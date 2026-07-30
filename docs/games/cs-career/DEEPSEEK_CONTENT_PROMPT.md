# DeepSeek 内容扩展提示词

本文用于让 DeepSeek 在当前仓库中扩展 `cs-career` 的事件、世界线、TOP20 文案、退役评语和职业称号。

## 使用方式

不要要求模型在一次回答里生成 1000 条事件。推荐流程：

1. 首先提交“总控提示词”，让 DeepSeek读取规则、盘点现有 ID，并生成世界线总图和批次清单。
2. 世界线 JSON 每批生成 3–5 条，先完成并校验全部世界线。
3. 事件 JSON 每批生成 20–30 条，约 40 批；每批必须是独立、完整、可解析的 JSON 数组。
4. 每完成一批就运行校验和测试，失败时只修当前批次。
5. 最后单独扩充 TOP20 采访、退役评语和职业称号。

如果 DeepSeek 具有仓库读写和终端能力，让它直接创建文件并运行命令。如果只是网页对话，让它按批次输出纯 JSON，再把结果保存到下述目录。

## 总控提示词

将下面整段原样提交给 DeepSeek：

```text
你正在维护一个 TypeScript + React + Vitest 项目中的单人生涯模拟器 `cs-career`。你的任务不是写散文提案，而是直接生成并落地符合当前 Schema、可由运行时加载的 JSON 内容。

工作前必须完整读取并严格遵守以下文件：

- AGENTS.md
- design.md
- docs/games/cs-career/RULES.md
- docs/games/cs-career/EVENT_SYSTEM.md
- docs/games/cs-career/EVENT_GENERATION_SPEC.md
- docs/games/cs-career/CAREER_CONTENT.md
- docs/games/cs-career/career-event.schema.json
- docs/games/cs-career/career-worldline.schema.json
- docs/games/cs-career/career-content.schema.json
- src/careerEventTypes.ts
- src/careerEventSystem.ts
- src/careerWorldlineSystem.ts
- src/careerContentSystem.ts
- src/data/career-events/*.json
- src/data/career-worldlines/*.json
- src/data/career-config/manifest.json
- src/data/career-config/top20-reviews.json
- src/data/career-config/career-reviews.json
- src/data/career-config/career-titles.json

一、总体目标

在不改变引擎代码、不增加 TypeScript 内置事件、不使用 eval、不访问网络、不调用 Math.random() 的前提下，为 `cs-career` 扩充：

- 1000 条全新职业事件。
- 30 条相互关联但可独立进入和退出的世界线。
- 200 条新的退役纪录片式评语。
- 60 条新的 TOP20 游戏生成采访短句。
- 30 个职业结局称号。

所有事件和世界线必须由 JSON 驱动。禁止把标题、briefing、选项、结果文案或世界线阶段硬编码进 TypeScript。

二、核心叙事基调

必须重点拓展以下五条主轴，但不得把它们写成固定结局：

1. 天才出道，魔王降世：少年期迅速进入高级赛场，面对资源倾斜、媒体造神、队内嫉妒、版本针对、健康透支和长期统治压力。
2. 天才出道，与 Major 一步之遥：多次在预选、淘汰赛、决赛或关键残局接近 Major，留下可被修复也可能恶化的遗憾，最终可能无冠退役、迟到圆梦或转型帮助队伍夺冠。
3. 天才出道，奋斗十年最终夺得 Major：早期天赋不是冠军保证，经历换队、阵容解体、伤病、低谷、角色转型、自由人窗口和高龄复出后才可能夺冠。
4. 普通天赋、长期努力：没有超高初始能力，依靠训练纪律、战术理解、辅助价值、阵容稳定、职业信誉和正确转会逐渐获得 EVP、冠军、TOP20 边缘席位或国内传奇地位。
5. 数据极高但长期无冠：玩家个人 Rating 和 APS 很高，但队伍状态、阵容稳定、合同选择或关键局失败导致无冠；这条线必须允许改善队友、主动换队、牺牲数据建立体系，也允许成为“无冕强者”。

五条主轴之外必须覆盖：

- 新秀、青训、试训、替补、首发竞争。
- 指挥、枪男指挥、指挥狙、辅助、突破手、狙击手的差异。
- Major 预选、Major 正赛、T1/T2、BO1/BO3/BO5、淘汰赛、决赛和爆冷。
- 队友成长、明星队友资源冲突、阵容重建、三人核心、老队重组。
- 教练更替、分析师、战术泄露、版本适应和地图池问题。
- 合同、续约、降薪、买断、替补合同、自由人、海外纵队和复出。
- 训练、作息、旅行、签证、伤病、心理压力和家庭责任。
- 媒体、直播、粉丝、商务、赞助、税务和合规风险。
- CN 生态、国际适应、长期低谷、复兴和赛区责任。
- 救赎、复仇、迟到的冠军、伤愈回归、老将转型和退役道路。
- 干净职业生涯、争议生涯、被调查、漂泊老兵和行业转型。

三、现实性与事实约束

- Major 冠军是五人阵容共同完成的。事件不得把冠军叙述成只有玩家一人有价值，也不得默认冠军队友全是低能力背景板。
- 队友 TOP20 由引擎的统一 APS 系统根据 Rating、ADR、地图、MVP、EVP、VP 和高级赛事成绩计算。事件可以叙述队友资源、明星竞争和团队价值，但不得用一次选择直接写死任何人获得 TOP20。
- 同理，任何选择都不得直接保证 Major、MVP、EVP、TOP20、TOP1 或王朝身份。只能使用结构化效果改变概率、赛事名次或后续条件。
- 当前事件变量白名单中没有 `teammate.rating`、`teammate.ability`、`teammate.topRank`、`player.topRank` 等变量。禁止创造 Schema 不支持的变量。队友相关资格只能使用当前可用的 `team.form`、`team.rosterStability`、排名、赛事上下文和世界线阶段表达。
- 正式比赛期间只有选手语音；教练只能在规则允许的暂停阶段沟通。
- 普通选手无权无故决定全队战术。全队级选择必须限制为 IGL，或在 briefing 中明确临时授权。
- 真实战队和选手只可来自项目静态快照；赛事方、赛事品牌、赞助商、生成角色和随机事件必须清楚保持虚构。
- 不使用 ESL、IEM、EPL、PGL、BLAST、StarLadder、FISSURE、EWC 等真实商业品牌。使用 ESI、EIM、ECL、PJL、BURST、NovaLadder、RIFT、GWC、遮天电竞等项目映射。
- 不引用或展示历史网页原文，不声称运行时查询 HLTV。

四、1000 条事件的最低分配

严格按照以下 15 类生成，总数必须恰好为 1000：

- 赛事内关键局：120
- 赛事内非关键突发：70
- 训练状态：75
- 伤病健康：70
- 队内体系：95
- 教练管理：60
- 合同转会：100
- 角色转职：55
- 舆论媒体：70
- 商业赞助：45
- 合规风险：55
- 家庭生活：45
- CN生态：55
- 救赎线：55
- 退役转型：30

额外覆盖指标：

- 至少 300 条属于某条世界线阶段。
- 至少 120 条能启动、推进、分支、暂停、恢复、完成或放弃世界线。
- 至少 80 条是跨世界线桥接事件，一个选项可以完成旧线并启动新线，但每次最多操作 2 条世界线。
- 至少 120 条包含 1–6 赛季延迟后果。
- 至少 80 条针对 IGL，50 条针对 AWPer，50 条针对突破手，50 条针对辅助；其余允许通用。
- 至少 80 条适用于 16–20 岁，80 条适用于 21–25 岁，80 条适用于 26–30 岁，40 条适用于 31 岁以上。
- 至少 100 条与 Major 或高级赛事相关，但不得全部是决赛残局。
- 至少 100 条有 CN 赛区或国际转会背景。
- 不得通过只替换城市、比分、伤病部位或角色名称制造伪新事件。

五、30 条世界线规划

每条世界线必须有 3–8 个阶段、2–5 个结局，并允许失败、暂停、转向和恢复。除五条主轴外，至少包括：

- 少年魔王
- 一步之遥
- 十年一冠
- 凡人长路
- 无冕强者
- 明星队友与资源竞争
- 冠军五人组
- 阵容解体与重建
- 三人核心漂流
- 海外纵队适应
- CN 复兴
- 指挥接班
- 指挥狙过载
- 辅助价值重估
- 版本之子与版本淘汰
- 伤病复健
- 心魔与救赎
- 自由人寒冬
- 替补逆袭
- 高龄复出
- 合规调查
- 商业明星
- 舆论反噬
- 家庭责任
- 教练冲突
- 老队友重聚
- 新秀导师
- 冠军后的王朝压力
- 关键失误后的复仇
- 退役转型

世界线不是剧本锁轨。进入条件只决定是否有资格开始，选择通过 `worldlineTransitions` 改变阶段。不得用单个事件自动完成整条世界线。

六、事件 JSON 硬约束

- 严格符合 `career-event.schema.json` 和 `parseEventPack` 的语义校验。
- 根节点必须是 JSON 数组。
- `schemaVersion` 固定为 `1.0`，`revision` 初始为 1。
- `catalogId` 全仓库唯一，格式统一为 `ds-<worldline-or-category>-<meaningful-name>-<nnn>`。
- `source` 固定使用：
  `{"type":"ai-generated","generator":"DeepSeek","promptTemplateVersion":"deepseek-career-v2","reviewStatus":"draft"}`
- `category` 只能使用 Schema 列出的 15 类。
- 每个事件 2–4 个选项；每个选项 2–4 个 outcome。
- outcome 优先使用 `weight`，不得同时维护另一套与 weight 冲突的手写概率文案。
- 所有 `changes` 字段只能来自 Schema 白名单。
- 常规即时变化一般为 3–8，重大变化为 10–20，极端变化不超过 25。
- 每个选项至少包含一个机会和一个代价。代价可以位于基础 changes、失败 outcome 或延迟后果中，但不能存在稳定支配其他选项的万能选择。
- `detail` 应准确总结公开代价和完整结果分布；动态权重时不要伪造固定百分比，可写“成功率受能力/健康/关系影响”。
- 隐性后果必须使用 `delayed`，延迟 1–6 赛季；选择前只通过 `riskHint` 提示风险种类。
- `eligibility` 和权重公式只能使用 Schema 变量白名单与允许的 JSON AST 运算符。
- 条件 AST 深度不得超过 12，节点不得超过 96。
- 同一事件的 `catalogId`、选项 ID、结果 ID 必须稳定且不重复。
- 每个事件设置合理的 `cooldownSeasons`、`maxOccurrences` 或 `exclusiveGroup`，避免叙事重复。
- 赛事内关键局必须有真实比分、经济、人数、道具、C4、时间或地图上下文；影响赛事结果时只能使用 Schema 当前支持的结构。若当前 Schema 不允许某字段，禁止自行新增字段，应把内容降级为状态变化或在任务报告中标记引擎缺口。

七、世界线 JSON 硬约束

- 严格符合 `career-worldline.schema.json`。
- 根节点必须是 JSON 数组。
- `worldlineId` 全仓库唯一，使用 `ds-` 前缀。
- `initialStage` 必须真实存在于 `stages`。
- `stages[].eventIds` 引用的事件 ID 必须存在；推荐主要使用稳定的 `eventTags` 关联批量事件。
- 每个事件的 `worldline.worldlineId`、阶段与状态必须引用真实世界线。
- 每个 `worldlineTransitions[].toStage` 必须引用目标世界线中的真实阶段。
- 禁止悬空引用、循环空转和无法进入的阶段。
- 所有 source 初始为 `draft`，不得自行标为 approved。

八、评语和称号约束

1. 退役评语：追加到 `src/data/career-config/career-reviews.json` 的 `retirementQuotes`，每条 45–100 个汉字，使用现有 tag 枚举，不得创建 Schema 未支持的 tag。
2. TOP20 采访：追加到 `src/data/career-config/top20-reviews.json` 的 `interview.quotes`，保持克制、像赛后采访，不虚构真实人物引语，不直接贬低队友。
3. TOP20 三段模板：只能使用 `CAREER_CONTENT.md` 允许的 placeholder，禁止自行发明变量。
4. 职业称号：追加到 `src/data/career-config/career-titles.json` 的 `titles`，条件字段只能使用 `integrity`、`trophies`、`rating`、`connections`、`role`、`fame`、`age`。不要用当前不支持的 Major 数、TOP20 次数、队友 TOP 数作为条件。
5. 称号优先级必须唯一且有明确顺序；保留现有空条件 fallback 为最后一项。
6. 如果想表达当前 Schema 不支持的精细称号，列入 `docs/games/cs-career/DEEPSEEK_ENGINE_GAPS.md`，不要修改 TypeScript 或伪造字段。

九、文件放置

- 新事件：`src/data/career-events/deepseek-events-001.json` 至 `deepseek-events-040.json`。
- 新世界线：`src/data/career-worldlines/deepseek-worldlines-01.json` 至 `deepseek-worldlines-06.json`。
- 世界线总图和批次台账：`docs/games/cs-career/DEEPSEEK_CONTENT_PLAN.md`。
- 引擎能力缺口：`docs/games/cs-career/DEEPSEEK_ENGINE_GAPS.md`。
- 退役评语：合并到 `src/data/career-config/career-reviews.json`。
- TOP20 文案：合并到 `src/data/career-config/top20-reviews.json`。
- 称号：合并到 `src/data/career-config/career-titles.json`。

事件与世界线目录由运行时自动加载新增 JSON。`career-config` 不会自动加载任意新文件，因此评语和称号必须合并进 manifest 已指定的文件，不能另建一个未被引用的 JSON 后宣称完成。

十、执行顺序

第一阶段只做盘点和规划，不生成 1000 条正文：

1. 统计现有事件、世界线、catalogId、worldlineId、标签和分类数量。
2. 创建 `DEEPSEEK_CONTENT_PLAN.md`，列出 30 条世界线的 ID、阶段 ID、入口、分支、结局、关联事件数量和批次归属。
3. 给出 40 个事件批次的精确分类配额，合计必须为 1000。
4. 检查计划中所有 ID 唯一、数量相加正确、五条主轴和全部现实领域均有覆盖。
5. 完成后停止，等待下一条“执行批次”指令。不要在规划阶段一次输出 1000 条事件。

后续每次执行一个批次时：

1. 读取总图、现有 JSON 和全部已有 ID。
2. 只生成当前批次指定的 20–30 条事件或 3–5 条世界线。
3. 写入约定文件，根节点保持为一个完整 JSON 数组。
4. 检查 JSON 可解析、ID 不重复、引用不悬空、分类数量符合批次计划。
5. 运行 `npm run lint`、`npm test`、`npm run build`。
6. 失败时修复当前批次，不删除或回退用户已有修改。
7. 最终报告新增数量、文件路径、引用关系、测试结果和未解决的引擎缺口。

十一、质量门槛

- 文案必须是自然中文，不使用 AI 总结腔、说教腔或同义句批量改写。
- briefing 约 60–140 字，选项 8–18 字，结果 20–60 字。
- 世界线的每个阶段都必须有不同的职业矛盾，不只是数值越来越高。
- 成功与失败都必须能继续游戏；失败可留下伤病、心魔、市场降级或遗憾，但不得出现未提示的必死选项。
- 至少一半世界线允许中途转向另一种职业价值，例如明星转体系核心、枪男转指挥、无冠核心转冠军拼图、主力转导师。
- “个人数据高但无冠”不得简单归因于四名队友都很菜；应综合阵容强度、角色冲突、合同选择、赛制波动、关键局、教练体系和转会窗口。Major 冠军队友必须被视为有高级赛事证据的优秀选手。
- 每批执行前与全部现有事件做语义去重。标题不同但冲突、选择和结果结构相同仍算重复。

现在只执行第一阶段：读取仓库、统计现状、创建世界线总图和 40 批事件配额。不要修改 TypeScript，不要生成事件正文，不要把任何 draft 改为 approved。
```

