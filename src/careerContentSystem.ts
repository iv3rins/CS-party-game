import manifestJson from './data/career-config/manifest.json';
import originsJson from './data/career-config/origins.json';
import talentsJson from './data/career-config/talents.json';
import top20Json from './data/career-config/top20-reviews.json';
import careerReviewsJson from './data/career-config/career-reviews.json';
import careerTitlesJson from './data/career-config/career-titles.json';
import { CAREER_TEAMS } from './careerData';

export type QuoteTag='legend'|'hall'|'world'|'star'|'veteran'|'champion'|'major'|'top1'|'top20'|'clean'|'famous'|'long'|'short'|'regret'|'journeyman';
export type ConfigOriginId='northeast'|'academy'|'campus'|'overseas'|'southwest'|'south'|'central'|'northwest';
export interface OriginConfig {id:ConfigOriginId;name:string;place:string;description:string;baseStats:{ability:number;connections:number;integrity:number;fame:number;health:number;internationalAdaptation:number};variance:{ability:number;connections:number;integrity:number;fame:number};initialTeamId:string;startingAssets:number;contractHalfSeasons:number;talentPoolTags:string[];eventWeightTags:Record<string,number>;earlyOpportunityTags:string[];}
export interface TalentEffect {ability?:number;connections?:number;integrity?:number;fame?:number;health?:number;positionFamiliarity?:number;internationalAdaptation?:number;highPressureChokingRisk?:number;}
export interface TalentConfig {id:string;revision:number;name:string;description:string;weight:number;poolTags:string[];exclusiveGroup?:string;effects:TalentEffect;}
export interface TalentSnapshot {id:string;revision:number;name:string;description:string;effects:TalentEffect;}
export interface CareerQuoteConfig {id:string;revision:number;text:string;tags:QuoteTag[];weight:number;}
export type CareerTitleField='integrity'|'trophies'|'rating'|'connections'|'role'|'fame'|'age';
export interface CareerTitleConfig {id:string;name:string;priority:number;conditions:Array<{field:CareerTitleField;op:'lt'|'lte'|'gt'|'gte'|'eq'|'ne';value:number|string}>;}
export interface Top20ReviewValues {playerName:string;year:number;rank:number;mvpCount:number;evpCount:number;vpCount:number;majorRating:number;eliteRating:number;playoffRating:number;arenaRating:number;finalRating:number;eliminationRating:number;aboveNick?:string;belowNick?:string;}

const QUOTE_TAGS=new Set<QuoteTag>(['legend','hall','world','star','veteran','champion','major','top1','top20','clean','famous','long','short','regret','journeyman']);
const TALENT_EFFECTS=new Set(['ability','connections','integrity','fame','health','positionFamiliarity','internationalAdaptation','highPressureChokingRisk']);
const TITLE_FIELDS=new Set(['integrity','trophies','rating','connections','role','fame','age']);
const TEMPLATE_KEYS=new Set(['playerName','year','rank','mvpCount','evpCount','vpCount','majorRating','eliteRating','playoffRating','arenaRating','finalRating','eliminationRating','aboveNick','belowComparison']);
const isObject=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
const unique=(values:string[])=>new Set(values).size===values.length;
const sourceApproved=(value:unknown)=>isObject(value)&&value.reviewStatus==='approved'&&['human-authored','ai-generated','built-in'].includes(String(value.type));
const templateTokens=(text:string)=>[...text.matchAll(/{{([A-Za-z][A-Za-z0-9]*)}}/g)].map(match=>match[1]);

