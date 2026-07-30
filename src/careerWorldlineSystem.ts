import type { CareerEventContext, WorldlineDefinition, WorldlineProgress, WorldlineTransition } from './careerEventTypes';
import { evaluateCondition, validateConditionAst } from './careerEventSystem';

export interface WorldlineValidationResult { valid: boolean; errors: string[]; }
const ID=/^[a-z0-9][a-z0-9-]*$/;
const isObject=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value);

export const validateWorldlineDefinition=(value:unknown):WorldlineValidationResult=>{
  const errors:string[]=[];
  if(!isObject(value))return {valid:false,errors:['世界线必须是对象']};
  if(value.schemaVersion!=='1.0')errors.push('schemaVersion 必须为 1.0');
  if(typeof value.worldlineId!=='string'||!ID.test(value.worldlineId))errors.push('worldlineId 格式无效');
  if(!Number.isInteger(value.revision)||Number(value.revision)<1)errors.push('revision 必须为正整数');
  for(const key of ['title','description','initialStage'])if(typeof value[key]!=='string'||!String(value[key]).trim())errors.push(`${key} 必填`);
  if(!isObject(value.source)||!['built-in','human-authored','ai-generated'].includes(String(value.source.type)))errors.push('source.type 无效');
  if(!isObject(value.entry))errors.push('entry 条件必填');else errors.push(...validateConditionAst(value.entry).map(error=>`entry.${error}`));
  if(!Array.isArray(value.stages)||value.stages.length<2)errors.push('stages 至少需要两个阶段');
  else {
    const ids=new Set<string>();
    value.stages.forEach((stage,index)=>{
      if(!isObject(stage)||typeof stage.id!=='string'||!ID.test(stage.id)){errors.push(`stages[${index}].id 格式无效`);return;}
      if(ids.has(stage.id))errors.push(`stages[${index}].id 重复`);ids.add(stage.id);
      if(typeof stage.title!=='string'||typeof stage.description!=='string')errors.push(`stages[${index}] 文本不完整`);
    });
    if(typeof value.initialStage==='string'&&!ids.has(value.initialStage))errors.push('initialStage 不存在于 stages');
  }
  return {valid:errors.length===0,errors};
};

export const parseWorldlinePack=(value:unknown):{worldlines:WorldlineDefinition[];errors:string[]}=>{
  if(!Array.isArray(value))return {worldlines:[],errors:['世界线包根节点必须是数组']};
  const worldlines:WorldlineDefinition[]=[],errors:string[]=[],ids=new Set<string>();
  value.forEach((item,index)=>{const validation=validateWorldlineDefinition(item);if(!validation.valid){errors.push(...validation.errors.map(error=>`[${index}] ${error}`));return;}const definition=item as unknown as WorldlineDefinition;if(ids.has(definition.worldlineId)){errors.push(`[${index}] worldlineId 重复`);return;}ids.add(definition.worldlineId);worldlines.push(definition);});
  return {worldlines:worldlines.sort((a,b)=>a.worldlineId<b.worldlineId?-1:a.worldlineId>b.worldlineId?1:0),errors};
};

export const eligibleWorldlines=(definitions:readonly WorldlineDefinition[],context:CareerEventContext)=>definitions.filter(definition=>!context.worldlines?.[definition.worldlineId]&&evaluateCondition(definition.entry,context));

export const applyWorldlineTransition=(definitions:readonly WorldlineDefinition[],progress:Readonly<Record<string,WorldlineProgress>>,transition:WorldlineTransition,season:number):Record<string,WorldlineProgress>=>{
  const definition=definitions.find(item=>item.worldlineId===transition.worldlineId);
  if(!definition)return {...progress};
  const current=progress[transition.worldlineId];
  const requiresCurrent=!['start'].includes(transition.action);
  if(requiresCurrent&&!current)return {...progress};
  if(current&&['completed','abandoned'].includes(current.status)&&transition.action!=='start')return {...progress};
  if(transition.action==='resume'&&current?.status!=='paused')return {...progress};
  if(transition.action==='start'&&current)return {...progress};
  const stageId=transition.toStage??current?.stageId??definition.initialStage;
  if(!definition.stages.some(stage=>stage.id===stageId))return {...progress};
  const status=transition.action==='complete'?'completed':transition.action==='abandon'?'abandoned':transition.action==='pause'?'paused':'active';
  return {...progress,[transition.worldlineId]:{worldlineId:transition.worldlineId,status,stageId,branchId:transition.branchId??current?.branchId,startedSeason:current?.startedSeason??season,updatedSeason:season,history:[transition.note??`${transition.action}:${stageId}`,...(current?.history??[])]}};
};
