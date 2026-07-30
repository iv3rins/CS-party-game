import templatesJson from './data/career-decision-templates/system-decisions.json';
import type { Decision } from './careerEventTypes';

export interface DecisionTemplate {templateId:string;kind:Decision['kind'];timing?:Decision['timing'];category:string;title:string;briefing:string;options:Array<{id:string;label:string;detail:string;result?:string;outcomes?:Array<{id:string;label:string}>}>;dynamicOptions?:Record<string,{label:string;detail:string;result?:string}>;}
const templates=templatesJson as DecisionTemplate[];
const ids=templates.map(template=>template.templateId);
if(new Set(ids).size!==ids.length||templates.some(template=>!template.title||!template.briefing||template.options.length<1))throw new Error('system-decisions.json 无效');
const render=(text:string,values:Record<string,string|number>)=>text.replace(/{{([A-Za-z][A-Za-z0-9]*)}}/g,(_,key)=>String(values[key]??''));
export const getDecisionTemplate=(templateId:string,values:Record<string,string|number>={})=>{
  const template=templates.find(item=>item.templateId===templateId);
  if(!template)throw new Error(`缺少决策 JSON 模板: ${templateId}`);
  return {...template,title:render(template.title,values),briefing:render(template.briefing,values),options:template.options.map(option=>({...option,label:render(option.label,values),detail:render(option.detail,values),result:option.result?render(option.result,values):undefined,outcomes:option.outcomes?.map(outcome=>({...outcome,label:render(outcome.label,values)}))})),dynamicOptions:Object.fromEntries(Object.entries(template.dynamicOptions??{}).map(([key,option])=>[key,{label:render(option.label,values),detail:render(option.detail,values),result:option.result?render(option.result,values):undefined}]))};
};
