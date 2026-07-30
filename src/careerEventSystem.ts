import type {
  CareerEventContext, CareerEventDefinition, ConditionExpression, Decision, DecisionOption, EventKind,
  EventTiming, NumberExpression, ProbabilityOutcome, ProbabilityOutcomeDefinition, Scalar, StatChange,
  ValueExpression, WeightSpec,
} from './careerEventTypes';

export interface EventValidationResult { valid: boolean; errors: string[]; }
export interface EventQuery { kind: EventKind; timing?: EventTiming; excludeTimings?: EventTiming[]; categories?: string[]; excludeCategories?: string[]; excludeCatalogIds?: string[]; excludeTitles?: string[]; }

const STAT_KEYS = new Set<keyof StatChange>(['ability','connections','integrity','fame','health','earnings','signingBonus','contractSalary','assets','teamForm','rosterStability','positionFamiliarity','defensiveSite','resetVrs','preserveCore','transfer','internationalTransfer','contractTier','contractTeamId','contractHalfSeasons','employmentStatus','noOfferWindows','rolePreparation','roleChange','iglArchetype','bootcampBonus','highPressureChokingRisk','internationalAdaptation']);
const KINDS = new Set(['emergency','field','offseason','annual']);
const TIMINGS = new Set(['in-season','post-report']);
const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const MAX_AST_DEPTH = 12;
const MAX_AST_NODES = 96;
const VARIABLES=new Set(['career.age','career.season','career.careerYear','player.ability','player.connections','player.integrity','player.fame','player.health','player.positionFamiliarity','player.internationalAdaptation','player.highPressureChokingRisk','team.form','team.rosterStability','team.globalRank','team.regionRank','team.negativeUpsetStreak','team.vrsActive','team.region','team.tier','tournament.tier','tournament.honorClass','tournament.placement','tournament.rating','tournament.isMajor','tournament.isPlayoff']);
const CONDITION_OPS=new Set(['all','any','not','eq','ne','lt','lte','gt','gte','in','exists']);
const NUMBER_OPS=new Set(['add','mul','min','max','sub','div','abs','floor','ceil','round','clamp','if']);

const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const valueAt = (context: CareerEventContext, variable: string): Scalar | undefined => {
  const [scope, key] = variable.split('.');
  const target = context[scope as keyof CareerEventContext];
  return isObject(target) ? (target as Record<string, unknown>)[key] as Scalar | undefined : undefined;
};
const valueOf = (expression: ValueExpression, context: CareerEventContext) => 'const' in expression ? expression.const : valueAt(context, expression.var);

export const evaluateCondition = (expression: ConditionExpression, context: CareerEventContext): boolean => {
  if('args' in expression&&expression.op==='all')return expression.args.every(item=>evaluateCondition(item,context));
  if('args' in expression&&expression.op==='any')return expression.args.some(item=>evaluateCondition(item,context));
  if(expression.op==='not')return !evaluateCondition(expression.arg,context);
  if(expression.op==='exists')return valueOf(expression.value,context)!==undefined;
  if(expression.op==='in')return expression.set.includes(valueOf(expression.value,context) as Scalar);
  if(!('left' in expression))return false;
  const left=valueOf(expression.left,context),right=valueOf(expression.right,context);
  if(left===undefined||right===undefined)return false;
  if(expression.op==='eq')return left===right;
  if(expression.op==='ne')return left!==right;
  if(typeof left!=='number'||typeof right!=='number')return false;
  if(expression.op==='lt')return left<right;
  if(expression.op==='lte')return left<=right;
  if(expression.op==='gt')return left>right;
  return left>=right;
};

