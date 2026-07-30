# CS Career 高质量事件生成指南

本文档基于已完成的"魔王降世"12条事件提取质量标准，用于指导后续事件生成。

## 一、已完成的质量基准

### 黄金标准示例

参考文件：`src/data/career-events/wl-demon-king-core.json`

**事件001：16岁天梯第一被顶级队伍注意**
- ✅ 真实场景：天梯排名→试训→休学困境
- ✅ 具体细节：世界排名前15队伍、主力狙击手退役、高中学业
- ✅ 三个选项：接受试训（激进）、完成学业（保守）、都不选会错过窗口
- ✅ 动态概率：试训成功率与能力挂钩
- ✅ 数值合理：能力+3~4、名气+8~12、健康-2~3
- ✅ 世界线衔接：成功进入domination阶段，失败pause在breakout

**事件002：Major决赛1v2残局**
- ✅ 具体场景：决胜图14:15、C4已放、时间15秒、队友语音只有呼吸声
- ✅ 赛事真实性：史上最年轻Major冠军、亚军vs冠军的奖金差异
- ✅ 三种策略：aggressive peek（赌枪法）、time pressure（信息战）、ask coach（团队）
- ✅ resultPatch：冠军改变名次+2、获得MVP/EVP荣誉
- ✅ 延迟后果：失利留下心魔，1-3赛季后影响关键局表现

**事件005：手腕慢性疼痛**
- ✅ 职业现实：连续三年12小时训练、队医建议vs教练暗示
- ✅ 两难困境：治疗=失去首发、止痛药=慢性伤病、快速方案=合规风险
- ✅ 长期后果：未治疗2-4赛季后健康-15、能力-8
- ✅ 合规风险：未批准治疗触发调查

## 二、质量标准检查清单

### 2.1 CS真实性（必须）

| 检查项 | 标准 | 反例（禁止） |
|--------|------|-------------|
| 权限边界 | 只有IGL或教练暂停授权才能做战术决策 | 普通选手在比赛中随意改变全队战术 |
| 教练位置 | 教练只能在暂停阶段沟通 | 教练站在选手身后实时指挥 |
| 赛事细节 | 具体比分、经济、C4状态、时间、地图位置 | "关键局""决赛""重要比赛"等模糊描述 |
| 伤病真实性 | 手腕、背部、视力、睡眠是职业选手真实问题 | 虚构的"电竞肌肉劳损""鼠标手综合症" |
| 商业合规 | 代言需要俱乐部审核、税务申报、时间冲突 | 选手私下接代言没有任何约束 |
| 转会流程 | 买断费、合同期、试训、首发承诺 | 随意换队没有合同和经济约束 |

### 2.2 选项设计（必须）

✅ **每个事件2-4个选项**
- 至少一个职业/保守路线（守规则、保团队、长期信用）
- 至少一个高风险/激进路线（短期收益、个人优先、潜在代价）
- 可选第三条中间路线或特殊选择

✅ **每个选项2-4个结果**
- 概率合计必须为100%
- 使用动态权重时：`{op:"add",args:[{const:基础值},{op:"mul",args:[{const:系数},{var:"player.ability"}]}]}`
- 成功和失败都能继续游戏，不存在"必死"结果

❌ **禁止的万能选项**
- "积极应对抓住机会"
- "保守处理稳扎稳打"
- "正面解决问题"
- "侧面迂回处理"

### 2.3 数值范围（必须遵守）

| 属性 | 单次即时变化 | 延迟后果（1-6赛季） | 特殊事件上限 |
|------|-------------|-------------------|------------|
| ability | -8 到 +8 | -10 到 +10 | Major冠军+MVP可达+18 |
| health | -12 到 +12 | -15 到 +15 | 慢性伤病可达-20 |
| fame | -12 到 +12 | -10 到 +10 | Major冠军+史上最年轻可达+20 |
| connections | -10 到 +10 | -12 到 +12 | 队内裂痕可达-15 |
| integrity | -15 到 +15 | -20 到 +20 | 合规调查可达-25 |
| earnings | -10 到 +50 | - | 独家代言可达+50 |
| teamForm | -8 到 +8 | -10 到 +10 | 阵容解体可达-15 |
| rosterStability | -10 到 +10 | -15 到 +15 | 队内冲突可达-20 |

### 2.4 文案标准（必须）

✅ **briefing（60-140字）**
- 第一句：年龄、具体场景、时间点
- 第二句：核心矛盾或选择
- 第三句（可选）：外部压力或后果提示

