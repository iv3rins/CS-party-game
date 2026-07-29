export const LANE_NAMES = ['A大', 'A小', '中路', 'B通', 'B狗洞'] as const;
export type Side = 'player' | 'ai';
export type WeaponKind = 'deagle' | 'galil' | 'm4a1' | 'ak47' | 'awp';
export type ItemKind = 'flash' | 'smoke' | 'c4' | 'defuse';
export type ProductKind = WeaponKind | ItemKind;

export interface Product {
  kind: ProductKind;
  name: string;
  short: string;
  price: number;
  force: number;
  damage: number;
  color: string;
  type: 'weapon' | 'item';
}

export const PRODUCTS: Record<ProductKind, Product> = {
  deagle: { kind: 'deagle', name: '沙鹰', short: 'DE', price: 800, force: 1, damage: 6, color: '#d9d5c8', type: 'weapon' },
  galil: { kind: 'galil', name: '咖喱', short: 'GA', price: 1400, force: 2, damage: 9, color: '#a7b39c', type: 'weapon' },
  m4a1: { kind: 'm4a1', name: 'M4A1-S', short: 'A1', price: 2200, force: 3, damage: 13, color: '#8ea5aa', type: 'weapon' },
  ak47: { kind: 'ak47', name: 'AK-47', short: 'AK', price: 2700, force: 4, damage: 18, color: '#d99645', type: 'weapon' },
  awp: { kind: 'awp', name: 'AWP', short: 'AWP', price: 4750, force: 5, damage: 25, color: '#8cb67a', type: 'weapon' },
  flash: { kind: 'flash', name: '闪光弹', short: 'FLASH', price: 900, force: 0, damage: 0, color: '#f4e7a2', type: 'item' },
  smoke: { kind: 'smoke', name: '烟雾弹', short: 'SMOKE', price: 1100, force: 0, damage: 0, color: '#9da4a4', type: 'item' },
  c4: { kind: 'c4', name: 'C4 炸弹', short: 'C4', price: 1800, force: 0, damage: 35, color: '#ffca0a', type: 'item' },
  defuse: { kind: 'defuse', name: '钳子', short: 'PLRS', price: 1200, force: 0, damage: 0, color: '#74a9bd', type: 'item' },
};

export interface Unit {
  id: string;
  kind: WeaponKind;
  side: Side;
  position: number;
  hasC4?: boolean;
  flashedUntil?: number;
  boosted?: boolean;
  spawnStartedAt?: number;
  spawnEndsAt?: number;
}

export const SPAWN_DURATION = .5;
export const PUSH_SPEED_PER_FORCE = 1.5;
export const MAX_PUSH_SPEED = 6;
export const INCOME_PER_SECOND = 300;
export const MONEY_CAP = 16000;

/** Visual collision footprint in track percentage points. Positions are entity centers. */
export const COLLISION_LENGTH: Record<WeaponKind, number> = {
  deagle: 6, galil: 8, m4a1: 9, ak47: 10, awp: 12,
};

export const collisionGap = (a: Unit, b: Unit) => (COLLISION_LENGTH[a.kind] + COLLISION_LENGTH[b.kind]) / 2;

export interface LaneState {
  player: Unit[];
  ai: Unit[];
  smokeUntil: number;
}

export interface ExcellentPosition {
  id: string;
  lane: number;
  position: 38 | 62;
  active: boolean;
  respawnAt: number;
}

export interface GameState {
  lanes: LaneState[];
  excellentPositions: ExcellentPosition[];
  playerBase: number;
  aiBase: number;
  playerMoney: number;
  aiMoney: number;
  playerItems: Record<ItemKind, number>;
  aiItems: Record<ItemKind, number>;
  playerDefuseCharges: number;
  aiDefuseCharges: number;
  elapsed: number;
  status: 'playing' | 'player-win' | 'ai-win' | 'draw';
  event: string;
}

