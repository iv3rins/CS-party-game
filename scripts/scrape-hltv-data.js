/**
 * HLTV 数据爬取脚本
 * 使用 HLTV API 获取 TOP30 队伍数据和历年 TOP20 选手数据
 * 
 * 使用方法：
 * npm install hltv axios
 * node scripts/scrape-hltv-data.js
 */

const fs = require('fs');
const path = require('path');

// 注意：实际使用时需要安装 hltv 包
// const HLTV = require('hltv').default;

async function scrapeTop30Teams() {
  console.log('开始爬取 TOP30 队伍数据...');
  
  // TODO: 使用 HLTV API 获取数据
  // const teams = await HLTV.getTeamRanking();
  
  // 临时模拟数据结构
  const mockTeams = [
    {
      name: 'FaZe',
      rank: 1,
      points: 1000,
      roster: [
        { nick: 'karrigan', role: 'igl', rating: 1.05 },
        { nick: 'ropz', role: 'rifler', rating: 1.20 },
        { nick: 'frozen', role: 'awper', rating: 1.18 },
        { nick: 'rain', role: 'entry', rating: 1.10 },
        { nick: 'broky', role: 'support', rating: 1.08 }
      ]
    }
  ];
  
  const outputPath = path.join(__dirname, '../src/data/hltv-teams.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(mockTeams, null, 2));
  
  console.log(`✓ 队伍数据已保存到 ${outputPath}`);
  return mockTeams;
}

async function scrapeTop20Players(years = [2023, 2024, 2025]) {
  console.log('开始爬取历年 TOP20 选手数据...');
  
  const allPlayers = {};
  
  for (const year of years) {
    console.log(`  爬取 ${year} 年 TOP20...`);
    
    // TODO: 使用 HLTV API 获取数据
    // const players = await HLTV.getPlayerRanking({ startDate, endDate });
    
    // 临时模拟数据结构
    allPlayers[year] = [
      { rank: 1, nick: 'ZywOo', team: 'Vitality', rating: 1.35, maps: 120, mvps: 8, evps: 12 },
      { rank: 2, nick: 'm0NESY', team: 'G2', rating: 1.30, maps: 115, mvps: 6, evps: 10 },
      // ... 其他 18 名选手
    ];
  }
  
  const outputPath = path.join(__dirname, '../src/data/hltv-top20-history.json');
  fs.writeFileSync(outputPath, JSON.stringify(allPlayers, null, 2));
  
  console.log(`✓ TOP20 历史数据已保存到 ${outputPath}`);
  return allPlayers;
}

async function main() {
  try {
    await scrapeTop30Teams();
    await scrapeTop20Players();
    console.log('\n✓ 所有数据爬取完成');
  } catch (error) {
    console.error('爬取失败:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { scrapeTop30Teams, scrapeTop20Players };