const errors:string[]=[];
const requiredPacks={top20Reviews:'top20-reviews.json',careerReviews:'career-reviews.json',careerTitles:'career-titles.json',origins:'origins.json',talents:'talents.json'};
if(manifestJson.schemaVersion!=='1.0'||manifestJson.contentVersion!=='career-content-v1'||manifestJson.seedAlgorithmVersion!=='career-rng-v1'||Object.entries(requiredPacks).some(([key,file])=>manifestJson.packs[key as keyof typeof manifestJson.packs]!==file))errors.push('manifest 版本或包映射无效');
for(const pack of [originsJson,talentsJson,top20Json,careerReviewsJson,careerTitlesJson])if(pack.schemaVersion!=='1.0'||pack.contentVersion!==manifestJson.contentVersion)errors.push('配置包版本与 manifest 不一致');
const originsRaw=Array.isArray(originsJson.origins)?originsJson.origins as unknown[]:[];
if(originsRaw.length!==8)errors.push('出身配置必须包含 8 项');
const originIds:string[]=[];
for(const [index,value] of originsRaw.entries()){
  if(!isObject(value)){errors.push(`origins[${index}] 无效`);continue;}
  const id=String(value.id);originIds.push(id);
  if(!sourceApproved(value.source))errors.push(`${id} 未审核`);
  if(!isObject(value.baseStats)||!isObject(value.variance))errors.push(`${id} 缺少属性配置`);
  else for(const key of ['ability','connections','integrity','fame','health','internationalAdaptation'])if(typeof value.baseStats[key]!=='number'||Number(value.baseStats[key])<0||Number(value.baseStats[key])>100)errors.push(`${id}.baseStats.${key} 越界`);
  if(!CAREER_TEAMS.some(team=>team.id===value.initialTeamId))errors.push(`${id} 引用了未知初始队伍`);
  if(!isObject(value.eventWeightTags)||!Array.isArray(value.earlyOpportunityTags)||!value.earlyOpportunityTags.length)errors.push(`${id} 缺少事件权重或早期机会标签`);
}
if(!unique(originIds))errors.push('出身 ID 重复');
const talentsRaw=Array.isArray(talentsJson.talents)?talentsJson.talents as unknown[]:[];
if(!isObject(talentsJson.selectionPolicy)||!Number.isInteger(talentsJson.selectionPolicy.count)||talentsJson.selectionPolicy.count<1)errors.push('天资抽取数量无效');
const talentIds:string[]=[];
for(const [index,value] of talentsRaw.entries()){
  if(!isObject(value)){errors.push(`talents[${index}] 无效`);continue;}
  const id=String(value.id);talentIds.push(id);
  if(!sourceApproved(value.source))errors.push(`${id} 未审核`);
  if(!Number.isInteger(value.revision)||typeof value.name!=='string'||typeof value.description!=='string'||!Array.isArray(value.poolTags)||!value.poolTags.length)errors.push(`${id} 天资元数据无效`);
  if(typeof value.weight!=='number'||value.weight<=0)errors.push(`${id}.weight 必须大于 0`);
  if(!isObject(value.effects))errors.push(`${id}.effects 无效`);else {let budget=0;for(const [key,effect] of Object.entries(value.effects)){if(!TALENT_EFFECTS.has(key)||typeof effect!=='number'||!Number.isFinite(effect))errors.push(`${id}.effects.${key} 无效`);else budget+=Math.abs(effect);}if(budget>15)errors.push(`${id} 效果预算超过 15`);}
}
if(!unique(talentIds))errors.push('天资 ID 重复');
const talentCount=isObject(talentsJson.selectionPolicy)&&Number.isInteger(talentsJson.selectionPolicy.count)?Number(talentsJson.selectionPolicy.count):0;
for(const origin of originsRaw.filter(isObject)){const pool=talentsRaw.filter(isObject).filter(talent=>Array.isArray(talent.poolTags)&&talent.poolTags.some(tag=>Array.isArray(origin.talentPoolTags)&&origin.talentPoolTags.includes(tag)));if(pool.length<talentCount)errors.push(`${origin.id} 天资池不足`);}
const quotesRaw=Array.isArray(careerReviewsJson.retirementQuotes)?careerReviewsJson.retirementQuotes as unknown[]:[];
const quoteIds:string[]=[];
for(const [index,value] of quotesRaw.entries()){
  if(!isObject(value)){errors.push(`retirementQuotes[${index}] 无效`);continue;}
  quoteIds.push(String(value.id));if(!sourceApproved(value.source))errors.push(`${value.id} 未审核`);
  if(!Number.isInteger(value.revision)||typeof value.weight!=='number'||value.weight<=0)errors.push(`${value.id} 评语元数据无效`);
  if(typeof value.text!=='string'||value.text.length<35||value.text.length>140)errors.push(`${value.id} 文本长度无效`);
  if(!Array.isArray(value.tags)||!value.tags.length||!unique(value.tags.map(String))||value.tags.some(tag=>!QUOTE_TAGS.has(tag as QuoteTag)))errors.push(`${value.id} 含未知或重复标签`);
}
if(!unique(quoteIds))errors.push('退役评语 ID 重复');
const titlesRaw=Array.isArray(careerTitlesJson.titles)?careerTitlesJson.titles as unknown[]:[];const titleIds:string[]=[];const titleOps=new Set(['lt','lte','gt','gte','eq','ne']);
for(const value of titlesRaw){if(!isObject(value))continue;titleIds.push(String(value.id));if(typeof value.id!=='string'||typeof value.name!=='string'||typeof value.priority!=='number'||!Array.isArray(value.conditions)||value.conditions.some(item=>!isObject(item)||!TITLE_FIELDS.has(String(item.field))||!titleOps.has(String(item.op))||!['string','number'].includes(typeof item.value)))errors.push(`${value.id} 称号条件无效`);}
if(!unique(titleIds)||!titlesRaw.some(value=>isObject(value)&&Array.isArray(value.conditions)&&value.conditions.length===0))errors.push('称号必须 ID 唯一且包含 fallback');
const requiredTemplates=['honorsWithMvp','honorsWithoutMvp','pressure','compareAbove','compareFirst'];
if(!isObject(top20Json.templates)||requiredTemplates.some(key=>typeof top20Json.templates[key as keyof typeof top20Json.templates]!=='string'))errors.push('TOP20 缺少必需模板');
else for(const key of requiredTemplates){const value=top20Json.templates[key as keyof typeof top20Json.templates];if(templateTokens(value).some(token=>!TEMPLATE_KEYS.has(token)))errors.push(`TOP20 模板 ${key} 占位符无效`);}
if(!isObject(top20Json.interview)||!Array.isArray(top20Json.interview.quotes)||!top20Json.interview.quotes.length||top20Json.interview.quotes.some(quote=>typeof quote.id!=='string'||typeof quote.text!=='string')||top20Json.interview.chanceBps<0||top20Json.interview.chanceBps>10000)errors.push('TOP20 采访配置无效');
if(errors.length)throw new Error(`职业内容配置无效：\n${errors.join('\n')}`);

