import { CAREER_DATA_VERSION, CAREER_TEAMS, CareerTeam, DATA_SNAPSHOT_NOTE, HonorClass, PlayerRole, TeamRegion, TOURNAMENTS, TournamentTier } from './careerData';
import { CAREER_QUOTES, QuoteTag } from './careerQuotes';
import { CAREER_EVENT_CATALOG, eligibleCatalogEvents } from './careerEventCatalog';

export const CAREER_SAVE_KEY = 'cspa:career:cs-career:v1';
export const CAREER_VERSION = 11;
export const CAREER_RULES_VERSION = 'career-rookie-market-dream-v11';

export type Pace = 'hardcore' | 'standard' | 'fast';
export type OriginId = 'northeast' | 'academy' | 'campus' | 'overseas' | 'southwest' | 'south' | 'central' | 'northwest';
export type Role = 'entry' | 'awper' | 'igl' | 'support';
export type RoleChangePreparation = 'awper-training' | 'igl-assistant' | 'none';
export type RoleChangeOutcome = 'breakthrough' | 'struggle' | 'disaster';
export type IglArchetype = 'brain' | 'fragging' | 'dynasty' | 'awp-caller';
export type Track = 'ability' | 'connections' | 'integrity' | 'fame';
export type CareerPhase = 'ready' | 'season' | 'emergency' | 'report' | 'awards' | 'choice' | 'retired';
export type EventResume = 'start-season' | 'continue-season' | 'continue-report';
export type DefensiveSite = 'a' | 'b' | 'rotator';
export type SeasonHalf = 'first' | 'second';
export type ChoiceKind = 'offseason' | 'annual';
export type EmploymentStatus = 'signed' | 'free-agent' | 'streamer';
export type ContractTier = 't1' | 't2' | 't3';
export type StatChange = Partial<Record<Track, number>> & { health?: number; earnings?: number; signingBonus?: number; contractSalary?: number; assets?: number; teamForm?: number; rosterStability?: number; positionFamiliarity?: number; defensiveSite?: DefensiveSite; resetVrs?: boolean; preserveCore?: boolean; transfer?: boolean; internationalTransfer?: boolean; contractTier?: ContractTier; contractTeamId?: string; contractHalfSeasons?: number; employmentStatus?: EmploymentStatus; noOfferWindows?: number; rolePreparation?: RoleChangePreparation; roleChange?: Role; iglArchetype?: IglArchetype; bootcampBonus?: number; highPressureChokingRisk?: number; internationalAdaptation?: number };
export interface TournamentResultPatch { placementDelta?: number; placement?: string; ratingDelta?: number; }
export interface DelayedOutcome { tag: string; riskHint: string; minSeasons: number; maxSeasons: number; changes: StatChange; revealText: string; }
export interface PendingConsequence { id: string; sourceDecisionId: string; dueSeason: number; tag: string; changes: StatChange; revealText: string; }
export interface OutcomePreview { optionId: string; outcomeId: string; outcomeLabel: string; probability: number; changes: StatChange; resultPatch?: TournamentResultPatch; delayedRisk?: string; }

export interface Origin { id: OriginId; name: string; place: string; description: string; abilityBase: number; connectionsBase: number; integrityBase: number; fameBase: number; }
export interface CareerStats { matches: number; rating: number; kd: number; adr: number; trophies: number; mvps: number; earnings: number; salaryIncome: number; prizeIncome: number; signingIncome: number; }
export interface StatSnapshot { ability: number; connections: number; integrity: number; fame: number; health: number; earnings: number; }
export interface StatDeltas extends StatSnapshot {}
export interface ContextRatings { major: number; elite: number; playoffs: number; arena: number; bigMatches: number; finals: number; elimination: number; vsTop5: number; vsTop10: number; vsTop20: number; }
export interface UpsetRecord { kind: 'positive' | 'negative'; opponent: string; opponentRank: number; format: string; score: string; probability: number; rankingImpact: number; }
export interface TournamentResult { id: string; tournamentId: string; name: string; organizer: string; tier: TournamentTier; honorClass: HonorClass; invited: boolean; invitationReason: string; placement: string; matches: number; wins: number; maps: number; mapWins: number; teamPrize: number; playerPrize: number; salaryPaid: number; rating: number; rankingDelta: number; context: ContextRatings; upset?: UpsetRecord; expectedPlacement?: string; hasCriticalEvent?: boolean; criticalEventId?: string; }
export interface HonorAward { id: string; season: number; tournamentName: string; kind: 'MVP' | 'EVP' | 'VP' | '冠军'; honorClass: HonorClass; }
export interface Top20Entry { rank: number; playerId: string; nick: string; team: string; score: number; isPlayer: boolean; }
export interface AnnualTop20 { calendarYear: number; careerYear: number; eligible: boolean; playerRank?: number; entries: Top20Entry[]; review?: string; generatedQuote?: string; t1Maps?: number; nominationChance?: number; }
export interface RenewalFactor { label: string; value: number; }
export interface RenewalEvaluation { season: number; chance: number; attitude: '稳妥' | '观望' | '危险'; factors: RenewalFactor[]; contractExpired: boolean; retained?: boolean; summary: string; }
export interface MarketOffer { id: string; teamId: string; team: string; rank: number; tier: string; role: '首发' | '轮换' | '试训'; salary: number; contractHalfSeasons: number; signingBonus: number; reason: string; cost: string; international?: boolean; }
export interface SeasonRecord {
  season: number; careerYear: number; half: SeasonHalf; age: number; team: string; tier: string; rating: number; kd: number; adr: number;
  matches: number; winRate: number; placement: string; teamPrize: number; playerPrize: number; salaryPaid: number; note: string; deltas: StatDeltas; tournaments: TournamentResult[]; globalRank: number; regionRank: number; rankingDelta: number; honors: HonorAward[];
}
export interface ProbabilityOutcome { id?: string; label: string; probability: number; changes: StatChange; resultPatch?: TournamentResultPatch; delayed?: DelayedOutcome; }
export interface DecisionOption { id: string; label: string; detail: string; result?: string; changes: StatChange; outcomes?: ProbabilityOutcome[]; }
export interface Decision { id: string; title: string; briefing: string; options: DecisionOption[]; kind: 'emergency' | 'field' | ChoiceKind; timing?: 'in-season' | 'post-report'; category?: string; }
export interface SeasonProgress { tournamentIds: string[]; nextIndex: number; results: TournamentResult[]; salaryPerTournament: number; pendingEvent?: Decision; }
export interface CareerState {
  version: number; rulesVersion: string; dataVersion: string; seed: number; pace: Pace; name: string; origin: Origin; role: Role; defensiveSite: DefensiveSite; positionFamiliarity: number; age: number; careerYear: number; half: SeasonHalf; season: number;
  teamId: string; team: string; region: TeamRegion; roster: Array<{ nick: string; role: PlayerRole; isPlayer?: boolean }>; coreMemberIds: string[]; tier: string; globalRank: number; regionRank: number; rankingPoints: number; vrsActive: boolean; rebuildPoints: number; lastTransferFee: number; teamForm: number; rosterStability: number; negativeUpsetStreak: number; internationalAdaptation: number; cncsRevival: boolean; ability: number; connections: number; integrity: number; fame: number; health: number; salary: number;
  rolePreparation: RoleChangePreparation; roleChangeCooldown: number; roleChangeCount: number; iglArchetype?: IglArchetype; bootcampCount: number; highPressureChokingRisk: number;
  hiddenFlags: Record<string, number>; pendingConsequences: PendingConsequence[]; employmentStatus: EmploymentStatus; noOfferWindows: number; contractHalfSeasonsRemaining: number; renewalEvaluation?: RenewalEvaluation; marketOffers?: MarketOffer[]; marketHeat?: string; assets: number; streamerWindows: number; highPotential: boolean;
  status: 'active' | 'retired'; phase: CareerPhase; choiceKind?: ChoiceKind; decision?: Decision; pendingEmergencies: Decision[]; resolvedEmergencies: string[]; eventResume?: EventResume; postReportEvent?: Decision;
  seasonProgress?: SeasonProgress; lastEventResult?: string; seasonBaseline?: StatSnapshot; stats: CareerStats; history: SeasonRecord[]; honors: HonorAward[]; top20History: AnnualTop20[]; log: string[];
}

export const ORIGINS: Origin[] = [
  { id: 'northeast', name: '东北网吧队', place: '沈阳', description: '线下赛打得多，出枪不怕硬碰硬。', abilityBase: 61, connectionsBase: 38, integrityBase: 72, fameBase: 18 },
  { id: 'academy', name: '京津青训营', place: '北京', description: '教练和试训资源都近，竞争也更早开始。', abilityBase: 56, connectionsBase: 58, integrityBase: 70, fameBase: 24 },
  { id: 'campus', name: '江浙校园赛', place: '杭州', description: '备选退路稳定，学习与适应能力更强。', abilityBase: 52, connectionsBase: 43, integrityBase: 81, fameBase: 17 },
  { id: 'overseas', name: '海外华人社区', place: '温哥华', description: '早早接触国际服，也要面对陌生赛场。', abilityBase: 57, connectionsBase: 35, integrityBase: 74, fameBase: 29 },
  { id: 'southwest', name: '川渝电竞馆', place: '成都', description: '地区赛事氛围浓厚，团队配合意识强。', abilityBase: 58, connectionsBase: 48, integrityBase: 76, fameBase: 20 },
  { id: 'south', name: '粤港网游圈', place: '广州', description: '商业资源丰富，但竞技环境复杂。', abilityBase: 54, connectionsBase: 52, integrityBase: 68, fameBase: 32 },
  { id: 'central', name: '中原高校联盟', place: '武汉', description: '理论基础扎实，战术理解深刻。', abilityBase: 55, connectionsBase: 45, integrityBase: 79, fameBase: 19 },
  { id: 'northwest', name: '西北草根圈', place: '西安', description: '起步晚但韧性足，善于逆境翻盘。', abilityBase: 59, connectionsBase: 36, integrityBase: 77, fameBase: 16 },
];

const teams = ['北岸电子', '火线青年', '终局协议', '边线俱乐部', '暗门战队'];
const placements = ['公开赛八强', '挑战赛四强', '地区联赛亚军', '邀请赛冠军'];
const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const makeRng = (seed: number) => () => { let value = seed += 0x6D2B79F5; value = Math.imul(value ^ value >>> 15, value | 1); value ^= value + Math.imul(value ^ value >>> 7, value | 61); return ((value ^ value >>> 14) >>> 0) / 4294967296; };
const hash = (text: string) => [...text].reduce((value, char) => Math.imul(value ^ char.charCodeAt(0), 16777619), 2166136261) >>> 0;
const seeded = (state: Pick<CareerState, 'seed' | 'season'>, key: string) => makeRng(hash(`${state.seed}:${state.season}:${key}`));
const snapshot = (state: CareerState): StatSnapshot => ({ ability: state.ability, connections: state.connections, integrity: state.integrity, fame: state.fame, health: state.health, earnings: state.stats.earnings });
const difference = (before: StatSnapshot, after: StatSnapshot): StatDeltas => ({ ability: after.ability - before.ability, connections: after.connections - before.connections, integrity: after.integrity - before.integrity, fame: after.fame - before.fame, health: after.health - before.health, earnings: after.earnings - before.earnings });
const declineAtAge = (age: number) => {
  if(age<=21)return 0;
  if(age<=25)return 0;
  if(age===26)return 2;
  if(age===27)return 4;
  if(age===28)return 6;
  if(age===29)return 8;
  if(age===30)return 10;
  return 12+(age-31)*4;
};
const peakAgeBonus = (age: number) => age === 21 ? 2 : age === 22 ? 1 : 0;
export const ageDecline = (fromAge: number, toAge: number) => { let total = 0; for (let age = fromAge + 1; age <= toAge; age += 1) total += declineAtAge(age); return total; };

const coreCrisisTemplates: Array<Omit<Decision, 'id'>> = [
  { kind: 'emergency', category: '三人核心', title: '队友被高价挖角', briefing: '另一家俱乐部同时报价两名核心队友。若两人离队，现阵容将不足三人，模拟 VRS 积分会立即清零。', options: [
    { id:'keep-core', label:'降薪留队维持核心', detail:'保留全部积分 / 月薪下降 / 关系 +6', changes:{ connections:6, fame:-1, preserveCore:true } },
    { id:'follow-core', label:'跟随核心整体转会', detail:'获得签字费 / 保留全部积分 / 关系 +3', changes:{ connections:3, transfer:true, preserveCore:true } },
    { id:'accept-rebuild', label:'接受阵容重建', detail:'积分清零 / 只能从公开预选重新开始', changes:{ ability:3, resetVrs:true } },
  ] },
  { kind: 'emergency', category: '三人核心', title: '俱乐部出售三人组', briefing: '管理层收到一笔高额三人组报价。阵容积分可以随三人核心整体转移，但原俱乐部希望你留下重建。', options: [
    { id:'move-trio', label:'随三人组整体转会', detail:'获得签字费 / 模拟 VRS 完整继承', changes:{ transfer:true, preserveCore:true, fame:3 } },
    { id:'stay-rebuild', label:'留在原队重建', detail:'积分清零 / 队内地位提升 / 关系 +5', changes:{ resetVrs:true, connections:5 } },
  ] },
  { kind: 'emergency', category: '三人核心', title: '管理层大换血', briefing: '俱乐部准备一次更换三名选手。新阵容纸面实力更强，但原有三人核心和全部排名积分都将消失。', options: [
    { id:'oppose-change', label:'联合队友反对换血', detail:'55% 保住核心 / 45% 仍被拆散', changes:{ connections:4 }, outcomes:[{label:'管理层撤回换血方案',probability:55,changes:{preserveCore:true}},{label:'换血照常执行，积分清零',probability:45,changes:{resetVrs:true,connections:-5}}] },
    { id:'support-change', label:'支持管理层重建', detail:'积分清零 / 能力 +5 / 关系 -4', changes:{ resetVrs:true, ability:5, connections:-4 } },
  ] },
  { kind: 'emergency', category: '三人核心', title: '主动邀请老队友组队', briefing: '两名老队友希望与你重新组成三人核心。新俱乐部愿意支付高额转会费，并继承这套核心的赛事积分。', options: [
    { id:'form-core', label:'组成新三人核心', detail:'整体转会 / 获得签字费 / 保留积分', changes:{ transfer:true, preserveCore:true, connections:5 } },
    { id:'remain-team', label:'拒绝邀请继续留队', detail:'当前阵容不变 / 清白 +2 / 名气 -2', changes:{ integrity:2, fame:-2, preserveCore:true } },
  ] },
];

const emergencyTemplates: Array<Omit<Decision, 'id'>> = [
  { kind: 'emergency', title: '战队突然解散', briefing: '赛季进行中，俱乐部因资金断裂宣布解散。比赛还没结束，你必须立刻决定接下来怎么打。', options: [
    { id: 'take-offer', label: '接受临时报价', detail: '关系 +5，名气 +2，能力 -2', changes: { connections: 5, fame: 2, ability: -2 } },
    { id: 'finish-standin', label: '以替补身份打完赛季', detail: '能力 +4，关系 -3，健康 -4', changes: { ability: 4, connections: -3, health: -4 } },
  ] },
  { kind: 'emergency', title: '管理层强制转会', briefing: '窗口关闭前，管理层突然把你列入交易名单。舆论已经发酵，当前赛季仍要继续。', options: [
    { id: 'cooperate', label: '配合转会安排', detail: '关系 +4，名气 +3，清白 +1', changes: { connections: 4, fame: 3, integrity: 1 } },
    { id: 'public-refusal', label: '公开拒绝转会', detail: '能力 +3，名气 +6，关系 -7', changes: { ability: 3, fame: 6, connections: -7 } },
  ] },
  { kind: 'emergency', title: '突发手腕伤病', briefing: '赛季中段训练时手腕受伤。队医建议休赛，但主力位置随时可能被替代。', options: [
    { id: 'rest', label: '接受治疗并休赛', detail: '健康 +10，能力 -4，名气 -2', changes: { health: 10, ability: -4, fame: -2 } },
    { id: 'play-hurt', label: '带伤继续比赛', detail: '能力 +4，名气 +3，健康 -12', changes: { ability: 4, fame: 3, health: -12 } },
  ] },
  { kind: 'emergency', title: '赞助商突然撤资', briefing: '主要赞助商在赛季末撤资，俱乐部要求全队降薪并临时增加直播任务。', options: [
    { id: 'stream-more', label: '接受直播任务', detail: '名气 +6，关系 +2，能力 -3', changes: { fame: 6, connections: 2, ability: -3 } },
    { id: 'refuse-extra', label: '拒绝额外商务', detail: '能力 +3，清白 +2，关系 -5', changes: { ability: 3, integrity: 2, connections: -5 } },
  ] },
];

