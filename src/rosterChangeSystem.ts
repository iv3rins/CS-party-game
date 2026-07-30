/**
 * 队友变阵系统
 * 基于战队表现、负面爆冷和赛季结果触发换人
 */

import type { CareerState, Decision } from './careerEngine';
import { seeded } from './careerEngine';

/**
 * 检查是否触发队友变阵
 * 触发条件：
 * 1. 连续负面爆冷 >= 2
 * 2. 战队状态 < 50
 * 3. 阵容稳定度 < 40
 * 4. 赛季末排名大幅下滑（>= 15名）
 */
export function shouldTriggerRosterChange(state: CareerState): boolean {
  if (state.employmentStatus !== 'signed' || state.roster.length < 5) return false;
  
  const recentReport = state.history.at(-1);
  if (!recentReport) return false;
  
  // 检查触发条件
  const hasNegativeStreak = state.negativeUpsetStreak >= 2;
  const lowTeamForm = state.teamForm < 50;
  const lowStability = state.rosterStability < 40;
  const majorRankDrop = recentReport.rankingDelta <= -15;
  
  const triggerCount = [hasNegativeStreak, lowTeamForm, lowStability, majorRankDrop].filter(Boolean).length;
  
  // 至少满足2个条件才触发
  return triggerCount >= 2;
}

/**
 * 生成队友变阵事件
 */
export function createRosterChangeEvent(state: CareerState): Decision {
  const isPlayer = state.roster.find(p => p.isPlayer);
  const teammates = state.roster.filter(p => !p.isPlayer);
  
  // 根据情况选择变阵类型
  const isMajorRebuild = state.teamForm < 45 && state.rosterStability < 35;
  const rng = seeded(state, `roster-change-${state.season}`);
  
  if (isMajorRebuild) {
    // 大规模重建：2-3人离队
    const leavingCount = Math.floor(rng() * 2) + 2; // 2或3人
    const leaving = teammates.slice(0, leavingCount);
    
    return {
      id: `roster-rebuild-${state.season}`,
      kind: 'offseason',
      category: '队内体系',
      title: '战队重建计划',
      briefing: `管理层决定启动大规模重建。${leaving.map(p => p.nick).join('、')} 将离队，新阵容即将公布。你是否愿意留队参与重建？`,
      options: [
        {
          id: 'stay-rebuild',
          label: '留队参与重建',
          detail: '阵容稳定 -20 / 战队状态 +15 / 关系 +8',
          changes: {
            rosterStability: -20,
            teamForm: 15,
            connections: 8,
          },
        },
        {
          id: 'leave-rebuild',
          label: '寻找转会机会',
          detail: '进入自由市场 / 可能获得更好报价',
          changes: {
            employmentStatus: 'free-agent',
            noOfferWindows: 0,
          },
        },
      ],
    };
  } else {
    // 小规模调整：1人离队
    const leaving = teammates[0];
    
    return {
      id: `roster-adjustment-${state.season}`,
      kind: 'offseason',
      category: '队内体系',
      title: '阵容微调',
      briefing: `管理层决定让 ${leaving.nick} 离队，引入新选手。这次调整可能改善战队氛围。`,
      options: [
        {
          id: 'support-change',
          label: '支持管理层决定',
          detail: '阵容稳定 -12 / 战队状态 +8 / 关系 +4',
          changes: {
            rosterStability: -12,
            teamForm: 8,
            connections: 4,
          },
        },
        {
          id: 'oppose-change',
          label: '反对这次换人',
          detail: '战队状态 +3 / 关系 -6 / 可能引发内部矛盾',
          changes: {
            teamForm: 3,
            connections: -6,
            rosterStability: -5,
          },
        },
      ],
    };
  }
}

/**
 * 应用变阵结果到状态
 * 更新 roster 数组，替换离队的队友
 */
export function applyRosterChange(state: CareerState, optionId: string): CareerState {
  if (optionId === 'leave-rebuild') {
    // 玩家选择离队，进入自由市场
    return {
      ...state,
      employmentStatus: 'free-agent',
      contractHalfSeasonsRemaining: 0,
      noOfferWindows: 0,
    };
  }
  
  // 生成新队友
  const rng = seeded(state, `new-roster-${state.season}`);
  const playerRole = state.role;
  const existingRoles = state.roster.filter(p => !p.isPlayer).map(p => p.role);
  
  // 确定需要替换的位置
  const isMajorRebuild = optionId === 'stay-rebuild';
  const replaceCount = isMajorRebuild ? Math.floor(rng() * 2) + 2 : 1;
  
  // 生成新队友
  const newTeammates: Array<{ nick: string; role: typeof existingRoles[number]; isPlayer?: boolean }> = [];
  const usedNicks = new Set(state.roster.map(p => p.nick));
  
  for (let i = 0; i < replaceCount; i++) {
    const roleIndex = Math.floor(rng() * existingRoles.length);
    const role = existingRoles[roleIndex];
    
    // 生成唯一昵称
    let nick: string;
    let attempts = 0;
    do {
      nick = `Player${state.season}_${Math.floor(rng() * 1000)}`;
      attempts++;
    } while (usedNicks.has(nick) && attempts < 100);
    
    usedNicks.add(nick);
    newTeammates.push({ nick, role });
  }
  
  // 更新阵容：保留玩家，替换队友
  const newRoster = [
    state.roster.find(p => p.isPlayer)!,
    ...state.roster.filter(p => !p.isPlayer).slice(replaceCount),
    ...newTeammates,
  ].slice(0, 5);
  
  return {
    ...state,
    roster: newRoster,
  };
}
