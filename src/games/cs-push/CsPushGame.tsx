import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  canSpawnUnit, createInitialState, deployUnit, GameState, INCOME_PER_SECOND, isUnitActive, ItemKind, LANE_NAMES, PRODUCTS,
  ProductKind, Side, SPAWN_DURATION, tickGame, useItem, WeaponKind, weightedProduct,
} from './engine';
import { Account, GAME_ID, getRankTier, MatchSession, platform, Rating, SEASON_ID } from '../../platform';
import { audio, SoundEvent } from './audio';
import { ItemIcon, OperatorAvatar, UiIcon, WeaponIcon } from '../../shared/icons';
import { hasSeenTutorial, markTutorialSeen } from './tutorial';
import { OnlineMatchClient } from './onlineClient';

const ITEM_KINDS: ItemKind[] = ['flash', 'smoke', 'c4', 'defuse'];
const WEAPON_KINDS: WeaponKind[] = ['deagle', 'galil', 'm4a1', 'ak47', 'awp'];
const isItem = (kind: ProductKind): kind is ItemKind => ITEM_KINDS.includes(kind as ItemKind);
const formatTime = (elapsed: number) => {
  const remaining = Math.max(0, (elapsed < 180 ? 180 : 240) - elapsed);
  return `${Math.floor(remaining / 60)}:${Math.floor(remaining % 60).toString().padStart(2, '0')}`;
};
const randomPositions = () => {
  const first = Math.floor(Math.random() * 5);
  let second = Math.floor(Math.random() * 5);
  while (second === first) second = Math.floor(Math.random() * 5);
  return [first, second];
};
const makeShop = () => Array.from({ length: 5 }, () => weightedProduct());
const unitId = () => crypto.randomUUID();
const debugParams = typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search);
const debugScene = debugParams.get('debug-chain');
const debugPush = debugParams.get('debug-push');
const debugSpawn = debugParams.get('debug-spawn');
const isDebug = Boolean(debugScene || debugPush || debugSpawn);
const activate = (game: GameState) => game.lanes.forEach(lane => [...lane.player, ...lane.ai].forEach(unit => {
  delete unit.spawnStartedAt; delete unit.spawnEndsAt;
}));

const weaponRoles: Record<WeaponKind, string> = {
  deagle: '低费补链', galil: '快攻核心', m4a1: '稳定中坚', ak47: '正面压制', awp: '高价破局',
};
const itemDetails: Record<ItemKind, { effect: string; duration: string; target: string }> = {
  flash: { effect: '前排敌方武器失去推力', duration: '3 秒', target: '指定赛道已有敌方武器' },
  smoke: { effect: '封锁中段，双方不能接触或伤害', duration: '5 秒', target: '指定赛道' },
  c4: { effect: '附着前排，突破时额外造成 35 伤害', duration: '单次', target: '该路未携弹己方武器' },
  defuse: { effect: '自动抵消一次敌方 C4 额外伤害', duration: '库存', target: '敌方 C4 突破时' },
};

type TutorialStep = { title: string; body: string; target: string; kind: 'text' | 'weapons' | 'items' | 'examples' };
const tutorialSteps: TutorialStep[] = [
  { title: '击破基地', body: '双方基地各有 100 点生命。让任意己方武器的前缘突破敌方底线，造成伤害；先将对手基地归零获胜。', target: 'bases', kind: 'text' },
  { title: '五线实体链', body: '每把枪都是独立实体。前排顶住后，后方枪必须贴上枪尾才会加入推力链。连续接触的总推力决定推进方向。', target: 'arena', kind: 'examples' },
  { title: '经济与节奏', body: `初始 $1600，双方每秒获得 $${INCOME_PER_SECOND}，上限 $16000。高等级枪更强，但抢占线路和补链同样重要。`, target: 'money', kind: 'text' },
  { title: '购买与出口', body: '从军备背包选择商品，再点击或拖到赛道。武器会从基地出口滑入，出口拥堵时不能连续部署同一路。', target: 'shop', kind: 'text' },
  { title: '枪械压制链', body: '每种枪同时决定推力和突破伤害。用低费枪快速补链，或积蓄经济争取高推力破局。', target: 'shop', kind: 'weapons' },
  { title: '优秀枪位', body: '首把通过优秀枪位的未强化武器永久获得 1.5 倍推力。获取后枪位消失，5 秒后会在其他位置刷新。', target: 'excellent', kind: 'text' },
  { title: '战术道具', body: '每种道具每局最多购买 2 次。道具只能在正确目标和时机发挥价值。', target: 'shop', kind: 'items' },
  { title: '加时决胜', body: '常规时间 3 分钟。之后进入 1 分钟突然死亡，推力与伤害均翻倍；时间结束时基地生命更高的一方获胜。', target: 'clock', kind: 'text' },
];