export const createInitialState = (positionLanes: number[]): GameState => ({
  lanes: LANE_NAMES.map(() => ({ player: [], ai: [], smokeUntil: 0 })),
  excellentPositions: positionLanes.slice(0, 2).map((lane, index) => ({
    id: `excellent-${index}`, lane, position: (index % 2 ? 62 : 38) as 38 | 62, active: true, respawnAt: 0,
  })),
  playerBase: 100, aiBase: 100, playerMoney: 1600, aiMoney: 1600,
  playerItems: { flash: 0, smoke: 0, c4: 0, defuse: 0 },
  aiItems: { flash: 0, smoke: 0, c4: 0, defuse: 0 },
  playerDefuseCharges: 0, aiDefuseCharges: 0,
  elapsed: 0, status: 'playing', event: '对局开始。选择军备，拖入赛道。',
});

export const isUnitActive = (unit: Unit, now: number) => unit.spawnEndsAt === undefined || unit.spawnEndsAt <= now;

const activeForce = (units: Unit[], now: number) => units.reduce(
  (sum, unit) => sum + (!isUnitActive(unit, now) || (unit.flashedUntil ?? 0) > now ? 0 : PRODUCTS[unit.kind].force * (unit.boosted ? 1.5 : 1)), 0,
);

export const totalForce = (units: Unit[], now: number) => activeForce(units, now);

const orderedUnits = (units: Unit[], side: Side) => [...units].sort(
  (a, b) => side === 'player' ? b.position - a.position : a.position - b.position,
);

const front = (units: Unit[], side: Side) => side === 'player'
  ? Math.max(...units.map(unit => unit.position))
  : Math.min(...units.map(unit => unit.position));

export const getFrontChainIds = (units: Unit[], side: Side, now = Infinity) => {
  const ordered = orderedUnits(units.filter(unit => isUnitActive(unit, now)), side);
  const ids = new Set<string>();
  if (!ordered.length) return ids;
  ids.add(ordered[0].id);
  for (let index = 1; index < ordered.length; index += 1) {
    const leader = ordered[index - 1];
    const follower = ordered[index];
    if (Math.abs(leader.position - follower.position) > collisionGap(leader, follower) + .01) break;
    ids.add(follower.id);
  }
  return ids;
};

/** Force of the contiguous front chain only; detached reinforcements do not push remotely. */
export const connectedChainForce = (units: Unit[], side: Side, now: number) => {
  const chainIds = getFrontChainIds(units, side, now);
  return activeForce(units.filter(unit => chainIds.has(unit.id)), now);
};

const moveForward = (units: Unit[], side: Side, distance: number, excluded = new Set<string>()) => units.map(unit => excluded.has(unit.id) ? unit : ({
  ...unit,
  position: unit.position + (side === 'player' ? distance : -distance),
}));

const shiftChain = (units: Unit[], chainIds: Set<string>, delta: number) => units.map(unit => chainIds.has(unit.id)
  ? { ...unit, position: unit.position + delta }
  : unit);

/** Resolve only actual overlaps, working from the front toward the base. */
const constrainFriendlySpacing = (units: Unit[], side: Side) => {
  const ordered = orderedUnits(units, side);
  for (let index = 1; index < ordered.length; index += 1) {
    const leader = ordered[index - 1];
    const follower = ordered[index];
    const touchingPosition = side === 'player'
      ? leader.position - collisionGap(leader, follower)
      : leader.position + collisionGap(leader, follower);
    if (side === 'player' && follower.position > touchingPosition) follower.position = touchingPosition;
    if (side === 'ai' && follower.position < touchingPosition) follower.position = touchingPosition;
  }
  return ordered;
};

/** Test helper: resolve overlaps without pulling a detached reinforcement forward. */
export const packChain = (units: Unit[], side: Side): Unit[] => constrainFriendlySpacing(structuredClone(units), side);