export const evaluateNumber = (expression: NumberExpression, context: CareerEventContext): number => {
  if('const' in expression)return expression.const;
  if('var' in expression){const value=valueAt(context,expression.var);return typeof value==='number'&&Number.isFinite(value)?value:0;}
  if(expression.op==='if')return evaluateNumber(evaluateCondition(expression.condition,context)?expression.then:expression.else,context);
  if(expression.op==='clamp')return Math.max(expression.min,Math.min(expression.max,evaluateNumber(expression.value,context)));
  if(expression.op==='abs')return Math.abs(evaluateNumber(expression.value,context));
  if(expression.op==='floor')return Math.floor(evaluateNumber(expression.value,context));
  if(expression.op==='ceil')return Math.ceil(evaluateNumber(expression.value,context));
  if(expression.op==='round')return Math.round(evaluateNumber(expression.value,context));
  if('args' in expression&&expression.op==='add')return expression.args.reduce((sum,item)=>sum+evaluateNumber(item,context),0);
  if('args' in expression&&expression.op==='mul')return expression.args.reduce((product,item)=>product*evaluateNumber(item,context),1);
  if('left' in expression){
    const left=evaluateNumber(expression.left,context),right=evaluateNumber(expression.right,context);
    return expression.op==='sub'?left-right:right===0?0:left/right;
  }
  if(!('args' in expression))return 0;
  const values=expression.args.map(item=>evaluateNumber(item,context));
  return expression.op==='min'?Math.min(...values):Math.max(...values);
};
const weightOf=(spec:WeightSpec|undefined,context:CareerEventContext,fallback:number)=>Math.max(0,Math.round(spec===undefined?fallback:typeof spec==='number'?spec:evaluateNumber(spec,context)));