const fieldEventTemplates: Array<Omit<Decision, 'id'>> = [
  { kind: 'field', timing: 'in-season', category: '治安', title: '球迷冲突', briefing: '比赛结束后，两边球迷在停车场发生冲突。你的车辆正好被堵在中间。', options: [
    { id: 'drive-away', label: '下车劝阻', detail: '60% 被拦住 / 40% 受到轻伤', changes: { fame: 2 }, outcomes: [
      { label: '安保及时拦住了你', probability: 60, changes: { connections: 2 } }, { label: '混乱中受到轻伤', probability: 40, changes: { health: -8, fame: 3 } },
    ] },
    { id: 'call-security', label: '锁门等待安保', detail: '100% 安全脱身 / 关系 -1', changes: { connections: -1 }, outcomes: [{ label: '安保清理出安全通道', probability: 100, changes: { integrity: 1 } }] },
  ] },
  { kind: 'field', timing: 'in-season', category: '设备', title: '比赛设备争议', briefing: '裁判发现你的外设配置与赛事备案不一致，比赛被技术暂停。', options: [
    { id: 'cooperate-check', label: '配合全面检查', detail: '85% 只是登记错误 / 15% 被判技术违规', changes: { integrity: 3 }, outcomes: [
      { label: '确认只是登记错误', probability: 85, changes: { fame: -1 } }, { label: '被判技术违规', probability: 15, changes: { fame: -5, connections: -3 } },
    ] },
    { id: 'argue-ruling', label: '当场质疑裁判', detail: '45% 改判 / 55% 维持处罚', changes: { fame: 3, connections: -3 }, outcomes: [
      { label: '赛事方撤销处罚', probability: 45, changes: { integrity: 2 } }, { label: '处罚维持并追加警告', probability: 55, changes: { integrity: -5 } },
    ] },
  ] },
  { kind: 'field', timing: 'post-report', category: '采访', title: '赛后采访失言', briefing: '直播采访中，你对队友的评价被截取传播，舆论开始发酵。', options: [
    { id: 'apologize', label: '立即公开道歉', detail: '75% 平息争议 / 25% 被继续嘲讽', changes: { integrity: 3 }, outcomes: [
      { label: '争议逐渐平息', probability: 75, changes: { connections: 3, fame: -2 } }, { label: '道歉引发二次传播', probability: 25, changes: { fame: 5, connections: -2 } },
    ] },
    { id: 'double-down', label: '坚持原本说法', detail: '40% 获得支持 / 60% 队内关系恶化', changes: { fame: 5 }, outcomes: [
      { label: '部分观众公开支持你', probability: 40, changes: { connections: 1 } }, { label: '队内关系明显恶化', probability: 60, changes: { connections: -7 } },
    ] },
  ] },
  { kind: 'field', timing: 'post-report', category: '社媒', title: '社交媒体争议', briefing: '你多年前的一条动态被翻出，赞助商要求在当天给出解释。', options: [
    { id: 'explain-post', label: '发布完整说明', detail: '70% 获得理解 / 30% 继续发酵', changes: { integrity: 2 }, outcomes: [
      { label: '说明获得多数人理解', probability: 70, changes: { fame: -2 } }, { label: '争议继续发酵', probability: 30, changes: { fame: 6, connections: -3 } },
    ] },
    { id: 'delete-post', label: '删除并保持沉默', detail: '50% 热度消退 / 50% 被质疑逃避', changes: {}, outcomes: [
      { label: '热度很快消退', probability: 50, changes: { fame: -3 } }, { label: '沉默被视为逃避', probability: 50, changes: { integrity: -4, fame: 4 } },
    ] },
  ] },
  { kind: 'field', timing: 'in-season', category: '签证', title: '客场签证受阻', briefing: '前往海外比赛的签证迟迟没有签发，战队必须决定是否安排替补。', options: [
    { id: 'urgent-visa', label: '自费走加急流程', detail: '80% 按时参赛 / 20% 仍然缺席', changes: { earnings: -4 }, outcomes: [
      { label: '签证及时签发', probability: 80, changes: { connections: 2 } }, { label: '仍然错过首轮比赛', probability: 20, changes: { ability: -3, fame: -2 } },
    ] },
    { id: 'accept-bench', label: '接受替补安排', detail: '100% 避免损失扩大 / 能力 -2', changes: { ability: -2, integrity: 2 }, outcomes: [{ label: '替补完成了首轮比赛', probability: 100, changes: { connections: 1 } }] },
  ] },
  { kind: 'field', timing: 'post-report', category: '税务', title: '收入申报抽查', briefing: '赛季奖金和直播收入触发税务抽查，历史合同也被要求补充材料。', options: [
    { id: 'full-audit', label: '提交全部材料', detail: '90% 顺利通过 / 10% 补缴费用', changes: { integrity: 5 }, outcomes: [
      { label: '审查顺利结束', probability: 90, changes: { fame: -1 } }, { label: '需要补缴费用', probability: 10, changes: { earnings: -8 } },
    ] },
    { id: 'ask-agent', label: '交给经纪人处理', detail: '65% 妥善解决 / 35% 留下合规隐患', changes: { connections: 3 }, outcomes: [
      { label: '经纪团队妥善解决', probability: 65, changes: {} }, { label: '申报材料留下隐患', probability: 35, changes: { integrity: -8 } },
    ] },
  ] },
  { kind: 'field', timing: 'post-report', category: '赞助', title: '争议品牌邀约', briefing: '一家话题度很高的新品牌开出高额代言，但合同中的合规条款含糊不清。', options: [
    { id: 'take-sponsor', label: '接受高额代言', detail: '65% 正常合作 / 35% 爆发品牌危机', changes: { earnings: 15, fame: 5 }, outcomes: [
      { label: '合作正常完成', probability: 65, changes: { connections: 2 } }, { label: '品牌危机波及个人', probability: 35, changes: { integrity: -8, fame: 6 } },
    ] },
    { id: 'reject-sponsor', label: '拒绝这份合同', detail: '100% 避免合规风险 / 名气 -2', changes: { integrity: 4, fame: -2 }, outcomes: [{ label: '团队找到更稳妥的合作', probability: 100, changes: { connections: 1 } }] },
  ] },
  { kind: 'field', timing: 'in-season', category: '交通', title: '转场交通事故', briefing: '战队前往比赛场馆途中发生轻微交通事故，赛前准备时间被大幅压缩。', options: [
    { id: 'continue-travel', label: '检查后继续赶往场馆', detail: '70% 正常参赛 / 30% 状态受损', changes: { health: -2 }, outcomes: [
      { label: '全队及时抵达场馆', probability: 70, changes: { connections: 2 } }, { label: '疲劳影响比赛状态', probability: 30, changes: { ability: -4, health: -4 } },
    ] },
    { id: 'medical-check', label: '优先进行医疗检查', detail: '100% 确保安全 / 可能缺席比赛', changes: { health: 5, ability: -3 }, outcomes: [{ label: '检查确认没有严重伤势', probability: 100, changes: { integrity: 2 } }] },
  ] },
];

const offseasonTemplates: Array<Omit<Decision, 'id'>> = [
  { kind: 'offseason', title: '休赛期封闭集训', briefing: '新赛季前有六周空档。教练希望全队参加高强度封闭训练。', options: [
    { id: 'train', label: '参加封闭集训', detail: '能力 +6，关系 +2，健康 -4', changes: { ability: 6, connections: 2, health: -4 } },
    { id: 'recover', label: '以恢复训练为主', detail: '健康 +8，能力 +1，名气 -1', changes: { health: 8, ability: 1, fame: -1 } },
  ] },
  { kind: 'offseason', title: '合同与转会窗口', briefing: '现队愿意续约，另一支更强的队伍只保证轮换位置。', options: [
    { id: 'stay', label: '留队继续首发', detail: '关系 +5，能力 +2，名气 -1', changes: { connections: 5, ability: 2, fame: -1 } },
    { id: 'move', label: '转会冲击更高舞台', detail: '名气 +5，能力 +3，关系 -4', changes: { fame: 5, ability: 3, connections: -4 } },
    { id: 'negotiate', label: '等待更好合同', detail: '清白 +2，名气 +2，关系 -2', changes: { integrity: 2, fame: 2, connections: -2 } },
  ] },
  { kind: 'offseason', title: '队内定位调整', briefing: '教练准备重做体系，你可以争夺核心位置，也可以承担更多团队职责。', options: [
    { id: 'core', label: '争取核心资源', detail: '能力 +5，名气 +3，关系 -4', changes: { ability: 5, fame: 3, connections: -4 } },
    { id: 'team-role', label: '接受团队定位', detail: '关系 +6，清白 +2，名气 -2', changes: { connections: 6, integrity: 2, fame: -2 } },
  ] },
  { kind: 'offseason', title: '直播与商务档期', briefing: '平台给出独家直播合约，但会占用一部分训练时间。', options: [
    { id: 'commercial', label: '签下直播合约', detail: '名气 +8，收入 +12，能力 -3', changes: { fame: 8, earnings: 12, ability: -3 } },
    { id: 'competition', label: '专注竞技训练', detail: '能力 +5，健康 -2，名气 -2', changes: { ability: 5, health: -2, fame: -2 } },
  ] },
  { kind: 'offseason', title: '完整休息还是加练', briefing: '漫长赛季结束后，你的身体需要恢复，但个人教练已经排好加练计划。', options: [
    { id: 'full-rest', label: '完整休息', detail: '健康 +10，能力 -2，名气 -1', changes: { health: 10, ability: -2, fame: -1 } },
    { id: 'extra-practice', label: '继续高强度加练', detail: '能力 +7，健康 -7，关系 -1', changes: { ability: 7, health: -7, connections: -1 } },
  ] },
  { kind: 'offseason', title: '来源不明的训练赛', briefing: '熟人邀请你参加一场高额训练赛，奖金来源和对手安排都说不清楚。', options: [
    { id: 'refuse', label: '拒绝并保留记录', detail: '清白 +7，关系 -4，名气 -1', changes: { integrity: 7, connections: -4, fame: -1 } },
    { id: 'accept', label: '接受训练赛邀请', detail: '收入 +10，关系 +5，清白 -12', changes: { earnings: 10, connections: 5, integrity: -12 } },
  ] },
];

const annualTemplates: Array<Omit<Decision, 'id'>> = [
  { kind: 'annual', title: '下一年的战队方向', briefing: '一整年结束后，你需要决定下一年留在熟悉体系，还是转会冲击更高目标。', options: [
    { id: 'annual-stay', label: '留队保持稳定', detail: '关系 +7，能力 +2，名气 -2', changes: { connections: 7, ability: 2, fame: -2 } },
    { id: 'annual-move', label: '主动寻求转会', detail: '能力 +4，名气 +6，关系 -5', changes: { ability: 4, fame: 6, connections: -5 } },
  ] },
  { kind: 'annual', title: '竞技还是商业', briefing: '新的年度规划只能有一个重心。商业团队和个人教练都在等你的答复。', options: [
    { id: 'annual-compete', label: '全年专注竞技', detail: '能力 +8，健康 -5，名气 -3', changes: { ability: 8, health: -5, fame: -3 } },
    { id: 'annual-business', label: '扩大商业影响', detail: '名气 +10，收入 +18，能力 -4', changes: { fame: 10, earnings: 18, ability: -4 } },
  ] },
  { kind: 'annual', title: '定位转型计划', briefing: '年龄和版本变化都在迫使你重新评估打法。', options: [
    { id: 'annual-transform', label: '学习新的团队定位', detail: '关系 +7，能力 +3，名气 -2', changes: { connections: 7, ability: 3, fame: -2 } },
    { id: 'annual-style', label: '坚持个人打法', detail: '能力 +6，名气 +4，关系 -4', changes: { ability: 6, fame: 4, connections: -4 } },
  ] },
  { kind: 'annual', title: '年度身体管理', briefing: '连续两个赛季后，你必须在系统休养和高强度冬训之间做选择。', options: [
    { id: 'annual-rest', label: '进行系统休养', detail: '健康 +14，能力 -3，名气 -2', changes: { health: 14, ability: -3, fame: -2 } },
    { id: 'annual-train', label: '投入高强度冬训', detail: '能力 +9，健康 -9，关系 +1', changes: { ability: 9, health: -9, connections: 1 } },
  ] },
];

