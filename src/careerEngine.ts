import { CAREER_DATA_VERSION, CAREER_TEAMS, CareerTeam, DATA_SNAPSHOT_NOTE, HonorClass, MAJOR_CITIES, MAJOR_ORGANIZERS, PlayerRole, TeamRegion, TOURNAMENTS, TournamentTier } from './careerData';
import { CAREER_CONTENT_VERSION, CAREER_REVIEW_QUOTES, formatTop20Review, getOriginConfig, ORIGIN_CONFIGS, selectCareerTitle, selectTalentConfigs, snapshotTalent, top20InterviewPolicy, type QuoteTag, type TalentSnapshot } from './careerContentSystem';
import { CAREER_NARRATIVE_CONTENT } from './careerNarrativeContent';
import { instantiateEvent, pickEvent } from './careerEventSystem';
import type { CareerEventContext, Decision, DecisionOption, DelayedOutcome, OutcomePreview, ProbabilityOutcome, StatChange, TournamentResultPatch, WorldlineProgress, WorldlineTransition } from './careerEventTypes';
import { getHistoricalPlayerBaseline } from './historicalTop20';
import { applyRosterChange, createRosterChangeEvent, shouldTriggerRosterChange } from './rosterChangeSystem';
import { applyWorldlineTransition, eligibleWorldlines } from './careerWorldlineSystem';
import { getDecisionTemplate } from './careerDecisionTemplates';

const EVENT_DEFINITIONS=CAREER_NARRATIVE_CONTENT.events;
const WORLDLINE_DEFINITIONS=CAREER_NARRATIVE_CONTENT.worldlines;

// Re-export types for components
export type { TournamentTier, HonorClass } from './careerData';

export const CAREER_SAVE_KEY = 'cspa:career:cs-career:v1';
export const CAREER_VERSION = 16;
export const CAREER_RULES_VERSION = `career-json-events-roster-top-v16:${CAREER_CONTENT_VERSION}`;
export const CAREER_START_YEAR = 2026;

export type Pace = 'hardcore' | 'standard' | 'fast';
export type OriginId = 'northeast' | 'academy' | 'campus' | 'overseas' | 'southwest' | 'south' | 'central' | 'northwest';
export type Role = 'entry' | 'awper' | 'igl' | 'support';
export type RoleChangePreparation = 'awper-training' | 'igl-assistant' | 'none';
export type { Decision, DecisionOption, DelayedOutcome, OutcomePreview, ProbabilityOutcome, StatChange, TournamentResultPatch } from './careerEventTypes';
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
export interface PendingConsequence { id: string; sourceDecisionId: string; dueSeason: number; tag: string; changes: StatChange; revealText: string; }

export interface Origin { id: OriginId; name: string; place: string; description: string; abilityBase: number; connectionsBase: number; integrityBase: number; fameBase: number; }
export interface CareerStats { matches: number; rating: number; kd: number; adr: number; trophies: number; mvps: number; earnings: number; salaryIncome: number; prizeIncome: number; signingIncome: number; }
export interface StatSnapshot { ability: number; connections: number; integrity: number; fame: number; health: number; earnings: number; }
export interface StatDeltas extends StatSnapshot {}
export interface ContextRatings { major: number; elite: number; playoffs: number; arena: number; bigMatches: number; finals: number; elimination: number; vsTop5: number; vsTop10: number; vsTop20: number; }
export interface UpsetRecord { kind: 'positive' | 'negative'; opponent: string; opponentRank: number; format: string; score: string; probability: number; rankingImpact: number; }
export interface TournamentResult { id: string; tournamentId: string; name: string; organizer: string; city?: string; tier: TournamentTier; honorClass: HonorClass; invited: boolean; qualified?: boolean; invitationReason: string; placement: string; matches: number; wins: number; maps: number; mapWins: number; teamPrize: number; playerPrize: number; salaryPaid: number; rating: number; rankingDelta: number; context: ContextRatings; qualifierOpponent?: string; qualifierScore?: string; qualifierStage?: string; upset?: UpsetRecord; expectedPlacement?: string; hasCriticalEvent?: boolean; criticalEventId?: string; }
export interface HonorAward { id: string; season: number; tournamentName: string; kind: 'MVP' | 'EVP' | 'VP' | '冠军'; honorClass: HonorClass; }
export type Top20Tier = 'TOP 1' | 'TOP 2-3' | 'TOP 4-5' | 'TOP 6-10' | 'TOP 11-15' | 'TOP 16-20';
export interface Top20Entry { rank: number; playerId: string; nick: string; team: string; score: number; isPlayer: boolean; isTeammate?: boolean; rating?: number; adr?: number; maps?: number; tier?: Top20Tier; }
export interface TeammateSeasonPerformance { season: number; careerYear: number; rating: number; adr: number; maps: number; mvp: number; evp: number; vp: number; majorTitles: number; eliteTitles: number; }
export interface CareerRosterPlayer { id: string; nick: string; role: PlayerRole; isPlayer?: boolean; ability: number; fame: number; seasonPerformances: TeammateSeasonPerformance[]; top20History: Array<{ calendarYear: number; rank: number; score: number }>; }
export interface AnnualTop20 { calendarYear: number; careerYear: number; eligible: boolean; playerRank?: number; entries: Top20Entry[]; review?: string; generatedQuote?: string; t1Maps?: number; nominationChance?: number; apsScore?: number; playerTier?: Top20Tier; }
export interface RenewalFactor { label: string; value: number; }
export interface RenewalEvaluation { season: number; chance: number; attitude: '稳妥' | '观望' | '危险'; factors: RenewalFactor[]; contractExpired: boolean; retained?: boolean; summary: string; }
export interface MarketOffer { id: string; teamId: string; team: string; rank: number; tier: string; role: '首发' | '轮换' | '试训'; salary: number; contractHalfSeasons: number; signingBonus: number; reason: string; cost: string; international?: boolean; }
export interface SeasonRecord {
  season: number; careerYear: number; half: SeasonHalf; age: number; team: string; tier: string; rating: number; kd: number; adr: number;
  matches: number; winRate: number; placement: string; teamPrize: number; playerPrize: number; salaryPaid: number; note: string; deltas: StatDeltas; tournaments: TournamentResult[]; globalRank: number; regionRank: number; rankingDelta: number; honors: HonorAward[];
}
export interface SeasonProgress { tournamentIds: string[]; nextIndex: number; results: TournamentResult[]; salaryPerTournament: number; pendingEvent?: Decision; }
export interface CareerState {
  version: number; rulesVersion: string; dataVersion: string; seed: number; pace: Pace; name: string; origin: Origin; role: Role; defensiveSite: DefensiveSite; positionFamiliarity: number; age: number; careerYear: number; half: SeasonHalf; season: number;
  talents: TalentSnapshot[]; contentVersion: string; teamId: string; team: string; region: TeamRegion; roster: CareerRosterPlayer[]; coreMemberIds: string[]; tier: string; globalRank: number; regionRank: number; rankingPoints: number; vrsActive: boolean; rebuildPoints: number; lastTransferFee: number; teamForm: number; rosterStability: number; negativeUpsetStreak: number; internationalAdaptation: number; cncsRevival: boolean; ability: number; connections: number; integrity: number; fame: number; health: number; salary: number;
  rolePreparation: RoleChangePreparation; roleChangeCooldown: number; roleChangeCount: number; iglArchetype?: IglArchetype; bootcampCount: number; highPressureChokingRisk: number;
  hiddenFlags: Record<string, number>; worldlines: Record<string, WorldlineProgress>; eventHistory: Record<string, { count: number; lastSeason: number }>; pendingConsequences: PendingConsequence[]; top3SeasonStreak: number; tacticalFatigue: boolean; crisisCooldowns: Record<string, number>; nextSeasonRatingPenalty: number; employmentStatus: EmploymentStatus; noOfferWindows: number; contractHalfSeasonsRemaining: number; renewalEvaluation?: RenewalEvaluation; marketOffers?: MarketOffer[]; marketHeat?: string; assets: number; streamerWindows: number; highPotential: boolean;
  status: 'active' | 'retired'; phase: CareerPhase; choiceKind?: ChoiceKind; decision?: Decision; pendingEmergencies: Decision[]; resolvedEmergencies: string[]; eventResume?: EventResume; postReportEvent?: Decision;
  seasonProgress?: SeasonProgress; lastEventResult?: string; seasonBaseline?: StatSnapshot; stats: CareerStats; history: SeasonRecord[]; honors: HonorAward[]; top20History: AnnualTop20[]; log: string[];
}

export const ORIGINS: Origin[] = ORIGIN_CONFIGS.map(origin=>({id:origin.id,name:origin.name,place:origin.place,description:origin.description,abilityBase:origin.baseStats.ability,connectionsBase:origin.baseStats.connections,integrityBase:origin.baseStats.integrity,fameBase:origin.baseStats.fame}));

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