const astStats=(value:unknown,depth=0):{depth:number;nodes:number}=>{
  if(!isObject(value))return {depth,nodes:1};
  const children=Object.values(value).flatMap(item=>Array.isArray(item)?item:[item]).filter(item=>isObject(item));
  const nested=children.map(child=>astStats(child,depth+1));
  return {depth:Math.max(depth,...nested.map(item=>item.depth)),nodes:1+nested.reduce((sum,item)=>sum+item.nodes,0)};
};
const validateValueExpression=(value:unknown,path:string,errors:string[])=>{
  if(!isObject(value)){errors.push(`${path} 必须是值表达式`);return;}
  if('const' in value){if(!['string','number','boolean'].includes(typeof value.const)||typeof value.const==='number'&&!Number.isFinite(value.const))errors.push(`${path}.const 无效`);return;}
  if(typeof value.var!=='string'||!VARIABLES.has(value.var))errors.push(`${path}.var 不在白名单`);
};
const validateConditionExpression=(value:unknown,path:string,errors:string[],depth=0):void=>{
  if(depth>MAX_AST_DEPTH||!isObject(value)||typeof value.op!=='string'||!CONDITION_OPS.has(value.op)){errors.push(`${path} 条件结构无效`);return;}
  if(value.op==='all'||value.op==='any'){if(!Array.isArray(value.args)||!value.args.length){errors.push(`${path}.args 必须是非空数组`);return;}value.args.forEach((item,index)=>validateConditionExpression(item,`${path}.args[${index}]`,errors,depth+1));return;}
  if(value.op==='not'){validateConditionExpression(value.arg,`${path}.arg`,errors,depth+1);return;}
  if(value.op==='in'){validateValueExpression(value.value,`${path}.value`,errors);if(!Array.isArray(value.set)||!value.set.length)errors.push(`${path}.set 必须是非空数组`);return;}
  if(value.op==='exists'){if(!isObject(value.value)||typeof value.value.var!=='string'||!VARIABLES.has(value.value.var))errors.push(`${path}.value.var 不在白名单`);return;}
  validateValueExpression(value.left,`${path}.left`,errors);validateValueExpression(value.right,`${path}.right`,errors);
};
const validateNumberExpression=(value:unknown,path:string,errors:string[],depth=0):void=>{
  if(typeof value==='number'){if(!Number.isFinite(value)||value<0)errors.push(`${path} 权重必须是非负有限数`);return;}
  if(depth>MAX_AST_DEPTH||!isObject(value)){errors.push(`${path} 数值公式无效`);return;}
  if('const' in value){if(typeof value.const!=='number'||!Number.isFinite(value.const))errors.push(`${path}.const 必须是有限数字`);return;}
  if('var' in value){if(typeof value.var!=='string'||!VARIABLES.has(value.var))errors.push(`${path}.var 不在白名单`);return;}
  if(typeof value.op!=='string'||!NUMBER_OPS.has(value.op)){errors.push(`${path}.op 无效`);return;}
  if(['add','mul','min','max'].includes(value.op)){if(!Array.isArray(value.args)||!value.args.length){errors.push(`${path}.args 必须是非空数组`);return;}value.args.forEach((item,index)=>validateNumberExpression(item,`${path}.args[${index}]`,errors,depth+1));return;}
  if(value.op==='sub'||value.op==='div'){validateNumberExpression(value.left,`${path}.left`,errors,depth+1);validateNumberExpression(value.right,`${path}.right`,errors,depth+1);return;}
  if(['abs','floor','ceil','round'].includes(value.op)){validateNumberExpression(value.value,`${path}.value`,errors,depth+1);return;}
  if(value.op==='clamp'){validateNumberExpression(value.value,`${path}.value`,errors,depth+1);if(typeof value.min!=='number'||typeof value.max!=='number'||value.min>value.max)errors.push(`${path} clamp 边界无效`);return;}
  validateConditionExpression(value.condition,`${path}.condition`,errors,depth+1);validateNumberExpression(value.then,`${path}.then`,errors,depth+1);validateNumberExpression(value.else,`${path}.else`,errors,depth+1);
};
export const validateConditionAst=(value:unknown)=>{const errors:string[]=[];validateConditionExpression(value,'condition',errors);return errors;};
const validateChanges=(value:unknown,path:string,errors:string[])=>{
  if(!isObject(value)){errors.push(`${path} 必须是对象`);return;}
  for(const [key,item] of Object.entries(value)){
    if(!STAT_KEYS.has(key as keyof StatChange))errors.push(`${path}.${key} 不是允许的效果字段`);
    if(typeof item==='number'&&!Number.isFinite(item))errors.push(`${path}.${key} 必须是有限数字`);
  }
};
const validateOutcome=(value:unknown,path:string,errors:string[])=>{
  if(!isObject(value)){errors.push(`${path} 必须是对象`);return;}
  if(value.id!==undefined&&(typeof value.id!=='string'||!ID_PATTERN.test(value.id)))errors.push(`${path}.id 格式无效`);
  if(typeof value.label!=='string'||!value.label.trim())errors.push(`${path}.label 必填`);
  if(value.probability===undefined&&value.weight===undefined)errors.push(`${path} 需要 probability 或 weight`);
  if(value.probability!==undefined&&(typeof value.probability!=='number'||value.probability<0))errors.push(`${path}.probability 必须为非负数字`);
  validateChanges(value.changes,path+'.changes',errors);
  if(value.delayed!==undefined){
    if(!isObject(value.delayed))errors.push(`${path}.delayed 必须是对象`);
    else {
      const min=value.delayed.minSeasons,max=value.delayed.maxSeasons;
      if(!Number.isInteger(min)||!Number.isInteger(max)||Number(min)<1||Number(max)>6||Number(min)>Number(max))errors.push(`${path}.delayed 延迟必须在 1-6 赛季且 min <= max`);
      validateChanges(value.delayed.changes,path+'.delayed.changes',errors);
    }
  }
  if(value.weight!==undefined){validateNumberExpression(value.weight,`${path}.weight`,errors);const stats=astStats(value.weight);if(stats.depth>MAX_AST_DEPTH||stats.nodes>MAX_AST_NODES)errors.push(`${path}.weight 公式复杂度超限`);}
};
export const validateEventDefinition=(value:unknown):EventValidationResult=>{
  const errors:string[]=[];
  if(!isObject(value))return {valid:false,errors:['事件必须是对象']};
  if(typeof value.catalogId!=='string'||!ID_PATTERN.test(value.catalogId))errors.push('catalogId 格式无效');
  if(value.schemaVersion!==undefined&&value.schemaVersion!=='1.0')errors.push('不支持的 schemaVersion');
  if(!KINDS.has(String(value.kind)))errors.push('kind 无效');
  if(value.timing!==undefined&&!TIMINGS.has(String(value.timing)))errors.push('timing 无效');
  for(const key of ['category','title','briefing'])if(typeof value[key]!=='string'||!String(value[key]).trim())errors.push(`${key} 必填`);
  if(!Array.isArray(value.options)||value.options.length<2||value.options.length>6)errors.push('options 数量必须为 2-6');
  else {
    const optionIds=new Set<string>();
    value.options.forEach((option,index)=>{
      const path=`options[${index}]`;
      if(!isObject(option)){errors.push(`${path} 必须是对象`);return;}
      if(typeof option.id!=='string'||!ID_PATTERN.test(option.id))errors.push(`${path}.id 格式无效`);
      else if(optionIds.has(option.id))errors.push(`${path}.id 重复`);else optionIds.add(option.id);
      if(typeof option.label!=='string'||!option.label.trim())errors.push(`${path}.label 必填`);
      validateChanges(option.changes,path+'.changes',errors);
      if(option.outcomes!==undefined){
        if(!Array.isArray(option.outcomes)||!option.outcomes.length)errors.push(`${path}.outcomes 必须是非空数组`);
        else {option.outcomes.forEach((outcome,outcomeIndex)=>validateOutcome(outcome,`${path}.outcomes[${outcomeIndex}]`,errors));const staticProbabilities=option.outcomes.map(item=>isObject(item)?item.probability:undefined);if(staticProbabilities.every(item=>typeof item==='number')&&staticProbabilities.reduce((sum,item)=>sum+Number(item),0)!==100)errors.push(`${path}.outcomes 静态概率总和必须为 100`);}
      }
    });
  }
  if(value.eligibility!==undefined)validateConditionExpression(value.eligibility,'eligibility',errors);
  if(value.triggerWeight!==undefined)validateNumberExpression(value.triggerWeight,'triggerWeight',errors);
  for(const formula of [value.eligibility,value.triggerWeight].filter(Boolean)){const stats=astStats(formula);if(stats.depth>MAX_AST_DEPTH||stats.nodes>MAX_AST_NODES)errors.push('事件公式复杂度超限');}
  return {valid:errors.length===0,errors};
};
export const parseEventPack=(value:unknown):{events:CareerEventDefinition[];errors:string[]}=>{
  if(!Array.isArray(value))return {events:[],errors:['事件包根节点必须是数组']};
  const events:CareerEventDefinition[]=[],errors:string[]=[],ids=new Set<string>();
  value.forEach((item,index)=>{const result=validateEventDefinition(item);if(!result.valid){errors.push(...result.errors.map(error=>`[${index}] ${error}`));return;}const event=item as unknown as CareerEventDefinition;if(ids.has(event.catalogId)){errors.push(`[${index}] catalogId 重复: ${event.catalogId}`);return;}ids.add(event.catalogId);events.push(event);});
  return {events,errors};
};

