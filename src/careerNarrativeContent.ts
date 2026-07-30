import type { CareerEventDefinition, WorldlineDefinition } from './careerEventTypes';
import { ALL_CAREER_EVENTS } from './careerEventCatalog';
import { CAREER_WORLDLINES } from './careerWorldlines';

const duplicateIds=(ids:string[])=>ids.filter((id,index)=>ids.indexOf(id)!==index);
const eventDuplicates=duplicateIds(ALL_CAREER_EVENTS.map(event=>event.catalogId));
const worldlineDuplicates=duplicateIds(CAREER_WORLDLINES.map(worldline=>worldline.worldlineId));
const worldlineById=new Map(CAREER_WORLDLINES.map(worldline=>[worldline.worldlineId,worldline]));
const referenceErrors:string[]=[];
for(const event of ALL_CAREER_EVENTS){
  const references=[...(event.worldline?[event.worldline]:[]),...event.options.flatMap(option=>(option.worldlineTransitions??[]).map(transition=>({worldlineId:transition.worldlineId,stages:transition.toStage?[transition.toStage]:undefined})) )];
  for(const reference of references){
    const worldline=worldlineById.get(reference.worldlineId);
    if(!worldline){referenceErrors.push(`${event.catalogId}: 未知世界线 ${reference.worldlineId}`);continue;}
    for(const stage of reference.stages??[])if(!worldline.stages.some(item=>item.id===stage))referenceErrors.push(`${event.catalogId}: ${reference.worldlineId} 不存在阶段 ${stage}`);
  }
}
export const NARRATIVE_CONTENT_ERRORS=[...eventDuplicates.map(id=>`重复事件 ID: ${id}`),...worldlineDuplicates.map(id=>`重复世界线 ID: ${id}`),...referenceErrors];
if(NARRATIVE_CONTENT_ERRORS.length)throw new Error(`叙事 JSON 交叉校验失败：\n${NARRATIVE_CONTENT_ERRORS.join('\n')}`);

export interface CareerNarrativeContent { events:readonly CareerEventDefinition[]; worldlines:readonly WorldlineDefinition[]; }
export const CAREER_NARRATIVE_CONTENT:CareerNarrativeContent={events:ALL_CAREER_EVENTS,worldlines:CAREER_WORLDLINES};
