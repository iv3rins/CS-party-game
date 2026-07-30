# DeepSeek CS Career 内容扩展总控规划

> 生成时间: 2026-07-30
> 规划版本: v1
> 目标: 1000条事件 + 30条世界线 + 200条退役评语 + 60条TOP20采访 + 30个称号

---

## 一、现状盘点

### 1.1 事件现状

| 指标 | 现有数量 |
|------|---------|
| 总事件数 | 366 |
| 独立 catalogId | 366 |
| 15个分类覆盖 | 全部覆盖，但严重不均衡 |
| 角色标签 | 0（全部未标记roles） |
| 年龄区间 | 0（全部未标记minAge/maxAge） |
| 世界线事件 | 1（rising-star-first-interview） |
| 世界线转换事件 | 1 |
| 延迟后果(outcomes含delayed) | 341 |
| 标签种类 | 3种（极其贫乏） |

### 1.2 现有事件分类分布

| 分类 | 现有 | 目标 | 需新增 |
|------|------|------|--------|
| 赛事内关键局 | 21 | 120 | 99 |
| 赛事内非关键突发 | 21 | 70 | 49 |
| 训练状态 | 23 | 75 | 52 |
| 伤病健康 | 23 | 70 | 47 |
| 队内体系 | 23 | 95 | 72 |
| 教练管理 | 21 | 60 | 39 |
| 合同转会 | 55 | 100 | 45 |
| 角色转职 | 22 | 55 | 33 |
| 舆论媒体 | 22 | 70 | 48 |
| 商业赞助 | 23 | 45 | 22 |
| 合规风险 | 26 | 55 | 29 |
| 家庭生活 | 21 | 45 | 24 |
| CN生态 | 21 | 55 | 34 |
| 救赎线 | 21 | 55 | 34 |
| 退役转型 | 23 | 30 | 7 |
| **合计** | **366** | **1000** | **634** |

注：实际需新增634条，但总控要求1000条全新事件。保留现有366条，新增1000条 → 最终总计1366条。

### 1.3 世界线现状

| 指标 | 现有 |
|------|------|
| 世界线数 | 1 (rising-star) |
| 阶段数 | 3 |
| 结局数 | 3 |
| 事件关联 | 1个事件通过eventTags关联 |

### 1.4 配置现状

| 类型 | 现有 | 目标 | 需新增 |
|------|------|------|--------|
| 退役评语 | 103 | 303 | 200 |
| TOP20采访 | 3 | 63 | 60 |
| 职业称号 | 7 | 37 | 30 |

---

## 二、30条世界线规划

所有worldlineId使用 `ds-` 前缀。

### 世界线总表

| # | worldlineId | 标题 | 阶段数 | 结局数 | 对应叙事基调 |
|---|-------------|------|--------|--------|-------------|
| 1 | ds-demon-king | 魔王降世 | 6 | 4 | 天才出道，魔王降世 |
| 2 | ds-one-step-away | 一步之遥 | 7 | 5 | 天才出道，与Major一步之遥 |
| 3 | ds-ten-year-major | 十年一冠 | 8 | 5 | 天才出道，奋斗十年终得Major |
| 4 | ds-mortal-road | 凡人长路 | 6 | 4 | 普通人天赋，努力收获荣誉 |
| 5 | ds-uncrowned-king | 无冕强者 | 6 | 4 | 数据极高，队友菜，无冠退役 |
| 6 | ds-star-teammate-rivalry | 明星队友与资源竞争 | 5 | 3 | 明星队友资源冲突 |
| 7 | ds-champion-five | 冠军五人组 | 5 | 4 | 冠军团队羁绊 |
| 8 | ds-roster-collapse | 阵容解体与重建 | 5 | 3 | 阵容解体危机 |
| 9 | ds-trio-drifting | 三人核心漂流 | 5 | 3 | 三人核心抱团 |
| 10 | ds-overseas-adaptation | 海外纵队适应 | 5 | 3 | 国际转会适应 |
| 11 | ds-cncs-revival | CN复兴 | 6 | 4 | CN赛区崛起 |
| 12 | ds-igl-succession | 指挥接班 | 5 | 3 | 接任指挥 |
| 13 | ds-awper-igl-overload | 指挥狙过载 | 5 | 3 | 双重角色压力 |
| 14 | ds-support-redemption | 辅助价值重估 | 4 | 3 | 辅助位证明价值 |
| 15 | ds-meta-king | 版本之子与版本淘汰 | 5 | 3 | 版本适应 |
| 16 | ds-injury-comeback | 伤病复健 | 5 | 4 | 重伤回归 |
| 17 | ds-trauma-redemption | 心魔与救赎 | 5 | 4 | 关键失误后的复仇 |
| 18 | ds-free-agent-winter | 自由人寒冬 | 4 | 3 | 无人问津 |
| 19 | ds-bench-to-star | 替补逆袭 | 5 | 3 | 替补翻身 |
| 20 | ds-veteran-comeback | 高龄复出 | 5 | 3 | 高龄回归 |
| 21 | ds-compliance-probe | 合规调查 | 5 | 3 | 合规危机 |
| 22 | ds-commercial-star | 商业明星 | 4 | 3 | 商业路线 |
| 23 | ds-public-backlash | 舆论反噬 | 4 | 3 | 舆论风暴 |
| 24 | ds-family-duty | 家庭责任 | 4 | 3 | 家庭与职业平衡 |
| 25 | ds-coach-conflict | 教练冲突 | 4 | 3 | 教练矛盾 |
| 26 | ds-old-friends-reunion | 老队友重聚 | 4 | 3 | 老友重组 |
| 27 | ds-rookie-mentor | 新秀导师 | 4 | 3 | 带新人 |
| 28 | ds-post-champion-pressure | 冠军后的王朝压力 | 5 | 3 | 卫冕压力 |
| 29 | ds-major-ghost | 关键失误后的复仇 | 5 | 4 | Major失误复仇 |
| 30 | ds-retirement-path | 退役转型 | 4 | 4 | 退役后生涯 |