const fallbackOutcomes = (option: DecisionOption): ProbabilityOutcome[] => [
  { id:`${option.id}-expected`, label:option.result??'决定按预期执行，但付出了相应代价', probability:62, changes:{} },
  { id:`${option.id}-variance`, label:'执行过程出现偏差，收益与代价发生变化', probability:38, changes:{ ability:(option.changes.ability??0)>0?-2:1, connections:(option.changes.connections??0)>0?-2:1, health:(option.changes.health??0)>0?-2:0 } },
];
const instantiate = (template: Omit<Decision, 'id'>, id: string): Decision => ({ ...template, id, options: template.options.map(option => ({ ...option, outcomes:(option.outcomes?.length&&option.outcomes.length>=2?option.outcomes:fallbackOutcomes(option)).map((outcome,index) => ({ ...outcome, id:outcome.id??`${id}-${option.id}-${index}` })) })) });
const eventCountFor = (state: CareerState) => {
  const roll=seeded(state,'event-count')();
  if(state.pace==='hardcore')return roll<.25?0:roll<.75?1:2;
  if(state.pace==='standard')return roll<.7?0:1;
  if(state.half==='first')return 0;
  return roll<.85?0:1;
};
const tournamentEventTemplates: Array<Omit<Decision, 'id'>> = [
  { kind:'field', category:'团队', title:'复盘室里的分歧', briefing:'刚结束的比赛暴露了补枪节奏问题。队友认为你过于强调个人处理，教练要求当场统一下一场的执行方式。', options:[
    { id:'review-together',label:'留下来和全队逐回合复盘',detail:'更重视团队同步，个人恢复时间会被压缩',result:'复盘持续到深夜。队友接受了新的补枪口令，但你没有得到完整休息。',changes:{connections:4,teamForm:4,health:-2}},
    { id:'review-solo',label:'先整理自己的失误清单',detail:'更利于个人调整，队友可能觉得你在回避争议',result:'你的个人问题很快被整理清楚，团队讨论却没有等到你。',changes:{ability:2,connections:-3,rosterStability:-2}},
  ]},
  { kind:'field', category:'位置', title:'教练提出换防区', briefing:'对手已经开始针对你当前的防区习惯。教练希望下一项赛事前调整你的长期主守位置。', options:[
    { id:'move-a',label:'改为主守 A 区',detail:'接受新的长期职责，短期需要重新建立默契',result:'你接下了 A 区职责。训练重点和搭档沟通从今天开始重排。',changes:{defensiveSite:'a',positionFamiliarity:-12,connections:2}},
    { id:'move-b',label:'改为主守 B 区',detail:'承担更独立的防守任务，短期适应存在压力',result:'你转去主守 B 区。更多独立判断落到你身上，教练会观察适应速度。',changes:{defensiveSite:'b',positionFamiliarity:-12,ability:1}},
    { id:'move-rotator',label:'改为游走补位',detail:'扩大支援责任，对沟通和读局要求更高',result:'你成为主要游走位。队伍愿意给你调度空间，也要求你更快报出判断。',changes:{defensiveSite:'rotator',positionFamiliarity:-14,connections:3}},
    { id:'keep-site',label:'协商保留当前防区',detail:'维持熟悉体系，但需要拿表现证明选择',result:'教练暂时保留了你的防区。下一场的表现会决定这次坚持是否站得住。',changes:{positionFamiliarity:4,connections:-2}},
  ]},
  { kind:'field', category:'战术', title:'残局指挥权', briefing:'连续几个残局出现多人同时报指令的情况。教练让你决定是否承担下一项赛事的残局沟通。', options:[
    { id:'take-clutch-call',label:'承担残局沟通',detail:'团队指令会更统一，但个人操作负担上升',result:'残局只保留你的主指令。队友执行更统一，你也必须同时处理更多信息。',changes:{connections:3,teamForm:3,health:-2}},
    { id:'leave-to-igl',label:'交还给指挥统一处理',detail:'职责更清楚，个人影响力会有所收缩',result:'指挥重新拿回全部残局调度。你的任务变得明确，但发言权也随之减少。',changes:{rosterStability:3,fame:-1}},
  ]},
  { kind:'field', category:'训练', title:'针对性加练', briefing:'分析师发现下一个对手会反复攻击你的主守区，训练组只剩一个晚上的准备时间。', options:[
    { id:'extra-server',label:'和防区搭档留队加练',detail:'提升防区配合，会消耗赛间恢复',result:'你和搭档把关键道具与回防路线重新走了一遍，次日精神明显更紧绷。',changes:{positionFamiliarity:6,connections:2,health:-4}},
    { id:'protect-recovery',label:'保留恢复计划',detail:'身体状态更稳定，战术准备维持原样',result:'你按计划完成恢复。身体状态稳定，但对手的针对只能临场解决。',changes:{health:4,teamForm:-1}},
  ]},
  { kind:'field', category:'采访', title:'赛后话筒递到面前', briefing:'采访者追问刚才的失利是否源于队友没有执行你的判断。直播镜头还没有切走。', options:[
    { id:'protect-team',label:'把责任归于整体执行',detail:'保护团队关系，个人话题度不会上升',result:'你没有点名任何队友。更衣室注意到了这次表态，争议很快降温。',changes:{connections:4,integrity:2,fame:-1}},
    { id:'state-disagreement',label:'坦率说明战术分歧',detail:'表达个人立场，可能放大队内压力',result:'你的回答成为赛后讨论焦点。外界知道了分歧，队内气氛也更加直接。',changes:{fame:4,connections:-4,rosterStability:-3}},
  ]},
  { kind:'field', category:'健康', title:'手臂出现紧绷反应', briefing:'赛后理疗时，队医发现你的前臂负荷偏高。下一项赛事间隔很短。', options:[
    { id:'medical-plan',label:'接受减量训练',detail:'优先控制伤情，比赛手感可能变慢',result:'队医调整了训练量。疼痛得到控制，但你需要在下一场重新寻找手感。',changes:{health:7,ability:-2}},
    { id:'keep-routine',label:'维持原训练计划',detail:'保持竞技节奏，身体风险继续累积',result:'你维持了原计划。训练手感没有中断，紧绷感也没有完全消失。',changes:{ability:2,health:-6}},
  ]},
];
const pickCatalogEvent = (state:CareerState, kind:Decision['kind'], key:string, timing?:Decision['timing']) => {
  const pool=eligibleCatalogEvents(state,kind,timing);
  if(!pool.length)return undefined;
  const template=pool[Math.floor(seeded(state,`${key}:pick`)()*pool.length)];
  return instantiate(template,`${key}-${template.catalogId}`);
};
const rookieSafeFieldEvent=(state:CareerState,key:string)=>{
  const safe=eligibleCatalogEvents(state,'field').filter(event=>!['伤病健康','合规风险','治安'].includes(event.category));
  const template=safe[Math.floor(seeded(state,`${key}:pick`)()*safe.length)];
  return template?instantiate(template,key):undefined;
};
const emergenciesFor = (state:CareerState) => {
  if(state.season===1){
    if(state.pace!=='hardcore'||seeded(state,'rookie-safe-event')()>=1)return [];
    const event=rookieSafeFieldEvent(state,`s${state.season}-rookie-safe`);
    return event?[event]:[];
  }
  if(state.season===2){
    if(seeded(state,'rookie-severe-event')()>=.03)return [];
    const event=pickCatalogEvent(state,'emergency',`s${state.season}-rookie-risk`);
    return event?[event]:[];
  }
  return Array.from({ length: eventCountFor(state) }, (_, index) => pickCatalogEvent(state,'emergency',`s${state.season}-e${index+1}`)).filter((event):event is Decision=>Boolean(event));
};
const tournamentEventFor = (state: CareerState, result: TournamentResult, index: number) => {
  const trigger=state.season===1?(state.pace==='hardcore'?.3:state.pace==='standard'?.04:0):state.season===2?.03:state.pace==='hardcore'?.08:state.pace==='standard'?.04:0;
  if(!trigger)return undefined;
  if(seeded(state,`tournament-event-trigger:${index}:${result.tournamentId}`)()>=trigger)return undefined;
  if(state.season<=2)return rookieSafeFieldEvent(state,`s${state.season}-t${index+1}-rookie-safe`);
  return pickCatalogEvent(state,'field',`s${state.season}-t${index+1}`, 'in-season');
};
const cnTeams=new Set(['TYLOO','Lynn Vision','Rare Atom','JiJieHao','Steel Helmet']);
const isCnTeam=(state:CareerState)=>cnTeams.has(state.team);
const hasInternationalResume=(state:CareerState)=>state.history.flatMap(record=>record.tournaments).some(result=>isLargeOrHigher(result.honorClass)&&result.rating>=1.08);
const isHighPotential=(state:CareerState,rating=state.history.at(-1)?.rating??state.stats.rating)=>state.age<23&&state.ability>=75&&state.health>=65&&rating>=marketRatingFloor(state)&&state.integrity>=35;
const internationalEligible=(state:CareerState)=>isCnTeam(state)&&state.age<23&&((state.ability>=75&&state.internationalAdaptation>=45)||(state.history.at(-1)?.rating??0)>=1.12&&hasInternationalResume(state));
const internationalOfferFor=(state:CareerState):Decision=>instantiate({kind:'offseason',category:'国际转会',title:'国际纵队正式报价',briefing:'你的年轻高潜状态和国际履历进入海外队伍视野。更高赛事上限伴随语言、体系和首发竞争。',options:[{id:'join-international',label:'接受国际纵队轮换合同',detail:'1–2 年合同 / 初期关系 -6、战队状态 -5 / 国际机会提高',changes:{internationalTransfer:true,contractTier:'t1',connections:-6,teamForm:-5,fame:7,internationalAdaptation:10}},{id:'stay-cn',label:'留在当前体系继续首发',detail:'保持现阵容 / 关系 +6 / 等待下一次国际窗口',changes:{connections:6,preserveCore:true}}]},`s${state.season}-international`);
const relativeTierLabel=(state:CareerState,target:ContractTier)=>{const current=teamTierForRank(state.globalRank);if(current===target)return target==='t1'?'同级 1.5 线队':'同级强队';if(target==='t1')return '升至 1.5 线';if(target==='t2')return current==='t3'?'升至二线':'降至二线';return '降至三线';};
const marketOfferChoiceFor=(state:CareerState,offers:MarketOffer[]):Decision=>instantiate({kind:'offseason',category:'合同转会',title:'转会市场收件箱',briefing:`你的表现引起市场关注：${state.marketHeat??'经纪人正在整理报价'}。每份报价都显示了层级、角色、期限、签字费和接受代价。`,options:[
  ...offers.map(offer=>({id:`market-offer-${offer.id}`,label:`接受 ${offer.team} · ${offer.role}`,detail:`模拟 VRS #${offer.rank} / ${offer.tier} / ${offer.salary} 万/月 / ${offer.contractHalfSeasons/2} 年 / 签字费 ${offer.signingBonus} 万`,changes:{contractTier:teamTierForRank(offer.rank),contractTeamId:offer.teamId,contractHalfSeasons:offer.contractHalfSeasons,internationalTransfer:offer.international,signingBonus:offer.signingBonus,contractSalary:offer.salary,employmentStatus:'signed' as const},result:`触发原因：${offer.reason}；代价：${offer.cost}` as string})),
  {id:'market-stay',label:'拒绝报价，留在当前队伍',detail:'保持现合同和首发默契 / 关闭本次市场热度',changes:{connections:4,fame:-1},result:'你决定先把当前体系打磨到更高水平。'},
]},`s${state.season}-market-inbox`);
const freeAgentChoiceFor=(state:CareerState):Decision=>instantiate({kind:'offseason',category:'合同转会',title:'自由人窗口',briefing:'原队合同已经结束。报价会明确显示相对当前履历的升降级、合同期限和首发保障。',options:[
  {id:'accept-market-offer',label:'接受当前职业报价',detail:`65% ${relativeTierLabel(state,'t2')}首发 / 35% ${relativeTierLabel(state,'t3')}首发`,changes:{},outcomes:[{id:'market-t2',label:`获得${relativeTierLabel(state,'t2')}首发合同`,probability:65,changes:{contractTier:'t2',employmentStatus:'signed',noOfferWindows:0,connections:3}},{id:'market-t3',label:`获得${relativeTierLabel(state,'t3')}首发合同`,probability:35,changes:{contractTier:'t3',employmentStatus:'signed',noOfferWindows:0,fame:-3}}]},
  {id:'wait-better-offer',label:'继续等待更高层级队伍',detail:'24% 等到二线强队 / 76% 本窗口没有报价',changes:{},outcomes:[{id:'wait-success',label:'二线强队临时出现首发空缺',probability:24,changes:{contractTier:'t2',employmentStatus:'signed',noOfferWindows:0,connections:-2,fame:2}},{id:'wait-fail',label:'窗口关闭，仍然没有职业队报价；你转为直播维持曝光并继续等待',probability:76,changes:{employmentStatus:'streamer',noOfferWindows:state.noOfferWindows+1,assets:-6,fame:-2,health:-2}}]},
  {id:'become-streamer',label:'暂别赛场，直播等待机会',detail:'进入半年主播窗口 / 保留复出资格 / 可用资产承担生活成本',changes:{employmentStatus:'streamer',noOfferWindows:0},outcomes:[{id:'stream-start',label:'直播间开始稳定运营，你仍在维持职业训练',probability:80,changes:{fame:3}},{id:'stream-slow',label:'直播起步缓慢，但你保留了继续等待的空间',probability:20,changes:{fame:1}}]},
]},`s${state.season}-free-agent`);
const breachChoiceFor=(state:CareerState):Decision=>instantiate({kind:'offseason',category:'合同转会',title:'违约加盟争冠队',briefing:'一支顶级队伍出现临时空缺，但转会窗口即将关闭。对方暗示你先与原队撕破合同，再解决买断问题。',options:[
  {id:'breach-for-superteam',label:'主动违约抱团争冠',detail:'32% 加盟成功 / 43% 被原队冷藏 / 25% 两边都不要',changes:{integrity:-8,connections:-6,earnings:-12},outcomes:[{id:'breach-success',label:'争冠队支付后续费用，你进入一线阵容，但背负违约口碑',probability:32,changes:{contractTier:'t1',employmentStatus:'signed',noOfferWindows:0,fame:10,integrity:-8}},{id:'breach-benched',label:'争冠队撤回承诺，原队将你冷藏到合同结束',probability:43,changes:{ability:-7,fame:-6,connections:-10,employmentStatus:'signed'}},{id:'breach-free',label:'合同解除，但市场认为风险过高，没有队伍立即报价',probability:25,changes:{employmentStatus:'free-agent',noOfferWindows:1,fame:-10,integrity:-7}}]},
  {id:'honor-contract',label:'履行合同等待正式报价',detail:'76% 保住首发 / 24% 错过窗口后资源下降',changes:{integrity:5,fame:-3},outcomes:[{id:'stay-starting',label:'原队认可职业态度，继续给你首发资源',probability:76,changes:{connections:6,teamForm:3}},{id:'stay-cost',label:'争冠机会消失，原队也开始培养替代者',probability:24,changes:{connections:-3,ability:-2,rosterStability:-4}}]},
]},`s${state.season}-contract-breach`);
const dreamEventFor=(state:CareerState,rating:number):Decision|undefined=>{
  if(state.season<=2||state.hiddenFlags.dreamCooldown)return undefined;
  const baseline=marketRatingFloor(state);
  const route=rating>=baseline+.12?'新人爆发线':state.role==='igl'&&state.connections>=60?'年轻指挥线':state.internationalAdaptation>=50?'国际试训线':state.teamForm>=75?'明星搭档线':state.history.at(-1)?.tournaments.some(result=>result.upset?.kind==='positive')?'爆冷英雄线':state.rosterStability>=78?'老队重组线':'版本受益线';
  if(seeded(state,`dream-route:${route}`)()>=.28)return undefined;
  const common={kind:'offseason' as const,category:'合同转会',title:`经纪人来信：${route}`,briefing:`你最近的表现让圈内人开始用更高的标准讨论你。这个机会低概率出现，但失败不会结束职业生涯。`,options:[
    {id:'dream-push',label:'抓住这次罕见窗口',detail:'能力与市场热度提高，但训练、关系或健康会承受代价',changes:{ability:4,fame:7,connections:-3,health:-3}},
    {id:'dream-steady',label:'先把当前队伍打磨好',detail:'保留稳定性，未来仍可能重新收到邀请',changes:{teamForm:5,rosterStability:4,connections:3}},
  ]};
  return instantiate(common,`s${state.season}-dream-${route}`);
};
const streamerChoiceFor=(state:CareerState):Decision=>{
  const income=Math.max(1,Math.round(2+state.fame*.14));
  const livingCost=Math.round(7+state.streamerWindows*1.5);
  const offerChance=Math.max(5,Math.min(72,Math.round(state.ability*.55+state.fame*.2+state.connections*.15+state.internationalAdaptation*.1-state.age-state.streamerWindows*8)));
  return instantiate({kind:'offseason',category:'退役转型',title:'主播待业窗口',briefing:`半年预计直播收入 ${income} 万、生活成本 ${livingCost} 万。当前可用资产 ${state.assets} 万，职业报价基础概率 ${offerChance}%。`,options:[
    {id:'stream-focus',label:'专注直播积累观众',detail:`预计净资产 ${income-livingCost>=0?'+':''}${income-livingCost} 万 / 能力 -3 / 报价概率较低`,changes:{assets:income-livingCost,earnings:income,fame:5,ability:-3,employmentStatus:'streamer'},outcomes:[{id:'stream-no-offer',label:'直播数据增长，但暂时没有合适的职业报价',probability:Math.max(20,100-Math.round(offerChance*.55)),changes:{}},{id:'stream-t3',label:'一支三线队提供首发复出合同',probability:Math.min(80,Math.round(offerChance*.55)),changes:{contractTier:'t3',employmentStatus:'signed',noOfferWindows:0}}]},
    {id:'stream-train',label:'自费训练保持竞技状态',detail:`训练与生活净支出 ${livingCost+5} 万 / 能力 -1 / 报价概率提高`,changes:{assets:-(livingCost+5),ability:-1,health:2,employmentStatus:'streamer'},outcomes:[{id:'train-no-offer',label:'训练状态尚可，但本窗口没有合适位置',probability:Math.max(15,100-offerChance),changes:{}},{id:'train-t2',label:'一支二线队提供首发复出合同',probability:Math.min(85,offerChance),changes:{contractTier:'t2',employmentStatus:'signed',noOfferWindows:0,connections:2}}]},
    {id:'stream-tryout',label:'主动联系队伍参加试训',detail:`差旅与团队费用 ${livingCost+7} 万 / 关系 -2 / 高层级报价概率提高`,changes:{assets:-(livingCost+7),connections:-2,ability:-2,employmentStatus:'streamer'},outcomes:[{id:'tryout-no-offer',label:'试训结束后没有队伍立即签约',probability:Math.max(12,100-Math.round(offerChance*1.15)),changes:{}},{id:'tryout-t1',label:internationalEligible(state)?'国际纵队提供轮换短约':'1.5 线队提供轮换短约',probability:Math.min(88,Math.round(offerChance*1.15)),changes:{contractTier:'t1',internationalTransfer:internationalEligible(state),employmentStatus:'signed',noOfferWindows:0,connections:2,internationalAdaptation:internationalEligible(state)?6:0}}]},
  ]},`s${state.season}-streamer-${state.streamerWindows}`);
};
const marketOffersFor=(state:CareerState,rating:number):MarketOffer[]=>{
  const baseline=marketRatingFloor(state);
  const recentRatings=[...state.history.map(record=>record.rating),rating].slice(-2);
  const priorTwo=recentRatings.length===2&&recentRatings.every(value=>value>=baseline+.06);
  const singleBreakthrough=rating>=baseline+.12;
  if(state.season<=2||(!priorTwo&&!singleBreakthrough))return [];
  const currentRank=state.globalRank;
  const currentTier=teamTierForRank(currentRank);
  const guaranteedBand:ContractTier=currentTier==='t3'?'t2':'t1';
  const extreme=rating>=baseline+.18&&state.ability>=78;
  const ranges:Array<{tier:ContractTier;min:number;max:number;role:MarketOffer['role']}>=guaranteedBand==='t2'
    ? [{tier:'t2',min:35,max:60,role:'首发'},{tier:'t2',min:21,max:40,role:'轮换'},{tier:extreme?'t1':'t2',min:extreme?5:21,max:extreme?20:35,role:'试训'}]
    : [{tier:'t1',min:13,max:20,role:'首发'},{tier:'t1',min:8,max:18,role:'轮换'},{tier:'t1',min:extreme?1:8,max:extreme?10:20,role:'试训'}];
  return ranges.map((range,index)=>{
    const candidates=CAREER_TEAMS.filter(team=>team.baseRank>=range.min&&team.baseRank<=range.max&&team.id!==state.teamId);
    const team=candidates[Math.floor(seeded(state,`rating-offer:${index}:${rating}`)()*candidates.length)]??CAREER_TEAMS.find(team=>team.id!==state.teamId&&team.baseRank<currentRank)!;
    const formal=singleBreakthrough&&state.ability>=72||priorTwo;
    const role:MarketOffer['role']=index===0&&formal?'首发':range.role;
    return {id:`${state.season}-${team.id}-${index}`,teamId:team.id,team:team.name,rank:team.baseRank,tier:team.baseRank<=12?'一线赛场':team.baseRank<=20?'1.5 线赛场':team.baseRank<=60?'二线赛场':'三线赛场',role,salary:Number((monthlySalaryFor({...state,globalRank:team.baseRank})*(isHighPotential(state)?1.25:1)).toFixed(1)),contractHalfSeasons:isHighPotential(state)?6:4,signingBonus:Math.round(transferFeeFor(state)*signingRateFor(state)*(isHighPotential(state)?1.4:1)),reason:singleBreakthrough?'单季 Rating 超过位置基准 +0.12':'连续两个赛季 Rating 超过位置基准 +0.06',cost:team.baseRank<=20?'首发保障降低，需要适应更严格的体系':'离开当前队伍，关系短期下降',international:false};
  });
};
const choiceFor = (state: CareerState, kind: ChoiceKind) => {
  if(state.marketOffers?.length)return marketOfferChoiceFor(state,state.marketOffers);
  if(state.employmentStatus==='streamer')return streamerChoiceFor(state);
  if(state.employmentStatus==='free-agent')return freeAgentChoiceFor(state);
  const internationalChance=isHighPotential(state)?.32:.18;
  if(kind==='offseason'&&internationalEligible(state)&&seeded(state,'international-offer')()<internationalChance)return internationalOfferFor(state);
  const dream=dreamEventFor(state,state.history.at(-1)?.rating??state.stats.rating);
  if(dream)return dream;
  const breachEligible=kind==='offseason'&&state.fame>=45&&state.ability>=72&&seeded(state,'breach-offer')()<.06;
  if(breachEligible)return breachChoiceFor(state);
  return pickCatalogEvent(state,kind,`s${state.season}-${kind}`) ?? instantiate(kind==='annual'?annualTemplates[0]:offseasonTemplates[0],`s${state.season}-${kind}-fallback`);
};