const makeInitialBattle = () => {
  let game = createInitialState([]);
  if (debugPush === 'before' || debugPush === 'after') {
    game = deployUnit(game, 'player', 2, 'galil', 'debug-push-player'); activate(game);
    game = deployUnit(game, 'ai', 2, 'deagle', 'debug-push-ai'); activate(game);
    game.lanes[2].player[0].position = 46.5;
    game.lanes[2].ai[0].position = 53.5;
    if (debugPush === 'after') game = tickGame(game, 1, () => .5);
    game.event = `推退自检：${debugPush === 'before' ? '接触初始位置' : '净推力 1 推进 1 秒'}`;
    return { game, shop: ['deagle', 'galil', 'm4a1', 'ak47', 'awp'] as ProductKind[] };
  }
  if (debugSpawn === 'start' || debugSpawn === 'mid' || debugSpawn === 'end') {
    game = deployUnit(game, 'player', 2, 'deagle', 'debug-spawn-player');
    const progress = debugSpawn === 'start' ? 0 : debugSpawn === 'mid' ? SPAWN_DURATION / 2 : SPAWN_DURATION;
    if (progress) game = tickGame(game, progress, () => .5);
    game.event = `出口自检：生成进度 ${debugSpawn}`;
    return { game, shop: ['deagle', 'galil', 'm4a1', 'ak47', 'awp'] as ProductKind[] };
  }
  if (debugScene === 'before' || debugScene === 'after') {
    game = deployUnit(game, 'player', 2, 'deagle', 'debug-player-front'); activate(game);
    game = deployUnit(game, 'player', 2, 'galil', 'debug-player-rear'); activate(game);
    game = deployUnit(game, 'ai', 2, 'deagle', 'debug-ai-front'); activate(game);
    game.lanes[2].player.find(unit => unit.id === 'debug-player-front')!.position = 47;
    game.lanes[2].player.find(unit => unit.id === 'debug-player-rear')!.position = 30;
    game.lanes[2].ai[0].position = 53;
    if (debugScene === 'after') for (let index = 0; index < 20; index += 1) game = tickGame(game, .1, () => .5);
    return { game, shop: ['deagle', 'galil', 'm4a1', 'ak47', 'awp'] as ProductKind[] };
  }
  return { game: createInitialState(randomPositions()), shop: makeShop() };
};

function WeaponGlyph({ kind, side, boosted = false }: { kind: WeaponKind; side?: Side; boosted?: boolean }) {
  return <span className={`weapon-glyph weapon-${kind} ${side ? `weapon-side-${side}` : ''} ${boosted ? 'weapon-boosted' : ''}`}>
    <span className="weapon-art"><WeaponIcon kind={kind} title={PRODUCTS[kind].name}/></span>
  </span>;
}