const fallbackOutcomes = (option: DecisionOption, decisionId='decision'): ProbabilityOutcome[] => {
  const expected=52+hash(`${decisionId}:${option.id}:fallback-probability`)%31;
  return [
    { id:`${option.id}-expected`, label:option.result??'决定按预期执行，但付出了相应代价', probability:expected, changes:{} },
    { id:`${option.id}-variance`, label:'执行过程出现偏差，收益与代价发生变化', probability:100-expected, changes:{ ability:(option.changes.ability??0)>0?-2:1, connections:(option.changes.connections??0)>0?-2:1, health:(option.changes.health??0)>0?-2:0 } },
  ];
};
const instantiateDecision = (template: Omit<Decision, 'id'>, id: string): Decision => ({ ...template, id, options: template.options.map(option => ({ ...option, outcomes:(option.outcomes?.length?option.outcomes:fallbackOutcomes(option,id)).map((outcome,index) => ({ ...outcome, id:outcome.id??`${id}-${option.id}-${index}` })) })) });
const configuredDecision=(templateId:string,id:string,values:Record<string,string|number>,optionLogic:Array<Pick<DecisionOption,'id'|'changes'|'outcomes'> & {result?:string}>,filter?:(optionId:string)=>boolean):Decision=>{
  const template=getDecisionTemplate(templateId,values);
  const options=template.options.filter(option=>filter?filter(option.id):true).map(copy=>{const logic=optionLogic.find(option=>option.id===copy.id);if(!logic)throw new Error(`${templateId} 缺少选项逻辑 ${copy.id}`);const outcomes=logic.outcomes?.map(outcome=>{const text=copy.outcomes?.find(item=>item.id===outcome.id);if(!text)throw new Error(`${templateId}/${copy.id} 缺少结果文案 ${outcome.id}`);return {...outcome,label:text.label};});return {...copy,...logic,outcomes};});
  return instantiateDecision({kind:template.kind,timing:template.timing,category:template.category,title:template.title,briefing:template.briefing,options},id);
};
const eventContextFor=(state:CareerState,tournament?:TournamentResult):CareerEventContext=>({
  career:{age:state.age,season:state.season,careerYear:state.careerYear},
  player:{role:state.role,originId:state.origin.id,originEventWeights:getOriginConfig(state.origin.id).eventWeightTags,earlyOpportunityTags:getOriginConfig(state.origin.id).earlyOpportunityTags,ability:state.ability,connections:state.connections,integrity:state.integrity,fame:state.fame,health:state.health,positionFamiliarity:state.positionFamiliarity,internationalAdaptation:state.internationalAdaptation,highPressureChokingRisk:state.highPressureChokingRisk},
  team:{form:state.teamForm,rosterStability:state.rosterStability,globalRank:state.globalRank,regionRank:state.regionRank,negativeUpsetStreak:state.negativeUpsetStreak,vrsActive:state.vrsActive,region:state.region,tier:state.tier},
  tournament:tournament?{tier:tournament.tier,honorClass:tournament.honorClass,placement:tournament.placement,rating:tournament.rating,isMajor:tournament.tier==='Major',isPlayoff:['八强','四强','亚军','冠军'].includes(tournament.placement)}:undefined,
  hiddenFlags:state.hiddenFlags,worldlines:state.worldlines,eventHistory:state.eventHistory,
});
const recentEventTitles=(state:CareerState)=>state.log.slice(0,6).map(line=>line.match(/选择了「(.+?)」/)?.[1]).filter((title):title is string=>Boolean(title));
const eventCountFor = (state: CareerState) => {
  const roll=seeded(state,'event-count')();
  if(state.pace==='hardcore')return roll<.25?0:roll<.75?1:2;
  if(state.pace==='standard')return roll<.7?0:1;
  if(state.half==='first')return 0;
  return roll<.85?0:1;
};
const pickCatalogEvent = (state:CareerState, kind:Decision['kind'], key:string, timing?:Decision['timing'],tournament?:TournamentResult,excludeCategories?:string[]) => {
  const context=eventContextFor(state,tournament);
  const template=pickEvent(EVENT_DEFINITIONS,context,{kind,timing,excludeTimings:timing?undefined:['post-report'],excludeCategories,excludeTitles:recentEventTitles(state)},seeded(state,`${key}:pick`)());
  return template?instantiateEvent(template,`${key}-${template.catalogId}`,context):undefined;
};
const rookieSafeFieldEvent=(state:CareerState,key:string,tournament?:TournamentResult,timing:Decision['timing']='in-season')=>{
  const context=eventContextFor(state,tournament);
  const template=pickEvent(EVENT_DEFINITIONS,context,{kind:'field',timing,excludeCategories:['赛事内关键局','伤病健康','合规风险','治安'],excludeTitles:recentEventTitles(state)},seeded(state,`${key}:pick`)());
  return template?instantiateEvent(template,key,context):undefined;
};
const emergenciesFor = (state:CareerState) => {
  if(state.season<=2)return [];
  return Array.from({ length: eventCountFor(state) }, (_, index) => pickCatalogEvent(state,'emergency',`s${state.season}-e${index+1}`,undefined,undefined,['赛事内关键局','赛事内非关键突发'])).filter((event):event is Decision=>Boolean(event));
};
const tournamentEventFor = (state: CareerState, result: TournamentResult, index: number) => {
  const trigger=state.season===1?(state.pace==='hardcore'?.3:state.pace==='standard'?.04:0):state.season===2?.03:state.pace==='hardcore'?.08:state.pace==='standard'?.04:0;
  if(!trigger)return undefined;
  if(seeded(state,`tournament-event-trigger:${index}:${result.tournamentId}`)()>=trigger)return undefined;
  if(state.season<=2)return rookieSafeFieldEvent(state,`s${state.season}-t${index+1}-rookie-safe`,result,'in-season');
  return pickCatalogEvent(state,'field',`s${state.season}-t${index+1}`, 'in-season',result);
};
const cnTeams=new Set(['TYLOO','Lynn Vision','Rare Atom','JiJieHao','Steel Helmet']);
const isCnTeam=(state:CareerState)=>cnTeams.has(state.team);
const hasInternationalResume=(state:CareerState)=>state.history.flatMap(record=>record.tournaments).some(result=>isLargeOrHigher(result.honorClass)&&result.rating>=1.08);
const isHighPotential=(state:CareerState,rating=state.history.at(-1)?.rating??state.stats.rating)=>state.hiddenFlags.worldClassPotential===1&&state.age<23&&state.ability>=75&&state.health>=65&&rating>=marketRatingFloor(state)&&state.integrity>=35;
const internationalEligible=(state:CareerState)=>isCnTeam(state)&&state.age<23&&((state.ability>=75&&state.internationalAdaptation>=45)||(state.history.at(-1)?.rating??0)>=1.12&&hasInternationalResume(state));
const internationalOfferFor=(state:CareerState):Decision=>configuredDecision('international-offer',`s${state.season}-international`,{},[{id:'join-international',changes:{internationalTransfer:true,contractTier:'t1',connections:-6,teamForm:-5,fame:7,internationalAdaptation:10}},{id:'stay-cn',changes:{connections:6,preserveCore:true}}]);
const relativeTierLabel=(state:CareerState,target:ContractTier)=>{const current=teamTierForRank(state.globalRank);if(current===target)return target==='t1'?'同级 1.5 线队':'同级强队';if(target==='t1')return '升至 1.5 线';if(target==='t2')return current==='t3'?'升至二线':'降至二线';return '降至三线';};
const marketOfferChoiceFor=(state:CareerState,offers:MarketOffer[]):Decision=>{
  const template=getDecisionTemplate('market-inbox',{marketHeat:state.marketHeat??'经纪人正在整理报价'});
  const stay=template.options.find(option=>option.id==='market-stay');
  const dynamic=template.dynamicOptions?.offer;
  if(!stay||!dynamic)throw new Error('market-inbox JSON 缺少动态报价模板');
  const offerOptions=offers.map(offer=>{const copy=getDecisionTemplate('market-inbox',{marketHeat:state.marketHeat??'',team:offer.team,role:offer.role,rank:offer.rank,tier:offer.tier,salary:offer.salary,years:offer.contractHalfSeasons/2,signingBonus:offer.signingBonus,reason:offer.reason,cost:offer.cost}).dynamicOptions!.offer;return {id:`market-offer-${offer.id}`,...copy,changes:{contractTier:teamTierForRank(offer.rank),contractTeamId:offer.teamId,contractHalfSeasons:offer.contractHalfSeasons,internationalTransfer:offer.international,signingBonus:offer.signingBonus,contractSalary:offer.salary,employmentStatus:'signed' as const}};});
  return instantiateDecision({kind:template.kind,category:template.category,title:template.title,briefing:template.briefing,options:[...offerOptions,{id:stay.id,label:stay.label,detail:stay.detail,result:stay.result,changes:{connections:4,fame:-1}}]},`s${state.season}-market-inbox`);
};
const freeAgentChoiceFor=(state:CareerState):Decision=>configuredDecision('free-agent',`s${state.season}-free-agent`,{t2Label:relativeTierLabel(state,'t2'),t3Label:relativeTierLabel(state,'t3')},[
  {id:'accept-market-offer',changes:{},outcomes:[{id:'market-t2',label:'',probability:65,changes:{contractTier:'t2',employmentStatus:'signed',noOfferWindows:0,connections:3}},{id:'market-t3',label:'',probability:35,changes:{contractTier:'t3',employmentStatus:'signed',noOfferWindows:0,fame:-3}}]},
  {id:'wait-better-offer',changes:{},outcomes:[{id:'wait-success',label:'',probability:24,changes:{contractTier:'t2',employmentStatus:'signed',noOfferWindows:0,connections:-2,fame:2}},{id:'wait-fail',label:'',probability:76,changes:{employmentStatus:'streamer',noOfferWindows:state.noOfferWindows+1,assets:-6,fame:-2,health:-2}}]},
  {id:'become-streamer',changes:{employmentStatus:'streamer',noOfferWindows:0},outcomes:[{id:'stream-start',label:'',probability:80,changes:{fame:3}},{id:'stream-slow',label:'',probability:20,changes:{fame:1}}]},
]);
const breachChoiceFor=(state:CareerState):Decision=>configuredDecision('contract-breach',`s${state.season}-contract-breach`,{},[
  {id:'breach-for-superteam',changes:{integrity:-8,connections:-6,earnings:-12},outcomes:[{id:'breach-success',label:'',probability:32,changes:{contractTier:'t1',employmentStatus:'signed',noOfferWindows:0,fame:10,integrity:-8}},{id:'breach-benched',label:'',probability:43,changes:{ability:-7,fame:-6,connections:-10,employmentStatus:'signed'}},{id:'breach-free',label:'',probability:25,changes:{employmentStatus:'free-agent',noOfferWindows:1,fame:-10,integrity:-7}}]},
  {id:'honor-contract',changes:{integrity:5,fame:-3},outcomes:[{id:'stay-starting',label:'',probability:76,changes:{connections:6,teamForm:3}},{id:'stay-cost',label:'',probability:24,changes:{connections:-3,ability:-2,rosterStability:-4}}]},
]);
const dreamEventFor=(state:CareerState,rating:number):Decision|undefined=>{
  if(state.season<=2||state.hiddenFlags.dreamCooldown)return undefined;
  const baseline=marketRatingFloor(state);
  const route=rating>=baseline+.12?'新人爆发线':state.role==='igl'&&state.connections>=60?'年轻指挥线':state.internationalAdaptation>=50?'国际试训线':state.teamForm>=75?'明星搭档线':state.history.at(-1)?.tournaments.some(result=>result.upset?.kind==='positive')?'爆冷英雄线':state.rosterStability>=78?'老队重组线':'版本受益线';
  if(seeded(state,`dream-route:${route}`)()>=.28)return undefined;
  return configuredDecision('dream-agent',`s${state.season}-dream-${route}`,{route},[{id:'dream-push',changes:{ability:4,fame:7,connections:-3,health:-3}},{id:'dream-steady',changes:{teamForm:5,rosterStability:4,connections:3}}]);
};
const streamerChoiceFor=(state:CareerState):Decision=>{
  const income=Math.max(1,Math.round(2+state.fame*.14));
  const livingCost=Math.round(7+state.streamerWindows*1.5);
  const offerChance=Math.max(5,Math.min(72,Math.round(state.ability*.55+state.fame*.2+state.connections*.15+state.internationalAdaptation*.1-state.age-state.streamerWindows*8)));
  return configuredDecision('streamer-window',`s${state.season}-streamer-${state.streamerWindows}`,{income,livingCost,assets:state.assets,offerChance,netIncome:`${income-livingCost>=0?'+':''}${income-livingCost}`,trainingCost:livingCost+5,tryoutCost:livingCost+7,tryoutOfferLabel:internationalEligible(state)?'国际纵队提供轮换短约':'1.5 线队提供轮换短约'},[
    {id:'stream-focus',changes:{assets:income-livingCost,earnings:income,fame:5,ability:-3,employmentStatus:'streamer'},outcomes:[{id:'stream-no-offer',label:'',probability:Math.max(20,100-Math.round(offerChance*.55)),changes:{}},{id:'stream-t3',label:'',probability:Math.min(80,Math.round(offerChance*.55)),changes:{contractTier:'t3',employmentStatus:'signed',noOfferWindows:0}}]},
    {id:'stream-train',changes:{assets:-(livingCost+5),ability:-1,health:2,employmentStatus:'streamer'},outcomes:[{id:'train-no-offer',label:'',probability:Math.max(15,100-offerChance),changes:{}},{id:'train-t2',label:'',probability:Math.min(85,offerChance),changes:{contractTier:'t2',employmentStatus:'signed',noOfferWindows:0,connections:2}}]},
    {id:'stream-tryout',changes:{assets:-(livingCost+7),connections:-2,ability:-2,employmentStatus:'streamer'},outcomes:[{id:'tryout-no-offer',label:'',probability:Math.max(12,100-Math.round(offerChance*1.15)),changes:{}},{id:'tryout-t1',label:'',probability:Math.min(88,Math.round(offerChance*1.15)),changes:{contractTier:'t1',internationalTransfer:internationalEligible(state),employmentStatus:'signed',noOfferWindows:0,connections:2,internationalAdaptation:internationalEligible(state)?6:0}}]},
  ]);
};
const marketOffersFor=(state:CareerState,rating:number,currentResults:readonly TournamentResult[]=[]):MarketOffer[]=>{
  const baseline=marketRatingFloor(state);
  const recentRatings=[...state.history.map(record=>record.rating),rating].slice(-2);
  const priorTwo=recentRatings.length===2&&recentRatings.every(value=>value>=baseline+.06);
  const singleBreakthrough=rating>=baseline+.12;
  const top1=state.top20History.at(-1)?.playerRank===1;
  const majorChampion=currentResults.some(result=>result.tier==='Major'&&result.qualified!==false&&result.placement==='冠军')||state.history.at(-1)?.tournaments.some(result=>result.tier==='Major'&&result.placement==='冠军')===true;
  const guaranteedT1=top1||majorChampion;
  if(!guaranteedT1&&(state.season<=2||(!priorTwo&&!singleBreakthrough)))return [];
  const currentRank=state.globalRank;
  const currentTier=teamTierForRank(currentRank);
  const guaranteedBand:ContractTier=guaranteedT1?'t1':currentTier==='t3'?'t2':'t1';
  const eliteEvidence=state.history.at(-1)?.tournaments.some(result=>isLargeOrHigher(result.honorClass)&&result.qualified!==false)??false;
  const extremeThreshold=state.role==='igl'&&state.iglArchetype==='awp-caller'?.20:.18;
  const extreme=rating>=baseline+extremeThreshold&&state.ability>=78&&eliteEvidence;
  const ranges:Array<{tier:ContractTier;min:number;max:number;role:MarketOffer['role']}>=guaranteedBand==='t2'
    ? [{tier:'t2',min:35,max:60,role:'首发'},{tier:'t2',min:21,max:40,role:'轮换'},{tier:extreme?'t1':'t2',min:extreme?5:21,max:extreme?20:35,role:'试训'}]
    : [{tier:'t1',min:13,max:20,role:'首发'},{tier:'t1',min:8,max:18,role:'轮换'},{tier:'t1',min:extreme?1:8,max:extreme?10:20,role:'试训'}];
  return ranges.map((range,index)=>{
    const candidates=CAREER_TEAMS.filter(team=>team.baseRank>=range.min&&team.baseRank<=range.max&&team.id!==state.teamId);
    const team=candidates[Math.floor(seeded(state,`rating-offer:${index}:${rating}`)()*candidates.length)]??CAREER_TEAMS.find(team=>team.id!==state.teamId&&team.baseRank<currentRank)!;
    const formal=singleBreakthrough&&state.ability>=72||priorTwo;
    const role:MarketOffer['role']=guaranteedT1||index===0&&formal?'首发':range.role;
    const reason=top1?'年度 TOP1 身份获得一线战队正式报价':majorChampion?'Major 冠军履历获得一线战队正式报价':singleBreakthrough?'单季 Rating 超过位置基准 +0.12':'连续两个赛季 Rating 超过位置基准 +0.06';
    return {id:`${state.season}-${team.id}-${index}`,teamId:team.id,team:team.name,rank:team.baseRank,tier:tierForRank(team.baseRank),role,salary:Math.round(monthlySalaryFor({...state,globalRank:team.baseRank})*(isHighPotential(state)?1.25:1)),contractHalfSeasons:isHighPotential(state)?6:4,signingBonus:Math.round(transferFeeFor(state)*signingRateFor(state)*(isHighPotential(state)?1.4:1)),reason,cost:team.baseRank<=20?'需要适应更严格的一线体系':'离开当前队伍，关系短期下降',international:false};
  });
};
const teammateProfile=(state:CareerState,nick:string)=>state.roster.find(player=>player.nick===nick)??{ability:60+Math.floor(seeded(state,`teammate-ability:${state.teamId}:${nick}`)()*36),fame:25+Math.floor(seeded(state,`teammate-fame:${state.teamId}:${nick}`)()*71)};
const dynastyCrisisFor=(state:CareerState,tournaments:TournamentResult[],top3Streak:number):Decision|undefined=>{
  const metaReady=state.role==='igl'&&top3Streak>=3&&(state.crisisCooldowns.metaShift??0)<=state.season;
  if(metaReady)return configuredDecision('dynasty-meta',`s${state.season}-meta-shift`,{},[
    {id:'meta-demo-grind',changes:{health:-12},outcomes:[{id:'meta-clear',label:'',probability:100,changes:{}}]},
    {id:'meta-discipline',changes:{health:-3},outcomes:[{id:'meta-discipline-clear',label:'',probability:85,changes:{}},{id:'meta-discipline-delay',label:'',probability:15,changes:{rosterStability:-15,teamForm:-8}}]},
  ],optionId=>optionId!=='meta-discipline'||state.integrity>=85);
  const eliteChampion=tournaments.some(result=>(result.tier==='Major'||result.honorClass==='super-elite')&&result.placement==='冠军');
  const stars=state.roster.filter(player=>!player.isPlayer).map(player=>({nick:player.nick,...teammateProfile(state,player.nick)})).filter(player=>player.ability>85).sort((a,b)=>b.ability-a.ability);
  const star=stars[0];
  if(state.role==='igl'&&eliteChampion&&star&&state.connections<70&&(state.crisisCooldowns.lockerRoomEgo??0)<=state.season){
    const success=Math.max(30,Math.min(90,70+(state.fame-star.fame)));
    const assetLoss=Math.max(10,Math.round(Math.abs(state.assets)*.15));
    return configuredDecision('dynasty-ego',`s${state.season}-locker-room-ego`,{starNick:star.nick,starAbility:star.ability,starFame:star.fame,success,assetLoss},[
      {id:'ego-suppress',changes:{},outcomes:[{id:'ego-win',label:'',probability:success,changes:{rosterStability:-15,teamForm:-8}},{id:'ego-lose',label:'',probability:100-success,changes:{connections:-12,ability:-4,fame:-5}}]},
      {id:'ego-compromise',changes:{connections:15},outcomes:[{id:'ego-peace',label:'',probability:100,changes:{rosterStability:8}}]},
      {id:'ego-leave',changes:{employmentStatus:'free-agent',noOfferWindows:1,assets:-assetLoss},outcomes:[{id:'ego-exit',label:'',probability:100,changes:{}}]},
    ]);
  }
  return undefined;
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
  const configured=pickCatalogEvent(state,kind,`s${state.season}-${kind}`);
  if(!configured)throw new Error(`事件 JSON 缺少可用的 ${kind} 事件`);
  return configured;
};