const signingRateFor = (state: CareerState) => .03 + Math.min(.05, (state.connections + state.fame) / 4000);
const transferFeeFor = (state: CareerState, core = false) => {
  const tierBase = state.globalRank <= 12 ? 800 : state.globalRank <= 20 ? 350 : state.globalRank <= 40 ? 120 : 50;
  const starValue = state.ability * 8 + state.fame * 5 + state.top20History.filter(item => item.playerRank).length * 160;
  return Math.round(Math.min(core ? 5000 : 2500, Math.max(core ? 1500 : 50, (tierBase + starValue) * (core ? 2.2 : 1))));
};
const teamTierForRank=(rank:number):ContractTier=>rank<=20?'t1':rank<=60?'t2':'t3';
const marketRatingFloor=(state:CareerState)=>state.role==='igl'?(state.iglArchetype==='brain'?.84:state.iglArchetype==='fragging'?.94:state.iglArchetype==='awp-caller'?1.06:.98):state.role==='support'?.94:state.role==='awper'?1.05:1.00;
const contractLengthFor=(state:CareerState)=>{
  const roll=seeded(state,`contract-length:${state.season}:${state.teamId}`)();
  const potential=isHighPotential(state);
  if(potential)return roll<.55?6:4;
  if(state.age<=24)return roll<.25?6:roll<.78?4:2;
  return roll<.18?4:2;
};
const marketEvaluation=(state:CareerState,rating:number,honors:HonorAward[],contractExpired:boolean):RenewalEvaluation=>{
  const tier=teamTierForRank(state.globalRank);
  const factors:RenewalFactor[]=[
    {label:'基础市场判断',value:42},
    {label:'当前能力',value:Math.round((state.ability-60)*.55)},
    {label:'最近 Rating',value:Math.round((rating-marketRatingFloor(state))*85)},
    {label:'队内关系',value:Math.round((state.connections-50)*.18)},
    {label:'健康与出勤',value:Math.round((state.health-60)*.12)},
    {label:'赛事荣誉',value:Math.min(14,honors.reduce((sum,honor)=>sum+(honor.kind==='MVP'?7:honor.kind==='EVP'?4:honor.kind==='冠军'?3:1),0))},
    {label:'年龄与赛场压力',value:-Math.round(Math.max(0,state.age-25)*(tier==='t1'?3:tier==='t2'?2:1)+(tier==='t1'?8:tier==='t2'?3:0))},
    {label:'年轻高潜',value:isHighPotential(state,rating)?10:0},
  ].filter(factor=>factor.value!==0);
  const chance=Math.max(8,Math.min(94,factors.reduce((sum,factor)=>sum+factor.value,0)));
  const attitude:RenewalEvaluation['attitude']=chance>=70?'稳妥':chance>=40?'观望':'危险';
  if(!contractExpired)return {season:state.season,chance,attitude,factors,contractExpired:false,summary:`管理层${attitude}：合同尚余 ${state.contractHalfSeasonsRemaining} 个半年`};
  const retained=seeded(state,`contract-retention:${state.season}`)()<chance/100;
  return {season:state.season,chance,attitude,factors,contractExpired:true,retained,summary:retained?`原队以 ${chance}% 评估通过续约`:`原队以 ${chance}% 评估决定不续约，进入公开市场`};
};
const monthlySalaryFor = (state: CareerState) => {
  const bestTop=state.top20History.reduce((best,item)=>Math.min(best,item.playerRank??99),99);
  const personalFactor=Math.min(1,Math.max(0,(state.ability-45)/55*.72+state.fame/100*.18+(bestTop<=5?.1:bestTop<=20?.05:0)));
  const [minimum,maximum]=state.globalRank<=5?[18,78]:state.globalRank<=12?[8,25]:state.globalRank<=20?[4,10]:state.globalRank<=40?[1.5,5]:state.globalRank<=80?[.8,3]:[.5,1.5];
  return Number((minimum+(maximum-minimum)*personalFactor).toFixed(1));
};
const applyChanges = (state: CareerState, changes: StatChange): CareerState => {
  const signingBonus=changes.signingBonus??0;
  const earned=(changes.earnings??0)+signingBonus;
  let next: CareerState = { ...state, ability: clamp(state.ability + (changes.ability ?? 0)), connections: clamp(state.connections + (changes.connections ?? 0)), integrity: clamp(state.integrity + (changes.integrity ?? 0)), fame: clamp(state.fame + (changes.fame ?? 0)), health: clamp(state.health + (changes.health ?? 0)), assets:state.assets+(changes.assets??(earned>0?earned*.55:earned)),teamForm:clamp(state.teamForm+(changes.teamForm??0)), rosterStability:clamp(state.rosterStability+(changes.rosterStability??0)), positionFamiliarity:clamp(state.positionFamiliarity+(changes.positionFamiliarity??0)), defensiveSite:changes.defensiveSite??state.defensiveSite, iglArchetype:changes.iglArchetype??state.iglArchetype, employmentStatus:changes.employmentStatus??state.employmentStatus,noOfferWindows:changes.noOfferWindows??state.noOfferWindows, highPressureChokingRisk:clamp(state.highPressureChokingRisk+(changes.highPressureChokingRisk??0)), internationalAdaptation:clamp(state.internationalAdaptation+(changes.internationalAdaptation??0)), stats: { ...state.stats, earnings: Math.max(0, state.stats.earnings + earned), signingIncome:state.stats.signingIncome+signingBonus } };
  if(changes.contractTier){
    const [minRank,maxRank]=changes.contractTier==='t1'?[8,20]:changes.contractTier==='t2'?[21,60]:[61,98];
    const candidates=CAREER_TEAMS.filter(team=>team.baseRank>=minRank&&team.baseRank<=maxRank&&(changes.internationalTransfer?team.region==='Europe':true));
    const target=changes.contractTeamId?CAREER_TEAMS.find(team=>team.id===changes.contractTeamId):candidates[Math.floor(seeded(state,`contract-team:${changes.contractTier}:${state.streamerWindows}`)()*candidates.length)];
    if(target){
      const contractHalfSeasonsRemaining=contractLengthFor(next);
      next={...next,teamId:target.id,team:target.name,region:target.region,roster:rosterWithPlayer(target,state.name,state.role),globalRank:target.baseRank,regionRank:regionRankFor(target.baseRank,target.region),tier:changes.contractTier==='t1'?'1.5 线赛场':changes.contractTier==='t2'?'二线赛场':'三线赛场',teamForm:55,rosterStability:58,employmentStatus:'signed',noOfferWindows:0,contractHalfSeasonsRemaining:changes.contractHalfSeasons??contractHalfSeasonsRemaining,streamerWindows:state.employmentStatus==='streamer'?state.streamerWindows:0,renewalEvaluation:undefined,marketOffers:undefined,marketHeat:undefined,log:[`签约 ${target.name} / ${(changes.contractHalfSeasons??contractHalfSeasonsRemaining)/2} 年合同 / ${relativeTierLabel(state,changes.contractTier)}`,...next.log]};
    }
  }
  if (changes.rolePreparation) next = { ...next, rolePreparation: changes.rolePreparation };
  if (changes.bootcampBonus) next = { ...next, bootcampCount: state.bootcampCount + 1 };
  if (changes.roleChange) {
    const newRole = changes.roleChange;
    const preparationBonus = (state.rolePreparation === 'awper-training' && newRole === 'awper') || (state.rolePreparation === 'igl-assistant' && newRole === 'igl') ? 20 : 0;
    const outcomeRoll = seeded(state, `rolechange-outcome:${newRole}`)();
    const abilityMod = state.ability / 100;
    const connectionsMod = state.connections / 100;
    let outcome: RoleChangeOutcome;
    let abilityChange = 0;
    let fameChange = 0;
    let connectionsChange = 0;
    if (newRole === 'awper') {
      const successChance = 0.35 + abilityMod * 0.20 + preparationBonus * 0.01;
      if (outcomeRoll < successChance) {
        outcome = 'breakthrough';
        abilityChange = 12; fameChange = 15; connectionsChange = 8;
      } else if (outcomeRoll < successChance + 0.30) {
        outcome = 'struggle';
        abilityChange = -6; fameChange = -3; connectionsChange = -2;
      } else {
        outcome = 'disaster';
        abilityChange = -15; fameChange = -8; connectionsChange = -5;
      }
    } else if (newRole === 'igl') {
      const successChance = 0.40 + connectionsMod * 0.25 + preparationBonus * 0.01;
      if (outcomeRoll < successChance) {
        outcome = 'breakthrough';
        abilityChange = 5; fameChange = 8; connectionsChange = 15;
      } else if (outcomeRoll < successChance + 0.35) {
        outcome = 'struggle';
        abilityChange = -4; fameChange = -2; connectionsChange = -6;
      } else {
        outcome = 'disaster';
        abilityChange = -8; fameChange = -5; connectionsChange = -12;
      }
    } else if (newRole === 'support') {
      const successChance = 0.50 + connectionsMod * 0.20;
      if (outcomeRoll < successChance) {
        outcome = 'breakthrough';
        abilityChange = 3; fameChange = -2; connectionsChange = 12;
      } else if (outcomeRoll < successChance + 0.35) {
        outcome = 'struggle';
        abilityChange = -5; fameChange = -5; connectionsChange = -3;
      } else {
        outcome = 'disaster';
        abilityChange = -10; fameChange = -8; connectionsChange = -8;
      }
    } else {
      const successChance = 0.45 + abilityMod * 0.15;
      if (outcomeRoll < successChance) {
        outcome = 'breakthrough';
        abilityChange = 8; fameChange = 6; connectionsChange = 5;
      } else if (outcomeRoll < successChance + 0.35) {
        outcome = 'struggle';
        abilityChange = -4; fameChange = -3; connectionsChange = -2;
      } else {
        outcome = 'disaster';
        abilityChange = -12; fameChange = -6; connectionsChange = -6;
      }
    }
    const outcomeText = outcome === 'breakthrough' ? '转职大成功，打开新天地' : outcome === 'struggle' ? '转职艰难，表现下滑' : '转职灾难，职业生涯受重创';
    next = { ...next, role: newRole, rolePreparation: 'none', roleChangeCooldown: 4, roleChangeCount: state.roleChangeCount + 1, ability: clamp(next.ability + abilityChange), fame: clamp(next.fame + fameChange), connections: clamp(next.connections + connectionsChange), log: [`转职 ${newRole} / ${outcomeText}`, ...next.log] };
  }
  if (changes.resetVrs) next = { ...next, vrsActive:false, rankingPoints:0, rebuildPoints:0, globalRank:101, regionRank:Math.max(1,CAREER_TEAMS.filter(team=>team.region===state.region).length+1), tier:'三线赛场', log:[`${state.team} 三人核心不足，模拟 VRS 积分清零`,...next.log] };
  if (changes.transfer || changes.internationalTransfer) {
    const fee = transferFeeFor(state, Boolean(changes.preserveCore));
    const bonus = Math.round(fee * signingRateFor(state) * (state.highPotential?1.4:1));
    const international=Boolean(changes.internationalTransfer);
    const target=international?CAREER_TEAMS.find(team=>team.region==='Europe'&&team.baseRank>=12&&team.baseRank<=25):undefined;
    next = { ...next, lastTransferFee:fee, assets:next.assets+bonus*.55, ...(target?{teamId:target.id,team:target.name,region:target.region,roster:rosterWithPlayer(target,state.name,state.role),globalRank:target.baseRank,regionRank:regionRankFor(target.baseRank,target.region),rankingPoints:Math.round(1800-target.baseRank*15),vrsActive:true,rebuildPoints:0,tier:'1.5 线赛场',teamForm:55,rosterStability:58,internationalAdaptation:clamp(state.internationalAdaptation+12)}:{}), stats:{...next.stats, earnings:next.stats.earnings+bonus, signingIncome:next.stats.signingIncome+bonus}, log:[`转会费 ${fee} 万 / 签字费 ${bonus} 万`,...next.log] };
  }
  return next;
};
const roleForRoster = (role: Role): PlayerRole => role === 'entry' ? 'entry' : role === 'awper' ? 'awper' : role === 'igl' ? 'igl' : 'support';
const initialTeamFor = (origin: OriginId) => CAREER_TEAMS.find(team => team.name === (
  origin === 'academy' ? 'TYLOO' :
  origin === 'campus' ? 'Rare Atom' :
  origin === 'overseas' ? 'FlyQuest' :
  origin === 'southwest' ? 'Steel Helmet' :
  origin === 'south' ? 'JiJieHao' :
  origin === 'central' ? 'Lynn Vision' :
  origin === 'northwest' ? 'ATOX' :
  'Lynn Vision'
)) ?? CAREER_TEAMS[27];
const rosterWithPlayer = (team: CareerTeam, name: string, role: Role) => {
  const targetRole = roleForRoster(role);
  const replacedIndex = Math.max(0, team.roster.findIndex(player => player.role === targetRole));
  return team.roster.map((player, index) => index === replacedIndex ? { nick: name, role: targetRole, isPlayer: true } : { nick: player.nick, role: player.role });
};
const regionRankFor = (globalRank: number, region: TeamRegion) => Math.max(1, CAREER_TEAMS.filter(team => team.region === region && team.baseRank <= globalRank).length);
const sigmoid=(value:number)=>1/(1+Math.exp(-value));
const invitationFor = (state:CareerState, tournament:typeof TOURNAMENTS[number]) => {
  const {globalRank,regionRank}=state;
  if(tournament.tier==='Major'){
    if(regionRank<=10)return {invited:true,reason:`VRS ${regionRank<=4?'后段阶段':'第一阶段'}区域邀请`};
    const chance=Math.max(.01,Math.min(.45,sigmoid((14-regionRank)/3)*(.60+state.teamForm/220)));
    const qualified=seeded(state,`qualifier:${tournament.id}`)()<chance;
    return {invited:qualified,reason:qualified?`通过 Major 区域预选（${Math.round(chance*100)}%）`:`Major 区域预选出局（晋级率 ${Math.round(chance*100)}%）`};
  }
  if(tournament.tier==='T1'){
    if(globalRank<=20)return {invited:true,reason:`VRS 全球第 ${globalRank} 名顺位邀请`};
    const chance=Math.max(.03,Math.min(.75,sigmoid((32-globalRank)/8)*(.65+state.teamForm/250)*(.75+state.rosterStability/400)));
    const qualified=seeded(state,`qualifier:${tournament.id}`)()<chance;
    return {invited:qualified,reason:qualified?`通过公开预选（${Math.round(chance*100)}%）`:`公开预选出局（晋级率 ${Math.round(chance*100)}%）`};
  }
  if(tournament.tier==='T2'){
    if(globalRank>12)return {invited:true,reason:`符合 T2 VRS 邀请规则（全球第 ${globalRank}）`};
    const chance=Math.max(.08,Math.min(.55,.18+(100-state.teamForm)/400));
    const qualified=seeded(state,`qualifier:${tournament.id}`)()<chance;
    return {invited:qualified,reason:qualified?`通过 T2 公开预选（${Math.round(chance*100)}%）`:'未通过 T2 公开预选'};
  }
  return {invited:true,reason:'非排名赛自由邀请'};
};
const honorWeight: Record<HonorClass, number> = { medium: 1, large: 2, elite: 3, 'super-elite': 4, major: 5 };
const iglProfileFor=(state:CareerState)=>{
  if(state.role!=='igl')return {ratingBase:undefined as number|undefined,ratingSpread:.16,teamBoost:0,stabilityBoost:0};
  const archetype=state.iglArchetype??'brain';
  if(archetype==='fragging')return {ratingBase:.95,ratingSpread:.10,teamBoost:2,stabilityBoost:1};
  if(archetype==='dynasty')return {ratingBase:1.00,ratingSpread:.10,teamBoost:8,stabilityBoost:8};
  if(archetype==='awp-caller')return {ratingBase:1.10,ratingSpread:.10,teamBoost:state.teamForm>=65?6:-3,stabilityBoost:2};
  return {ratingBase:.84,ratingSpread:.08,teamBoost:7,stabilityBoost:7};
};
const dynastyEvolutionFor=(state:CareerState,results:TournamentResult[])=>{
  if(state.role!=='igl'||state.iglArchetype==='dynasty'||state.globalRank>5||state.teamForm<85||state.rosterStability<85)return false;
  const teammateQuality=state.roster.filter(player=>!player.isPlayer).map(player=>70+seeded(state,`roster-quality:${state.teamId}:${player.nick}`)()*30);
  if(teammateQuality.length!==4||teammateQuality.some(value=>value<82))return false;
  const eliteDeepRuns=results.filter(result=>isLargeOrHigher(result.honorClass)&&['冠军','亚军','四强'].includes(result.placement)).length;
  const eliteTitles=results.filter(result=>isLargeOrHigher(result.honorClass)&&result.placement==='冠军').length;
  if(eliteDeepRuns<2&&eliteTitles<1)return false;
  return seeded(state,`dynasty-evolution:${state.careerYear}:${state.half}`)()<.002;
};
const tournamentCalendarFor = (state: CareerState) => {
  const count=5+Math.floor(seeded(state,'calendar-count')()*4);
  const majors=TOURNAMENTS.filter(tournament=>tournament.tier==='Major');
  const yearMajorOffset=seeded(state,`major-year:${state.careerYear}`)()<.5?0:1;
  const majorIndex=(state.careerYear*2+(state.half==='second'?1:0)+yearMajorOffset)%majors.length;
  const major=majors[majorIndex];
  const ordered=TOURNAMENTS
    .filter(tournament=>tournament.tier!=='Major'&&(!tournament.region||tournament.region===state.region))
    .map(tournament=>({tournament,order:seeded(state,`calendar-order:${tournament.id}`)()}))
    .sort((a,b)=>a.order-b.order)
    .map(item=>item.tournament);
  const entered=ordered.filter(tournament=>invitationFor(state,tournament).invited);
  const fallback=ordered.filter(tournament=>tournament.tier==='unranked'||tournament.tier==='T2');
  const unique=[...new Map([...entered,...fallback].map(tournament=>[tournament.id,tournament])).values()];
  const majorEntry=invitationFor(state,major);
  const reserve=majorEntry.invited?1:0;
  const picked=unique.slice(0,count-reserve);
  if(majorEntry.invited)picked.splice(Math.min(picked.length,Math.floor(picked.length*.65)),0,major);
  while(picked.length<Math.min(5,count)){
    const replacement=ordered.find(tournament=>!picked.some(item=>item.id===tournament.id));
    if(!replacement)break;
    picked.push(replacement);
  }
  return picked.slice(0,count);
};
const contextRatingsFor = (state: CareerState, tournament: typeof TOURNAMENTS[number], rating: number): ContextRatings => {
  const value = (key:string, modifier=0) => Number(Math.max(.55,rating+modifier+(seeded(state,`context:${tournament.id}:${key}`)()-.5)*.16).toFixed(2));
  const eliteModifier = isLargeOrHigher(tournament.honorClass) ? .01 : -.03;
  return { major:value('major',tournament.tier==='Major'?.02:-.04), elite:value('elite',eliteModifier), playoffs:value('playoffs',-.01), arena:value('arena',.005), bigMatches:value('big',-.015), finals:value('finals',-.025), elimination:value('elimination',-.01), vsTop5:value('top5',-.04), vsTop10:value('top10',-.025), vsTop20:value('top20',-.01) };
};
const upsetFor = (state: CareerState, tournament: typeof TOURNAMENTS[number]) => {
  const format = tournament.format.includes('BO1') ? 'BO1' : tournament.format.includes('BO5') ? 'BO5' : 'BO3';
  const maxNegative = format==='BO1'?.35:format==='BO5'?.12:.2;
  const opponentPool = CAREER_TEAMS.filter(team=>team.id!==state.teamId);
  const opponent = opponentPool[Math.floor(seeded(state,`opponent:${tournament.id}`)()*opponentPool.length)];
  const rankGap = opponent.baseRank-state.globalRank;
  const instability = (100-state.teamForm)*.45+(100-state.rosterStability)*.25+(100-state.health)*.15+(100-state.connections)*.15;
  const negativeProbability = Math.min(maxNegative,Math.max(.01,.02+instability/300+Math.max(0,rankGap)/500));
  const positiveProbability = Math.min(format==='BO1'?.24:format==='BO5'?.08:.14,Math.max(.01,.015+Math.max(0,-rankGap)/420+state.teamForm/1200));
  const roll=seeded(state,`upset:${tournament.id}`)();
  if(rankGap>=18&&roll<negativeProbability) return { kind:'negative' as const, opponent, format, probability:Math.round(negativeProbability*100), impact:-Math.round(18+rankGap*.7+honorWeight[tournament.honorClass]*5) };
  if(rankGap<=-18&&roll<positiveProbability) return { kind:'positive' as const, opponent, format, probability:Math.round(positiveProbability*100), impact:Math.round(24+Math.abs(rankGap)*.8+honorWeight[tournament.honorClass]*6) };
  return undefined;
};
const simulateTournament = (state: CareerState, tournament: typeof TOURNAMENTS[number], salaryPaid: number): TournamentResult => {
  const rng = seeded(state, `tournament:${tournament.id}`);
  const invitation = invitationFor(state,tournament);
  const pressure = honorWeight[tournament.honorClass] * 2.4;
  const dataBonus = tournament.tier === 'unranked' ? .14 : tournament.tier === 'T2' ? .1 : tournament.tier === 'Major' ? -.03 : 0;
  const slumpChance = Math.min(.32, .1 + Math.max(0, 60 - state.health) / 180 + Math.max(0, state.age - 30) * .025);
  const slumped = seeded(state, `tournament-slump:${tournament.id}`)() < slumpChance;
  const slumpPenalty = slumped ? .19 + seeded(state, `tournament-slump-depth:${tournament.id}`)() * .12 : 0;
  const rankStrength=Math.max(25,101-Math.min(100,state.globalRank)*.72);
  const siteFit=(state.positionFamiliarity-50)*.06+(state.defensiveSite==='rotator'?(state.connections-50)*.025:0);
  const roleAgePenalty=state.role==='awper'?Math.max(0,state.age-26)*1.4:state.role==='entry'?Math.max(0,state.age-26)*1.1:state.role==='igl'?0:Math.max(0,state.age-28)*.7;
  const effectiveRating = 0.65 + Math.max(0, state.ability - 38) / 68 * 0.70;
  const carryBonus = Math.max(0, effectiveRating - 1.08) * 140;
  const iglProfile=iglProfileFor(state);
  const seriesTeamBoost=tournament.format.includes('BO1')?iglProfile.teamBoost*.35:iglProfile.teamBoost;
  const performance = rankStrength*.35+state.teamForm*.20+(state.rosterStability+iglProfile.stabilityBoost)*.15+state.ability*.20+carryBonus+seriesTeamBoost+siteFit+rng()*18-pressure-slumpPenalty*25-roleAgePenalty;
  const placement = performance >= 88 ? '冠军' : performance >= 81 ? '亚军' : performance >= 73 ? '四强' : performance >= 64 ? '八强' : performance >= 54 ? '小组赛出局' : '首轮出局';
  const cnChoking=isCnTeam(state)&&isLargeOrHigher(tournament.honorClass)&&state.highPressureChokingRisk>0?
    (seeded(state,`cn-choking:${tournament.id}`)()*100<state.highPressureChokingRisk?0.09:0):0;
  const bootcampBonus=state.bootcampCount>0?.02*Math.min(3,state.bootcampCount):0;
  const rawRating=iglProfile.ratingBase===undefined?0.65+Math.max(0,state.ability-38)/68*.70+siteFit/200+rng()*.16:iglProfile.ratingBase+(rng()-.5)*iglProfile.ratingSpread+Math.max(-.03,Math.min(.03,(state.ability-65)/600));
  let rating = Number(Math.max(.55,rawRating-pressure/220+dataBonus-slumpPenalty-cnChoking+bootcampBonus).toFixed(2));
  const upset = upsetFor(state,tournament);
  const adjustedPlacement = upset?.kind==='negative' ? (performance>=73?'小组赛出局':'首轮出局') : upset?.kind==='positive' ? (performance>=64?'冠军':'四强') : placement;
  const matches = adjustedPlacement === '冠军' ? 7 : adjustedPlacement === '亚军' ? 6 : adjustedPlacement === '四强' ? 5 : adjustedPlacement === '八强' ? 4 : 3;
  const wins = adjustedPlacement === '冠军' ? matches : adjustedPlacement === '亚军' ? matches - 1 : adjustedPlacement === '四强' ? matches - 1 : adjustedPlacement === '八强' ? matches - 2 : Math.max(0, matches - 2);
  const maps=Array.from({length:matches},(_,seriesIndex)=>{
    const isFinal=seriesIndex===matches-1&&['冠军','亚军'].includes(adjustedPlacement);
    const bestOf=tournament.format.includes('BO1')&&!isFinal?1:tournament.format.includes('BO5')&&isFinal?5:3;
    const needed=Math.floor(bestOf/2)+1;
    const extra=bestOf===1?0:bestOf===3?(seeded(state,`maps:${tournament.id}:${seriesIndex}`)()<.48?1:0):Math.floor(seeded(state,`maps:${tournament.id}:${seriesIndex}`)()*3);
    return needed+extra;
  }).reduce((sum,value)=>sum+value,0);
  const mapWins=Math.max(wins,Math.round(maps*(wins/Math.max(1,matches))));
  if(upset?.kind==='positive') rating=Number((rating+.07).toFixed(2));
  if(upset?.kind==='negative') rating=Number(Math.max(.55,rating-.09).toFixed(2));
  const prizeBase = honorWeight[tournament.honorClass] * 30;
  const teamPrize = Math.round(prizeBase * (adjustedPlacement === '冠军' ? 2.2 : adjustedPlacement === '亚军' ? 1.4 : adjustedPlacement === '四强' ? .8 : adjustedPlacement === '八强' ? .4 : .1));
  const playerPrize = Number((teamPrize * .136).toFixed(1));
  const baseRankingDelta = tournament.tier === 'unranked' ? 0 : Math.round((wins / matches - .45) * honorWeight[tournament.honorClass] * 24);
  const rankingDelta=baseRankingDelta+(upset?.impact??0);
  const upsetRecord:UpsetRecord|undefined=upset?{kind:upset.kind,opponent:upset.opponent.name,opponentRank:upset.opponent.baseRank,format:upset.format,score:upset.kind==='positive'?'2:1':'0:2',probability:upset.probability,rankingImpact:upset.impact}:undefined;
  const isCriticalMatch=(adjustedPlacement==='冠军'||adjustedPlacement==='亚军')&&(tournament.tier==='Major'||tournament.honorClass==='super-elite')||(state.globalRank>=90&&adjustedPlacement!=='首轮出局');
  const criticalMomentRoll=seeded(state,`critical:${tournament.id}`)();
  const criticalTriggerRate=state.pace==='fast'?(tournament.tier==='Major'&&['冠军','亚军'].includes(adjustedPlacement)?.08:0):tournament.tier==='Major'?(state.pace==='hardcore'?.15:.08):isLargeOrHigher(tournament.honorClass)?(state.pace==='hardcore'?.10:.06):0;
  const hasCriticalEvent=isCriticalMatch&&criticalMomentRoll<criticalTriggerRate;
  return { id: `s${state.season}-${tournament.id}`, tournamentId: tournament.id, name: tournament.name, organizer: tournament.organizer, tier: tournament.tier, honorClass: tournament.honorClass, invited: invitation.invited, invitationReason: state.vrsActive ? invitation.reason : tournament.tier === 'unranked' ? '未入榜期间参加非排名赛' : invitation.reason, placement:adjustedPlacement, matches, wins, maps, mapWins, teamPrize, playerPrize, salaryPaid, rating, rankingDelta, context:contextRatingsFor(state,tournament,rating), upset:upsetRecord, expectedPlacement:hasCriticalEvent?adjustedPlacement:undefined, hasCriticalEvent, criticalEventId:hasCriticalEvent?`critical-${state.season}-${tournament.id}`:undefined };
};
const honorsForResults = (state: CareerState, results: TournamentResult[]): HonorAward[] => results.flatMap(result => {
  const awards: HonorAward[] = [];
  if (result.placement === '冠军') awards.push({ id: `${result.id}-champion`, season: state.season, tournamentName: result.name, kind: '冠军', honorClass: result.honorClass });
  const roleDataPenalty=state.role==='igl'||state.role==='support'?.05:0;
  const playoffsRating=result.context.playoffs;
  const finalsRating=result.context.finals;
  const vsTop10Rating=result.context.vsTop10;
  const impactBonus=(result.context.bigMatches+result.context.elimination)/2;
  const effectiveRating=result.rating*.4+playoffsRating*.25+finalsRating*.2+impactBonus*.15;
  const mvpThreshold=1.28-roleDataPenalty;
  const evpThreshold=1.18-roleDataPenalty;
  const vpThreshold=1.10-roleDataPenalty;
  const isMajorOrSuperElite=result.tier==='Major'||result.honorClass==='super-elite';
  const hasPlayoffsData=result.matches>=5;
  if(result.placement==='冠军'&&effectiveRating>=mvpThreshold&&playoffsRating>=1.20&&finalsRating>=1.15){
    awards.push({id:`${result.id}-mvp`,season:state.season,tournamentName:result.name,kind:'MVP',honorClass:result.honorClass});
  }else if(result.placement==='亚军'&&effectiveRating>=mvpThreshold+.07&&playoffsRating>=1.25&&finalsRating>=1.20&&isMajorOrSuperElite){
    awards.push({id:`${result.id}-mvp`,season:state.season,tournamentName:result.name,kind:'MVP',honorClass:result.honorClass});
  }else if(effectiveRating>=evpThreshold&&hasPlayoffsData&&['冠军','亚军','四强'].includes(result.placement)&&playoffsRating>=1.12){
    awards.push({id:`${result.id}-evp`,season:state.season,tournamentName:result.name,kind:'EVP',honorClass:result.honorClass});
  }else if(effectiveRating>=vpThreshold&&hasPlayoffsData&&vsTop10Rating>=1.05){
    awards.push({id:`${result.id}-vp`,season:state.season,tournamentName:result.name,kind:'VP',honorClass:result.honorClass});
  }
  return awards;
});
const isLargeOrHigher = (honorClass: HonorClass) => honorWeight[honorClass] >= honorWeight.large;
const averageContext=(results:TournamentResult[],key:keyof ContextRatings)=>Number((results.reduce((sum,result)=>sum+result.context[key]*result.matches*honorWeight[result.honorClass],0)/Math.max(1,results.reduce((sum,result)=>sum+result.matches*honorWeight[result.honorClass],0))).toFixed(2));
const top20ReviewFor=(state:CareerState,year:number,rank:number,results:TournamentResult[],honors:HonorAward[],entries:Top20Entry[])=>{
  const mvps=honors.filter(h=>h.kind==='MVP').length,evps=honors.filter(h=>h.kind==='EVP').length,vps=honors.filter(h=>h.kind==='VP').length;
  const major=averageContext(results,'major'),elite=averageContext(results,'elite'),playoffs=averageContext(results,'playoffs'),arena=averageContext(results,'arena'),elimination=averageContext(results,'elimination'),finals=averageContext(results,'finals');
  const above=entries.find(e=>e.rank===rank-1),below=entries.find(e=>e.rank===rank+1);
  const honorText=mvps?`凭借 ${mvps} 次 MVP、${evps} 次 EVP 与 ${vps} 次 VP`:`虽然没有拿到 MVP，但依靠 ${evps} 次 EVP 与 ${vps} 次 VP`;
  const compare=above?`与前一位 ${above.nick} 相比，他在最高级别赛事的奖项厚度仍稍逊一筹；但其淘汰赛表现足以压过${below?`后一位 ${below.nick}`:'多数竞争者'}。`:`他在同场奖项比较和高压比赛中领先其他候选人，因此最终位居榜首。`;
  return `${state.name} ${honorText}进入 ${year} 年度第 ${rank} 名。其 Major、精英以上赛事 Rating 分别为 ${major} 和 ${elite}，淘汰赛、场馆及总决赛数据达到 ${playoffs}、${arena} 和 ${finals}，面临淘汰时仍有 ${elimination}。这些数字说明他的表现并非来自低级赛事堆积，而是在更高压力环境中保持了价值。${compare}`;
};
const generateAnnualTop20 = (state: CareerState, yearRecords: SeasonRecord[]): AnnualTop20 => {
  const calendarYear = 2025 + state.careerYear;
  const results = yearRecords.flatMap(record => record.tournaments);
  const rankedResults = results.filter(result => result.tier !== 'unranked');
  const t1Results=results.filter(result=>result.tier==='T1'||result.tier==='Major');
  const t1Maps=t1Results.reduce((sum,result)=>sum+result.maps,0);
  const t1Rating=t1Results.reduce((sum,result)=>sum+result.rating*result.maps,0)/Math.max(1,t1Maps);
  const vsTop10=averageContext(t1Results,'vsTop10');
  const weightedMatches = results.reduce((sum, result) => sum + result.maps * honorWeight[result.honorClass], 0);
  const weightedRating = results.reduce((sum, result) => sum + result.rating * result.maps * honorWeight[result.honorClass], 0) / Math.max(1, weightedMatches);
  const highLevelSuccess = results.some(result => isLargeOrHigher(result.honorClass) && ['冠军','亚军','四强'].includes(result.placement));
  const playerHonors = yearRecords.flatMap(record => record.honors);
  const mvpCount=playerHonors.filter(h=>h.kind==='MVP').length;
  const evpCount=playerHonors.filter(h=>h.kind==='EVP').length;
  const bigEvps=playerHonors.filter(h=>h.kind==='EVP'&&isLargeOrHigher(h.honorClass)).length;
  const hasHardwareBase=mvpCount>=1||bigEvps>=2;
  const meritFloor=t1Maps>=70&&t1Rating>=1.15&&vsTop10>=1.05&&bigEvps>=2;
  const nominationChance=meritFloor?Math.min(.05,.02+Math.max(0,t1Rating-1.15)*.15+Math.max(0,vsTop10-1.05)*.08):0;
  const nominated=meritFloor&&seeded(state,`top20-gate:${calendarYear}`)()<nominationChance;
  const eligible=rankedResults.length>=6&&rankedResults.some(result=>isLargeOrHigher(result.honorClass))&&t1Maps>=70;
  const contextScore=(averageContext(results,'major')*1.35+averageContext(results,'elite')*1.2+averageContext(results,'playoffs')*1.25+averageContext(results,'arena')+averageContext(results,'bigMatches')*1.1+averageContext(results,'finals')*1.2+averageContext(results,'elimination')*1.15+averageContext(results,'vsTop5')*1.25+averageContext(results,'vsTop10')+averageContext(results,'vsTop20')*.8)*26;
  const roleScorePenalty=state.role==='igl'||state.role==='support'?55:state.role==='awper'?-18:0;
  const cnExposurePenalty=isCnTeam(state)&&state.internationalAdaptation<55?35:isCnTeam(state)?15:0;
  const mvpBonus=mvpCount*65;
  const evpBonus=evpCount*28;
  const hardwarePenalty=hasHardwareBase?0:-80;
  const playerScore = weightedRating * 340 + contextScore + mvpBonus + evpBonus + playerHonors.reduce((sum, honor) => sum + honorWeight[honor.honorClass] * (honor.kind === '冠军' ? 18 : 3), 0) + results.reduce((sum, result) => sum + Math.max(0, result.rankingDelta), 0)*.6 + state.fame * .28 - roleScorePenalty - cnExposurePenalty + hardwarePenalty;
  const historicalCalibration:Record<string,number>={ZywOo:62,donk:58,m0NESY:52,ropz:48,NiKo:44,sh1ro:42,flameZ:36,frozen:34,Spinx:32,broky:30,device:28,Jimpphat:26,xertioN:24,KSCERATO:22,molodoy:20};
  const realPlayerAges:Record<string,number>={ZywOo:24,donk:18,m0NESY:19,ropz:25,NiKo:27,sh1ro:23,flameZ:25,frozen:24,Spinx:22,broky:24,device:28,Jimpphat:18,xertioN:21,KSCERATO:25,molodoy:20};
  const realPlayerDecay=(nick:string)=>{
    const startAge=realPlayerAges[nick]??23;
    const currentAge=startAge+state.careerYear;
    if(currentAge<=25)return 0;
    if(currentAge<=27)return -10;
    if(currentAge<=29)return -25;
    if(currentAge<=31)return -45;
    return -80;
  };
  const fictionalPlayerNames=['Akira','Blaze','Cipher','Drake','Echo','Falcon','Ghost','Hunter','Inferno','Jolt','Kilo','Lynx','Matrix','Nexus','Omega','Phoenix','Quantum','Raven','Storm','Titan','Vortex','Wolf','Xeno','Zenith'];
  const generateFictionalPlayers=(careerYear:number)=>{
    const count=Math.min(15,Math.floor(careerYear*1.5));
    return Array.from({length:count},(_, i)=>{
      const seed=hash(`fictional:${i}:${careerYear}`);
      const rng=makeRng(seed);
      const nick=fictionalPlayerNames[i%fictionalPlayerNames.length]+(i>=fictionalPlayerNames.length?Math.floor(i/fictionalPlayerNames.length):'');
      const baseScore=300+rng()*250;
      const age=18+Math.floor(rng()*8);
      const ageBonus=age===21?30:age<=23?15:age<=25?5:0;
      return {playerId:`fictional-${i}`,nick,team:'Generated Team',score:baseScore+ageBonus,isPlayer:false};
    });
  };
  const competitors = CAREER_TEAMS.flatMap(team => team.roster.map(player => {
    const roleModifier = player.role === 'awper' ? 15 : player.role === 'entry' ? 10 : player.role === 'igl' ? -12 : player.role==='support'?-8:4;
    const agingPenalty=realPlayerDecay(player.nick);
    const score = team.strength * 7.8 + roleModifier + (historicalCalibration[player.nick]??0) + seeded(state, `top20:${calendarYear}:${player.id}`)() * 80 + agingPenalty;
    return { playerId: player.id, nick: player.nick, team: team.name, score, isPlayer: false };
  })).sort((a, b) => b.score - a.score || a.playerId.localeCompare(b.playerId));
  const fictionalPlayers=generateFictionalPlayers(state.careerYear);
  const allCompetitors=[...competitors,...fictionalPlayers];
  const candidate = { playerId: `career-player-${state.seed}`, nick: state.name, team: state.team, score: playerScore, isPlayer: true };
  let pool = eligible&&nominated ? [...allCompetitors, candidate] : allCompetitors;
  pool.sort((a, b) => b.score - a.score || a.playerId.localeCompare(b.playerId));
  if (eligible&&nominated&&!highLevelSuccess) {
    const index = pool.findIndex(item => item.isPlayer);
    if (index >= 0 && index < 14) { const [player] = pool.splice(index, 1); pool.splice(14, 0, player); }
  }
  if(eligible&&nominated&&!hasHardwareBase){
    const index=pool.findIndex(item=>item.isPlayer);
    if(index>=0&&index<16){const [player]=pool.splice(index,1);pool.splice(Math.min(20,pool.length),0,player);}
  }
  const entries = pool.slice(0, 20).map((entry, index) => ({ ...entry, rank: index + 1, score: Math.round(entry.score) }));
  let playerRank = entries.find(entry => entry.isPlayer)?.rank;
  const top1Qualified=playerRank===1&&weightedRating>=1.30&&mvpCount>=3&&results.filter(result=>result.placement==='冠军'&&isLargeOrHigher(result.honorClass)).length>=2;
  if(playerRank===1&&(!top1Qualified||seeded(state,`top1-gate:${calendarYear}`)()>=.0009)){
    const index=entries.findIndex(entry=>entry.isPlayer);
    if(index>=0){const [player]=entries.splice(index,1);entries.splice(Math.min(1,entries.length),0,player);entries.forEach((entry,index)=>entry.rank=index+1);playerRank=2;}
  }
  const review=playerRank?top20ReviewFor(state,calendarYear,playerRank,results,playerHonors,entries):undefined;
  const generatedQuote=playerRank&&seeded(state,`top20-quote:${calendarYear}`)()<.35?`"我只想在最重要的比赛里保持清醒，排名是那些回合结束后的结果。"——游戏生成采访` : undefined;
  return { calendarYear, careerYear: state.careerYear, eligible, playerRank, entries, review, generatedQuote, t1Maps, nominationChance:Number((nominationChance*100).toFixed(2)) };
};