function TutorialContent({ step }: { step: TutorialStep }) {
  if (step.kind === 'weapons') return <div className="tutorial-table" data-tutorial="weapons-table">
    {WEAPON_KINDS.map(kind => <div key={kind}><WeaponGlyph kind={kind}/><strong>{PRODUCTS[kind].name}</strong><span>${PRODUCTS[kind].price.toLocaleString()}</span><span>推力 {PRODUCTS[kind].force}</span><span>伤害 {PRODUCTS[kind].damage}</span><small>{weaponRoles[kind]}</small></div>)}
  </div>;
  if (step.kind === 'items') return <div className="tutorial-items">
    {ITEM_KINDS.map(kind => <div key={kind}><ItemIcon kind={kind}/><strong>{PRODUCTS[kind].name}</strong><span>${PRODUCTS[kind].price.toLocaleString()} · {itemDetails[kind].duration}</span><small>{itemDetails[kind].effect}</small><em>目标：{itemDetails[kind].target} · 每局 2 次</em></div>)}
  </div>;
  if (step.kind === 'examples') return <div className="force-examples">
    <div><b>沙鹰 1</b><span>vs</span><b>沙鹰 1</b><strong>互相顶住</strong></div>
    <div><b>咖喱 2</b><span>vs</span><b>沙鹰 1 + 沙鹰 1</b><strong>互相顶住</strong></div>
    <div><b>AWP 5</b><span>vs</span><b>AK 4</b><strong>AWP 推进</strong></div>
  </div>;
  return null;
}

type CsPushGameProps = {
  matchId?: string;
  mySide?: 'ct' | 't';
};

