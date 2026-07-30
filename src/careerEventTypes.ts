export type EventRole = 'entry' | 'awper' | 'igl' | 'support';
export type EventKind = 'emergency' | 'field' | 'offseason' | 'annual';
export type EventTiming = 'in-season' | 'post-report';
export type EventCategory =
  | '赛事内关键局' | '赛事内非关键突发' | '训练状态' | '伤病健康' | '队内体系'
  | '教练管理' | '合同转会' | '角色转职' | '舆论媒体' | '商业赞助'
  | '合规风险' | '家庭生活' | 'CN生态' | '救赎线' | '退役转型';

export type EmploymentStatus = 'signed' | 'free-agent' | 'streamer';
export type ContractTier = 't1' | 't2' | 't3';
export type RoleChangePreparation = 'awper-training' | 'igl-assistant' | 'none';
export type IglArchetype = 'brain' | 'fragging' | 'dynasty' | 'awp-caller';
export type DefensiveSite = 'a' | 'b' | 'rotator';

export type StatChange = Partial<Record<'ability' | 'connections' | 'integrity' | 'fame', number>> & {
  health?: number; earnings?: number; signingBonus?: number; contractSalary?: number; assets?: number;
  teamForm?: number; rosterStability?: number; positionFamiliarity?: number; defensiveSite?: DefensiveSite;
  resetVrs?: boolean; preserveCore?: boolean; transfer?: boolean; internationalTransfer?: boolean;
  contractTier?: ContractTier; contractTeamId?: string; contractHalfSeasons?: number;
  employmentStatus?: EmploymentStatus; noOfferWindows?: number; rolePreparation?: RoleChangePreparation;
  roleChange?: EventRole; iglArchetype?: IglArchetype; bootcampBonus?: number;
  highPressureChokingRisk?: number; internationalAdaptation?: number;
};
export interface TournamentResultPatch { placementDelta?: number; placement?: string; ratingDelta?: number; }
export interface DelayedOutcome { tag: string; riskHint: string; minSeasons: number; maxSeasons: number; changes: StatChange; revealText: string; }

export type EventVariable =
  | 'career.age' | 'career.season' | 'career.careerYear'
  | 'player.ability' | 'player.connections' | 'player.integrity' | 'player.fame' | 'player.health'
  | 'player.positionFamiliarity' | 'player.internationalAdaptation' | 'player.highPressureChokingRisk'
  | 'team.form' | 'team.rosterStability' | 'team.globalRank' | 'team.regionRank' | 'team.negativeUpsetStreak'
  | 'team.vrsActive' | 'team.region' | 'team.tier'
  | 'tournament.tier' | 'tournament.honorClass' | 'tournament.placement' | 'tournament.rating'
  | 'tournament.isMajor' | 'tournament.isPlayoff';