示例：
> "22岁，Major决赛对手在每个关键回合都用三人夹A针对你的狙击位。教练暂停后建议你转B区让队友接管A点，但这意味着承认被针对成功。"

❌ **禁止的AI腔调**
- "这是一个艰难的抉择"
- "你需要权衡利弊"
- "每个选择都有代价"
- "你会如何决定？"

✅ **选项label（8-18字）**
- 动词开头：接受、拒绝、坚持、转型、请求、主动、服用、联系
- 具体动作：不用"积极""保守"等抽象词

✅ **选项detail（20-60字）**
- 说明即时代价和长期影响
- 使用"但"连接收益与代价

✅ **结果label（20-60字）**
- 具体描述发生了什么
- 不用"你成功了""你失败了"等抽象表述

### 2.5 世界线衔接（必须）

✅ **worldlineTransitions结构**
```json
{
  "worldlineId": "wl-demon-king",
  "action": "advance",  // advance推进 | pause暂停 | complete完成
  "toStage": "domination",  // 目标阶段ID
  "branchId": "early-success",  // 分支标识
  "note": "通过试训进入顶级队伍首发"
}
```

✅ **何时使用转移**
- 关键选择改变职业轨迹时：试训成功、版本转型、伤病退役
- 不是每个事件都需要转移
- 同一阶段的小事件可以不推进阶段

✅ **结局类型（ending）**
- dynasty：建立王朝
- version-victim：版本受害者
- injury-early-exit：伤病早退
- transform：成功转型

### 2.6 延迟后果（重要机制）

✅ **何时使用延迟**
- 慢性伤病（手腕、背部、睡眠）
- 合规风险（未批准治疗、灰色代言）
- 队内裂痕（资源冲突、公开批评）
- 战术泄露（纪录片、社交媒体）
- 心理创伤（Major失利、被针对）

✅ **延迟后果结构**
```json
{
  "tag": "chronic-injury",
  "riskHint": "未治疗的伤病会在未来严重爆发",
  "minSeasons": 2,
  "maxSeasons": 4,
  "changes": {
    "health": -15,
    "ability": -8
  },
  "revealText": "手腕的慢性伤病终于爆发，医生说如果当年好好治疗就不会这么严重。"
}
```

❌ **禁止**
- 延迟窗口超过6赛季
- minSeasons > maxSeasons
- 延迟变化超过正常数值上限

## 三、五条主轴世界线事件清单

### 3.1 魔王降世（wl-demon-king）

**已完成12条**，还需8-10条补充：

| 编号 | 阶段 | 场景 | 关键矛盾 |
|-----|------|------|---------|
| 013 | pressure | BURST淘汰赛对阵克星队伍 | 被研究透vs改变打法 |
| 014 | pressure | 粉丝见面会冲突事件 | 商业义务vs个人安全 |
| 015 | sustain-or-fall | 新版本AWP彻底改版 | 适应vs转型vs退役 |
| 016 | sustain-or-fall | 年轻替补挑战首发 | 竞争vs导师vs离队 |
| 017 | sustain-or-fall | 26岁收到最后一份顶级合同 | 接受降薪vs二线养老vs退役 |
| 018 | sustain-or-fall | 老队友重组邀请 | 重返巅峰vs情怀陷阱 |
| 019 | sustain-or-fall | 建立个人战队 | 老板vs球员vs教练 |
| 020 | sustain-or-fall | 退役仪式准备 | 体面离场vs不甘心 |

### 3.2 一步之遥（wl-one-step-away）

需要15-18条事件，覆盖：

**first-near-miss阶段（4-5条）**
- Major四强1v3残局失利
- 预选赛最后一场被爆冷
- 决赛加时赛关键失误
- 赛后媒体质疑"关键局软脚"
- 队友私下安慰vs公开指责

**repeated-heartbreak阶段（5-6条）**
- 连续三个赛季止步四强
- 被贴上"无冠核心"标签
- 转会到强队但仍然失利
- 年轻队友拿到冠军而你替补
- 教练建议心理辅导

**mental-burden阶段（3-4条）**
- 关键局开始出现肌肉记忆犹豫
- 睡前反复回放失利录像
- 队友不敢把残局交给你
- 考虑换个定位逃避压力

**redemption-or-acceptance阶段（3-4条）**
- 心理师帮助复盘心魔
- 主动降级打低压力赛事
- 老将身份帮助年轻人夺冠
- 无冠退役但被尊重

### 3.3 十年一冠（wl-ten-year-major）

需要18-20条事件，覆盖：

**promising-start阶段（4-5条）**
- 二线队打出高Rating
- 第一次转会失败
- 被顶级队伍试训后拒绝
- 阵容解体成为自由人