### 世界线阶段详情

#### 1. ds-demon-king（魔王降世）— 6阶段/4结局
- **stages**: emergence(天才浮现), spotlight(聚光灯下), jealousy(队内嫉妒), targeting(版本针对), overload(健康透支), reign-or-fall(统治或陨落)
- **endings**: true-king(真正王者), burned-out(燃尽陨落), humble-survivor(谦逊生存), fallen-star(流星坠落)

#### 2. ds-one-step-away（一步之遥）— 7阶段/4结局
- **stages**: early-promise(早期闪耀), first-near-miss(首次擦肩), rebuilding-hope(重建希望), second-heartbreak(二次心碎), final-push(最后冲刺), fateful-decision(命运抉择), closure(终点)
- **endings**: peaceful-retirement(平静退役), late-major-miracle(迟到Major奇迹), coach-champion(转型教练夺冠), eternal-regret(永恒遗憾)

#### 3. ds-ten-year-major（十年一冠）— 8阶段/5结局
- **stages**: prodigy-emerges(天才出世), first-setback(首次挫折), roster-carousel(阵容轮转), injury-valley(伤病低谷), role-reinvention(角色重塑), free-agent-gamble(自由人豪赌), veteran-push(老兵冲刺), crowning-moment(加冕时刻)
- **endings**: major-champion(Major冠军), fell-short-again(再次失败), content-journey(满足旅程), bitter-end(苦涩结局), coach-path(教练之路)

#### 4. ds-mortal-road（凡人长路）— 6阶段/4结局
- **stages**: humble-start(卑微起步), grind-years(苦练岁月), first-breakthrough(首次突破), steady-climb(稳步攀登), ceiling-test(天花板测试), legacy-definition(定义遗产)
- **endings**: domestic-legend(国内传奇), world-class-journeyman(世界级老兵), respected-role-player(受尊敬的拼图), quiet-retirement(安静退役)

#### 5. ds-uncrowned-king（无冕强者）— 6阶段/4结局
- **stages**: rising-star(新星升起), carry-burden(负重前行), teammate-frustration(队友瓶颈), transfer-gamble(转会赌博), last-dance(最后一舞), acceptance-or-rage(接受或愤怒)
- **endings**: uncrowned-peace(无冕和平), bitter-exit(愤然离场), late-bloom-champion(迟开冠军), coach-redemption(教练救赎)

### （中间省略6-30的详细阶段描述，完整内容见世界线JSON文件）

---

## 三、40批次事件配额表

