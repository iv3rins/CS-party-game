/**
 * 历年 HLTV TOP20 真实选手数据
 * 用于生成 NPC 竞争基准
 */

import top20_2023 from './data/hltv_top20_2023.json';
import top20_2024 from './data/hltv_top20_2024.json';
import top20_2025 from './data/hltv_top20_2025.json';

export interface HistoricalTop20Player {
  placement: number;
  nickname: string;
  name: string;
  country: string;
}

export const HISTORICAL_TOP20: Record<number, HistoricalTop20Player[]> = {
  2023: top20_2023,
  2024: top20_2024,
  2025: top20_2025,
};

/**
 * 根据游戏年份获取对应的真实 TOP20 选手
 * 游戏从 2025 年开始，每个 careerYear 对应真实年份
 */
export function getTop20ForYear(careerYear: number): HistoricalTop20Player[] {
  const realYear = 2025 + careerYear - 1;
  
  // 如果超出已有数据范围，使用最新年份数据
  if (realYear < 2023) return HISTORICAL_TOP20[2023];
  if (realYear > 2025) return HISTORICAL_TOP20[2025];
  
  return HISTORICAL_TOP20[realYear] || HISTORICAL_TOP20[2025];
}

/**
 * 检查某个昵称是否是真实的历史TOP20选手
 */
export function isHistoricalTop20(nickname: string): boolean {
  return Object.values(HISTORICAL_TOP20).some(year =>
    year.some(player => player.nickname === nickname)
  );
}

/**
 * 为真实选手生成基于历史排名的基准 APS 分数
 */
export function getHistoricalPlayerBaseline(nickname: string, careerYear: number): number | undefined {
  const yearData = getTop20ForYear(careerYear);
  const player = yearData.find(p => p.nickname === nickname);
  
  if (!player) return undefined;
  
  // 根据排名生成基准分数
  // TOP1-3: 600-750, TOP4-10: 400-600, TOP11-20: 250-400
  const rank = player.placement;
  if (rank <= 3) return 750 - (rank - 1) * 75;
  if (rank <= 10) return 600 - (rank - 4) * 30;
  return 400 - (rank - 11) * 15;
}