const frontPair = (player: Unit[], ai: Unit[]) => {
  if (!player.length || !ai.length) return null;
  const playerPosition = front(player, 'player');
  const aiPosition = front(ai, 'ai');
  const playerUnit = player.find(unit => unit.position === playerPosition)!;
  const aiUnit = ai.find(unit => unit.position === aiPosition)!;
  return { playerUnit, aiUnit, distance: aiPosition - playerPosition, required: collisionGap(playerUnit, aiUnit) };
};

const spawnTarget = (unit: Unit) => unit.side === 'player'
  ? COLLISION_LENGTH[unit.kind] / 2
  : 100 - COLLISION_LENGTH[unit.kind] / 2;

const updateSpawningUnits = (units: Unit[], now: number) => units.map(unit => {
  if (unit.spawnStartedAt === undefined || unit.spawnEndsAt === undefined) return unit;
  const duration = unit.spawnEndsAt - unit.spawnStartedAt;
  const progress = Math.max(0, Math.min(1, (now - unit.spawnStartedAt) / duration));
  const halfLength = COLLISION_LENGTH[unit.kind] / 2;
  const origin = unit.side === 'player' ? -halfLength : 100 + halfLength;
  const position = origin + (spawnTarget(unit) - origin) * progress;
  if (progress < 1) return { ...unit, position };
  const active = { ...unit, position };
  delete active.spawnStartedAt;
  delete active.spawnEndsAt;
  return active;
});

export const canSpawnUnit = (state: GameState, side: Side, laneIndex: number, kind: WeaponKind) => {
  const units = state.lanes[laneIndex][side];
  if (units.some(unit => !isUnitActive(unit, state.elapsed))) return false;
  const active = orderedUnits(units.filter(unit => isUnitActive(unit, state.elapsed)), side);
  if (!active.length) return true;
  const rear = active.at(-1)!;
  const candidate: Unit = { id: 'spawn-check', kind, side, position: spawnTarget({ id: '', kind, side, position: 0 }) };
  const requiredRearPosition = side === 'player'
    ? spawnTarget(candidate) + collisionGap(rear, candidate)
    : spawnTarget(candidate) - collisionGap(rear, candidate);
  return side === 'player' ? rear.position >= requiredRearPosition : rear.position <= requiredRearPosition;
};

const respawnExcellentPositions = (state: GameState, random: () => number) => {
  for (const point of state.excellentPositions) {
    if (!point.active && state.elapsed >= point.respawnAt) {
      point.active = true;
      point.lane = Math.floor(random() * LANE_NAMES.length);
      point.position = random() < .5 ? 38 : 62;
      point.respawnAt = 0;
      state.event = `新的优秀枪位已在 ${LANE_NAMES[point.lane]} 出现`;
    }
  }
};

const collectExcellentPosition = (state: GameState, point: ExcellentPosition, previousPositions: Map<string, number>) => {
  if (!point.active) return;
  const lane = state.lanes[point.lane];
  const crossed = (unit: Unit) => {
    const previous = previousPositions.get(unit.id) ?? unit.position;
    return unit.side === 'player'
      ? previous < point.position && unit.position >= point.position
      : previous > point.position && unit.position <= point.position;
  };
  const candidates = [
    ...lane.player.filter(unit => !unit.boosted && crossed(unit)),
    ...lane.ai.filter(unit => !unit.boosted && crossed(unit)),
  ];
  if (!candidates.length) return;
  // Determine who crossed first using the interpolated crossing fraction within this tick,
  // rather than the final distance (which can reverse the order for coarse ticks).
  const crossingFraction = (unit: Unit) => {
    const previous = previousPositions.get(unit.id) ?? unit.position;
    const travel = Math.abs(unit.position - previous);
    return travel === 0 ? 1 : Math.abs(point.position - previous) / travel;
  };
  const unit = candidates.sort((a, b) => crossingFraction(a) - crossingFraction(b) || a.id.localeCompare(b.id))[0];
  unit.boosted = true;
  point.active = false;
  point.respawnAt = state.elapsed + 5;
  state.event = `${unit.side === 'player' ? '你' : '对手'}的 ${PRODUCTS[unit.kind].name} 获得优秀枪位，永久推力 ×1.5`;
};

