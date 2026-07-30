import type { WorldlineDefinition } from './careerEventTypes';
import { parseWorldlinePack } from './careerWorldlineSystem';

const modules=import.meta.glob('./data/career-worldlines/*.json',{eager:true,import:'default'}) as Record<string,unknown>;
const loaded=Object.entries(modules).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([path,module])=>({path,result:parseWorldlinePack(module)}));
export const CAREER_WORLDLINE_ERRORS=loaded.flatMap(({path,result})=>result.errors.map(error=>`${path}: ${error}`));
if(CAREER_WORLDLINE_ERRORS.length)throw new Error(`职业世界线 JSON 校验失败：\n${CAREER_WORLDLINE_ERRORS.join('\n')}`);
export const CAREER_WORLDLINES:readonly WorldlineDefinition[]=loaded.flatMap(({result})=>result.worldlines).sort((a,b)=>a.worldlineId<b.worldlineId?-1:a.worldlineId>b.worldlineId?1:0);