| 批次 | 文件名 | 事件数 | 分类重点 | 世界线关联 |
|------|--------|--------|---------|-----------|
| 001 | deepseek-events-001.json | 25 | 赛事内关键局(15) + 救赎线(10) | ds-one-step-away, ds-major-ghost |
| 002 | deepseek-events-002.json | 25 | 赛事内关键局(15) + 救赎线(10) | ds-demon-king, ds-ten-year-major |
| 003 | deepseek-events-003.json | 25 | 赛事内关键局(15) + 赛事内非关键突发(10) | ds-uncrowned-king, ds-champion-five |
| 004 | deepseek-events-004.json | 25 | 赛事内关键局(15) + 赛事内非关键突发(10) | ds-roster-collapse, ds-post-champion-pressure |
| 005 | deepseek-events-005.json | 25 | 赛事内关键局(15) + 队内体系(10) | ds-star-teammate-rivalry, ds-igl-succession |
| 006 | deepseek-events-006.json | 25 | 赛事内关键局(15) + 队内体系(10) | ds-awper-igl-overload, ds-support-redemption |
| 007 | deepseek-events-007.json | 25 | 赛事内关键局(15) + 训练状态(10) | ds-mortal-road, ds-meta-king |
| 008 | deepseek-events-008.json | 25 | 赛事内关键局(15) + 训练状态(10) | ds-injury-comeback, ds-veteran-comeback |
| 009 | deepseek-events-009.json | 25 | 赛事内非关键突发(15) + 伤病健康(10) | ds-demon-king, ds-injury-comeback |
| 010 | deepseek-events-010.json | 25 | 赛事内非关键突发(10) + 伤病健康(15) | ds-ten-year-major, ds-bench-to-star |
| 011 | deepseek-events-011.json | 25 | 伤病健康(15) + 训练状态(10) | ds-free-agent-winter, ds-injury-comeback |
| 012 | deepseek-events-012.json | 25 | 训练状态(15) + 教练管理(10) | ds-mortal-road, ds-coach-conflict |
| 013 | deepseek-events-013.json | 25 | 训练状态(10) + 教练管理(15) | ds-igl-succession, ds-meta-king |
| 014 | deepseek-events-014.json | 25 | 队内体系(15) + 角色转职(10) | ds-star-teammate-rivalry, ds-awper-igl-overload |
| 015 | deepseek-events-015.json | 25 | 队内体系(15) + 角色转职(10) | ds-support-redemption, ds-champion-five |
| 016 | deepseek-events-016.json | 25 | 队内体系(15) + 合同转会(10) | ds-roster-collapse, ds-trio-drifting |
| 017 | deepseek-events-017.json | 25 | 队内体系(10) + 合同转会(15) | ds-old-friends-reunion, ds-rookie-mentor |
| 018 | deepseek-events-018.json | 25 | 合同转会(15) + 舆论媒体(10) | ds-overseas-adaptation, ds-uncrowned-king |
| 019 | deepseek-events-019.json | 25 | 合同转会(15) + 商业赞助(10) | ds-free-agent-winter, ds-commercial-star |
| 020 | deepseek-events-020.json | 25 | 合同转会(15) + 合规风险(10) | ds-ten-year-major, ds-compliance-probe |
| 021 | deepseek-events-021.json | 25 | 合同转会(15) + 角色转职(10) | ds-bench-to-star, ds-veteran-comeback |
| 022 | deepseek-events-022.json | 25 | 角色转职(15) + 训练状态(10) | ds-igl-succession, ds-awper-igl-overload |
| 023 | deepseek-events-023.json | 25 | 角色转职(10) + 舆论媒体(15) | ds-public-backlash, ds-demon-king |
| 024 | deepseek-events-024.json | 25 | 舆论媒体(15) + 商业赞助(10) | ds-commercial-star, ds-one-step-away |
| 025 | deepseek-events-025.json | 25 | 舆论媒体(15) + 合规风险(10) | ds-public-backlash, ds-compliance-probe |
| 026 | deepseek-events-026.json | 25 | 舆论媒体(10) + 家庭生活(15) | ds-family-duty, ds-mortal-road |
| 027 | deepseek-events-027.json | 25 | 商业赞助(15) + 合规风险(10) | ds-commercial-star, ds-cncs-revival |
| 028 | deepseek-events-028.json | 25 | 合规风险(15) + 教练管理(10) | ds-compliance-probe, ds-coach-conflict |
| 029 | deepseek-events-029.json | 25 | 合规风险(10) + 家庭生活(15) | ds-family-duty, ds-retirement-path |
| 030 | deepseek-events-030.json | 25 | 家庭生活(15) + CN生态(10) | ds-cncs-revival, ds-old-friends-reunion |
| 031 | deepseek-events-031.json | 25 | CN生态(15) + 救赎线(10) | ds-cncs-revival, ds-ten-year-major |
| 032 | deepseek-events-032.json | 25 | CN生态(15) + 退役转型(10) | ds-cncs-revival, ds-retirement-path |
| 033 | deepseek-events-033.json | 25 | CN生态(15) + 教练管理(10) | ds-coach-conflict, ds-rookie-mentor |
| 034 | deepseek-events-034.json | 25 | 救赎线(15) + 队内体系(10) | ds-trauma-redemption, ds-major-ghost |
| 035 | deepseek-events-035.json | 25 | 救赎线(10) + 赛事内非关键突发(15) | ds-one-step-away, ds-post-champion-pressure |
| 036 | deepseek-events-036.json | 25 | 退役转型(10) + 伤病健康(15) | ds-retirement-path, ds-injury-comeback |
| 037 | deepseek-events-037.json | 25 | 跨世界线桥接事件(25) | 多世界线交叉 |
| 038 | deepseek-events-038.json | 25 | 跨世界线桥接事件(25) | 多世界线交叉 |
| 039 | deepseek-events-039.json | 25 | 跨世界线桥接事件(25) | 多世界线交叉 |
| 040 | deepseek-events-040.json | 25 | 综合收尾(补齐缺口) | 全部世界线覆盖 |