**wandering-years阶段（6-8条）**
- 三次换队经历
- 自由人窗口主播谋生
- 替补期保持训练
- 伤病恢复期
- 合同纠纷

**transformation阶段（4-5条）**
- 从枪男转辅助
- 学习指挥
- 接受体系角色
- 牺牲数据换团队

**final-push阶段（4-5条）**
- 29岁最后机会
- 老将拼图身份
- 用经验帮助年轻队友
- 终于夺冠vs遗憾退役

### 3.4 凡人长路（wl-mortal-road）

需要16-18条事件，覆盖：

**discipline-path阶段（4-5条）**
- 每天额外2小时录像复盘
- 作息管理与健康投资
- 拒绝捷径坚持基础训练
- 能力缓慢但稳定提升

**support-value阶段（5-6条）**
- 主动承担闪光和信息位
- 放弃击杀换队友生存
- 不争夺MVP但队友认可
- 辅助价值被教练看重

**system-core阶段（4-5条）**
- 成为阵容稳定器
- Rating不高但教练信任
- 年轻人向你请教
- 体系价值被市场认可

**recognition阶段（3-4条）**
- 获得EVP
- TOP20边缘席位
- 区域传奇地位
- 教练转型

### 3.5 无冕强者（wl-uncrowned-king）

需要14-16条事件，覆盖：

**high-stats-low-trophies阶段（5-6条）**
- 连续三年Rating 1.15+但无冠
- 被质疑"数据刷子"
- 弱队核心vs强队替补
- 队友状态拖累

**contract-crossroads阶段（5-6条）**
- 弱队顶薪vs强队底薪
- 首发承诺的真实性
- 降薪加入争冠队
- 合同陷阱

**sacrifice-or-persist阶段（4-5条）**
- 牺牲数据建立体系
- 坚持打法接受无冠
- 转为指挥
- 迟到的奖杯vs永恒假设

## 四、25条支线世界线规划

### 核心支线（每条6-10个事件）

1. **wl-star-teammate-conflict**：明星队友资源竞争
2. **wl-champion-five**：冠军五人组的长期维系
3. **wl-roster-rebuild**：阵容解体与重建
4. **wl-three-core-drift**：三人核心漂流
5. **wl-international-adapt**：海外纵队适应
6. **wl-cn-revival**：CN复兴责任
7. **wl-igl-succession**：指挥接班
8. **wl-awp-igl-overload**：指挥狙过载
9. **wl-support-value**：辅助价值重估
10. **wl-version-child**：版本之子
11. **wl-version-victim-fast**：版本快速淘汰
12. **wl-injury-comeback**：伤病回归
13. **wl-mental-health**：心理健康危机
14. **wl-trauma-revenge**：心魔与救赎
15. **wl-free-agent-winter**：自由人寒冬
16. **wl-substitute-rise**：替补逆袭
17. **wl-veteran-comeback**：高龄复出
18. **wl-compliance-crisis**：合规调查
19. **wl-commercial-star**：商业明星路线
20. **wl-media-backlash**：舆论反噬
21. **wl-family-duty**：家庭责任
22. **wl-coach-conflict**：教练冲突
23. **wl-old-teammate-reunion**：老队友重聚
24. **wl-rookie-mentor**：新秀导师
25. **wl-retire-transition**：退役转型

### 桥接事件（50-80条）

桥接事件允许从一条世界线转向另一条，例如：
- 从"魔王降世"因伤病转入"伤病回归"
- 从"一步之遥"因心态崩溃转入"心理健康危机"
- 从"十年一冠"因表现出色转入"明星队友竞争"
- 从"凡人长路"因辅助价值转入"辅助价值重估"

桥接事件必须：
- 同时引用两条世界线
- complete旧线同时start新线
- 明确转换原因

## 五、生成工作流程

### 5.1 单个事件生成步骤

1. **确定场景**：具体年龄、赛事、时间点、职业情境
2. **设计矛盾**：真实的两难困境，不存在完美选项
3. **列出选项**：2-4个，至少一个职业路线+一个风险路线
4. **设置概率**：每个选项2-4个结果，概率合计100%
5. **校准数值**：遵守数值范围表
6. **检查权限**：选手是否有权做这个决定
7. **添加后果**：关键选择添加延迟后果
8. **世界线衔接**：重大转折添加worldlineTransitions
9. **文案检查**：避免AI腔，使用具体动词和场景
10. **Schema验证**：确保JSON结构合法

### 5.2 批量生成建议