export function tickGame(input: GameState, dt: number, random: () => number = Math.random): GameState {
  if (input.status !== 'playing') return input;
  const state = structuredClone(input);
  state.elapsed += dt;
  const overtime = state.elapsed >= 180;
  const speedScale = overtime ? 2 : 1;
  const damageScale = overtime ? 2 : 1;
  const march = 5.5 * dt * speedScale;
  state.playerMoney = Math.min(MONEY_CAP, state.playerMoney + INCOME_PER_SECOND * dt);
  state.aiMoney = Math.min(MONEY_CAP, state.aiMoney + INCOME_PER_SECOND * dt);
  const previousPositions = new Map(input.lanes.flatMap(lane => [...lane.player, ...lane.ai]).map(unit => [unit.id, unit.position]));
  respawnExcellentPositions(state, random);

  state.lanes.forEach((lane, index) => {
    const enteringPlayerIds = new Set(lane.player.filter(unit => unit.spawnEndsAt !== undefined && unit.spawnEndsAt > input.elapsed).map(unit => unit.id));
    const enteringAiIds = new Set(lane.ai.filter(unit => unit.spawnEndsAt !== undefined && unit.spawnEndsAt > input.elapsed).map(unit => unit.id));
    lane.player = updateSpawningUnits(lane.player, state.elapsed);
    lane.ai = updateSpawningUnits(lane.ai, state.elapsed);
    const playerActiveIds = new Set(lane.player.filter(unit => isUnitActive(unit, state.elapsed) && !enteringPlayerIds.has(unit.id)).map(unit => unit.id));
    const aiActiveIds = new Set(lane.ai.filter(unit => isUnitActive(unit, state.elapsed) && !enteringAiIds.has(unit.id)).map(unit => unit.id));
    const activePlayers = () => lane.player.filter(unit => playerActiveIds.has(unit.id));
    const activeAi = () => lane.ai.filter(unit => aiActiveIds.has(unit.id));
    const smoked = lane.smokeUntil > state.elapsed;
    const pairBeforeMove = frontPair(activePlayers(), activeAi());
    const contacted = Boolean(pairBeforeMove && pairBeforeMove.distance <= pairBeforeMove.required + .01);

    if (smoked) {
      lane.player = moveForward(lane.player, 'player', march, new Set(lane.player.filter(unit => !playerActiveIds.has(unit.id)).map(unit => unit.id))).map(unit => ({
        ...unit,
        position: playerActiveIds.has(unit.id) ? Math.min(unit.position, 46 - COLLISION_LENGTH[unit.kind] / 2) : unit.position,
      }));
      lane.ai = moveForward(lane.ai, 'ai', march, new Set(lane.ai.filter(unit => !aiActiveIds.has(unit.id)).map(unit => unit.id))).map(unit => ({
        ...unit,
        position: aiActiveIds.has(unit.id) ? Math.max(unit.position, 54 + COLLISION_LENGTH[unit.kind] / 2) : unit.position,
      }));
    } else if (contacted) {
      const playerChain = getFrontChainIds(activePlayers(), 'player', state.elapsed);
      const aiChain = getFrontChainIds(activeAi(), 'ai', state.elapsed);
      const playerForce = activeForce(lane.player.filter(unit => playerChain.has(unit.id)), state.elapsed);
      const aiForce = activeForce(lane.ai.filter(unit => aiChain.has(unit.id)), state.elapsed);
      const net = playerForce - aiForce;
      const pushSpeed = Math.min(MAX_PUSH_SPEED, Math.abs(net) * PUSH_SPEED_PER_FORCE);
      const delta = Math.abs(net) > .001 ? Math.sign(net) * pushSpeed * dt * speedScale : 0;

      lane.player = shiftChain(lane.player, playerChain, delta);
      lane.ai = shiftChain(lane.ai, aiChain, delta);
      const playerExcluded = new Set([...playerChain, ...lane.player.filter(unit => !playerActiveIds.has(unit.id)).map(unit => unit.id)]);
      const aiExcluded = new Set([...aiChain, ...lane.ai.filter(unit => !aiActiveIds.has(unit.id)).map(unit => unit.id)]);
      lane.player = moveForward(lane.player, 'player', march, playerExcluded);
      lane.ai = moveForward(lane.ai, 'ai', march, aiExcluded);
    } else {
      const playerExcluded = new Set(lane.player.filter(unit => !playerActiveIds.has(unit.id)).map(unit => unit.id));
      const aiExcluded = new Set(lane.ai.filter(unit => !aiActiveIds.has(unit.id)).map(unit => unit.id));
      lane.player = moveForward(lane.player, 'player', march, playerExcluded);
      lane.ai = moveForward(lane.ai, 'ai', march, aiExcluded);
    }

    const spawningPlayers = lane.player.filter(unit => !playerActiveIds.has(unit.id));
    const spawningAi = lane.ai.filter(unit => !aiActiveIds.has(unit.id));
    lane.player = constrainFriendlySpacing(activePlayers(), 'player').concat(spawningPlayers);
    lane.ai = constrainFriendlySpacing(activeAi(), 'ai').concat(spawningAi);

    if (!smoked) {
      const pairAfterMove = frontPair(activePlayers(), activeAi());
      if (pairAfterMove && pairAfterMove.distance < pairAfterMove.required) {
        const overlap = pairAfterMove.required - pairAfterMove.distance;
        lane.player = shiftChain(lane.player, getFrontChainIds(activePlayers(), 'player', state.elapsed), -overlap / 2);
        lane.ai = shiftChain(lane.ai, getFrontChainIds(activeAi(), 'ai', state.elapsed), overlap / 2);
      }
    }

    state.excellentPositions.filter(point => point.lane === index).forEach(point => collectExcellentPosition(state, point, previousPositions));

    const pushedOutPlayers = lane.player.filter(unit => playerActiveIds.has(unit.id) && unit.position - COLLISION_LENGTH[unit.kind] / 2 < -.001);
    const pushedOutAi = lane.ai.filter(unit => aiActiveIds.has(unit.id) && unit.position + COLLISION_LENGTH[unit.kind] / 2 > 100.001);
    if (pushedOutPlayers.length) state.event = `${LANE_NAMES[index]} 的己方 ${PRODUCTS[pushedOutPlayers[0].kind].name} 被挤出基地并摧毁`;
    if (pushedOutAi.length) state.event = `${LANE_NAMES[index]} 的敌方 ${PRODUCTS[pushedOutAi[0].kind].name} 被挤出基地并摧毁`;
    const pushedIds = new Set([...pushedOutPlayers, ...pushedOutAi].map(unit => unit.id));
    lane.player = lane.player.filter(unit => !pushedIds.has(unit.id));
    lane.ai = lane.ai.filter(unit => !pushedIds.has(unit.id));

    const playerHits = lane.player.filter(unit => isUnitActive(unit, state.elapsed) && unit.position + COLLISION_LENGTH[unit.kind] / 2 >= 100);
    const aiHits = lane.ai.filter(unit => isUnitActive(unit, state.elapsed) && unit.position - COLLISION_LENGTH[unit.kind] / 2 <= 0);
    lane.player = lane.player.filter(unit => !playerHits.includes(unit));
    lane.ai = lane.ai.filter(unit => !aiHits.includes(unit));

    for (const unit of playerHits) {
      let c4Damage = unit.hasC4 ? PRODUCTS.c4.damage : 0;
      let defused = false;
      if (c4Damage && state.aiDefuseCharges > 0) {
        state.aiDefuseCharges -= 1; c4Damage = 0; defused = true;
      }
      const damage = (PRODUCTS[unit.kind].damage + c4Damage) * damageScale;
      state.aiBase = Math.max(0, state.aiBase - damage);
      state.event = defused ? `敌方使用钳子拆除了 ${LANE_NAMES[index]} 的 C4，武器仍造成 ${damage} 伤害` : `${LANE_NAMES[index]} 突破！敌方基地 -${damage}`;
    }
    for (const unit of aiHits) {
      let c4Damage = unit.hasC4 ? PRODUCTS.c4.damage : 0;
      let defused = false;
      if (c4Damage && state.playerDefuseCharges > 0) {
        state.playerDefuseCharges -= 1; c4Damage = 0; defused = true;
      }
      const damage = (PRODUCTS[unit.kind].damage + c4Damage) * damageScale;
      state.playerBase = Math.max(0, state.playerBase - damage);
      state.event = defused ? `钳子拦截了 ${LANE_NAMES[index]} 的 C4，武器仍造成 ${damage} 伤害` : `${LANE_NAMES[index]} 失守！己方基地 -${damage}`;
    }
  });

  if (state.playerBase <= 0 && state.aiBase <= 0) state.status = 'draw';
  else if (state.aiBase <= 0) state.status = 'player-win';
  else if (state.playerBase <= 0) state.status = 'ai-win';
  else if (state.elapsed >= 240) state.status = state.playerBase === state.aiBase ? 'draw' : state.playerBase > state.aiBase ? 'player-win' : 'ai-win';
  return state;
}

