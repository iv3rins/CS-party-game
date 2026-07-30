/**
 * 队友变阵系统
 * 基于战队表现、负面爆冷和赛季结果触发换人。
 * 该模块只提供纯函数；所有随机结果都由生涯种子和赛季确定。
 */

import type { CareerState, Decision } from './careerEngine';
import type { PlayerRole } from './careerData';
import { getDecisionTemplate } from './careerDecisionTemplates';

const makeRng = (seed: number) => () => { let value = seed += 0x6D2B79F5; value = Math.imul(value ^ value >>> 15, value | 1); value ^= value + Math.imul(value ^ value >>> 7, value | 61); return ((value ^ value >>> 14) >>> 0) / 4294967296; };
const hash = (text: string) => [...text].reduce((value, char) => Math.imul(value ^ char.charCodeAt(0), 16777619), 2166136261) >>> 0;
const rosterRng = (state: Pick<CareerState, 'seed' | 'season'>, key: string) => makeRng(hash(`${state.seed}:${state.season}:${key}`));

export interface RosterChangePlan {
  kind: 'adjustment' | 'rebuild';
  leaving: Array<{ nick: string; role: PlayerRole }>;
}

export function shouldTriggerRosterChange(state: CareerState): boolean {
  if (state.employmentStatus !== 'signed' || state.roster.length !== 5 || !state.history.at(-1)) return false;
  if (state.negativeUpsetStreak >= 3) return true;
  const signals = [
    state.negativeUpsetStreak >= 2,
    state.teamForm < 50,
    state.rosterStability < 40,
    state.history.at(-1)!.rankingDelta <= -15,
  ].filter(Boolean).length;
  return signals >= 2;
}

export function rosterChangePlan(state: CareerState): RosterChangePlan {
  const teammates = state.roster.filter(player => !player.isPlayer);
  const rebuild = state.negativeUpsetStreak >= 3 || (state.teamForm < 45 && state.rosterStability < 35);
  const leavingCount = rebuild ? 2 + Math.floor(rosterRng(state, 'roster-change-plan')() * 2) : 1;
  return { kind: rebuild ? 'rebuild' : 'adjustment', leaving: teammates.slice(0, leavingCount) };
}

export function createRosterChangeEvent(state: CareerState): Decision {
  const plan = rosterChangePlan(state);
  const template=getDecisionTemplate(plan.kind==='rebuild'?'roster-rebuild':'roster-adjustment',{leavers:plan.leaving.map(player=>player.nick).join('、'),leaver:plan.leaving[0]?.nick??''});
  const effects=plan.kind==='rebuild'?{ 'stay-rebuild':{rosterStability:-20,teamForm:15,connections:8},'leave-rebuild':{employmentStatus:'free-agent' as const,noOfferWindows:0}}:{'support-change':{rosterStability:-12,teamForm:8,connections:4},'oppose-change':{teamForm:3,connections:-6,rosterStability:-5}};
  return {id:`roster-${plan.kind}-${state.season}`,kind:template.kind,timing:template.timing,category:template.category,rosterChange:plan,title:template.title,briefing:template.briefing,options:template.options.map(option=>{const changes=effects[option.id as keyof typeof effects];if(!changes)throw new Error(`阵容模板缺少选项逻辑 ${option.id}`);return {id:option.id,label:option.label,detail:option.detail,result:option.result,changes};})};
}

export function applyRosterChange(state: CareerState, decision: Decision, optionId: string): CareerState {
  if (!decision.id.startsWith('roster-') || !decision.options.some(option => option.id === optionId)) return state;
  if (optionId === 'leave-rebuild') {
    return {
      ...state,
      teamId: '', team: '自由人', roster: [], salary: 0,
      employmentStatus: 'free-agent', contractHalfSeasonsRemaining: 0, noOfferWindows: 0,
      vrsActive: false, rankingPoints: 0, rebuildPoints: 0, globalRank: 101, tier: '未入榜', coreMemberIds: [],
    };
  }

  const plan = decision.rosterChange;
  if(!plan)return state;
  const rng = rosterRng(state, 'roster-change-replacements');
  const leavingNames = new Set(plan.leaving.map(player => player.nick));
  const usedNicks = new Set(state.roster.map(player => player.nick));
  const replacements = plan.leaving.map((player, index) => {
    let nick = '';
    do nick = `Rookie-${state.season}-${index + 1}-${Math.floor(rng() * 1000)}`; while (usedNicks.has(nick));
    usedNicks.add(nick);
    return { id:`generated-${state.seed}-${state.season}-${index}`,nick,role:player.role,ability:Math.max(55,Math.min(96,Math.round(68+(101-Math.min(100,state.globalRank))*.18+(rng()-.5)*14))),fame:Math.round(20+rng()*35),seasonPerformances:[],top20History:[] };
  });
  const roster = [...state.roster.filter(player => !leavingNames.has(player.nick)), ...replacements];
  const losesCore = plan.leaving.length >= 3;
  return {
    ...state,
    roster,
    coreMemberIds: losesCore ? [] : state.coreMemberIds.slice(0, 3),
    ...(losesCore ? { vrsActive: false, rankingPoints: 0, rebuildPoints: 0, globalRank: 101, tier: '三线赛场' } : {}),
    log: [`阵容更新：${plan.leaving.map(player => player.nick).join('、')} 离队，${replacements.map(player => player.nick).join('、')} 加入${losesCore ? '；三人核心不足，模拟 VRS 积分清零' : ''}`, ...state.log],
  };
}