const applyOriginVariance = (base: number, seed: number, key: string) => {
  const variance = makeRng(hash(`${seed}:origin:${key}`))();
  return clamp(base + Math.round((variance - 0.5) * 16));
};
const initialSalaryFor=(rank:number,ability:number,fame:number)=>{const [min,max]=rank<=5?[18,78]:rank<=12?[8,25]:rank<=20?[4,10]:rank<=40?[1.5,5]:rank<=80?[.8,3]:[.5,1.5];const factor=Math.min(1,Math.max(0,(ability-45)/55*.8+fame/100*.2));return Number((min+(max-min)*factor).toFixed(1));};
export const createCareer = (input: { seed: string; name: string; pace: Pace; originId: OriginId; role: Role; iglArchetype?: IglArchetype }): CareerState => {
  const origin = ORIGINS.find(item => item.id === input.originId) ?? ORIGINS[0];
  const name = input.name.trim().slice(0, 16) || '无名新人';
  const seed = hash(input.seed.trim() || `${name}:${input.pace}:${origin.id}:${input.role}:${CAREER_RULES_VERSION}:${CAREER_DATA_VERSION}`);
  const ability = applyOriginVariance(origin.abilityBase, seed, 'ability');
  const connections = applyOriginVariance(origin.connectionsBase, seed, 'connections');
  const integrity = applyOriginVariance(origin.integrityBase, seed, 'integrity');
  const fame = applyOriginVariance(origin.fameBase, seed, 'fame');
  const team = initialTeamFor(origin.id);
  return {
    version: CAREER_VERSION, rulesVersion: CAREER_RULES_VERSION, dataVersion: CAREER_DATA_VERSION, seed, pace: input.pace, name, origin, role: input.role, defensiveSite:input.role==='entry'?'a':input.role==='support'?'b':'rotator', positionFamiliarity:68,
    age: 16, careerYear: 1, half: 'first', season: 1, teamId: team.id, team: team.name, region: team.region, roster: rosterWithPlayer(team, name, input.role), coreMemberIds:team.roster.slice(0,3).map(player=>player.id), tier: team.baseRank > 80 ? '三线赛场' : team.baseRank <= 12 ? '一线赛场' : team.baseRank <= 20 ? '1.5 线赛场' : '二线赛场', globalRank: team.baseRank, regionRank: regionRankFor(team.baseRank, team.region), rankingPoints: Math.max(120,Math.round(1800-team.baseRank*15)), vrsActive:true, rebuildPoints:0, lastTransferFee:0, teamForm:Math.round(Math.max(55,75-team.baseRank*.15)), rosterStability:72, negativeUpsetStreak:0, internationalAdaptation:origin.id==='overseas'?68:origin.id==='academy'?35:origin.id==='south'?30:25, cncsRevival:false, ability, connections, integrity, fame, health: 82, salary:initialSalaryFor(team.baseRank,ability,fame), rolePreparation: 'none', roleChangeCooldown: 0, roleChangeCount: 0, iglArchetype:input.role==='igl'?(input.iglArchetype&&input.iglArchetype!=='dynasty'?input.iglArchetype:'brain'):undefined, bootcampCount: 0, highPressureChokingRisk: 20, hiddenFlags:{rookieStartAbility:ability}, pendingConsequences:[], employmentStatus:'signed', noOfferWindows:0, contractHalfSeasonsRemaining:4, assets:5, streamerWindows:0, highPotential:false, status: 'active', phase: 'ready', pendingEmergencies: [], resolvedEmergencies: [], honors: [], top20History: [],
    stats: { matches: 0, rating: 1.01, kd: 1.02, adr: 72, trophies: 0, mvps: 0, earnings: 0, salaryIncome:0, prizeIncome:0, signingIncome:0 }, history: [], log: [`16 岁 / 生涯第 1 年上半年 / 加入 ${team.name}`, DATA_SNAPSHOT_NOTE],
  };
};