export const CAREER_CONTENT_VERSION=manifestJson.contentVersion;
export const ORIGIN_CONFIGS=originsRaw as unknown as readonly OriginConfig[];
export const TALENT_CONFIGS=(talentsRaw as unknown as TalentConfig[]).slice().sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
export const TALENT_SELECTION_COUNT=talentCount;
export const CAREER_REVIEW_QUOTES=(quotesRaw as unknown as CareerQuoteConfig[]).slice().sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
export const CAREER_TITLE_CONFIGS=(titlesRaw as unknown as CareerTitleConfig[]).slice().sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id));

const render=(template:string,values:Record<string,string|number>)=>template.replace(/{{([A-Za-z][A-Za-z0-9]*)}}/g,(_,key)=>String(values[key]??''));
export const formatTop20Review=(values:Top20ReviewValues)=>{
  const common={...values,belowComparison:values.belowNick?`后一位 ${values.belowNick}`:'多数竞争者'};
  const honorTemplate=values.mvpCount?top20Json.templates.honorsWithMvp:top20Json.templates.honorsWithoutMvp;
  const comparison=values.aboveNick?top20Json.templates.compareAbove:top20Json.templates.compareFirst;
  return render(honorTemplate,common)+render(top20Json.templates.pressure,common)+render(comparison,common);
};
export const top20InterviewPolicy={chanceBps:top20Json.interview.chanceBps,suffix:top20Json.interview.suffix,quotes:top20Json.interview.quotes.slice().sort((a,b)=>a.id.localeCompare(b.id))};
export const getOriginConfig=(id:string)=>ORIGIN_CONFIGS.find(origin=>origin.id===id)??ORIGIN_CONFIGS[0];
export const selectTalentConfigs=(origin:OriginConfig,rollFor:(key:string)=>number)=>{
  const selected:TalentConfig[]=[];let pool=TALENT_CONFIGS.filter(talent=>talent.poolTags.some(tag=>origin.talentPoolTags.includes(tag)));
  for(let slot=0;slot<TALENT_SELECTION_COUNT;slot++){
    const eligible=pool.filter(talent=>!talent.exclusiveGroup||!selected.some(item=>item.exclusiveGroup===talent.exclusiveGroup));
    const total=eligible.reduce((sum,talent)=>sum+talent.weight,0);let point=rollFor(`talent-slot:${slot}:${CAREER_CONTENT_VERSION}`)*total;
    const chosen=eligible.find(talent=>{point-=talent.weight;return point<0;})??eligible.at(-1);if(!chosen)break;selected.push(chosen);pool=pool.filter(item=>item.id!==chosen.id);
  }
  return selected;
};
export const snapshotTalent=(talent:TalentConfig):TalentSnapshot=>({id:talent.id,revision:talent.revision,name:talent.name,description:talent.description,effects:{...talent.effects}});
export const selectCareerTitle=(context:Record<CareerTitleField,number|string>)=>CAREER_TITLE_CONFIGS.find(title=>title.conditions.every(condition=>{const actual=context[condition.field],expected=condition.value;if(condition.op==='eq')return actual===expected;if(condition.op==='ne')return actual!==expected;if(typeof actual!=='number'||typeof expected!=='number')return false;if(condition.op==='lt')return actual<expected;if(condition.op==='lte')return actual<=expected;if(condition.op==='gt')return actual>expected;return actual>=expected;}))!;