function App({ matchId, mySide }: CsPushGameProps) {
  const [battle, setBattle] = useState<{ game: GameState; shop: ProductKind[] }>(makeInitialBattle);
  const { game, shop } = battle;
  const setGame = useCallback((update: (current: GameState) => GameState) => setBattle(current => ({ ...current, game: update(current.game) })), []);
  const [selected, setSelected] = useState<number | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [rating, setRating] = useState<Rating | null>(null);
  const [sound, setSound] = useState(() => audio.isEnabled());
  const [volume, setVolume] = useState(() => audio.getVolume());
  const [tutorialOpen, setTutorialOpen] = useState(() => !isDebug && !hasSeenTutorial());
  const [tutorialStep, setTutorialStep] = useState(0);
  const [intelOpen, setIntelOpen] = useState(false);
  const [intelTab, setIntelTab] = useState<'events' | 'items'>('events');
  const [toast, setToast] = useState('');
  const [spotlight, setSpotlight] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const submitted = useRef(false);
  const previousGame = useRef(game);
  const match = useRef<MatchSession | null>(null);
  const [onlineMode] = useState(() => Boolean(matchId));
  const [onlineClient] = useState(() => {
    if (!matchId) return null;
    return new OnlineMatchClient(matchId);
  });
  const [pendingCommands, setPendingCommands] = useState<Set<string>>(new Set());
  const [opponentConnected, setOpponentConnected] = useState(true);
  const [reconnectDeadline, setReconnectDeadline] = useState<string | null>(null);
  const [onlineFinished, setOnlineFinished] = useState(false);

  useEffect(() => {
    platform.getAccount().then(setAccount);
    platform.getRating(GAME_ID, SEASON_ID).then(setRating);
    if (!onlineMode) {
      platform.startMatch({ gameId: GAME_ID, seasonId: SEASON_ID }).then(session => { match.current = session; });
    }
  }, [onlineMode]);

  useEffect(() => {
    if (!onlineClient) return;
    onlineClient.connect().catch(error => {
      setToast(`连接失败: ${error.message}`);
    });
    onlineClient.onSnapshot(snapshot => {
      const serverSide: Side = snapshot.yourSide === 'ct' ? 'player' : 'ai';
      const isCt = snapshot.yourSide === 'ct';
      const mapped: GameState = {
        ...snapshot.state,
        playerBase: isCt ? snapshot.state.playerBase : snapshot.state.aiBase,
        aiBase: isCt ? snapshot.state.aiBase : snapshot.state.playerBase,
        playerMoney: isCt ? snapshot.state.playerMoney : snapshot.state.aiMoney,
        aiMoney: isCt ? snapshot.state.aiMoney : snapshot.state.playerMoney,
        playerItems: isCt ? snapshot.state.playerItems : snapshot.state.aiItems,
        aiItems: isCt ? snapshot.state.aiItems : snapshot.state.playerItems,
        playerDefuseCharges: isCt ? snapshot.state.playerDefuseCharges : snapshot.state.aiDefuseCharges,
        aiDefuseCharges: isCt ? snapshot.state.aiDefuseCharges : snapshot.state.playerDefuseCharges,
        lanes: snapshot.state.lanes.map(lane => ({
          ...lane,
          player: isCt ? lane.player : lane.ai,
          ai: isCt ? lane.ai : lane.player,
        })),
      };
      setBattle(prev => ({ ...prev, game: mapped, shop: snapshot.shops[serverSide] }));
    });
    onlineClient.onCommandStatus((commandId, status, error) => {
      if (status === 'accepted') {
        setPendingCommands(prev => {
          const next = new Set(prev);
          next.delete(commandId);
          return next;
        });
      } else if (status === 'rejected') {
        setPendingCommands(prev => {
          const next = new Set(prev);
          next.delete(commandId);
          return next;
        });
        setToast(error || '操作被服务器拒绝');
      }
    });
    onlineClient.onFinished(result => {
      setOnlineFinished(true);
      const outcome = result.result.outcome;
      const myOutcome = (outcome === mySide ? 'player-win' : outcome === 'draw' ? 'draw' : 'ai-win');
      setBattle(prev => ({ ...prev, game: { ...prev.game, status: myOutcome } }));
    });
    onlineClient.onConnection((principalId, connected, deadline) => {
      setOpponentConnected(connected);
      setReconnectDeadline(deadline || null);
    });
    onlineClient.onError(error => {
      setToast(`连接错误: ${error.message}`);
    });
    return () => {
      onlineClient.disconnect();
    };
  }, [onlineClient, mySide]);

  useEffect(() => {
    if (onlineMode || isDebug || tutorialOpen || game.status !== 'playing') return;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(.2, (now - previous) / 1000);
      previous = now;
      setGame(current => tickGame(current, dt));
    }, 100);
    return () => clearInterval(timer);
  }, [onlineMode, game.status, tutorialOpen, setGame]);

  useEffect(() => {
    const previous = previousGame.current;
    const play = (event: SoundEvent) => { void audio.play(event); };
    if (previous.elapsed < 180 && game.elapsed >= 180) play('overtime');
    if (game.playerBase < previous.playerBase || game.aiBase < previous.aiBase) play('baseHit');
    if (game.event !== previous.event) {
      if (game.event.includes('优秀枪位')) play('boost');
      else if (game.event.includes('拆除了') || game.event.includes('拦截了')) play('defuse');
      else if (game.event.includes('部署')) play('deploy');
      if (/优秀枪位|突破|失守|烟雾|闪光|C4|钳子|出口拥堵|突然死亡/.test(game.event)) setToast(game.event);
    }
    if (previous.status === 'playing' && game.status !== 'playing') play(game.status === 'player-win' ? 'win' : game.status === 'ai-win' ? 'loss' : 'draw');
    previousGame.current = game;
  }, [game]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 2800);
    return () => clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!tutorialOpen) { setSpotlight(null); return; }
    const updateSpotlight = () => {
      const target = document.querySelector(`[data-tutorial="${tutorialSteps[tutorialStep].target}"]`);
      if (!target) { setSpotlight(null); return; }
      const rect = target.getBoundingClientRect();
      const pad = 8;
      setSpotlight({ top: Math.max(0, rect.top - pad), left: Math.max(0, rect.left - pad), width: rect.width + pad * 2, height: rect.height + pad * 2 });
    };
    updateSpotlight();
    window.addEventListener('resize', updateSpotlight);
    return () => window.removeEventListener('resize', updateSpotlight);
  }, [tutorialOpen, tutorialStep]);

  useEffect(() => {
    if (onlineMode) return;
    if (game.status === 'playing') return;
    if (submitted.current) return;
    submitted.current = true;
    const outcome = game.status === 'player-win' ? 'win' : game.status === 'ai-win' ? 'loss' : 'draw';
    const session = match.current;
    if (!session) return;
    platform.completeMatch({ matchId: session.matchId, gameId: GAME_ID, seasonId: SEASON_ID, outcome, opponentElo: session.opponentElo }).then(setRating);
  }, [onlineMode, game.status]);

  useEffect(() => {
    if (onlineMode || isDebug || tutorialOpen || game.status !== 'playing') return;
    const ai = window.setInterval(() => {
      setGame(current => {
        const affordable = (Object.keys(PRODUCTS) as ProductKind[]).filter(kind => PRODUCTS[kind].type === 'weapon' && PRODUCTS[kind].price <= current.aiMoney) as WeaponKind[];
        if (!affordable.length) return current;
        const laneIndex = current.lanes.map((lane, index) => ({ index, score: lane.player.length - lane.ai.length + Math.random() * 2 })).sort((a, b) => b.score - a.score)[0].index;
        const kind = affordable[Math.floor(Math.random() * affordable.length)];
        if (!canSpawnUnit(current, 'ai', laneIndex, kind)) return current;
        const next = deployUnit(current, 'ai', laneIndex, kind, unitId());
        next.aiMoney -= PRODUCTS[kind].price;
        return next;
      });
    }, 1700);
    return () => clearInterval(ai);
  }, [onlineMode, game.status, tutorialOpen, setGame]);

  const selectedKind = selected === null ? null : shop[selected];
  const deploy = useCallback((laneIndex: number, shopIndex: number) => {
    if (onlineMode) {
      if (tutorialOpen || !onlineClient) return;
      const kind = shop[shopIndex];
      if (!kind) return;
      const commandId = crypto.randomUUID();
      const product = PRODUCTS[kind];
      if (game.playerMoney < product.price) {
        setToast('经济不足，继续控场积攒资金。');
        return;
      }
      void audio.unlock();
      void audio.play('purchase');
      const command: import('./onlineClient').MatchCommand = product.type === 'weapon'
        ? { type: 'buy_deploy', slot: shopIndex, lane: laneIndex }
        : { type: 'use_item', slot: shopIndex, lane: laneIndex };
      onlineClient.sendCommand(commandId, command);
      setPendingCommands(prev => new Set(prev).add(commandId));
      setSelected(null);
      return;
    }
    setBattle(current => {
      if (tutorialOpen) return current;
      const kind = current.shop[shopIndex];
      if (!kind) return current;
      const product = PRODUCTS[kind];
      const state = current.game;
      if (state.status !== 'playing') return current;
      if (state.playerMoney < product.price) return { ...current, game: { ...state, event: '经济不足，继续控场积攒资金。' } };
      if (!isItem(kind) && !canSpawnUnit(state, 'player', laneIndex, kind as WeaponKind)) return { ...current, game: { ...state, event: `${LANE_NAMES[laneIndex]} 出口拥堵，等待上一把枪完全离开出口。` } };
      if (isItem(kind) && state.playerItems[kind] >= 2) return { ...current, game: { ...state, event: `${product.name} 本局已达 2 次上限。` } };
      if (kind === 'c4' && !state.lanes[laneIndex].player.some(unit => !unit.hasC4)) return { ...current, game: { ...state, event: 'C4 需要附着在该路未携带炸弹的己方武器。' } };
      if (kind === 'flash' && state.lanes[laneIndex].ai.length === 0) return { ...current, game: { ...state, event: '该路没有可致盲的敌方武器。' } };
      void audio.unlock(); void audio.play('purchase');
      let next = structuredClone(state);
      next.playerMoney -= product.price;
      if (product.type === 'weapon') next = deployUnit(next, 'player', laneIndex, kind as WeaponKind, unitId());
      else {
        next.playerItems[kind as ItemKind] += 1;
        if (kind === 'defuse') { next.playerDefuseCharges += 1; next.event = '钳子已入库，将自动拦截一次敌方 C4。'; }
        else { next = useItem(next, 'player', laneIndex, kind as ItemKind); void audio.play(kind as 'flash' | 'smoke' | 'c4'); }
      }
      return { game: next, shop: current.shop.map((item, index) => index === shopIndex ? weightedProduct() : item) };
    });
    setSelected(null);
  }, [onlineMode, onlineClient, tutorialOpen, shop, game.playerMoney]);

  const closeTutorial = () => { markTutorialSeen(); setTutorialOpen(false); };
  const restart = () => { submitted.current = false; match.current = null; platform.startMatch({ gameId: GAME_ID, seasonId: SEASON_ID }).then(session => { match.current = session; }); setBattle({ game: createInitialState(randomPositions()), shop: makeShop() }); setSelected(null); };
  const phase = game.elapsed < 180 ? '常规时间' : '突然死亡 · 2X';
  const result = game.status === 'player-win' ? '任务完成' : game.status === 'ai-win' ? '防线失守' : '势均力敌';

  const currentTutorial = tutorialSteps[tutorialStep];

  const hasPendingCommand = pendingCommands.size > 0;

  return <main className={`cs-push-root app-shell ${intelOpen ? 'intel-expanded' : 'intel-collapsed'} ${onlineMode ? 'online-mode' : ''}`} data-game-elapsed={game.elapsed.toFixed(2)} data-money={Math.floor(game.playerMoney)}>
    {hasPendingCommand && <div className="command-pending-overlay" role="status"><div className="pending-spinner"><span>等待服务器确认...</span></div></div>}
    {!opponentConnected && reconnectDeadline && <div className="connection-warning" role="alert"><UiIcon name="timer" /><span>对手已断线，{new Date(reconnectDeadline).toLocaleTimeString()} 前未重连将判负</span></div>}
    <header className="topbar">
      <button className="icon-button" onClick={() => platform.leaveToLobby()} title="返回合集大厅"><UiIcon name="back" /></button>
      <div className="brand"><span className="brand-mark">CS</span><strong>PARTY ARENA</strong><small>/ 001</small></div>
      <div className="game-title"><span>当前行动</span><strong>CS推推</strong></div>
      <div className="audio-controls"><button className="sound-toggle" onClick={() => { const next = !sound; setSound(next); audio.setEnabled(next); }} aria-pressed={sound}><UiIcon name="sound" />{sound ? 'SFX ON' : 'SFX OFF'}</button><input aria-label="音效音量" title={`音量 ${Math.round(volume * 100)}%`} type="range" min="0" max="1" step="0.05" value={volume} onChange={event => { const next = Number(event.target.value); setVolume(next); audio.setVolume(next); }} /></div>
      <div className="identity"><OperatorAvatar accountId={account?.accountId ?? 'loading'} /><span><small>{account?.displayName ?? '载入档案'}</small><strong>{getRankTier(rating?.elo ?? 1000).name} · {rating?.elo ?? '----'}</strong></span></div>
    </header>

    <section className="match-strip" data-tutorial="bases">
      <div className="base-status player-status"><UiIcon name="base"/><span>你的基地 / CT</span><strong>{Math.ceil(game.playerBase).toString().padStart(3, '0')}</strong><div><i style={{ width: `${game.playerBase}%` }} /></div></div>
      <div className="clock" data-tutorial="clock"><span className={game.elapsed >= 180 ? 'hot' : ''}>{phase}</span><strong><UiIcon name="timer" />{formatTime(game.elapsed)}</strong><small>率先击破敌方基地</small></div>
      <div className="base-status ai-status"><UiIcon name="base"/><span>敌方基地 / T</span><strong>{Math.ceil(game.aiBase).toString().padStart(3, '0')}</strong><div><i style={{ width: `${game.aiBase}%` }} /></div></div>
    </section>

    <section className="battle-layout">
      <aside className="briefing" data-tutorial="rules">
        <span className="vertical-label">OPERATION PUSH</span><button className="tutorial-open" onClick={() => { setTutorialStep(0); setTutorialOpen(true); }} title="规则与教程"><UiIcon name="crosshair" /></button>
        <div className="brief-content"><h1>五线<br/>推进</h1><p>连续实体链决定推力。抢占优秀枪位，击破敌方基地。</p><dl><div><dt>优秀枪位</dt><dd>单枪永久 ×1.5</dd></div><div><dt>加时</dt><dd>推力 / 伤害 ×2</dd></div></dl></div>
      </aside>

      <div className="arena" aria-label="五路对抗战场" data-tutorial="arena">
        {toast && <div className="battle-toast" role="status">{toast}</div>}
        <div className="side-label ct-label">CT 防线</div><div className="side-label t-label">T 防线</div>
        {game.lanes.map((lane, laneIndex) => {
          const pForce = lane.player.reduce((sum, unit) => sum + (isUnitActive(unit, game.elapsed) ? PRODUCTS[unit.kind].force * (unit.boosted ? 1.5 : 1) : 0), 0);
          const aForce = lane.ai.reduce((sum, unit) => sum + (isUnitActive(unit, game.elapsed) ? PRODUCTS[unit.kind].force * (unit.boosted ? 1.5 : 1) : 0), 0);
          return <div className={`lane ${selectedKind ? 'lane-ready' : ''}`} key={LANE_NAMES[laneIndex]} onDragOver={event => event.preventDefault()} onDrop={event => deploy(laneIndex, Number(event.dataTransfer.getData('shop-index')))} onClick={() => selected !== null && deploy(laneIndex, selected)}>
            <div className="lane-name"><b>0{laneIndex + 1}</b><strong>{LANE_NAMES[laneIndex]}</strong><span>{pForce} : {aForce}</span></div>
            <div className="track">
              <div className="center-line" />
              {laneIndex === 0 && <span className="tutorial-anchor" data-tutorial="excellent" />}
              {game.excellentPositions.filter(point => point.active && point.lane === laneIndex).map(point => <div key={point.id} className="excellent-position" style={{ left: `${point.position}%` }} title="首把未强化武器通过后永久获得 1.5 倍推力"><span>★</span><b>优秀枪位</b><small>1.5X</small></div>)}
              {lane.smokeUntil > game.elapsed && <div className="smoke-cloud"><i/><i/><i/><span>烟雾封锁</span></div>}
              {(['player', 'ai'] as Side[]).map(side => <div className="unit-layer" key={side}>{lane[side].map(unit => <div key={unit.id} tabIndex={0} data-unit-id={unit.id} data-kind={unit.kind} data-side={side} data-spawning={!isUnitActive(unit, game.elapsed)} className={`unit unit-${unit.kind} ${side} ${!isUnitActive(unit, game.elapsed) ? 'spawning' : ''} ${unit.hasC4 ? 'has-c4' : ''} ${unit.boosted ? 'boosted' : ''}`} style={{ left: `${unit.position}%`, top: '50%' }}>
                <WeaponGlyph kind={unit.kind} side={side} boosted={unit.boosted} />{unit.hasC4 && <em>C4</em>}{unit.boosted && <span className="boost-tag">★ 1.5X</span>}<span className="unit-tooltip">{PRODUCTS[unit.kind].name} · 推力 {PRODUCTS[unit.kind].force}{unit.boosted ? ' · 优秀枪位强化' : ''}</span>
              </div>)}</div>)}
              <div className="deploy-hint">部署到 {LANE_NAMES[laneIndex]}</div>
            </div>
          </div>;
        })}
      </div>

      <aside className="intel" aria-label="战术侧栏">
        <div className="intel-rail"><button onClick={() => { setIntelOpen(true); setIntelTab('events'); }} title="战况"><UiIcon name="intel" /></button><button onClick={() => { setIntelOpen(true); setIntelTab('items'); }} title="道具与火力"><UiIcon name="trophy" /></button></div>
        {intelOpen && <div className="intel-panel"><div className="intel-head"><div className="intel-tabs"><button className={intelTab === 'events' ? 'active' : ''} onClick={() => setIntelTab('events')}>战况</button><button className={intelTab === 'items' ? 'active' : ''} onClick={() => setIntelTab('items')}>道具</button></div><button className="intel-close" onClick={() => setIntelOpen(false)} title="折叠战术侧栏">×</button></div>
          {intelTab === 'events' ? <div className="event-log"><small>最新战况</small><p>{game.event}</p></div> : <div className="item-intel" data-tutorial="items"><small>本局道具 / 2</small>{ITEM_KINDS.map(kind => <div key={kind}><ItemIcon kind={kind}/><span>{PRODUCTS[kind].name}<em>{itemDetails[kind].duration}</em></span><i>{game.playerItems[kind]}</i></div>)}<div className="legend"><small>火力链</small>{WEAPON_KINDS.map(kind => <div key={kind}><WeaponGlyph kind={kind}/><span>{PRODUCTS[kind].force}</span></div>)}</div></div>}
        </div>}
      </aside>
    </section>

    <section className="armory" data-tutorial="shop">
      <div className="money" data-tutorial="money"><small>可用经济</small><strong>${Math.floor(game.playerMoney).toLocaleString()}</strong><span>+${INCOME_PER_SECOND} / 秒</span></div>
      <div className="shop"><div className="shop-label"><strong>军备背包</strong><span>拖拽至赛道</span></div>{shop.map((kind, index) => {
        const product = PRODUCTS[kind]; const disabled = game.playerMoney < product.price;
        const tooltip = product.type === 'weapon' ? `推力 ${product.force} · 基地伤害 ${product.damage} · ${weaponRoles[kind as WeaponKind]}` : `${itemDetails[kind as ItemKind].effect}；持续 ${itemDetails[kind as ItemKind].duration}；目标：${itemDetails[kind as ItemKind].target}；每局 2 次`;
        return <button key={`${kind}-${index}`} className={`shop-card ${selected === index ? 'selected' : ''} ${disabled ? 'disabled' : ''}`} draggable={!disabled} onDragStart={event => event.dataTransfer.setData('shop-index', String(index))} onClick={() => setSelected(selected === index ? null : index)}>
          <span className="slot">0{index + 1}</span>{product.type === 'weapon' ? <WeaponGlyph kind={kind as WeaponKind}/> : <span className={`item-glyph item-${kind}`}><ItemIcon kind={kind as ItemKind} title={product.name}/></span>}<strong>{product.name}</strong><small>${product.price.toLocaleString()}</small><span className="shop-tooltip">{tooltip}</span>
        </button>;
      })}</div>
      <div className="rank-chip"><UiIcon name="trophy"/><span><small>季前赛</small><strong>{rating?.wins ?? 0} 胜 / {rating?.losses ?? 0} 负</strong></span></div>
    </section>

    {tutorialOpen && <div className="tutorial-overlay" role="dialog" aria-modal="true" aria-label="CS推推新手教程">{spotlight && <div className="tutorial-cutout" style={{ top: spotlight.top, left: spotlight.left, width: spotlight.width, height: spotlight.height }} />}<section className="tutorial-card"><div className="tutorial-card-head"><span>CS推推 / 新手行动</span><strong>{tutorialStep + 1} / {tutorialSteps.length}</strong></div><h2>{currentTutorial.title}</h2><p>{currentTutorial.body}</p><TutorialContent step={currentTutorial} /><div className="tutorial-actions"><button className="tutorial-skip" onClick={closeTutorial}>跳过教程</button><span>{tutorialStep > 0 && <button onClick={() => setTutorialStep(step => step - 1)}>上一步</button>}<button className="tutorial-next" onClick={() => tutorialStep === tutorialSteps.length - 1 ? closeTutorial() : setTutorialStep(step => step + 1)}>{tutorialStep === tutorialSteps.length - 1 ? '开始对局' : '下一步'}</button></span></div></section></div>}
    {game.status !== 'playing' && <div className="result-overlay"><div className="result-panel"><span>MATCH COMPLETE</span><h2>{result}</h2><p>CT {Math.ceil(game.playerBase)} — {Math.ceil(game.aiBase)} T</p>{!onlineMode && <div className="elo-result"><small>CS推推 · 独立天梯</small><strong>{getRankTier(rating?.elo ?? 1000).name} · {rating?.elo ?? 1000} ELO</strong></div>}{onlineMode ? <button onClick={() => platform.leaveToLobby()}><UiIcon name="back"/>返回大厅</button> : <button onClick={restart}><UiIcon name="restart"/>再次行动</button>}</div></div>}
  </main>;
}

export default App;