const finishSeason = (state: CareerState): CareerState => {
  const rng = seeded(state, 'season-report');
  const turnsOlder = state.half === 'second';
  const nextAge = turnsOlder ? state.age + 1 : state.age;
  const ability = state.ability;
  const health = state.health;
  const tournaments = state.seasonProgress?.results ?? [];
  const honors = honorsForResults(state, tournaments);
  const matches = tournaments.reduce((sum, result) => sum + result.matches, 0);
  const wins = tournaments.reduce((sum, result) => sum + result.wins, 0);
  const teamPrize = tournaments.reduce((sum, result) => sum + result.teamPrize, 0);
  const playerPrize = tournaments.reduce((sum, result) => sum + result.playerPrize, 0);
  const salaryPaid = tournaments.reduce((sum, result) => sum + result.salaryPaid, 0);
  const rankingDelta = tournaments.reduce((sum, result) => sum + result.rankingDelta, 0);
  const rating = Number((tournaments.reduce((sum, result) => sum + result.rating * result.matches, 0) / Math.max(1, matches)).toFixed(2));
  const kd = Number((.76 + ability / 310 + rng() * .17).toFixed(2));
  const adr = Math.round(49 + ability * .57 + rng() * 8);
  const winRate = Math.round(wins / Math.max(1, matches) * 100);
  const best = [...tournaments].sort((a, b) => honorWeight[b.honorClass] - honorWeight[a.honorClass] || ['冠军','亚军','四强','八强','小组赛出局','首轮出局'].indexOf(a.placement) - ['冠军','亚军','四强','八强','小组赛出局','首轮出局'].indexOf(b.placement))[0];
  const rebuildPoints = state.vrsActive ? state.rebuildPoints : Math.max(0, state.rebuildPoints + Math.max(0, rankingDelta));
  const projectedRank=state.vrsActive?state.globalRank-Math.round(rankingDelta/16):100-Math.floor((rebuildPoints-120)/10);
  const projectedPoints=state.vrsActive?state.rankingPoints+rankingDelta:rebuildPoints;
  const vrsActive = state.vrsActive ? projectedRank<=100&&projectedPoints>0 : rebuildPoints>=120;
  const globalRank = vrsActive ? Math.max(1,Math.min(100,projectedRank)) : 101;
  const regionRank = vrsActive ? regionRankFor(globalRank, state.region) : CAREER_TEAMS.filter(team => team.region === state.region).length+1;
  const rankingPoints = vrsActive ? Math.max(1,projectedPoints) : 0;
  const tier = !vrsActive ? '三线赛场' : globalRank <= 12 ? '一线赛场' : globalRank <= 20 ? '1.5 线赛场' : '二线赛场';
  const positiveUpsets=tournaments.filter(result=>result.upset?.kind==='positive').length;
  const negativeUpsets=tournaments.filter(result=>result.upset?.kind==='negative').length;
  const negativeUpsetStreak=negativeUpsets?state.negativeUpsetStreak+negativeUpsets:0;
  const teamForm=clamp(state.teamForm+positiveUpsets*10-negativeUpsets*14+(winRate>=65?5:winRate<40?-6:0));
  const rosterStability=clamp(state.rosterStability-(negativeUpsetStreak>=3?12:negativeUpsetStreak>=2?6:0)+(state.resolvedEmergencies.some(event=>event.includes('核心'))?0:2));
  const fame = clamp(state.fame + honors.length * 2 + tournaments.filter(result => result.placement === '冠军').length * 3+positiveUpsets*5);
  const earnings = state.stats.earnings + playerPrize + salaryPaid;
  const trophies = state.stats.trophies + honors.filter(honor => honor.kind === '冠军').length;
  const mvps = state.stats.mvps + honors.filter(honor => honor.kind === 'MVP').length;
  const before = state.seasonBaseline ?? snapshot(state);
  const asianChampions=[...state.history.flatMap(record=>record.tournaments),...tournaments].filter(result=>result.placement==='冠军'&&(result.name.includes('亚洲')||result.name.includes('东境')||result.name.includes('成都'))).length;
  const revivalEligible=!state.cncsRevival&&isCnTeam(state)&&state.coreMemberIds.length>=3&&asianChampions>0&&ability>=75&&state.connections>=60;
  const cncsRevival=state.cncsRevival||(revivalEligible&&seeded(state,'cncs-revival')()<.005);
  const revivalBoost=cncsRevival&&!state.cncsRevival?18:0;
  const crisisLog=cncsRevival&&!state.cncsRevival?'CNCS 复兴线启动：中国战队获得持续国际邀请与赞助':negativeUpsetStreak>=3?'连续爆冷触发换人或解散风险':negativeUpsetStreak>=2?'连续爆冷引发队内危机':'';
  const dynastyEvolution=dynastyEvolutionFor(state,tournaments);
  const dynastyLog=dynastyEvolution?'隐藏进化：顶级阵容完成长期磨合，你成为王朝指挥':'';
  const t1Matches=tournaments.filter(result=>result.tier==='T1'||result.tier==='Major').reduce((sum,result)=>sum+result.matches,0);
  const growthRoll=seeded(state,'t1-growth')();
  const growthChance=Math.min(0.35,t1Matches*0.008);
  const hasGrowth=t1Matches>=5&&nextAge<=25&&growthRoll<growthChance;
  const potentialMultiplier=isHighPotential(state)?1.4:1;
  const growthAmount=hasGrowth?(seeded(state,'t1-growth-amount')()*3+2)*potentialMultiplier:0;
  const peakBonus=peakAgeBonus(nextAge)*potentialMultiplier;
  const rookieRatingBonus=state.season<=2?Math.max(0,Math.min(4,Math.round((rating-marketRatingFloor(state))/.03))):0;
  const rookieGrowth=state.season<=2?2+rookieRatingBonus:0;
  const totalAbilityChange=peakBonus+growthAmount+rookieGrowth;
  const rookieFloor=state.season===2?Math.max(0,(state.hiddenFlags.rookieStartAbility??ability)+4):0;
  const finalAbility=clamp(Math.max(ability+totalAbilityChange,rookieFloor));
  const floorBonus=Math.max(0,finalAbility-(ability+totalAbilityChange));
  const growthLog=state.season<=2?`新秀成长期：基础成长 +2${rookieRatingBonus?`，表现成长 +${rookieRatingBonus}`:''}${floorBonus?`，成长保底 +${floorBonus}`:''}`:hasGrowth?`T1赛事磨练：能力 +${Math.round(growthAmount)}`:peakBonus>0?`工夫到家：能力 +${peakBonus}`:'';
  const contractHalfSeasonsRemaining=Math.max(0,state.contractHalfSeasonsRemaining-1);
  const highPotential=isHighPotential({...state,age:nextAge,ability:finalAbility,health} as CareerState,rating);
  const interim: CareerState = { ...state, age: nextAge, tier, globalRank:Math.max(1,globalRank-revivalBoost), regionRank, rankingPoints:rankingPoints+revivalBoost*10, vrsActive, rebuildPoints, teamForm:clamp(teamForm+revivalBoost),rosterStability:clamp(rosterStability+(cncsRevival?6:0)),negativeUpsetStreak,cncsRevival, iglArchetype:dynastyEvolution?'dynasty':state.iglArchetype, ability:finalAbility, fame:clamp(fame+(cncsRevival?5:0)), health, assets:state.assets+(playerPrize+salaryPaid)*.55,highPotential,contractHalfSeasonsRemaining, roleChangeCooldown: Math.max(0, state.roleChangeCooldown - 1), phase: 'report', decision: undefined, pendingEmergencies: [], stats: { matches: state.stats.matches + matches, rating, kd, adr, trophies, mvps, earnings, salaryIncome:state.stats.salaryIncome+salaryPaid, prizeIncome:state.stats.prizeIncome+playerPrize, signingIncome:state.stats.signingIncome }, honors: [...state.honors, ...honors] };
  const record: SeasonRecord = {
    season: state.season, careerYear: state.careerYear, half: state.half, age: nextAge, team: state.team, tier, rating, kd, adr, matches, winRate,
    placement: best ? `${best.name} · ${best.placement}` : '未获赛事资格', teamPrize, playerPrize, salaryPaid, note: state.resolvedEmergencies.length ? `经历 ${state.resolvedEmergencies.length} 次随机事件` : '赛季平稳结束', deltas: difference(before, snapshot(interim)),
    tournaments, globalRank, regionRank, rankingDelta, honors,
  };
  const shouldEvaluate=contractHalfSeasonsRemaining===0||state.half==='second';
  const market=shouldEvaluate?marketEvaluation(interim,rating,honors,contractHalfSeasonsRemaining===0):undefined;
  const retained=market?.contractExpired&&market.retained;
  const employmentStatus:EmploymentStatus=market?.contractExpired&&!market.retained?'free-agent':'signed';
  const nextContract=retained?contractLengthFor(interim):contractHalfSeasonsRemaining;
  const forcedRetirement = (nextAge >= 29 && ability < 35) || state.integrity < 12 || health < 8;
  const completedHistory = [...state.history, record];
  const ratingOffers=employmentStatus==='signed'?marketOffersFor(interim,rating):[];
  const completed: CareerState = { ...interim,employmentStatus,noOfferWindows:employmentStatus==='free-agent'?state.noOfferWindows+1:0,contractHalfSeasonsRemaining:nextContract,renewalEvaluation:market,marketOffers:ratingOffers.length?ratingOffers:undefined,marketHeat:ratingOffers.length?'连续进步引起多支队伍关注':undefined,status: forcedRetirement ? 'retired' : 'active', phase: forcedRetirement ? 'retired' : 'report', history: completedHistory, resolvedEmergencies: [], seasonProgress:undefined, lastEventResult:undefined, seasonBaseline: undefined, eventResume: undefined, postReportEvent: forcedRetirement ? undefined : state.postReportEvent, log: [market?.summary,dynastyLog,crisisLog,growthLog,highPotential&&!state.highPotential?'年轻高潜状态生效：成长与市场机会提高':'',`生涯第 ${state.careerYear} 年${state.half === 'first' ? '上半年' : '下半年'} / 全球第 ${globalRank} / ${record.placement}`, ...state.log].filter((item):item is string=>Boolean(item)) };
  if (forcedRetirement && state.half === 'second' && !completed.top20History.some(item => item.careerYear === state.careerYear)) return { ...completed, top20History: [...completed.top20History, generateAnnualTop20(completed, completedHistory.filter(item => item.careerYear === state.careerYear))] };
  return completed;
};