export function deployUnit(state: GameState, side: Side, laneIndex: number, kind: WeaponKind, id: string): GameState {
  if (!canSpawnUnit(state, side, laneIndex, kind)) return state;
  const next = structuredClone(state);
  const halfLength = COLLISION_LENGTH[kind] / 2;
  next.lanes[laneIndex][side].push({
    id, kind, side,
    position: side === 'player' ? -halfLength : 100 + halfLength,
    spawnStartedAt: next.elapsed,
    spawnEndsAt: next.elapsed + SPAWN_DURATION,
  });
  next.event = `${side === 'player' ? '你' : '对手'}的 ${PRODUCTS[kind].name} 正从 ${LANE_NAMES[laneIndex]} 出口滑入`;
  return next;
}

export function useItem(state: GameState, side: Side, laneIndex: number, kind: ItemKind): GameState {
  const lane = state.lanes[laneIndex];
  const enemy: Side = side === 'player' ? 'ai' : 'player';
  if (kind === 'flash' && lane[enemy].length === 0) return state;
  if (kind === 'c4' && !lane[side].some(unit => !unit.hasC4)) return state;
  if (kind === 'defuse') return state;

  const next = structuredClone(state);
  const nextLane = next.lanes[laneIndex];
  if (kind === 'flash') nextLane[enemy].forEach(unit => { unit.flashedUntil = next.elapsed + 3; });
  if (kind === 'smoke') nextLane.smokeUntil = next.elapsed + 5;
  if (kind === 'c4') {
    const candidates = nextLane[side].filter(unit => !unit.hasC4);
    const target = [...candidates].sort((a, b) => side === 'player' ? b.position - a.position : a.position - b.position)[0];
    target.hasC4 = true;
  }
  next.event = `${side === 'player' ? '你' : '对手'}在 ${LANE_NAMES[laneIndex]} 使用 ${PRODUCTS[kind].name}`;
  return next;
}

export const weightedProduct = (random = Math.random): ProductKind => {
  const value = random();
  if (value < .24) return 'deagle';
  if (value < .45) return 'galil';
  if (value < .62) return 'm4a1';
  if (value < .76) return 'ak47';
  if (value < .84) return 'awp';
  if (value < .89) return 'flash';
  if (value < .94) return 'smoke';
  if (value < .97) return 'c4';
  return 'defuse';
};