## 执行单个事件批次的提示词

总控规划完成后，每次把以下提示词提交给 DeepSeek，只替换批次号：

```text
继续执行 `docs/games/cs-career/DEEPSEEK_CONTENT_PLAN.md` 中的事件批次 [001]。

要求：

1. 先重新读取总图、Schema、事件生成规范和全部现有事件 ID。
2. 严格生成计划中该批次规定的数量、分类、世界线标签和阶段引用，不提前生成其他批次。
3. 写入 `src/data/career-events/deepseek-events-[001].json`，根节点为完整 JSON 数组。
4. 所有 source 使用 DeepSeek / deepseek-career-v2 / draft。
5. 不修改 TypeScript，不修改既有事件，不创建 Schema 外字段。
6. 检查选项取舍、动态权重、延迟后果、权限边界、赛事真实性、虚构品牌和语义去重。
7. 验证 JSON 解析、世界线交叉引用和 ID 唯一性。
8. 运行 `npm run lint`、`npm test`、`npm run build`。
9. 若 Schema 与设计目标冲突，把缺口追加到 `DEEPSEEK_ENGINE_GAPS.md`，不要绕过 Schema。
10. 最终只报告：新增事件数、分类统计、涉及世界线、文件路径、验证结果和缺口。
```

## 执行世界线批次的提示词