const enterSeason = (state: CareerState): CareerState => ({ ...state, phase:'season', decision:undefined, pendingEmergencies:[], eventResume:undefined });
const applyDueConsequences=(state:CareerState)=>{
  const due=state.pendingConsequences.filter(item=>item.dueSeason<=state.season);
  if(!due.length)return state;
  const applied=due.reduce((current,item)=>applyChanges(current,item.changes),state);
  return {...applied,pendingConsequences:state.pendingConsequences.filter(item=>item.dueSeason>state.season),log:[...due.map(item=>`延迟后果 / ${item.revealText}`),...applied.log]};
};
export const startSeason = (state: CareerState): CareerState => {
  if (state.status !== 'active' || state.phase !== 'ready' || state.employmentStatus !== 'signed') return state;
  const consequenceState=applyDueConsequences(state);
  const baseline = snapshot(consequenceState);
  const rng=seeded(state,'season-report');
  const nextAge=consequenceState.half==='second'?consequenceState.age+1:consequenceState.age;
  const prepared={...consequenceState,ability:clamp(consequenceState.ability+Math.round(rng()*4)-1-(consequenceState.half==='second'?ageDecline(consequenceState.age,nextAge):0)),health:clamp(consequenceState.health-Math.round(rng()*5)),positionFamiliarity:clamp(consequenceState.positionFamiliarity+2),seasonBaseline:baseline,resolvedEmergencies:[],lastEventResult:undefined};
  const calendar=tournamentCalendarFor(prepared);
  const salaryPerTournament=Number((state.salary*6/Math.max(1,calendar.length)).toFixed(2));
  const withProgress:CareerState={...prepared,seasonProgress:{tournamentIds:calendar.map(item=>item.id),nextIndex:0,results:[],salaryPerTournament}};
  const events=emergenciesFor(withProgress);
  if(!events.length)return enterSeason(withProgress);
  return {...withProgress,phase:'emergency',decision:events[0],pendingEmergencies:events.slice(1),eventResume:'start-season'};
};

export const advanceTournament = (state:CareerState):CareerState => {
  if(state.phase!=='season'||!state.seasonProgress)return state;
  const progress=state.seasonProgress;
  const tournamentId=progress.tournamentIds[progress.nextIndex];
  if(!tournamentId)return finishSeason(state);
  const tournament=TOURNAMENTS.find(item=>item.id===tournamentId);
  if(!tournament)return finishSeason(state);
  const result=simulateTournament(state,tournament,progress.salaryPerTournament);
  const nextProgress={...progress,nextIndex:progress.nextIndex+1,results:[...progress.results,result]};
  const updatedState:CareerState={...state,seasonProgress:nextProgress,lastEventResult:undefined};
  if(result.hasCriticalEvent&&result.criticalEventId){
    const criticalPool=eligibleCatalogEvents(updatedState,'field','in-season').filter(event=>event.category==='赛事内关键局');
    const template=criticalPool[Math.floor(seeded(updatedState,`${result.criticalEventId}:pick`)()*criticalPool.length)];
    const criticalEvent=template?instantiate(template,`${result.criticalEventId}-${template.catalogId}`):undefined;
    if(criticalEvent)return {...updatedState,phase:'emergency',seasonProgress:{...nextProgress,pendingEvent:criticalEvent},decision:criticalEvent,pendingEmergencies:[],eventResume:'continue-season'};
  }
  const postEvent=tournamentEventFor(updatedState,result,progress.results.length);
  if(postEvent)return {...updatedState,phase:'emergency',seasonProgress:{...nextProgress,pendingEvent:postEvent},decision:postEvent,pendingEmergencies:[],eventResume:'continue-season'};
  if(nextProgress.nextIndex>=nextProgress.tournamentIds.length)return finishSeason(updatedState);
  return updatedState;
};

export const continueTournament = (state:CareerState):CareerState => {
  return state;
};

const outcomesFor=(option:DecisionOption)=>option.outcomes?.length&&option.outcomes.length>=2?option.outcomes:fallbackOutcomes(option);
export const previewDecisionOutcome=(state:CareerState,decision:Decision,optionId:string):OutcomePreview|null=>{
  const option=decision.options.find(item=>item.id===optionId);
  if(!option)return null;
  const outcomes=outcomesFor(option);
  const total=outcomes.reduce((sum,outcome)=>sum+outcome.probability,0);
  const roll=seeded(state,`outcome:${decision.id}:${option.id}`)()*total;
  let cumulative=0;
  const outcome=outcomes.find(item=>{cumulative+=item.probability;return roll<cumulative;})??outcomes.at(-1)!;
  return {optionId,outcomeId:outcome.id??`${decision.id}-${option.id}-${outcomes.indexOf(outcome)}`,outcomeLabel:outcome.label,probability:Number((outcome.probability/total*100).toFixed(1)),changes:outcome.changes,resultPatch:outcome.resultPatch,delayedRisk:outcome.delayed?.riskHint};
};
const scheduleDelayedOutcome=(state:CareerState,decision:Decision,option:DecisionOption,preview:OutcomePreview)=>{
  const outcome=outcomesFor(option).find(item=>(item.id??`${decision.id}-${option.id}-${outcomesFor(option).indexOf(item)}`)===preview.outcomeId);
  if(!outcome?.delayed)return state;
  const delaySpan=Math.max(0,outcome.delayed.maxSeasons-outcome.delayed.minSeasons);
  const dueSeason=state.season+outcome.delayed.minSeasons+Math.floor(seeded(state,`delay:${decision.id}:${option.id}:${preview.outcomeId}`)()*(delaySpan+1));
  const consequence:PendingConsequence={id:`${decision.id}:${option.id}:${preview.outcomeId}`,sourceDecisionId:decision.id,dueSeason,tag:outcome.delayed.tag,changes:outcome.delayed.changes,revealText:outcome.delayed.revealText};
  return {...state,hiddenFlags:{...state.hiddenFlags,[outcome.delayed.tag]:(state.hiddenFlags[outcome.delayed.tag]??0)+1},pendingConsequences:[...state.pendingConsequences,consequence]};
};
const applyOptionOutcome=(state:CareerState,decision:Decision,option:DecisionOption,preview?:OutcomePreview)=>{
  const canonical=previewDecisionOutcome(state,decision,option.id);
  if(!canonical||preview&&preview.outcomeId!==canonical.outcomeId)return {state,outcomeLabel:'结果校验失败，未提交选择。',preview:null};
  let resolved=applyChanges(state,option.changes);
  resolved=applyChanges(resolved,canonical.changes);
  resolved=scheduleDelayedOutcome(resolved,decision,option,canonical);
  return {state:resolved,outcomeLabel:canonical.outcomeLabel,preview:canonical};
};
const placementScale=['首轮出局','小组赛出局','八强','四强','亚军','冠军'];
const updateCriticalMatchResult=(state:CareerState,decision:Decision,preview:OutcomePreview|null):CareerState=>{
  if(decision.category!=='赛事内关键局'||!preview?.resultPatch||!state.seasonProgress)return state;
  const latest=state.seasonProgress.results.at(-1);
  if(!latest)return state;
  const currentIndex=placementScale.indexOf(latest.placement);
  const placement=preview.resultPatch.placement??placementScale[Math.max(0,Math.min(placementScale.length-1,currentIndex+(preview.resultPatch.placementDelta??0)))];
  const matches=placement==='冠军'?7:placement==='亚军'?6:placement==='四强'?5:placement==='八强'?4:3;
  const wins=placement==='冠军'?matches:placement==='亚军'||placement==='四强'?matches-1:placement==='八强'?matches-2:Math.max(0,matches-2);
  const prizeBase=honorWeight[latest.honorClass]*30;
  const teamPrize=Math.round(prizeBase*(placement==='冠军'?2.2:placement==='亚军'?1.4:placement==='四强'?.8:placement==='八强'?.4:.1));
  const playerPrize=Number((teamPrize*.136).toFixed(1));
  const rating=Number(Math.max(.55,latest.rating+(preview.resultPatch.ratingDelta??0)).toFixed(2));
  const rankingDelta=latest.tier==='unranked'?0:Math.round((wins/matches-.45)*honorWeight[latest.honorClass]*24)+(latest.upset?.rankingImpact??0);
  const maps=Math.max(matches,Math.round(latest.maps*matches/Math.max(1,latest.matches)));
  const mapWins=Math.max(wins,Math.round(maps*wins/Math.max(1,matches)));
  const tournament=TOURNAMENTS.find(item=>item.id===latest.tournamentId);
  const context=tournament?contextRatingsFor(state,tournament,rating):latest.context;
  const updatedResult={...latest,placement,matches,wins,maps,mapWins,teamPrize,playerPrize,rating,rankingDelta,context};
  return {...state,seasonProgress:{...state.seasonProgress,results:[...state.seasonProgress.results.slice(0,-1),updatedResult]}};
};
const enterChoiceAfterReport = (state: CareerState): CareerState => {
  const choiceKind: ChoiceKind = state.pace === 'fast' ? 'annual' : 'offseason';
  return { ...state, phase: 'choice', choiceKind, decision: choiceFor(state, choiceKind), postReportEvent: undefined, eventResume: undefined };
};
const advanceAfterReport = (state: CareerState): CareerState => {
  if (state.half === 'second' && !state.top20History.some(item => item.careerYear === state.careerYear)) {
    const yearRecords = state.history.filter(record => record.careerYear === state.careerYear);
    const award = generateAnnualTop20(state, yearRecords);
    return { ...state, phase: 'awards', top20History: [...state.top20History, award], decision: undefined, postReportEvent: undefined, eventResume: undefined };
  }
  if(state.marketOffers?.length)return enterChoiceAfterReport(state);
  if(state.employmentStatus!=='signed')return enterChoiceAfterReport(state);
  if (state.pace === 'fast' && state.half === 'first') return { ...state, half: 'second', season: state.season + 1, phase: 'ready', decision: undefined, postReportEvent: undefined, eventResume: undefined };
  return enterChoiceAfterReport(state);
};

export const resolveEmergency = (state: CareerState, optionId: string, preview?:OutcomePreview): CareerState => {
  if (state.phase !== 'emergency' || !state.decision) return state;
  const decision = state.decision;
  const option = decision.options.find(item => item.id === optionId);
  if (!option) return state;
  const canonical=previewDecisionOutcome(state,decision,optionId);
  if(preview&&canonical?.outcomeId!==preview.outcomeId)return state;
  const result = applyOptionOutcome(state, decision, option, preview);
  const resultText=result.outcomeLabel||option.result||`${option.label}的决定已经执行。`;
  let resolved: CareerState = { ...result.state, lastEventResult:resultText, log: [`${decision.title} / ${resultText}`, ...result.state.log] };
  resolved=updateCriticalMatchResult(resolved,decision,result.preview);
  const resolvedEmergencies = [...state.resolvedEmergencies, decision.title];
  if (state.pendingEmergencies.length) return { ...resolved, decision: state.pendingEmergencies[0], pendingEmergencies: state.pendingEmergencies.slice(1), resolvedEmergencies };
  if (state.eventResume === 'continue-report') return advanceAfterReport({ ...resolved, phase: 'report', decision: undefined, pendingEmergencies: [], resolvedEmergencies, eventResume: undefined });
  if(state.eventResume==='start-season')return enterSeason({...resolved,decision:undefined,pendingEmergencies:[],resolvedEmergencies});
  if(state.eventResume==='continue-season'){
    const progress=resolved.seasonProgress?{...resolved.seasonProgress,pendingEvent:undefined}:undefined;
    const resumed:CareerState={...resolved,phase:'season',decision:undefined,pendingEmergencies:[],resolvedEmergencies,eventResume:undefined,seasonProgress:progress};
    if(progress&&progress.nextIndex>=progress.tournamentIds.length)return finishSeason(resumed);
    return resumed;
  }
  return resolved;
};