export type Scalar = string | number | boolean;
export type ValueExpression = { const: Scalar } | { var: EventVariable };
export type ConditionExpression =
  | { op: 'all' | 'any'; args: ConditionExpression[] }
  | { op: 'not'; arg: ConditionExpression }
  | { op: 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte'; left: ValueExpression; right: ValueExpression }
  | { op: 'in'; value: ValueExpression; set: Scalar[] }
  | { op: 'exists'; value: { var: EventVariable } };
export type NumberExpression =
  | { const: number }
  | { var: EventVariable }
  | { op: 'add' | 'mul' | 'min' | 'max'; args: NumberExpression[] }
  | { op: 'sub' | 'div'; left: NumberExpression; right: NumberExpression }
  | { op: 'abs' | 'floor' | 'ceil' | 'round'; value: NumberExpression }
  | { op: 'clamp'; value: NumberExpression; min: number; max: number }
  | { op: 'if'; condition: ConditionExpression; then: NumberExpression; else: NumberExpression };
export type WeightSpec = number | NumberExpression;

export interface ProbabilityOutcomeDefinition {
  id?: string; label: string; probability?: number; weight?: WeightSpec; changes: StatChange;
  resultPatch?: TournamentResultPatch; delayed?: DelayedOutcome;
}
export type WorldlineAction = 'start' | 'advance' | 'branch' | 'pause' | 'resume' | 'complete' | 'abandon';
export interface WorldlineTransition { worldlineId: string; action: WorldlineAction; toStage?: string; branchId?: string; note?: string; }
export interface EventOptionDefinition {
  id: string; label: string; detail?: string; result?: string; changes: StatChange;
  outcomes?: ProbabilityOutcomeDefinition[]; worldlineTransitions?: WorldlineTransition[];
}
export interface EventSource {
  type: 'built-in' | 'human-authored' | 'ai-generated'; generator?: string; promptTemplateVersion?: string;
  reviewStatus?: 'draft' | 'approved' | 'rejected'; reviewer?: string; contentHash?: string;
}
export interface CareerEventDefinition {
  schemaVersion?: string; catalogId: string; revision?: number; category: EventCategory; kind: EventKind;
  timing?: EventTiming; title: string; briefing: string; tags?: string[]; source?: EventSource;
  minAge?: number; maxAge?: number; roles?: EventRole[]; requiresHiddenFlag?: string;
  eligibility?: ConditionExpression; triggerWeight?: WeightSpec; cooldownSeasons?: number;
  maxOccurrences?: number; exclusiveGroup?: string;
  worldline?: { worldlineId: string; stages?: string[]; statuses?: WorldlineStatus[] };
  options: EventOptionDefinition[];
}

export interface ProbabilityOutcome extends Omit<ProbabilityOutcomeDefinition, 'probability' | 'weight'> { id?: string; probability: number; }
export interface DecisionOption extends Omit<EventOptionDefinition, 'outcomes'> { detail: string; outcomes?: ProbabilityOutcome[]; }
export interface Decision {
  id: string; catalogId?: string; revision?: number; title: string; briefing: string; options: DecisionOption[];
  kind: EventKind; timing?: EventTiming; category?: string;
  rosterChange?: { kind: 'adjustment' | 'rebuild'; leaving: Array<{ nick: string; role: 'entry' | 'awper' | 'igl' | 'support' | 'rifler' }> };
}
export interface OutcomePreview { optionId: string; outcomeId: string; outcomeLabel: string; probability: number; changes: StatChange; resultPatch?: TournamentResultPatch; delayedRisk?: string; }

export type WorldlineStatus = 'active' | 'paused' | 'completed' | 'abandoned';
export interface WorldlineProgress { worldlineId: string; status: WorldlineStatus; stageId: string; branchId?: string; startedSeason: number; updatedSeason: number; history: string[]; }
export interface WorldlineStageDefinition { id: string; title: string; description: string; eventIds?: string[]; eventTags?: string[]; }
export interface WorldlineDefinition {
  schemaVersion: '1.0'; worldlineId: string; revision: number; title: string; description: string; tags?: string[];
  source: EventSource; entry: ConditionExpression; initialStage: string; stages: WorldlineStageDefinition[];
  endings?: Array<{ id: string; title: string; description: string }>;
}

export interface CareerEventContext {
  career: { age: number; season: number; careerYear: number };
  player: { role: EventRole; originId?: string; originEventWeights?: Readonly<Record<string,number>>; earlyOpportunityTags?: readonly string[]; ability: number; connections: number; integrity: number; fame: number; health: number; positionFamiliarity: number; internationalAdaptation: number; highPressureChokingRisk: number };
  team: { form: number; rosterStability: number; globalRank: number; regionRank: number; negativeUpsetStreak: number; vrsActive: boolean; region: string; tier: string };
  tournament?: { tier: string; honorClass: string; placement: string; rating: number; isMajor: boolean; isPlayoff: boolean };
  hiddenFlags: Readonly<Record<string, number>>;
  worldlines?: Readonly<Record<string, WorldlineProgress>>;
  eventHistory?: Readonly<Record<string, { count: number; lastSeason: number }>>;
}