const fallbackOutcomeDefinitions=(option:DecisionOption,instanceId:string):ProbabilityOutcomeDefinition[]=>{
  const expected=52+[...`${instanceId}:${option.id}`].reduce((value,char)=>(value*31+char.charCodeAt(0))>>>0,7)%31;
  return [
    {id:`${option.id}-expected`,label:option.result??'决定按预期执行，但付出了相应代价',probability:expected,changes:{}},
    {id:`${option.id}-variance`,label:'执行过程出现偏差，收益与代价发生变化',probability:100-expected,changes:{ability:(option.changes.ability??0)>0?-2:1,connections:(option.changes.connections??0)>0?-2:1,health:(option.changes.health??0)>0?-2:0}},
  ];
};
const normalizeOutcomes=(definitions:ProbabilityOutcomeDefinition[],context:CareerEventContext,instanceId:string,optionId:string):ProbabilityOutcome[]=>{
  const weights=definitions.map(outcome=>weightOf(outcome.weight,context,outcome.probability??0));
  const total=weights.reduce((sum,weight)=>sum+weight,0);
  if(total<=0)throw new Error(`${instanceId}/${optionId} 的结果权重总和必须大于 0`);
  const exact=weights.map(weight=>weight/total*100);
  const probabilities=exact.map(value=>Math.floor(value));
  let remainder=100-probabilities.reduce((sum,value)=>sum+value,0);
  exact.map((value,index)=>({index,fraction:value-probabilities[index]})).sort((a,b)=>b.fraction-a.fraction||a.index-b.index).slice(0,remainder).forEach(item=>{probabilities[item.index]+=1;remainder-=1;});
  return definitions.map((outcome,index)=>({id:outcome.id??`${instanceId}-${optionId}-${index}`,label:outcome.label,probability:probabilities[index],changes:{...outcome.changes},resultPatch:outcome.resultPatch?{...outcome.resultPatch}:undefined,delayed:outcome.delayed?{...outcome.delayed,changes:{...outcome.delayed.changes}}:undefined}));
};
export const instantiateEvent=(definition:CareerEventDefinition,instanceId:string,context:CareerEventContext):Decision=>{
  const options:DecisionOption[]=definition.options.map(option=>{
    const base={...option,changes:{...option.changes}} as DecisionOption;
    const outcomes=normalizeOutcomes(option.outcomes?.length?option.outcomes:fallbackOutcomeDefinitions(base,instanceId),context,instanceId,option.id);
    const detail=option.detail??outcomes.map(outcome=>`${outcome.probability}% ${outcome.delayed?'存在长期风险':outcome.label}`).join(' / ');
    return {...base,detail,outcomes};
  });
  return {id:instanceId,catalogId:definition.catalogId,revision:definition.revision??1,title:definition.title,briefing:definition.briefing,kind:definition.kind,timing:definition.timing,category:definition.category,options};
};
export const isEventEligible=(definition:CareerEventDefinition,context:CareerEventContext):boolean=>{
  if(definition.minAge!==undefined&&context.career.age<definition.minAge)return false;
  if(definition.maxAge!==undefined&&context.career.age>definition.maxAge)return false;
  if(definition.roles&&!definition.roles.includes(context.player.role))return false;
  if(definition.requiresHiddenFlag&&!context.hiddenFlags[definition.requiresHiddenFlag])return false;
  if(definition.worldline){
    const progress=context.worldlines?.[definition.worldline.worldlineId];
    if(!progress)return false;
    if(definition.worldline.stages&&!definition.worldline.stages.includes(progress.stageId))return false;
    if(definition.worldline.statuses&&!definition.worldline.statuses.includes(progress.status))return false;
  }
  if(definition.category==='CN生态'&&context.team.region!=='Asia')return false;
  const history=context.eventHistory?.[definition.catalogId];
  if(definition.maxOccurrences!==undefined&&(history?.count??0)>=definition.maxOccurrences)return false;
  if(definition.cooldownSeasons&&history&&context.career.season-history.lastSeason<definition.cooldownSeasons)return false;
  return !definition.eligibility||evaluateCondition(definition.eligibility,context);
};
export const queryEvents=(definitions:readonly CareerEventDefinition[],context:CareerEventContext,query:EventQuery)=>definitions.filter(definition=>{
  if(definition.kind!==query.kind)return false;
  if(query.timing&&definition.timing&&definition.timing!==query.timing)return false;
  if(query.excludeTimings?.includes(definition.timing as EventTiming))return false;
  if(query.categories&&!query.categories.includes(definition.category))return false;
  if(query.excludeCategories?.includes(definition.category))return false;
  if(query.excludeCatalogIds?.includes(definition.catalogId))return false;
  if(query.excludeTitles?.includes(definition.title))return false;
  return isEventEligible(definition,context);
}).sort((a,b)=>a.catalogId<b.catalogId?-1:a.catalogId>b.catalogId?1:0);
export const pickEvent=(definitions:readonly CareerEventDefinition[],context:CareerEventContext,query:EventQuery,roll:number):CareerEventDefinition|undefined=>{
  const candidates=queryEvents(definitions,context,query);
  const weights=candidates.map(definition=>weightOf(definition.triggerWeight,context,100));
  const total=weights.reduce((sum,weight)=>sum+weight,0);if(total<=0)return undefined;
  let point=Math.max(0,Math.min(.999999999999,roll))*total;
  return candidates.find((_,index)=>{point-=weights[index];return point<0;})??candidates.at(-1);
};