```text
继续执行 `docs/games/cs-career/DEEPSEEK_CONTENT_PLAN.md` 中的世界线批次 [01]。

只生成计划指定的 3–5 条世界线，写入 `src/data/career-worldlines/deepseek-worldlines-[01].json`。严格遵守 `career-worldline.schema.json`：所有 worldlineId、stage ID、initialStage、eventTags 和 ending ID 唯一；阶段必须可进入、可推进并有至少两种结局。不要修改 TypeScript，不要引用尚未进入总图的事件 ID。完成后运行 lint、test、build，并报告交叉引用检查结果。
```

## 执行评语与称号扩充的提示词

```text
按照 `DEEPSEEK_CONTENT_PLAN.md` 执行评语与称号扩充：

- 向 `career-reviews.json.retirementQuotes` 新增 200 条退役评语。
- 向 `top20-reviews.json.interview.quotes` 新增 60 条游戏生成采访短句。
- 向 `career-titles.json.titles` 新增 30 个称号。

必须先读取 `CAREER_CONTENT.md`、`career-content.schema.json` 和 `careerContentSystem.ts`。只使用当前支持的标签、placeholder、称号条件字段和操作符。所有 ID 全仓库唯一，source 为 ai-generated / DeepSeek / deepseek-career-v2 / draft。保留原有内容和 fallback，不覆盖用户已有文案。完成后运行 lint、test、build。
```

## 人工验收与发布

DeepSeek 生成的内容必须保留 `reviewStatus: "draft"`。人工审核至少检查：

- 是否有真实赛事品牌或不当使用真实人物。
- 是否存在唯一正确选项、万能选项或未提示的严重后果。
- 世界线引用是否完整。
- 动态权重与 UI 描述是否一致。
- 是否大量复用同一叙事骨架。
- 是否尊重 Major 冠军阵容和队友 TOP 的现实逻辑。

审核通过后再把对应条目的 `reviewStatus` 改为 `approved`。发布整个内容包时，还需要更新 `src/data/career-config/manifest.json` 的 `contentVersion`，并同步提升 `careerEngine.ts` 中的规则/存档版本；这一步应由维护者统一完成，不要让内容生成批次自行反复升级版本。