### 1000条事件分类汇总（对照目标）

| 分类 | 分配 | 目标 | 状态 |
|------|------|------|------|
| 赛事内关键局 | 120 | 120 | ✅ |
| 赛事内非关键突发 | 70 | 70 | ✅ |
| 训练状态 | 75 | 75 | ✅ |
| 伤病健康 | 70 | 70 | ✅ |
| 队内体系 | 95 | 95 | ✅ |
| 教练管理 | 60 | 60 | ✅ |
| 合同转会 | 100 | 100 | ✅ |
| 角色转职 | 55 | 55 | ✅ |
| 舆论媒体 | 70 | 70 | ✅ |
| 商业赞助 | 45 | 45 | ✅ |
| 合规风险 | 55 | 55 | ✅ |
| 家庭生活 | 45 | 45 | ✅ |
| CN生态 | 55 | 55 | ✅ |
| 救赎线 | 55 | 55 | ✅ |
| 退役转型 | 30 | 30 | ✅ |
| **合计** | **1000** | **1000** | ✅ |

### 覆盖指标对照

| 指标 | 目标 | 分配 |
|------|------|------|
| 世界线阶段事件 | ≥300 | ~450 |
| 世界线转换事件 | ≥120 | ~150 |
| 跨世界线桥接 | ≥80 | 75（批次37-39） |
| 延迟后果事件 | ≥120 | ~200 |
| IGL事件 | ≥80 | ~100 |
| AWPer事件 | ≥50 | ~70 |
| 突破手事件 | ≥50 | ~70 |
| 辅助事件 | ≥50 | ~60 |
| 16-20岁事件 | ≥80 | ~100 |
| 21-25岁事件 | ≥80 | ~120 |
| 26-30岁事件 | ≥80 | ~100 |
| 31+岁事件 | ≥40 | ~50 |
| Major/高级赛事 | ≥100 | ~130 |
| CN赛区/国际转会 | ≥100 | ~120 |

---

## 四、世界线批次分配

| 批次 | 文件 | 世界线数 | 世界线ID |
|------|------|---------|---------|
| WL-01 | deepseek-worldlines-01.json | 5 | ds-demon-king, ds-one-step-away, ds-ten-year-major, ds-mortal-road, ds-uncrowned-king |
| WL-02 | deepseek-worldlines-02.json | 5 | ds-star-teammate-rivalry, ds-champion-five, ds-roster-collapse, ds-trio-drifting, ds-overseas-adaptation |
| WL-03 | deepseek-worldlines-03.json | 5 | ds-cncs-revival, ds-igl-succession, ds-awper-igl-overload, ds-support-redemption, ds-meta-king |
| WL-04 | deepseek-worldlines-04.json | 5 | ds-injury-comeback, ds-trauma-redemption, ds-free-agent-winter, ds-bench-to-star, ds-veteran-comeback |
| WL-05 | deepseek-worldlines-05.json | 5 | ds-compliance-probe, ds-commercial-star, ds-public-backlash, ds-family-duty, ds-coach-conflict |
| WL-06 | deepseek-worldlines-06.json | 5 | ds-old-friends-reunion, ds-rookie-mentor, ds-post-champion-pressure, ds-major-ghost, ds-retirement-path |

---

## 五、catalogId命名规范

所有新事件ID格式: `ds-{category-abbr}-{descriptive-name}-{nnn}`

分类缩写:
- 赛事内关键局 → `key`
- 赛事内非关键突发 → `mid`
- 训练状态 → `train`
- 伤病健康 → `health`
- 队内体系 → `team`
- 教练管理 → `coach`
- 合同转会 → `contract`
- 角色转职 → `role`
- 舆论媒体 → `media`
- 商业赞助 → `biz`
- 合规风险 → `comply`
- 家庭生活 → `family`
- CN生态 → `cn`
- 救赎线 → `redeem`
- 退役转型 → `retire`

跨世界线桥接事件: `ds-bridge-{name}-{nnn}`

---

## 六、执行状态追踪

| 阶段 | 状态 | 完成时间 |
|------|------|---------|
| 盘点 | ✅ 完成 | 2026-07-30 |
| 规划 | ✅ 完成 | 2026-07-30 |
| WL-01~06 | ⬜ 待执行 | - |
| 事件批次 001~040 | ⬜ 待执行 | - |
| 评语/采访/称号 | ⬜ 待执行 | - |
| 校验测试 | ⬜ 待执行 | - |
