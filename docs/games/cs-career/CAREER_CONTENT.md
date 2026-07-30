# CS Career 外置内容配置

职业评语、TOP20 评语、初始出身和随机天资均从 `src/data/career-config/` 加载。运行时不调用 AI，也不读取远程内容。

## 文件

- `manifest.json`：内容版本、随机协议版本和各配置包路径。
- `top20-reviews.json`：年度 TOP20 分段模板及虚构采访池。
- `career-reviews.json`：退役/职业生涯评语池。
- `career-titles.json`：职业称号、优先级和匹配条件。
- `origins.json`：八个初始出身、基础属性、波动、队伍和天资池标签。
- `talents.json`：随机天资、权重、互斥组和效果快照。

统一加载及语义校验位于 `src/careerContentSystem.ts`。配置错误会阻止应用启动和构建，不会静默使用默认值。

## TOP20 模板

模板只允许固定 `{{placeholder}}`，不支持函数、条件、HTML 或脚本。允许字段：

- `playerName`、`year`、`rank`
- `mvpCount`、`evpCount`、`vpCount`
- `majorRating`、`eliteRating`
- `playoffRating`、`arenaRating`、`finalRating`、`eliminationRating`
- `aboveNick`、`belowComparison`

评语固定按荣誉、压力数据、相邻名次比较三个段落生成。采访概率使用万分比 `chanceBps`，并明确附加“游戏生成采访”后缀。

## 职业称号

称号按照 `priority` 从高到低匹配，ID 用于稳定排序。条件字段首版只允许：

- `integrity`、`trophies`、`rating`
- `connections`、`role`、`fame`、`age`

至少必须有一条空条件 fallback。称号不进行随机抽取。

## 初始出身

每个出身包含：

- 基础能力、关系、清白、名气、健康和国际适应。
- 四项核心属性各自独立的随机波动半径。
- 初始队伍 ID、资产和合同长度。
- 可抽取天资的标签。

每项属性使用独立随机域 `origin:{originId}:stat:{stat}`，新增属性不会扰动已有属性。

## 随机天资

每个天资包含稳定 ID、revision、权重、池标签、互斥组、说明和效果。效果仅允许：

- `ability`、`connections`、`integrity`、`fame`
- `health`、`positionFamiliarity`
- `internationalAdaptation`、`highPressureChokingRisk`

单个天资绝对效果预算不得超过 15。天资按稳定 ID 排序后使用独立随机域抽取。抽中后将 ID、revision、名称、说明和效果快照写入存档；同一 `contentVersion` 内不会回查并改写天资。发布新的内容版本会按项目现有策略使旧存档失效。

## AI 内容流程

1. AI 只生成候选 JSON，不生成 TypeScript 或可执行公式。
2. 所有来源元数据初始使用 `reviewStatus: draft`。
3. 通过 JSON Schema、运行时语义校验和固定种子测试。
4. 人工审核文本、数值预算、真实/虚构边界后改为 `approved`。
5. 发布会改变数值或抽取结果的配置时，必须更新 `contentVersion` 与规则版本。