**每批次规模**：15-25条事件
**文件命名**：
- 主轴：`wl-[worldline-id]-events.json`
- 支线：`wl-[worldline-id]-side.json`
- 桥接：`wl-bridge-events-[batch].json`

**质量检查脚本**：
```javascript
// 检查重复标题
const titles = events.map(e => e.title);
const duplicates = titles.filter((t, i) => titles.indexOf(t) !== i);

// 检查空即时效果
const emptyChanges = events.filter(e => 
  e.options.some(o => !o.changes || Object.keys(o.changes).length === 0)
);

// 检查概率合计
const badProb = events.filter(e => 
  e.options.some(o => {
    const total = (o.outcomes||[]).reduce((s, x) => s + (x.probability||0), 0);
    return total !== 0 && total !== 100;
  })
);

// 检查数值范围
const badValues = events.filter(e => 
  e.options.some(o => {
    const changes = o.changes || {};
    return Math.abs(changes.ability||0) > 8 || 
           Math.abs(changes.health||0) > 12 || 
           Math.abs(changes.fame||0) > 12;
  })
);
```

### 5.3 审核标准

**必须通过**：
- ✅ JSON Schema验证
- ✅ npm test全部通过
- ✅ 无重复catalogId
- ✅ 概率合计100%
- ✅ 数值在合理范围
- ✅ 世界线引用正确

**建议审核**：
- 📋 文案是否有AI腔
- 📋 场景是否符合CS现实
- 📋 权限边界是否正确
- 📋 选项是否有真实取舍
- 📋 延迟后果是否合理

## 六、快速参考

### 常用触发条件模板

```json
// 年龄范围
{"op":"all","args":[
  {"op":"gte","left":{"var":"career.age"},"right":{"const":18}},
  {"op":"lte","left":{"var":"career.age"},"right":{"const":22}}
]}

// Major决赛
{"op":"all","args":[
  {"op":"eq","left":{"var":"tournament.tier"},"right":{"const":"Major"}},
  {"op":"eq","left":{"var":"tournament.isPlayoff"},"right":{"const":true}}
]}

// 高能力低排名
{"op":"all","args":[
  {"op":"gte","left":{"var":"player.ability"},"right":{"const":75}},
  {"op":"lte","left":{"var":"team.globalRank"},"right":{"const":40}}
]}

// 健康问题
{"op":"lte","left":{"var":"player.health"},"right":{"const":60}}

// 高名气高压力
{"op":"all","args":[
  {"op":"gte","left":{"var":"player.fame"},"right":{"const":70}},
  {"op":"gte","left":{"var":"player.highPressureChokingRisk"},"right":{"const":3}}
]}
```

### 常用动态权重模板

```json
// 能力影响成功率
{"op":"add","args":[
  {"const":30},
  {"op":"mul","args":[{"const":0.6},{"var":"player.ability"}]}
]}

// 关系影响谈判
{"op":"add","args":[
  {"const":25},
  {"op":"mul","args":[{"const":0.7},{"var":"player.connections"}]}
]}

// 健康影响表现
{"op":"add","args":[
  {"const":40},
  {"op":"mul","args":[{"const":0.5},{"var":"player.health"}]}
]}
```

### 常用resultPatch

```json
// 改变名次
{"placementDelta": 1}  // 提升一名
{"placementDelta": -1}  // 下降一名
{"placementDelta": 2}  // 冠军

// 确认荣誉
{"honorPatch":{"kind":"MVP","confirmed":true}}
{"honorPatch":{"kind":"EVP","confirmed":true}}
{"honorPatch":{"kind":"冠军","confirmed":true}}

// 组合
{
  "placementDelta": 2,
  "honorPatch": {"kind":"MVP","confirmed":true}
}
```

---

## 附录：现有事件目录

- `src/data/career-events/wl-demon-king-core.json` - 魔王降世12条（质量基准）
- `src/data/career-events/base-career-choices.json` - 10条基础选择（已改为正邪分叉）
- `src/data/career-events/core-catalog.json` - 315条核心事件（已改为正邪分叉）
- `src/data/career-events/dream-events.json` - 36条梦想事件
- `src/data/career-events/match-fixing.json` - 4条合规事件
- `src/data/career-events/rising-star.json` - 1条骤然成名事件

当前事件总数：378条
目标事件总数：600-800条

---

**最后提醒**：
1. 所有新生成内容`reviewStatus`必须为`"draft"`
2. 人工审核通过后再改为`"approved"`
3. 发布前更新`manifest.json`的`contentVersion`
4. 不要在TypeScript中硬编码事件文案
5. 每批生成后立即运行`npm test`