export const continueFromReport = (state: CareerState): CareerState => {
  if (state.phase !== 'report' || state.status !== 'active') return state;
  if (state.postReportEvent) return { ...state, phase: 'emergency', decision: state.postReportEvent, postReportEvent: undefined, eventResume: 'continue-report', pendingEmergencies: [] };
  return advanceAfterReport(state);
};

export const continueFromAwards = (state: CareerState): CareerState => {
  if (state.phase !== 'awards' || state.status !== 'active') return state;
  return enterChoiceAfterReport(state);
};

export const resolveCareerChoice = (state: CareerState, optionId: string, preview?:OutcomePreview): CareerState => {
  if (state.phase !== 'choice' || !state.decision) return state;
  const option = state.decision.options.find(item => item.id === optionId);
  if (!option) return state;
  const canonical=previewDecisionOutcome(state,state.decision,optionId);
  if(preview&&canonical?.outcomeId!==preview.outcomeId)return state;
  const outcomeResult=applyOptionOutcome(state,state.decision,option,preview);
  const changed=outcomeResult.state;
  const recoveryIds=['train','recover','full-rest','extra-practice','annual-rest','annual-train','stay','team-role','annual-stay'];
  const changedWithForm=recoveryIds.includes(option.id)?{...changed,teamForm:clamp(changed.teamForm+(option.id.includes('rest')||option.id==='recover'?12:7)),rosterStability:clamp(changed.rosterStability+(option.id.includes('stay')||option.id==='team-role'?10:4))}:changed;
  const marketSalary = monthlySalaryFor(changedWithForm);
  const salary = option.id === 'keep-core' ? Number(Math.max(.5, marketSalary * .82).toFixed(1)) : typeof option.changes.contractSalary==='number'?option.changes.contractSalary:changedWithForm.employmentStatus==='signed'?marketSalary:0;
  const nextIsFirst = state.half === 'second';
  const streamerWindows=changedWithForm.employmentStatus==='streamer'?state.streamerWindows+1:changedWithForm.employmentStatus==='signed'?0:state.streamerWindows;
  const nextAge=state.employmentStatus==='streamer'&&nextIsFirst?state.age+1:changedWithForm.age;
  const insolvent=state.employmentStatus==='streamer'&&changedWithForm.assets<=-30;
  return {
    ...changedWithForm, salary, streamerWindows, marketOffers:undefined, marketHeat:undefined, age:nextAge,status:insolvent?'retired':'active',phase:insolvent?'retired':changedWithForm.employmentStatus==='signed'?'ready':'choice', decision: insolvent?undefined:changedWithForm.employmentStatus==='signed'?undefined:choiceFor({...changedWithForm,age:nextAge,streamerWindows,season:state.season+1},'offseason'), choiceKind: insolvent||changedWithForm.employmentStatus==='signed'?undefined:'offseason', season: state.season + 1, half: nextIsFirst ? 'first' : 'second', careerYear: nextIsFirst ? state.careerYear + 1 : state.careerYear,
    lastEventResult:outcomeResult.outcomeLabel, log: [insolvent?'可用资产跌至 -30 万，被迫结束等待并正式退役':'',`${state.decision.kind === 'annual' ? '年度选择' : '休赛期'} / ${option.label} / ${outcomeResult.outcomeLabel}`, ...changedWithForm.log].filter(Boolean),
  };
};

export const becomeStreamer = (state:CareerState):CareerState => {
  if(state.status!=='active'||state.history.length===0||!['report','choice'].includes(state.phase))return state;
  const streamerState:CareerState={...state,employmentStatus:'streamer',salary:0,phase:'choice',choiceKind:'offseason',streamerWindows:0,contractHalfSeasonsRemaining:0,renewalEvaluation:undefined,postReportEvent:undefined};
  return {...streamerState,decision:streamerChoiceFor(streamerState),log:[`${state.age} 岁 / 暂别职业赛场，开始直播等待复出`,...state.log]};
};

export const retireCareer = (state: CareerState): CareerState => {
  if (state.status !== 'active' || (state.phase !== 'report' && !(state.phase === 'choice' && state.employmentStatus === 'streamer')) || state.history.length === 0) return state;
  let top20History = state.top20History;
  if (state.half === 'second' && !top20History.some(item => item.careerYear === state.careerYear)) {
    const yearRecords = state.history.filter(record => record.careerYear === state.careerYear);
    top20History = [...top20History, generateAnnualTop20(state, yearRecords)];
  }
  return { ...state, top20History, status: 'retired', phase: 'retired', postReportEvent: undefined, log: [`${state.age} 岁 / 主动宣布退役`, ...state.log] };
};

export interface CareerScore { score:number; tier:'传奇'|'名人堂'|'世界级'|'一线'|'职业级'|'求生'; next:string; }
export const getCurrentCareerScore=(state:CareerState):CareerScore=>{
  const results=state.history.flatMap(record=>record.tournaments);
  const majorWins=results.filter(result=>result.tier==='Major'&&result.placement==='冠军').length;
  const eliteWins=results.filter(result=>isLargeOrHigher(result.honorClass)&&result.placement==='冠军').reduce((sum,result)=>sum+honorWeight[result.honorClass],0);
  const championship=Math.min(40,majorWins*18+eliteWins*2.2);
  const mvps=state.honors.filter(honor=>honor.kind==='MVP').reduce((sum,honor)=>sum+honorWeight[honor.honorClass],0);
  const evps=state.honors.filter(honor=>honor.kind==='EVP').reduce((sum,honor)=>sum+honorWeight[honor.honorClass],0);
  const bestTop=state.top20History.reduce((best,item)=>Math.min(best,item.playerRank??99),99);
  const honorScore=Math.min(30,mvps*2.5+evps+ (bestTop===1?15:bestTop<=5?11:bestTop<=10?8:bestTop<=20?5:0));
  const t1=results.filter(result=>result.tier==='T1'||result.tier==='Major');
  const maps=t1.reduce((sum,result)=>sum+result.maps,0);
  const rating=t1.reduce((sum,result)=>sum+result.rating*result.maps,0)/Math.max(1,maps);
  const roleBaseline=state.role==='igl'?(state.iglArchetype==='brain'?.85:state.iglArchetype==='fragging'?.96:state.iglArchetype==='awp-caller'?1.10:1.00):state.role==='support'?.96:state.role==='awper'?1.10:1.05;
  const dataScore=Math.min(20,Math.max(0,(rating-roleBaseline)*50)+Math.min(8,maps/20));
  const longevity=Math.min(5,state.history.length/4);
  const reputation=Math.min(5,state.integrity/40+state.fame/40);
  let score=Math.round(championship+honorScore+dataScore+longevity+reputation);
  if(majorWins===0&&bestTop>20)score=Math.min(72,score);
  const tier:CareerScore['tier']=score>=92?'传奇':score>=82?'名人堂':score>=70?'世界级':score>=55?'一线':score>=35?'职业级':'求生';
  const next=majorWins===0?'Major冠军':bestTop>20?'年度TOP20':mvps===0?'大型赛事MVP':score<92?'更厚的高级赛事荣誉':'守住传奇地位';
  return {score,tier,next};
};

export const careerTitle = (state: CareerState) => {
  if (state.integrity < 25) return '被调查者';
  if (state.stats.trophies >= 3 && state.stats.rating >= 1.12) return '一代枪男';
  if (state.connections > 75 && state.role === 'igl') return '战术大脑';
  if (state.fame > 80) return '流量巨星';
  if (state.integrity > 82 && state.age >= 29) return '干净的职业人';
  return '无冕强者';
};
export interface CareerTrophy { id: string; name: string; calendarYear: number; season: number; honorClass: HonorClass; tier: TournamentTier; format: string; rating: number; teamPrize: number; playerPrize: number; personalHonor?: 'MVP' | 'EVP' | 'VP'; }
export interface CareerSummary {
  legacy: '传奇' | '名人堂' | '世界级' | '一线名将' | '职业老兵'; title: string; seasons: number; teams: string[]; matches: number; averageRating: number; earnings: number;
  trophies: CareerTrophy[]; mvpCount: number; evpCount: number; vpCount:number; major: { appearances: number; wins: number; mvps: number; bestPlacement: string }; top20: AnnualTop20[]; keyEvents: string[]; quote:string; incomeBreakdown:{salary:number;prize:number;signing:number};
}
const placementOrder = ['冠军','亚军','四强','八强','小组赛出局','首轮出局','未参赛'];
export const getCareerSummary = (state: CareerState): CareerSummary => {
  const allResults = state.history.flatMap(record => record.tournaments.map(result => ({ ...result, record })));
  const trophies: CareerTrophy[] = allResults.filter(item => item.placement === '冠军').map(item => {
    const personalHonor = item.record.honors.find(honor => honor.tournamentName === item.name && (honor.kind === 'MVP' || honor.kind === 'EVP'))?.kind as 'MVP' | 'EVP' | undefined;
    return { id: item.id, name: item.name, calendarYear: 2025 + item.record.careerYear, season: item.record.season, honorClass: item.honorClass, tier: item.tier, format: TOURNAMENTS.find(definition => definition.id === item.tournamentId)?.format ?? 'BO3', rating: item.rating, teamPrize:item.teamPrize, playerPrize:item.playerPrize, personalHonor };
  });
  const majors = allResults.filter(item => item.tier === 'Major');
  const bestMajor = majors.map(item => item.placement).sort((a,b) => placementOrder.indexOf(a) - placementOrder.indexOf(b))[0] ?? '未参赛';
  const bestTop = Math.min(...state.top20History.map(item => item.playerRank ?? 99), 99);
  const legacyScore = trophies.reduce((sum, trophy) => sum + honorWeight[trophy.honorClass] * 9, 0) + state.stats.mvps * 12 + state.honors.filter(honor => honor.kind === 'EVP').length * 5 + (bestTop <= 1 ? 50 : bestTop <= 5 ? 35 : bestTop <= 10 ? 20 : bestTop <= 20 ? 10 : 0);
  const legacy: CareerSummary['legacy'] = legacyScore >= 180 ? '传奇' : legacyScore >= 120 ? '名人堂' : legacyScore >= 70 ? '世界级' : legacyScore >= 35 ? '一线名将' : '职业老兵';
  const weightedRating = state.history.reduce((sum, record) => sum + record.rating * record.matches, 0) / Math.max(1, state.history.reduce((sum, record) => sum + record.matches, 0));
  const tags:QuoteTag[]=[legacy==='传奇'?'legend':legacy==='名人堂'?'hall':legacy==='世界级'?'world':legacy==='一线名将'?'star':'veteran'];
  if(trophies.length)tags.push('champion');if(majors.length)tags.push('major');if(bestTop===1)tags.push('top1');else if(bestTop<=20)tags.push('top20');if(state.integrity>=75)tags.push('clean');if(state.fame>=70)tags.push('famous');if(state.age-16>=10)tags.push('long');if(state.age-16<=3)tags.push('short');if(trophies.length===0)tags.push('regret');if([...new Set(state.history.map(record=>record.team))].length>=3)tags.push('journeyman');
  const preferredQuotes=CAREER_QUOTES.filter(item=>item.text.length>=45&&item.text.length<=75);const quotePool=preferredQuotes.length?preferredQuotes:CAREER_QUOTES;const scored=quotePool.map((quote,index)=>({quote,index,score:quote.tags.filter(tag=>tags.includes(tag)).length}));const bestScore=Math.max(...scored.map(item=>item.score));const matches=scored.filter(item=>item.score===bestScore);const quote=matches[Math.floor(makeRng(hash(`${state.seed}:retirement-quote`))()*matches.length)].quote.text;
  return {
    legacy, title: careerTitle(state), seasons: state.history.length, teams: [...new Set(state.history.map(record => record.team).concat(state.team))], matches: state.stats.matches,
    averageRating: Number(weightedRating.toFixed(2)), earnings: Math.round(state.stats.earnings), trophies, mvpCount: state.honors.filter(honor => honor.kind === 'MVP').length,
    evpCount: state.honors.filter(honor => honor.kind === 'EVP').length, vpCount:state.honors.filter(honor=>honor.kind==='VP').length, quote,incomeBreakdown:{salary:Math.round(state.stats.salaryIncome),prize:Math.round(state.stats.prizeIncome),signing:Math.round(state.stats.signingIncome)}, major: { appearances: majors.length, wins: majors.filter(item => item.placement === '冠军').length, mvps: state.honors.filter(honor => honor.kind === 'MVP' && majors.some(item => item.name === honor.tournamentName)).length, bestPlacement: bestMajor },
    top20: state.top20History.filter(item => item.playerRank), keyEvents: state.log.filter(item => /事件|退役|转会|伤病|审查|争议|冠军/.test(item)).slice(0, 12),
  };
};

export const seasonLabel = (state: Pick<CareerState, 'careerYear' | 'half'>) => `生涯第 ${state.careerYear} 年 · ${state.half === 'first' ? '上半年赛季' : '下半年赛季'}`;
export const emergencyProgress = (state: CareerState) => {
  const total = state.resolvedEmergencies.length + state.pendingEmergencies.length + (state.phase === 'emergency' ? 1 : 0);
  const current = state.resolvedEmergencies.length + 1;
  if (total <= 1) return '赛季中';
  return current === 1 ? '赛季初' : current === total ? '赛季末' : '赛季中';
};

const validPhases: CareerPhase[] = ['ready','season','emergency','report','awards','choice','retired'];
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const mapsForLegacyResult=(result:TournamentResult)=>result.maps??Math.max(result.matches,Math.round(result.matches*(result.tier==='Major'?2.7:result.tier==='T1'?2.4:2.1)));
const migrateCareer=(raw:unknown):unknown=>raw;
const isValidCareer = (state: unknown): state is CareerState => {
  if (!state || typeof state !== 'object') return false;
  const value = state as Partial<CareerState>;
  return value.version === CAREER_VERSION && value.rulesVersion === CAREER_RULES_VERSION && value.dataVersion === CAREER_DATA_VERSION && typeof value.name === 'string' && ['a','b','rotator'].includes(value.defensiveSite as string) && isFiniteNumber(value.positionFamiliarity) && typeof value.teamId === 'string' && typeof value.team === 'string' && typeof value.origin === 'object' && typeof value.role === 'string' && (value.status === 'active' || value.status === 'retired') && validPhases.includes(value.phase as CareerPhase) && isFiniteNumber(value.seed) && isFiniteNumber(value.age) && isFiniteNumber(value.careerYear) && isFiniteNumber(value.season) && isFiniteNumber(value.ability) && isFiniteNumber(value.connections) && isFiniteNumber(value.integrity) && isFiniteNumber(value.fame) && isFiniteNumber(value.health) && isFiniteNumber(value.globalRank) && isFiniteNumber(value.regionRank) && typeof value.stats === 'object' && value.stats !== null && isFiniteNumber(value.teamForm) && isFiniteNumber(value.rosterStability) && isFiniteNumber(value.internationalAdaptation) && typeof value.cncsRevival === 'boolean' && typeof value.vrsActive === 'boolean' && Array.isArray(value.roster) && value.roster.length === 5 && Array.isArray(value.history) && Array.isArray(value.honors) && Array.isArray(value.top20History) && Array.isArray(value.pendingEmergencies) && Array.isArray(value.resolvedEmergencies) && Array.isArray(value.log) && ['none','awper-training','igl-assistant'].includes(value.rolePreparation as string) && isFiniteNumber(value.roleChangeCooldown) && isFiniteNumber(value.roleChangeCount) && isFiniteNumber(value.bootcampCount) && isFiniteNumber(value.highPressureChokingRisk) && typeof value.hiddenFlags==='object' && value.hiddenFlags!==null && Array.isArray(value.pendingConsequences) && ['signed','free-agent','streamer'].includes(value.employmentStatus as string) && isFiniteNumber(value.noOfferWindows) && isFiniteNumber(value.contractHalfSeasonsRemaining) && isFiniteNumber(value.assets) && isFiniteNumber(value.streamerWindows) && typeof value.highPotential==='boolean';
};
export const loadCareer = (): CareerState | null => {
  try { const stored = localStorage.getItem(CAREER_SAVE_KEY); if (!stored) return null; const state=migrateCareer(JSON.parse(stored)); return isValidCareer(state) ? state : null; } catch { return null; }
};
export const saveCareer = (state: CareerState) => localStorage.setItem(CAREER_SAVE_KEY, JSON.stringify(state));
export const clearCareer = () => localStorage.removeItem(CAREER_SAVE_KEY);