const signingRateFor = (state: CareerState) => .03 + Math.min(.05, (state.connections + state.fame) / 4000);
const transferFeeFor = (state: CareerState, core = false) => {
  const tierBase = state.globalRank <= 12 ? 800 : state.globalRank <= 20 ? 350 : state.globalRank <= 40 ? 120 : 50;
  const starValue = state.ability * 8 + state.fame * 5 + state.top20History.filter(item => item.playerRank).length * 160;
  return Math.round(Math.min(core ? 5000 : 2500, Math.max(core ? 1500 : 50, (tierBase + starValue) * (core ? 2.2 : 1))));
};
const teamTierForRank=(rank:number):ContractTier=>rank<=20?'t1':rank<=40?'t2':'t3';
const tierForRank=(rank:number):string=>rank<=12?'一线赛场':rank<=20?'1.5 线赛场':rank<=40?'二线赛场':'三线赛场';
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
  return Math.round(minimum+(maximum-minimum)*personalFactor);
};
const applyChanges = (state: CareerState, changes: StatChange): CareerState => {
  const signingBonus=changes.signingBonus??0;
  const earned=(changes.earnings??0)+signingBonus;
  const pressureHealthMultiplier=state.role==='igl'&&state.iglArchetype==='awp-caller'&&state.phase==='emergency'&&state.eventResume==='continue-season'&&typeof changes.health==='number'&&changes.health<0?1.5:1;
  let next: CareerState = { ...state, ability: clamp(state.ability + (changes.ability ?? 0)), connections: clamp(state.connections + (changes.connections ?? 0)), integrity: clamp(state.integrity + (changes.integrity ?? 0)), fame: clamp(state.fame + (changes.fame ?? 0)), health: clamp(state.health + Math.round((changes.health ?? 0)*pressureHealthMultiplier)), assets:state.assets+(changes.assets??(earned>0?earned*.55:earned)),teamForm:clamp(state.teamForm+(changes.teamForm??0)), rosterStability:clamp(state.rosterStability+(changes.rosterStability??0)), positionFamiliarity:clamp(state.positionFamiliarity+(changes.positionFamiliarity??0)), defensiveSite:changes.defensiveSite??state.defensiveSite, iglArchetype:changes.iglArchetype??state.iglArchetype, employmentStatus:changes.employmentStatus??state.employmentStatus,noOfferWindows:changes.noOfferWindows??state.noOfferWindows, highPressureChokingRisk:clamp(state.highPressureChokingRisk+(changes.highPressureChokingRisk??0)), internationalAdaptation:clamp(state.internationalAdaptation+(changes.internationalAdaptation??0)), stats: { ...state.stats, earnings: Math.max(0, state.stats.earnings + earned), signingIncome:state.stats.signingIncome+signingBonus } };
  if(changes.contractTier){
    const [minRank,maxRank]=changes.contractTier==='t1'?[8,20]:changes.contractTier==='t2'?[21,60]:[61,98];
    const candidates=CAREER_TEAMS.filter(team=>team.baseRank>=minRank&&team.baseRank<=maxRank&&(changes.internationalTransfer?team.region==='Europe':true));
    const target=changes.contractTeamId?CAREER_TEAMS.find(team=>team.id===changes.contractTeamId):candidates[Math.floor(seeded(state,`contract-team:${changes.contractTier}:${state.streamerWindows}`)()*candidates.length)];
    if(target){
      const contractHalfSeasonsRemaining=contractLengthFor(next);
      next={...next,teamId:target.id,team:target.name,region:target.region,roster:rosterWithPlayer(target,state.name,state.role,state.seed),globalRank:target.baseRank,regionRank:regionRankFor(target.baseRank,target.region),tier:tierForRank(target.baseRank),teamForm:55,rosterStability:58,employmentStatus:'signed',noOfferWindows:0,contractHalfSeasonsRemaining:changes.contractHalfSeasons??contractHalfSeasonsRemaining,streamerWindows:state.employmentStatus==='streamer'?state.streamerWindows:0,renewalEvaluation:undefined,marketOffers:undefined,marketHeat:undefined,log:[`签约 ${target.name} / ${(changes.contractHalfSeasons??contractHalfSeasonsRemaining)/2} 年合同 / ${relativeTierLabel(state,changes.contractTier)}`,...next.log]};
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
    next = { ...next, lastTransferFee:fee, assets:next.assets+bonus*.55, ...(target?{teamId:target.id,team:target.name,region:target.region,roster:rosterWithPlayer(target,state.name,state.role,state.seed),globalRank:target.baseRank,regionRank:regionRankFor(target.baseRank,target.region),rankingPoints:Math.round(1800-target.baseRank*15),vrsActive:true,rebuildPoints:0,tier:'1.5 线赛场',teamForm:55,rosterStability:58,internationalAdaptation:clamp(state.internationalAdaptation+12)}:{}), stats:{...next.stats, earnings:next.stats.earnings+bonus, signingIncome:next.stats.signingIncome+bonus}, log:[`转会费 ${fee} 万 / 签字费 ${bonus} 万`,...next.log] };
  }
  return next;
};
const roleForRoster = (role: Role): PlayerRole => role === 'entry' ? 'entry' : role === 'awper' ? 'awper' : role === 'igl' ? 'igl' : 'support';
const initialTeamFor = (origin: OriginId) => CAREER_TEAMS.find(team => team.id === getOriginConfig(origin).initialTeamId) ?? CAREER_TEAMS[27];
const rosterWithPlayer = (team: CareerTeam, name: string, role: Role, careerSeed=hash(`${team.id}:${name}:${role}`)):CareerRosterPlayer[] => {
  const targetRole = roleForRoster(role);
  const replacedIndex = Math.max(0, team.roster.findIndex(player => player.role === targetRole));
  return team.roster.map((player, index) => {
    const isPlayer=index===replacedIndex;
    const rng=makeRng(hash(`${careerSeed}:roster:${team.id}:${player.id}`));
    const teamFloor=Math.max(58,Math.round(92-team.baseRank*.38));
    return {id:isPlayer?`career-player-${careerSeed}`:player.id,nick:isPlayer?name:player.nick,role:isPlayer?targetRole:player.role,isPlayer:isPlayer||undefined,ability:isPlayer?0:clamp(teamFloor+Math.round((rng()-.5)*18)),fame:isPlayer?0:clamp(24+Math.round((101-team.baseRank)*.42+rng()*24)),seasonPerformances:[],top20History:[]};
  });
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
const superEliteOrMajor = (honorClass: HonorClass) => honorClass === 'super-elite' || honorClass === 'major';
const top20TierForRank = (rank: number): Top20Tier => rank === 1 ? 'TOP 1' : rank <= 3 ? 'TOP 2-3' : rank <= 5 ? 'TOP 4-5' : rank <= 10 ? 'TOP 6-10' : rank <= 15 ? 'TOP 11-15' : 'TOP 16-20';
const top20TierMinScore: Record<Top20Tier, number> = { 'TOP 1': 4500, 'TOP 2-3': 3500, 'TOP 4-5': 2800, 'TOP 6-10': 2000, 'TOP 11-15': 1500, 'TOP 16-20': 1200 };
const top20TierMinRating: Record<Top20Tier, number> = { 'TOP 1': 1.30, 'TOP 2-3': 1.25, 'TOP 4-5': 1.20, 'TOP 6-10': 1.15, 'TOP 11-15': 1.12, 'TOP 16-20': 1.10 };
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
const tournamentCityPool=['北京','上海','成都','杭州','广州','新加坡','首尔','东京','伦敦','巴黎','柏林','里斯本','马德里','纽约','洛杉矶','悉尼','墨尔本'];
const hostedTournament=(state:CareerState,tournament:typeof TOURNAMENTS[number],index:number)=>{
  const city=tournament.city??tournamentCityPool[Math.floor(seeded(state,`event-city:${tournament.id}:${index}`)()*tournamentCityPool.length)];
  const type=tournament.tier==='unranked'?'公开赛':tournament.tier==='T2'?(/邀请|亚洲/.test(tournament.name)?'邀请赛':'挑战赛'):tournament.honorClass==='super-elite'?'大师赛':tournament.honorClass==='elite'?'精英赛':'冠军赛';
  return {...tournament,city,name:`${tournament.organizer} ${city} ${type}`};
};
const majorForSeason=(state:CareerState)=>{
  const slot=(state.careerYear-1)*2+(state.half==='second'?1:0);
  const previousCity=state.history.at(-1)?.tournaments.find(result=>result.tier==='Major')?.city;
  let cityIndex=Math.floor(seeded(state,`major-city:${slot}`)()*MAJOR_CITIES.length);
  if(previousCity&&MAJOR_CITIES[cityIndex]===previousCity)cityIndex=(cityIndex+1)%MAJOR_CITIES.length;
  let organizerIndex=Math.floor(seeded(state,`major-organizer:${slot}`)()*MAJOR_ORGANIZERS.length);
  const recentOrganizers=state.history.slice(-2).map(record=>record.tournaments.find(result=>result.tier==='Major')?.organizer).filter(Boolean);
  if(recentOrganizers.length===2&&recentOrganizers[0]===recentOrganizers[1]&&MAJOR_ORGANIZERS[organizerIndex]===recentOrganizers[0])organizerIndex=(organizerIndex+1)%MAJOR_ORGANIZERS.length;
  const organizer=MAJOR_ORGANIZERS[organizerIndex];
  const city=MAJOR_CITIES[cityIndex];
  return {id:`major-${state.careerYear}-${state.half}`,name:`${organizer} ${city} Major`,organizer,city,tier:'Major' as const,honorClass:'major' as const,format:'BO3/BO5' as const};
};
const tournamentCalendarFor = (state: CareerState) => {
  const count=5+Math.floor(seeded(state,'calendar-count')()*4);
  const major=majorForSeason(state);
  const ordered=TOURNAMENTS
    .filter(tournament=>tournament.tier!=='Major'&&(!tournament.region||tournament.region===state.region))
    .map(tournament=>({tournament,order:seeded(state,`calendar-order:${tournament.id}`)()}))
    .sort((a,b)=>a.order-b.order)
    .map((item,index)=>hostedTournament(state,item.tournament,index));
  const invitedT1=ordered.filter(tournament=>tournament.tier==='T1'&&invitationFor(state,tournament).invited);
  const enteredOther=ordered.filter(tournament=>tournament.tier!=='T1'&&invitationFor(state,tournament).invited);
  const fallback=ordered.filter(tournament=>tournament.tier==='unranked'||tournament.tier==='T2');
  const guaranteedT1=state.globalRank<=12?3:state.globalRank<=20?2:state.globalRank<=40?1:0;
  const priority=[...invitedT1.slice(0,guaranteedT1),...invitedT1.slice(guaranteedT1),...enteredOther,...fallback];
  const unique=[...new Map(priority.map(tournament=>[tournament.id,tournament])).values()];
  const reserve=1;
  const picked=unique.slice(0,count-reserve);
  picked.splice(Math.min(picked.length,Math.floor(picked.length*.65)),0,major);
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
  const negativeProbability = Math.min(maxNegative,Math.max(.01,.02+instability/300+Math.max(0,rankGap)/500)*(state.tacticalFatigue?2:1));
  const positiveProbability = Math.min(format==='BO1'?.24:format==='BO5'?.08:.14,Math.max(.01,.015+Math.max(0,-rankGap)/420+state.teamForm/1200));
  const roll=seeded(state,`upset:${tournament.id}`)();
  if(rankGap>=18&&roll<negativeProbability) return { kind:'negative' as const, opponent, format, probability:Math.round(negativeProbability*100), impact:-Math.round(18+rankGap*.7+honorWeight[tournament.honorClass]*5) };
  if(rankGap<=-18&&roll<positiveProbability) return { kind:'positive' as const, opponent, format, probability:Math.round(positiveProbability*100), impact:Math.round(24+Math.abs(rankGap)*.8+honorWeight[tournament.honorClass]*6) };
  return undefined;
};
const simulateTournament = (state: CareerState, tournament: typeof TOURNAMENTS[number], salaryPaid: number): TournamentResult => {
  const rng = seeded(state, `tournament:${tournament.id}`);
  const invitation = invitationFor(state,tournament);
  if(tournament.tier==='Major'&&!invitation.invited){
    const opponentPool=CAREER_TEAMS.filter(team=>team.region===state.region&&team.id!==state.teamId);
    const opponent=opponentPool[Math.floor(seeded(state,`major-qualifier-opponent:${tournament.id}`)()*opponentPool.length)]??CAREER_TEAMS[0];
    const score=seeded(state,`major-qualifier-score:${tournament.id}`)()<.5?'1:2':'0:2';
    return {id:`s${state.season}-${tournament.id}`,tournamentId:tournament.id,name:tournament.name,organizer:tournament.organizer,city:tournament.city,tier:tournament.tier,honorClass:tournament.honorClass,invited:true,qualified:false,invitationReason:invitation.reason,placement:'预选出局',matches:0,wins:0,maps:0,mapWins:0,teamPrize:0,playerPrize:0,salaryPaid,rating:0,rankingDelta:0,context:{major:0,elite:0,playoffs:0,arena:0,bigMatches:0,finals:0,elimination:0,vsTop5:0,vsTop10:0,vsTop20:0},qualifierStage:`${state.region==='Asia'?'亚洲':state.region==='Europe'?'欧洲':'美洲'}封闭预选败者组决赛`,qualifierOpponent:opponent.name,qualifierScore:score};
  }
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
  const tacticalFatiguePenalty=state.tacticalFatigue?15:0;
  const teammateAbility=state.roster.filter(player=>!player.isPlayer).reduce((sum,player)=>sum+player.ability,0)/Math.max(1,state.roster.filter(player=>!player.isPlayer).length);
  const performance = rankStrength*.27+state.teamForm*.18+(state.rosterStability+iglProfile.stabilityBoost-(state.tacticalFatigue?15:0))*.13+state.ability*.14+teammateAbility*.20+carryBonus+seriesTeamBoost+siteFit+rng()*18-pressure-slumpPenalty*25-roleAgePenalty-tacticalFatiguePenalty;
  const placement = performance >= 88 ? '冠军' : performance >= 81 ? '亚军' : performance >= 73 ? '四强' : performance >= 64 ? '八强' : performance >= 54 ? '小组赛出局' : '首轮出局';
  const cnChoking=isCnTeam(state)&&isLargeOrHigher(tournament.honorClass)&&state.highPressureChokingRisk>0?
    (seeded(state,`cn-choking:${tournament.id}`)()*100<state.highPressureChokingRisk?0.09:0):0;
  const bootcampBonus=state.bootcampCount>0?.02*Math.min(3,state.bootcampCount):0;
  const rawRating=iglProfile.ratingBase===undefined?0.65+Math.max(0,state.ability-38)/68*.70+siteFit/200+rng()*.16:iglProfile.ratingBase+(rng()-.5)*iglProfile.ratingSpread+Math.max(-.03,Math.min(.03,(state.ability-65)/600));
  const awpCallerFatigue=state.role==='igl'&&state.iglArchetype==='awp-caller'&&state.health<65?(tournament.tier==='Major'||tournament.tier==='T1'?.08:tournament.tier==='T2'?.05:.03):0;
  let rating = Number(Math.max(.55,rawRating-pressure/220+dataBonus-slumpPenalty-cnChoking+bootcampBonus-awpCallerFatigue-state.nextSeasonRatingPenalty).toFixed(2));
  const upset = upsetFor(state,tournament);
  const proposedPlacement = upset?.kind==='negative' ? (performance>=73?'小组赛出局':'首轮出局') : upset?.kind==='positive' ? (performance>=64?'冠军':'四强') : placement;
  const majorTitleChance=state.hiddenFlags.worldClassPotential===1?.08:.005;
  const adjustedPlacement=tournament.tier==='Major'&&proposedPlacement==='冠军'&&seeded(state,`major-title:${tournament.id}`)()>=majorTitleChance?'亚军':proposedPlacement;
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
  const playerPrize = Math.round(teamPrize * .136);
  const baseRankingDelta = tournament.tier === 'unranked' ? 0 : Math.round((wins / matches - .45) * honorWeight[tournament.honorClass] * 24);
  const rankingDelta=baseRankingDelta+(upset?.impact??0);
  const upsetRecord:UpsetRecord|undefined=upset?{kind:upset.kind,opponent:upset.opponent.name,opponentRank:upset.opponent.baseRank,format:upset.format,score:upset.kind==='positive'?'2:1':'0:2',probability:upset.probability,rankingImpact:upset.impact}:undefined;
  const isCriticalMatch=(adjustedPlacement==='冠军'||adjustedPlacement==='亚军')&&(tournament.tier==='Major'||tournament.honorClass==='super-elite')||(state.globalRank>=90&&adjustedPlacement!=='首轮出局');
  const criticalMomentRoll=seeded(state,`critical:${tournament.id}`)();
  const criticalTriggerRate=state.pace==='fast'?(tournament.tier==='Major'&&['冠军','亚军'].includes(adjustedPlacement)?.08:0):tournament.tier==='Major'?(state.pace==='hardcore'?.15:.08):isLargeOrHigher(tournament.honorClass)?(state.pace==='hardcore'?.10:.06):0;
  const hasCriticalEvent=isCriticalMatch&&criticalMomentRoll<criticalTriggerRate;
  return { id: `s${state.season}-${tournament.id}`, tournamentId: tournament.id, name: tournament.name, organizer: tournament.organizer, city:tournament.city, tier: tournament.tier, honorClass: tournament.honorClass, invited: true, qualified:true, invitationReason: state.vrsActive ? invitation.reason : tournament.tier === 'unranked' ? '未入榜期间参加非排名赛' : invitation.reason, placement:adjustedPlacement, matches, wins, maps, mapWins, teamPrize, playerPrize, salaryPaid, rating, rankingDelta, context:contextRatingsFor(state,tournament,rating), upset:upsetRecord, expectedPlacement:hasCriticalEvent?adjustedPlacement:undefined, hasCriticalEvent, criticalEventId:hasCriticalEvent?`critical-${state.season}-${tournament.id}`:undefined };
};
const eventWeightFor=(honorClass:HonorClass,tier?:TournamentTier)=>tier==='unranked'?.25:tier==='T2'?.5:honorClass==='major'?1.5:honorClass==='super-elite'?1.3:honorClass==='elite'?1.1:honorClass==='large'?1:.7;
const honorsForResults = (state: CareerState, results: TournamentResult[]): HonorAward[] => results.flatMap(result => {
  const awards: HonorAward[] = [];
  if(result.qualified===false)return awards;
  if(result.placement==='冠军')awards.push({id:`${result.id}-champion`,season:state.season,tournamentName:result.name,kind:'冠军',honorClass:result.honorClass});
  const roleCorrection=state.role==='igl'||state.role==='support'?.05:0;
  const rating=result.rating+roleCorrection;
  const playoffs=result.context.playoffs+roleCorrection;
  const finals=result.context.finals+roleCorrection;
  const vsTop5=result.context.vsTop5+roleCorrection;
  const deep=['冠军','亚军','四强'].includes(result.placement);
  const topEight=deep||result.placement==='八强';
  if(result.placement==='冠军'&&rating>=1.20&&playoffs>=1.20&&finals>=1.15){
    awards.push({id:`${result.id}-mvp`,season:state.season,tournamentName:result.name,kind:'MVP',honorClass:result.honorClass});
  }else if((result.placement==='亚军'&&rating>=1.15)||(deep&&rating>=1.18&&playoffs>=1.12)){
    awards.push({id:`${result.id}-evp`,season:state.season,tournamentName:result.name,kind:'EVP',honorClass:result.honorClass});
  }else if((topEight&&rating>=1.08)||((result.tier==='Major'||result.honorClass==='super-elite')&&vsTop5>=1.10)){
    awards.push({id:`${result.id}-vp`,season:state.season,tournamentName:result.name,kind:'VP',honorClass:result.honorClass});
  }
  return awards;
});
const isLargeOrHigher = (honorClass: HonorClass) => honorWeight[honorClass] >= honorWeight.large;
const teammatePerformanceFor=(state:CareerState,player:CareerRosterPlayer,results:TournamentResult[]):TeammateSeasonPerformance=>{
  const played=results.filter(result=>result.qualified!==false);
  const maps=played.reduce((sum,result)=>sum+result.maps,0);
  const weightedMaps=played.reduce((sum,result)=>sum+result.maps*eventWeightFor(result.honorClass,result.tier),0);
  const roleBase=player.role==='awper'?.08:player.role==='entry'?.04:player.role==='igl'?-.06:player.role==='support'?-.03:0;
  const teamRating=played.reduce((sum,result)=>sum+result.rating*result.maps*eventWeightFor(result.honorClass,result.tier),0)/Math.max(1,weightedMaps);
  const rng=seeded(state,`teammate-season:${player.id}`);
  const majorTitles=played.filter(result=>result.tier==='Major'&&result.placement==='冠军').length;
  const eliteTitles=played.filter(result=>isLargeOrHigher(result.honorClass)&&result.placement==='冠军').length;
  const championFloor=majorTitles?1.08+Math.max(0,player.ability-75)*.004:0;
  const rating=Number(Math.max(.72,championFloor,teamRating+(player.ability-state.ability)*.006+roleBase+(rng()-.5)*.1).toFixed(2));
  const adr=Math.round(67+(rating-1)*55+(player.role==='entry'?4:player.role==='support'?-3:0)+rng()*5);
  const deepRuns=played.filter(result=>['冠军','亚军','四强'].includes(result.placement)&&isLargeOrHigher(result.honorClass)).length;
  const mvp=Math.min(majorTitles,majorTitles&&rating>=1.18?1:0);
  const evp=Math.max(0,Math.min(deepRuns,Math.floor((rating-1.06)*10)));
  const vp=Math.max(0,Math.min(played.length,Math.floor((rating-1)*12)));
  return {season:state.season,careerYear:state.careerYear,rating,adr,maps,mvp,evp,vp,majorTitles,eliteTitles};
};
const averageContext=(results:TournamentResult[],key:keyof ContextRatings)=>Number((results.reduce((sum,result)=>sum+result.context[key]*result.matches*honorWeight[result.honorClass],0)/Math.max(1,results.reduce((sum,result)=>sum+result.matches*honorWeight[result.honorClass],0))).toFixed(2));
const top20ReviewFor=(state:CareerState,year:number,rank:number,results:TournamentResult[],honors:HonorAward[],entries:Top20Entry[])=>formatTop20Review({playerName:state.name,year,rank,mvpCount:honors.filter(h=>h.kind==='MVP').length,evpCount:honors.filter(h=>h.kind==='EVP').length,vpCount:honors.filter(h=>h.kind==='VP').length,majorRating:averageContext(results,'major'),eliteRating:averageContext(results,'elite'),playoffRating:averageContext(results,'playoffs'),arenaRating:averageContext(results,'arena'),finalRating:averageContext(results,'finals'),eliminationRating:averageContext(results,'elimination'),aboveNick:entries.find(e=>e.rank===rank-1)?.nick,belowNick:entries.find(e=>e.rank===rank+1)?.nick});
type ApsProfile={rating:number;adr:number;maps:number;playoffs:number;finals:number;vsTop5:number;mvp:number;evp:number;vp:number;topAwards:number};
const apsFor=(profile:ApsProfile,honors?:HonorAward[])=>{
  const awardScore=honors
    ? honors.filter(honor=>honor.kind!=='冠军').reduce((sum,honor)=>sum+(honor.kind==='MVP'?100:honor.kind==='EVP'?40:12)*eventWeightFor(honor.honorClass),0)
    : profile.mvp*100*1.5+profile.evp*40*1.3+profile.vp*12;
  const rawScore=(profile.rating-1)*300+(profile.adr-70)*2;
  const playoffDelta=profile.playoffs>=1.20?.08:profile.rating-profile.playoffs>.15?-.08:0;
  const top5Delta=profile.vsTop5>=1.15?.05:profile.vsTop5<1?-.05:0;
  const majorMvpBonus=honors?.some(honor=>honor.kind==='MVP'&&honor.honorClass==='major')?3500:0;
  const superEliteMvpBonus=honors?.some(honor=>honor.kind==='MVP'&&honor.honorClass==='super-elite')?2200:0;
  const scale=honors ? 1 : 10;
  return Math.max(0,Math.round((awardScore*scale+rawScore*scale+majorMvpBonus+superEliteMvpBonus)*(1+playoffDelta+top5Delta)));
};
const tierQualified=(profile:ApsProfile,honors:HonorAward[],tier:Top20Tier)=>{
  const eliteEvps=honors.length?honors.filter(honor=>honor.kind==='EVP'&&superEliteOrMajor(honor.honorClass)).length:profile.evp;
  const eliteMvps=honors.length?honors.filter(honor=>honor.kind==='MVP'&&superEliteOrMajor(honor.honorClass)).length:profile.mvp;
  if(profile.rating<top20TierMinRating[tier])return false;
  if(tier==='TOP 1')return eliteMvps>=1&&profile.playoffs>=profile.rating&&profile.vsTop5>=1.15;
  if(tier==='TOP 2-3')return eliteMvps+eliteEvps>=2;
  if(tier==='TOP 4-5')return eliteEvps>=4;
  if(tier==='TOP 6-10')return eliteEvps>=3;
  if(tier==='TOP 11-15')return eliteEvps>=1;
  return eliteEvps>=1||profile.maps>=80;
};
const tierForCandidate=(profile:ApsProfile,honors:HonorAward[],score:number):Top20Tier|undefined=>{
  const tiers:Top20Tier[]=['TOP 1','TOP 2-3','TOP 4-5','TOP 6-10','TOP 11-15','TOP 16-20'];
  return tiers.find(tier=>score>=top20TierMinScore[tier]&&tierQualified(profile,honors,tier));
};
export const generateAnnualTop20 = (state: CareerState, yearRecords: SeasonRecord[]): AnnualTop20 => {
  const calendarYear=CAREER_START_YEAR+state.careerYear-1;
  const results=yearRecords.flatMap(record=>record.tournaments).filter(result=>result.qualified!==false);
  const t1Results=results.filter(result=>result.tier==='T1'||result.tier==='Major');
  const t1Maps=t1Results.reduce((sum,result)=>sum+result.maps,0);
  const honors=yearRecords.flatMap(record=>record.honors);
  const weightedMaps=results.reduce((sum,result)=>sum+result.maps*eventWeightFor(result.honorClass,result.tier),0);
  const weightedRating=results.reduce((sum,result)=>sum+result.rating*result.maps*eventWeightFor(result.honorClass,result.tier),0)/Math.max(1,weightedMaps);
  const weightedAdr=yearRecords.reduce((sum,record)=>sum+record.adr*record.matches,0)/Math.max(1,yearRecords.reduce((sum,record)=>sum+record.matches,0));
  const profile:ApsProfile={rating:weightedRating,adr:weightedAdr,maps:results.reduce((sum,result)=>sum+result.maps,0),playoffs:averageContext(results,'playoffs'),finals:averageContext(results,'finals'),vsTop5:averageContext(results,'vsTop5'),mvp:honors.filter(h=>h.kind==='MVP').length,evp:honors.filter(h=>h.kind==='EVP').length,vp:honors.filter(h=>h.kind==='VP').length,topAwards:honors.filter(h=>(h.kind==='MVP'||h.kind==='EVP')&&(h.honorClass==='major'||h.honorClass==='super-elite')).length};
  const playerAps=apsFor(profile,honors);
  const edgeConditions=[profile.evp>=2,profile.vp>=5,profile.playoffs>=1.05].filter(Boolean).length;
  const majorMvpCount=new Set(honors.filter(honor=>honor.kind==='MVP'&&honor.honorClass==='major').map(honor=>honor.tournamentName)).size;
  const guaranteedTop1=majorMvpCount>=1&&profile.rating>=1.30&&profile.playoffs>=profile.rating&&profile.vsTop5>=1.15;
  const eligible=t1Maps>=40;
  const playerTop3Qualified=playerAps>=4500&&profile.rating>=1.30&&tierQualified(profile,honors,'TOP 1');
  const seenNpcNicks=new Set<string>();
  const npcProfiles=CAREER_TEAMS.slice(0,30).flatMap(team=>team.roster.flatMap(player=>{
    if(seenNpcNicks.has(player.nick))return [];
    seenNpcNicks.add(player.nick);
    const rng=seeded(state,`aps-npc:${calendarYear}:${player.id}`);
    const roleBase=player.role==='awper'?1.12:player.role==='entry'?1.09:player.role==='igl'?.97:player.role==='support'?1.01:1.06;
    const teamBoost=(101-team.baseRank)/100*.14;
    const rating=Number((roleBase+teamBoost+(rng()-.5)*.14).toFixed(2));
    const maps=40+Math.floor(rng()*80);
    const adr=Math.round(66+(rating-1)*50+rng()*8);
    const playoffs=Number((rating+(rng()-.5)*.16).toFixed(2));
    const finals=Number((rating+(rng()-.5)*.20).toFixed(2));
    const vsTop5=Number((rating-.05+(rng()-.5)*.16).toFixed(2));
    const mvp=Math.max(0,Math.floor((team.strength/100)*rng()*2.5));
    const evp=Math.max(0,Math.floor((team.strength/100)*rng()*5));
    const vp=Math.max(0,Math.floor(rng()*6));
    const topAwards=Math.min(mvp+evp,Math.floor((team.strength/100)*rng()*3.5));
    const npcProfile:ApsProfile={rating,adr,maps,playoffs,finals,vsTop5,mvp,evp,vp,topAwards};
    const historicalBaseline=getHistoricalPlayerBaseline(player.nick,state.careerYear);
    const calibratedScore=historicalBaseline===undefined?apsFor(npcProfile):Math.max(apsFor(npcProfile),historicalBaseline*6*(.9+rng()*.2));
    return [{playerId:player.id,nick:player.nick,team:team.name,score:calibratedScore,isPlayer:false,isTeammate:false,rating,adr,maps,top3Qualified:npcProfile.rating>=1.25&&npcProfile.topAwards>=2,tier:tierForCandidate(npcProfile,[],calibratedScore)}];
  }));
  const currentTeammateIds=new Set(state.roster.filter(player=>!player.isPlayer).map(player=>player.id));
  const teammateProfiles=state.roster.filter(player=>!player.isPlayer).flatMap(player=>{
    const seasons=player.seasonPerformances.filter(performance=>performance.careerYear===state.careerYear);
    if(!seasons.length)return [];
    const maps=seasons.reduce((sum,item)=>sum+item.maps,0);
    const rating=seasons.reduce((sum,item)=>sum+item.rating*item.maps,0)/Math.max(1,maps);
    const adr=seasons.reduce((sum,item)=>sum+item.adr*item.maps,0)/Math.max(1,maps);
    const mvp=seasons.reduce((sum,item)=>sum+item.mvp,0),evp=seasons.reduce((sum,item)=>sum+item.evp,0),vp=seasons.reduce((sum,item)=>sum+item.vp,0);
    const majorTitles=seasons.reduce((sum,item)=>sum+item.majorTitles,0);
    const profile:ApsProfile={rating,adr,maps,playoffs:Number((rating+.01).toFixed(2)),finals:Number((rating+.02).toFixed(2)),vsTop5:Number((rating-.02).toFixed(2)),mvp,evp,vp,topAwards:mvp+evp};
    const rawScore=apsFor(profile)*10;
    const score=majorTitles?Math.max(rawScore,1200+Math.max(0,player.ability-70)*60+majorTitles*450):rawScore;
    return [{playerId:player.id,nick:player.nick,team:state.team,score,isPlayer:false,isTeammate:true,rating:Number(rating.toFixed(2)),adr:Math.round(adr),maps,top3Qualified:rating>=1.25&&profile.topAwards>=2,tier:score>=1200&&rating>=1.10?('TOP 16-20' as Top20Tier):undefined}];
  });
  const candidates=[...npcProfiles.filter(candidate=>!currentTeammateIds.has(candidate.playerId)),...teammateProfiles,{playerId:`career-player-${state.seed}`,nick:state.name,team:state.team,score:playerAps,isPlayer:true,isTeammate:false,rating:Number(weightedRating.toFixed(2)),adr:Math.round(weightedAdr),maps:profile.maps,top3Qualified:playerTop3Qualified,tier:tierForCandidate(profile,honors,playerAps)}]
    .filter(candidate=>!candidate.isPlayer||eligible)
    .sort((a,b)=>b.score-a.score||a.playerId.localeCompare(b.playerId));
  const top3=candidates.filter(candidate=>candidate.score>=4500&&candidate.top3Qualified).slice(0,3);
  const rest=candidates.filter(candidate=>!top3.includes(candidate));
  const pool=[...top3,...rest].slice(0,20);
  let entries=pool.map((entry,index)=>({playerId:entry.playerId,nick:entry.nick,team:entry.team,score:Math.round(entry.score),isPlayer:entry.isPlayer,isTeammate:entry.isTeammate,rating:entry.rating,adr:entry.adr,maps:entry.maps,tier:entry.tier,rank:index+1}));
  if(guaranteedTop1&&eligible){
    const playerEntry={playerId:`career-player-${state.seed}`,nick:state.name,team:state.team,score:Math.round(playerAps),isPlayer:true,isTeammate:false,rating:Number(weightedRating.toFixed(2)),adr:Math.round(weightedAdr),maps:profile.maps,tier:tierForCandidate(profile,honors,playerAps),rank:1};
    entries=[playerEntry,...entries.filter(entry=>!entry.isPlayer)].slice(0,20).map((entry,index)=>({...entry,rank:index+1}));
  }
  const initialPlayerRank=entries.find(entry=>entry.isPlayer)?.rank;
  if(!guaranteedTop1&&initialPlayerRank&&initialPlayerRank>=11&&edgeConditions<2){
    entries=entries.filter(entry=>!entry.isPlayer);
    const entryIds=new Set(entries.map(entry=>entry.playerId));
    const replacement=candidates.find(candidate=>!candidate.isPlayer&&!entryIds.has(candidate.playerId));
    if(replacement)entries.push({playerId:replacement.playerId,nick:replacement.nick,team:replacement.team,score:Math.round(replacement.score),isPlayer:false,isTeammate:replacement.isTeammate,rating:replacement.rating,adr:replacement.adr,maps:replacement.maps,tier:replacement.tier,rank:entries.length+1});
    entries=entries.map((entry,index)=>({...entry,rank:index+1}));
  }
  const playerRank=entries.find(entry=>entry.isPlayer)?.rank;
  const review=playerRank?top20ReviewFor(state,calendarYear,playerRank,results,honors,entries):undefined;
  const quoteRoll=seeded(state,`top20-quote:${calendarYear}`)();
  const quoteIndex=Math.floor(seeded(state,`top20-quote-pick:${calendarYear}:${CAREER_CONTENT_VERSION}`)()*top20InterviewPolicy.quotes.length);
  const generatedQuote=playerRank&&quoteRoll*10000<top20InterviewPolicy.chanceBps?`“${top20InterviewPolicy.quotes[quoteIndex].text}”${top20InterviewPolicy.suffix}`:undefined;
  const playerTier=entries.find(entry=>entry.isPlayer)?.tier;
  return {calendarYear,careerYear:state.careerYear,eligible,playerRank,entries,review,generatedQuote,t1Maps,nominationChance:eligible?100:0,apsScore:Math.round(playerAps),playerTier};
};

const applyOriginVariance = (base: number, radius:number, seed: number, originId:string,key: string) => {
  const variance = makeRng(hash(`${seed}:origin:${originId}:stat:${key}`))();
  return clamp(base + Math.round((variance * 2 - 1) * radius));
};
const initialSalaryFor=(rank:number,ability:number,fame:number)=>{const [min,max]=rank<=5?[18,78]:rank<=12?[8,25]:rank<=20?[4,10]:rank<=40?[1.5,5]:rank<=80?[.8,3]:[.5,1.5];const factor=Math.min(1,Math.max(0,(ability-45)/55*.8+fame/100*.2));return Math.round(min+(max-min)*factor);};
export const createCareer = (input: { seed: string; name: string; pace: Pace; originId: OriginId; role: Role; iglArchetype?: IglArchetype }): CareerState => {
  const origin = ORIGINS.find(item => item.id === input.originId) ?? ORIGINS[0];
  const originConfig=getOriginConfig(origin.id);
  const name = input.name.trim().slice(0, 16) || '无名新人';
  const seed = hash(input.seed.trim() || `${name}:${input.pace}:${origin.id}:${input.role}:${CAREER_RULES_VERSION}:${CAREER_DATA_VERSION}`);
  const talentConfigs=selectTalentConfigs(originConfig,key=>makeRng(hash(`${seed}:${key}`))());
  const talents=talentConfigs.map(snapshotTalent);
  const talentEffect=(key:keyof TalentSnapshot['effects'])=>talents.reduce((sum,talent)=>sum+(talent.effects[key]??0),0);
  const ability = clamp(applyOriginVariance(originConfig.baseStats.ability,originConfig.variance.ability,seed,origin.id,'ability')+talentEffect('ability'));
  const connections = clamp(applyOriginVariance(originConfig.baseStats.connections,originConfig.variance.connections,seed,origin.id,'connections')+talentEffect('connections'));
  const integrity = clamp(applyOriginVariance(originConfig.baseStats.integrity,originConfig.variance.integrity,seed,origin.id,'integrity')+talentEffect('integrity'));
  const fame = clamp(applyOriginVariance(originConfig.baseStats.fame,originConfig.variance.fame,seed,origin.id,'fame')+talentEffect('fame'));
  const team = initialTeamFor(origin.id);
  return {
    version: CAREER_VERSION, rulesVersion: CAREER_RULES_VERSION, dataVersion: CAREER_DATA_VERSION, contentVersion:CAREER_CONTENT_VERSION,seed, pace: input.pace, name, origin, talents,role: input.role, defensiveSite:input.role==='entry'?'a':input.role==='support'?'b':'rotator', positionFamiliarity:clamp(68+talentEffect('positionFamiliarity')),
    age: 16, careerYear: 1, half: 'first', season: 1, teamId: team.id, team: team.name, region: team.region, roster: rosterWithPlayer(team, name, input.role,seed), coreMemberIds:team.roster.slice(0,3).map(player=>player.id), tier: tierForRank(team.baseRank), globalRank: team.baseRank, regionRank: regionRankFor(team.baseRank, team.region), rankingPoints: Math.max(120,Math.round(1800-team.baseRank*15)), vrsActive:true, rebuildPoints:0, lastTransferFee:0, teamForm:Math.round(Math.max(55,75-team.baseRank*.15)), rosterStability:72, negativeUpsetStreak:0, internationalAdaptation:clamp(originConfig.baseStats.internationalAdaptation+talentEffect('internationalAdaptation')), cncsRevival:false, ability, connections, integrity, fame, health:clamp(originConfig.baseStats.health+talentEffect('health')), salary:initialSalaryFor(team.baseRank,ability,fame), rolePreparation: 'none', roleChangeCooldown: 0, roleChangeCount: 0, iglArchetype:input.role==='igl'?(input.iglArchetype&&input.iglArchetype!=='dynasty'?input.iglArchetype:'brain'):undefined, bootcampCount: 0, highPressureChokingRisk:clamp(20+talentEffect('highPressureChokingRisk')), hiddenFlags:{rookieStartAbility:ability,worldClassPotential:makeRng(hash(`${seed}:world-class-potential:v1`))()<.05?1:0}, worldlines:{}, eventHistory:{}, pendingConsequences:[], top3SeasonStreak:0, tacticalFatigue:false, crisisCooldowns:{}, nextSeasonRatingPenalty:0, employmentStatus:'signed', noOfferWindows:0, contractHalfSeasonsRemaining:originConfig.contractHalfSeasons, assets:originConfig.startingAssets, streamerWindows:0, highPotential:false, status: 'active', phase: 'ready', pendingEmergencies: [], resolvedEmergencies: [], honors: [], top20History: [],
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
  const best = [...tournaments].filter(result=>result.qualified!==false).sort((a, b) => honorWeight[b.honorClass] - honorWeight[a.honorClass] || ['冠军','亚军','四强','八强','小组赛出局','首轮出局'].indexOf(a.placement) - ['冠军','亚军','四强','八强','小组赛出局','首轮出局'].indexOf(b.placement))[0];
  const rebuildPoints = state.vrsActive ? state.rebuildPoints : Math.max(0, state.rebuildPoints + Math.max(0, rankingDelta));
  const projectedRank=state.vrsActive?state.globalRank-Math.round(rankingDelta/16):100-Math.floor((rebuildPoints-120)/10);
  const projectedPoints=state.vrsActive?state.rankingPoints+rankingDelta:rebuildPoints;
  const vrsActive = state.vrsActive ? projectedRank<=100&&projectedPoints>0 : rebuildPoints>=120;
  const globalRank = vrsActive ? Math.max(1,Math.min(100,projectedRank)) : 101;
  const regionRank = vrsActive ? regionRankFor(globalRank, state.region) : CAREER_TEAMS.filter(team => team.region === state.region).length+1;
  const rankingPoints = vrsActive ? Math.max(1,projectedPoints) : 0;
  const tier = !vrsActive ? '三线赛场' : tierForRank(globalRank);
  const positiveUpsets=tournaments.filter(result=>result.upset?.kind==='positive').length;
  const negativeUpsets=tournaments.filter(result=>result.upset?.kind==='negative').length;
  const negativeUpsetStreak=negativeUpsets?state.negativeUpsetStreak+negativeUpsets:0;
  const teamForm=clamp(state.teamForm+positiveUpsets*10-negativeUpsets*14+(winRate>=65?5:winRate<40?-6:0));
  const rosterStability=clamp(state.rosterStability-(negativeUpsetStreak>=3?12:negativeUpsetStreak>=2?6:0)+(state.resolvedEmergencies.some(event=>event.includes('核心'))?0:2));
  const baseFameChange=honors.length*2+tournaments.filter(result=>result.placement==='冠军').length*3+positiveUpsets*5;
  const missedMajor=tournaments.some(result=>result.tier==='Major'&&result.qualified===false);
  const awpCallerResponsibility=state.role==='igl'&&state.iglArchetype==='awp-caller'&&missedMajor?Math.max(1,Math.ceil(Math.abs(Math.min(0,baseFameChange-4))*.15)):0;
  const fame = clamp(state.fame + baseFameChange-(missedMajor?4:0)-awpCallerResponsibility);
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
  const t1Matches=tournaments.filter(result=>(result.tier==='T1'||result.tier==='Major')&&result.qualified!==false).reduce((sum,result)=>sum+result.matches,0);
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
  const burnoutLog=state.role==='igl'&&state.iglArchetype==='awp-caller'?`战术与架点双重负荷，健康基础损耗额外增加 50%${state.health<65?'，低健康导致赛事 Rating 受罚':''}`:'';
  const growthLog=state.season<=2?`新秀成长期：基础成长 +2${rookieRatingBonus?`，表现成长 +${rookieRatingBonus}`:''}${floorBonus?`，成长保底 +${floorBonus}`:''}`:hasGrowth?`T1赛事磨练：能力 +${Math.round(growthAmount)}`:peakBonus>0?`工夫到家：能力 +${peakBonus}`:'';
  const contractHalfSeasonsRemaining=Math.max(0,state.contractHalfSeasonsRemaining-1);
  const highPotential=isHighPotential({...state,age:nextAge,ability:finalAbility,health} as CareerState,rating);
  const roster=state.roster.map(player=>player.isPlayer?player:{...player,seasonPerformances:[...player.seasonPerformances,teammatePerformanceFor(state,player,tournaments)]});
  const interim: CareerState = { ...state, roster, age: nextAge,nextSeasonRatingPenalty:0, tier, globalRank:Math.max(1,globalRank-revivalBoost), regionRank, rankingPoints:rankingPoints+revivalBoost*10, vrsActive, rebuildPoints, teamForm:clamp(teamForm+revivalBoost),rosterStability:clamp(rosterStability+(cncsRevival?6:0)),negativeUpsetStreak,cncsRevival, iglArchetype:dynastyEvolution?'dynasty':state.iglArchetype, ability:finalAbility, fame:clamp(fame+(cncsRevival?5:0)), health, assets:state.assets+(playerPrize+salaryPaid)*.55,highPotential,contractHalfSeasonsRemaining, roleChangeCooldown: Math.max(0, state.roleChangeCooldown - 1), phase: 'report', decision: undefined, pendingEmergencies: [], stats: { matches: state.stats.matches + matches, rating, kd, adr, trophies, mvps, earnings, salaryIncome:state.stats.salaryIncome+salaryPaid, prizeIncome:state.stats.prizeIncome+playerPrize, signingIncome:state.stats.signingIncome }, honors: [...state.honors, ...honors] };
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
  const top3SeasonStreak=globalRank<=3?state.top3SeasonStreak+1:0;
  const dynastyCrisis=dynastyCrisisFor({...interim,top3SeasonStreak},tournaments,top3SeasonStreak);
  const ratingOffers=employmentStatus==='signed'?marketOffersFor(interim,rating,tournaments):[];
  let completed: CareerState = { ...interim,employmentStatus,top3SeasonStreak,tacticalFatigue:interim.tacticalFatigue||dynastyCrisis?.title==='王朝危机：战术被摸透',noOfferWindows:employmentStatus==='free-agent'?state.noOfferWindows+1:0,contractHalfSeasonsRemaining:nextContract,renewalEvaluation:market,marketOffers:ratingOffers.length?ratingOffers:undefined,marketHeat:ratingOffers.length?'连续进步引起多支队伍关注':undefined,status: forcedRetirement ? 'retired' : 'active', phase: forcedRetirement ? 'retired' : 'report', history: completedHistory, resolvedEmergencies: [], seasonProgress:undefined, lastEventResult:undefined, seasonBaseline: undefined, eventResume: undefined, postReportEvent: forcedRetirement ? undefined : dynastyCrisis??state.postReportEvent, log: [market?.summary,dynastyLog,crisisLog,burnoutLog,awpCallerResponsibility?`指挥狙为 Major 未晋级承担主要责任：名气额外 -${awpCallerResponsibility}`:'',growthLog,highPotential&&!state.highPotential?'年轻高潜状态生效：成长与市场机会提高':'',`生涯第 ${state.careerYear} 年${state.half === 'first' ? '上半年' : '下半年'} / 全球第 ${globalRank} / ${record.placement}`, ...state.log].filter((item):item is string=>Boolean(item)) };
  if(!forcedRetirement){
    const availableWorldlines=eligibleWorldlines(WORLDLINE_DEFINITIONS,eventContextFor(completed));
    if(availableWorldlines.length){
      const started=availableWorldlines.reduce((current,definition)=>applyWorldlineTransition(WORLDLINE_DEFINITIONS,current,{worldlineId:definition.worldlineId,action:'start',toStage:definition.initialStage,note:`进入世界线：${definition.title}`},completed.season),completed.worldlines);
      completed={...completed,worldlines:started,log:[...availableWorldlines.map(definition=>`世界线开启 / ${definition.title}`),...completed.log]};
    }
  }
  if(!forcedRetirement&&shouldTriggerRosterChange(completed)){
    const rosterEvent=createRosterChangeEvent(completed);
    completed=completed.postReportEvent?{...completed,pendingEmergencies:[...completed.pendingEmergencies,rosterEvent]}:{...completed,postReportEvent:rosterEvent};
  }
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
  const baseHealthLoss=Math.round(rng()*5);
  const burnoutMultiplier=consequenceState.role==='igl'&&consequenceState.iglArchetype==='awp-caller'?1.5:1;
  const prepared={...consequenceState,ability:clamp(consequenceState.ability+Math.round(rng()*4)-1-(consequenceState.half==='second'?ageDecline(consequenceState.age,nextAge):0)),health:clamp(consequenceState.health-Math.round(baseHealthLoss*burnoutMultiplier)),positionFamiliarity:clamp(consequenceState.positionFamiliarity+2),seasonBaseline:baseline,resolvedEmergencies:[],lastEventResult:undefined};
  const calendar=tournamentCalendarFor(prepared);
  const salaryPerTournament=Math.round(state.salary*6/Math.max(1,calendar.length));
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
  const tournament=TOURNAMENTS.find(item=>item.id===tournamentId)??(tournamentId.startsWith(`major-${state.careerYear}-${state.half}`)?majorForSeason(state):undefined);
  if(!tournament)return finishSeason(state);
  const result=simulateTournament(state,tournament,progress.salaryPerTournament);
  const nextProgress={...progress,nextIndex:progress.nextIndex+1,results:[...progress.results,result]};
  const updatedState:CareerState={...state,seasonProgress:nextProgress,lastEventResult:undefined};
  if(result.hasCriticalEvent&&result.criticalEventId){
    const context=eventContextFor(updatedState,result);
    const template=pickEvent(EVENT_DEFINITIONS,context,{kind:'field',timing:'in-season',categories:['赛事内关键局']},seeded(updatedState,`${result.criticalEventId}:pick`)());
    const criticalEvent=template?instantiateEvent(template,`${result.criticalEventId}-${template.catalogId}`,context):undefined;
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

const outcomesFor=(option:DecisionOption,decisionId='decision')=>option.outcomes?.length?option.outcomes:fallbackOutcomes(option,decisionId);
export const previewDecisionOutcome=(state:CareerState,decision:Decision,optionId:string):OutcomePreview|null=>{
  const option=decision.options.find(item=>item.id===optionId);
  if(!option)return null;
  const outcomes=outcomesFor(option,decision.id);
  const total=outcomes.reduce((sum,outcome)=>sum+outcome.probability,0);
  const roll=seeded(state,`outcome:${decision.id}:${option.id}`)()*total;
  let cumulative=0;
  const outcome=outcomes.find(item=>{cumulative+=item.probability;return roll<cumulative;})??outcomes.at(-1)!;
  return {optionId,outcomeId:outcome.id??`${decision.id}-${option.id}-${outcomes.indexOf(outcome)}`,outcomeLabel:outcome.label,probability:Number((outcome.probability/total*100).toFixed(1)),changes:outcome.changes,resultPatch:outcome.resultPatch,delayedRisk:outcome.delayed?.riskHint};
};
const scheduleDelayedOutcome=(state:CareerState,decision:Decision,option:DecisionOption,preview:OutcomePreview)=>{
  const optionOutcomes=outcomesFor(option,decision.id);
  const outcome=optionOutcomes.find(item=>(item.id??`${decision.id}-${option.id}-${optionOutcomes.indexOf(item)}`)===preview.outcomeId);
  if(!outcome?.delayed)return state;
  const delaySpan=Math.max(0,outcome.delayed.maxSeasons-outcome.delayed.minSeasons);
  const dueSeason=state.season+outcome.delayed.minSeasons+Math.floor(seeded(state,`delay:${decision.id}:${option.id}:${preview.outcomeId}`)()*(delaySpan+1));
  const consequence:PendingConsequence={id:`${decision.id}:${option.id}:${preview.outcomeId}`,sourceDecisionId:decision.id,dueSeason,tag:outcome.delayed.tag,changes:outcome.delayed.changes,revealText:outcome.delayed.revealText};
  return {...state,hiddenFlags:{...state.hiddenFlags,[outcome.delayed.tag]:(state.hiddenFlags[outcome.delayed.tag]??0)+1},pendingConsequences:[...state.pendingConsequences,consequence]};
};
const applyWorldlineTransitions=(state:CareerState,transitions:WorldlineTransition[]|undefined):CareerState=>{
  if(!transitions?.length)return state;
  const worldlines=transitions.reduce((progress,transition)=>applyWorldlineTransition(WORLDLINE_DEFINITIONS,progress,transition,state.season),state.worldlines);
  const applied=transitions.filter(transition=>worldlines[transition.worldlineId]!==state.worldlines[transition.worldlineId]);
  return {...state,worldlines,log:[...applied.map(transition=>`世界线 ${transition.worldlineId} / ${transition.action} / ${transition.toStage??worldlines[transition.worldlineId]?.stageId}`),...state.log]};
};
const applyOptionOutcome=(state:CareerState,decision:Decision,option:DecisionOption,preview?:OutcomePreview)=>{
  const canonical=previewDecisionOutcome(state,decision,option.id);
  if(!canonical||preview&&preview.outcomeId!==canonical.outcomeId)return {state,outcomeLabel:'结果校验失败，未提交选择。',preview:null};
  let resolved=applyChanges(state,option.changes);
  resolved=applyChanges(resolved,canonical.changes);
  resolved=scheduleDelayedOutcome(resolved,decision,option,canonical);
  resolved=applyWorldlineTransitions(resolved,option.worldlineTransitions);
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
  const playerPrize=Math.round(teamPrize*.136);
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
const applyTeammateTop20=(roster:CareerRosterPlayer[],award:AnnualTop20)=>roster.map(player=>{
  if(player.isPlayer)return player;
  const entry=award.entries.find(item=>item.playerId===player.id);
  return entry?{...player,top20History:[...player.top20History,{calendarYear:award.calendarYear,rank:entry.rank,score:entry.score}]}:player;
});
const advanceAfterReport = (state: CareerState): CareerState => {
  if (state.half === 'second' && !state.top20History.some(item => item.careerYear === state.careerYear)) {
    const yearRecords = state.history.filter(record => record.careerYear === state.careerYear);
    const award = generateAnnualTop20(state, yearRecords);
    const top1=award.playerRank===1;
    const globalRank=top1?Math.min(state.globalRank,12):state.globalRank;
    const awardedState:CareerState={...state,globalRank,regionRank:top1?regionRankFor(globalRank,state.region):state.regionRank,tier:top1?tierForRank(globalRank):state.tier,roster:applyTeammateTop20(state.roster,award),top20History:[...state.top20History,award]};
    const top1Offers=top1?marketOffersFor(awardedState,state.history.at(-1)?.rating??state.stats.rating):[];
    return { ...awardedState, marketOffers:top1Offers.length?top1Offers:state.marketOffers,marketHeat:top1Offers.length?'年度 TOP1 身份触发一线正式报价':state.marketHeat,phase: 'awards', decision: undefined, postReportEvent: undefined, eventResume: undefined };
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
  const eventHistory=decision.catalogId?{...result.state.eventHistory,[decision.catalogId]:{count:(result.state.eventHistory[decision.catalogId]?.count??0)+1,lastSeason:state.season}}:result.state.eventHistory;
  let resolved: CareerState = { ...result.state, eventHistory, lastEventResult:resultText, log: [`${decision.title} / ${resultText}`, ...result.state.log] };
  if(decision.id.startsWith('roster-'))resolved=applyRosterChange(resolved,decision,optionId);
  if(decision.title==='王朝危机：战术被摸透'){
    const cleared=result.preview?.outcomeId==='meta-clear'||result.preview?.outcomeId==='meta-discipline-clear';
    resolved={...resolved,tacticalFatigue:!cleared,crisisCooldowns:{...resolved.crisisCooldowns,metaShift:state.season+4},log:[cleared?'战术疲劳已清除':'战术疲劳延续：下一赛季表现 -15%、稳定 -15、负面爆冷概率翻倍',...resolved.log]};
  }
  if(decision.title==='王朝危机：更衣室炸弹'){
    const penalty=result.preview?.outcomeId==='ego-win'||option.id==='ego-compromise'?.05:0;
    const starNick=decision.briefing.match(/明星队友 (.+?)（/)?.[1];
    const replacement=starNick&&result.preview?.outcomeId==='ego-win'?{id:`rookie-${state.seed}-${state.season}`,nick:`Rookie-${state.season}`,role:state.roster.find(player=>player.nick===starNick)?.role??'rifler' as PlayerRole,ability:clamp(72+Math.round(seeded(state,'dynasty-rookie')()*18)),fame:25,seasonPerformances:[],top20History:[]}:undefined;
    const roster=replacement?resolved.roster.map(player=>player.nick===starNick?replacement:player):resolved.roster;
    resolved={...resolved,roster,nextSeasonRatingPenalty:penalty,crisisCooldowns:{...resolved.crisisCooldowns,lockerRoomEgo:state.season+4},log:[result.preview?.outcomeId==='ego-lose'?'你被下放至替补，下一转会窗口将重新评估合同':'',...resolved.log].filter(Boolean)};
  }
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
  if (state.postReportEvent) return { ...state, phase: 'emergency', decision: state.postReportEvent, postReportEvent: undefined, eventResume: 'continue-report' };
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
  const eventHistory=state.decision.catalogId?{...outcomeResult.state.eventHistory,[state.decision.catalogId]:{count:(outcomeResult.state.eventHistory[state.decision.catalogId]?.count??0)+1,lastSeason:state.season}}:outcomeResult.state.eventHistory;
  const changed={...outcomeResult.state,eventHistory};
  const recoveryIds=['train','recover','full-rest','extra-practice','annual-rest','annual-train','stay','team-role','annual-stay'];
  const changedWithForm=recoveryIds.includes(option.id)?{...changed,teamForm:clamp(changed.teamForm+(option.id.includes('rest')||option.id==='recover'?12:7)),rosterStability:clamp(changed.rosterStability+(option.id.includes('stay')||option.id==='team-role'?10:4))}:changed;
  const marketSalary = monthlySalaryFor(changedWithForm);
  const salary = option.id === 'keep-core' ? Math.round(Math.max(.5, marketSalary * .82)) : typeof option.changes.contractSalary==='number'?option.changes.contractSalary:changedWithForm.employmentStatus==='signed'?marketSalary:0;
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
  if(state.status!=='active'||state.history.length===0)return state;
  const streamerState:CareerState={...state,teamId:'',team:'无所属战队',roster:[],tier:'未入榜',globalRank:999,regionRank:999,vrsActive:false,employmentStatus:'streamer',salary:0,phase:'choice',choiceKind:'offseason',streamerWindows:0,contractHalfSeasonsRemaining:0,renewalEvaluation:undefined,postReportEvent:undefined};
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

export const careerTitle = (state: CareerState) => selectCareerTitle({integrity:state.integrity,trophies:state.stats.trophies,rating:state.stats.rating,connections:state.connections,role:state.role,fame:state.fame,age:state.age}).name;
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
    return { id: item.id, name: item.name, calendarYear: CAREER_START_YEAR + item.record.careerYear - 1, season: item.record.season, honorClass: item.honorClass, tier: item.tier, format: TOURNAMENTS.find(definition => definition.id === item.tournamentId)?.format ?? 'BO3', rating: item.rating, teamPrize:item.teamPrize, playerPrize:item.playerPrize, personalHonor };
  });
  const majors = allResults.filter(item => item.tier === 'Major'&&item.qualified!==false);
  const bestMajor = majors.map(item => item.placement).sort((a,b) => placementOrder.indexOf(a) - placementOrder.indexOf(b))[0] ?? '未参赛';
  const bestTop = Math.min(...state.top20History.map(item => item.playerRank ?? 99), 99);
  const legacyScore = trophies.reduce((sum, trophy) => sum + honorWeight[trophy.honorClass] * 9, 0) + state.stats.mvps * 12 + state.honors.filter(honor => honor.kind === 'EVP').length * 5 + (bestTop <= 1 ? 50 : bestTop <= 5 ? 35 : bestTop <= 10 ? 20 : bestTop <= 20 ? 10 : 0);
  const legacy: CareerSummary['legacy'] = legacyScore >= 180 ? '传奇' : legacyScore >= 120 ? '名人堂' : legacyScore >= 70 ? '世界级' : legacyScore >= 35 ? '一线名将' : '职业老兵';
  const weightedRating = state.history.reduce((sum, record) => sum + record.rating * record.matches, 0) / Math.max(1, state.history.reduce((sum, record) => sum + record.matches, 0));
  const tags:QuoteTag[]=[legacy==='传奇'?'legend':legacy==='名人堂'?'hall':legacy==='世界级'?'world':legacy==='一线名将'?'star':'veteran'];
  if(trophies.length)tags.push('champion');if(majors.length)tags.push('major');if(bestTop===1)tags.push('top1');else if(bestTop<=20)tags.push('top20');if(state.integrity>=75)tags.push('clean');if(state.fame>=70)tags.push('famous');if(state.age-16>=10)tags.push('long');if(state.age-16<=3)tags.push('short');if(trophies.length===0)tags.push('regret');if([...new Set(state.history.map(record=>record.team))].length>=3)tags.push('journeyman');
  const preferredQuotes=CAREER_REVIEW_QUOTES.filter(item=>item.text.length>=45&&item.text.length<=75);const quotePool=preferredQuotes.length?preferredQuotes:CAREER_REVIEW_QUOTES;const scored=quotePool.map(quote=>({quote,score:quote.tags.filter(tag=>tags.includes(tag)).length}));const bestScore=Math.max(...scored.map(item=>item.score));const matches=scored.filter(item=>item.score===bestScore).sort((a,b)=>a.quote.id.localeCompare(b.quote.id));const totalWeight=matches.reduce((sum,item)=>sum+item.quote.weight,0);let quotePoint=makeRng(hash(`${state.seed}:retirement-quote:${CAREER_CONTENT_VERSION}`))()*totalWeight;const quote=(matches.find(item=>{quotePoint-=item.quote.weight;return quotePoint<0;})??matches.at(-1)!).quote.text;
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
  return value.version === CAREER_VERSION && value.rulesVersion === CAREER_RULES_VERSION && value.dataVersion === CAREER_DATA_VERSION && value.contentVersion === CAREER_CONTENT_VERSION && Array.isArray(value.talents) && value.talents.length > 0 && typeof value.name === 'string' && ['a','b','rotator'].includes(value.defensiveSite as string) && isFiniteNumber(value.positionFamiliarity) && typeof value.teamId === 'string' && typeof value.team === 'string' && typeof value.origin === 'object' && typeof value.role === 'string' && (value.status === 'active' || value.status === 'retired') && validPhases.includes(value.phase as CareerPhase) && isFiniteNumber(value.seed) && isFiniteNumber(value.age) && isFiniteNumber(value.careerYear) && isFiniteNumber(value.season) && isFiniteNumber(value.ability) && isFiniteNumber(value.connections) && isFiniteNumber(value.integrity) && isFiniteNumber(value.fame) && isFiniteNumber(value.health) && isFiniteNumber(value.globalRank) && isFiniteNumber(value.regionRank) && typeof value.stats === 'object' && value.stats !== null && isFiniteNumber(value.teamForm) && isFiniteNumber(value.rosterStability) && isFiniteNumber(value.internationalAdaptation) && typeof value.cncsRevival === 'boolean' && typeof value.vrsActive === 'boolean' && Array.isArray(value.roster) && value.roster.every(player=>typeof player?.id==='string'&&isFiniteNumber(player?.ability)&&isFiniteNumber(player?.fame)&&Array.isArray(player?.seasonPerformances)&&Array.isArray(player?.top20History)) && ((value.employmentStatus === 'signed' && value.roster.length === 5 && value.roster.filter(player=>player?.isPlayer).length === 1) || (value.employmentStatus !== 'signed' && (value.roster.length === 0 || value.roster.length === 5))) && Array.isArray(value.history) && Array.isArray(value.honors) && Array.isArray(value.top20History) && Array.isArray(value.pendingEmergencies) && Array.isArray(value.resolvedEmergencies) && Array.isArray(value.log) && ['none','awper-training','igl-assistant'].includes(value.rolePreparation as string) && isFiniteNumber(value.roleChangeCooldown) && isFiniteNumber(value.roleChangeCount) && isFiniteNumber(value.bootcampCount) && isFiniteNumber(value.highPressureChokingRisk) && typeof value.hiddenFlags==='object' && value.hiddenFlags!==null && typeof value.worldlines==='object' && value.worldlines!==null && typeof value.eventHistory==='object' && value.eventHistory!==null && Array.isArray(value.pendingConsequences) && ['signed','free-agent','streamer'].includes(value.employmentStatus as string) && isFiniteNumber(value.noOfferWindows) && isFiniteNumber(value.contractHalfSeasonsRemaining) && isFiniteNumber(value.assets) && isFiniteNumber(value.streamerWindows) && typeof value.highPotential==='boolean' && isFiniteNumber(value.top3SeasonStreak) && typeof value.tacticalFatigue==='boolean' && typeof value.crisisCooldowns==='object' && value.crisisCooldowns!==null && isFiniteNumber(value.nextSeasonRatingPenalty);
};
export const loadCareer = (): CareerState | null => {
  try { const stored = localStorage.getItem(CAREER_SAVE_KEY); if (!stored) return null; const state=migrateCareer(JSON.parse(stored)); return isValidCareer(state) ? state : null; } catch { return null; }
};
export const saveCareer = (state: CareerState) => localStorage.setItem(CAREER_SAVE_KEY, JSON.stringify(state));
export const clearCareer = () => localStorage.removeItem(CAREER_SAVE_KEY);
