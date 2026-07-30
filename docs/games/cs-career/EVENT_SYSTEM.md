# CS Career 事件系统

事件系统与 `careerEngine.ts` 解耦。AI 或人工作者只提交 JSON 事件包，不能提交可执行代码。

## 模块边界

- `src/careerEventTypes.ts`：JSON 定义、公式 AST、运行时 Decision 和事件上下文类型。
- `src/careerEventSystem.ts`：校验、公式解释、资格筛选、加权抽取、概率归一化和实例化。
- `src/careerExternalEvents.ts`：从 `src/data/career-events/*.json` 加载事件包；任一文件不合法时拒绝启动。
- `src/careerEventCatalog.ts`：只聚合已校验的 JSON 事件，不包含事件定义或运行规则。
- `src/careerEngine.ts`：构造只读事件上下文、提供种子随机值、接收已实例化 Decision 并结算效果。

合同、转会报价、主播复出、阵容变更和王朝危机的标题、说明、选项及结果文案统一来自 `src/data/career-decision-templates/system-decisions.json`。引擎只计算当次合同数值、概率和状态效果，并注入 JSON 模板；任何事件内容都不得在 TypeScript 中维护。AI 事件不能直接创建房间、联机行为或绕过合同状态机。

## JSON 必要字段

每个事件至少包含：

- `schemaVersion`：当前为 `1.0`。
- `catalogId` 与 `revision`：稳定身份和内容修订号。
- `category`、`kind`、`timing`、`tags`：分类与触发阶段。
- `source`：`type`、生成模型、提示模板版本、审核状态、审核人和内容哈希。
- `eligibility`：赛事、队伍、个人和生涯条件。
- `triggerWeight`：满足条件后进入候选池的相对权重。
- `cooldownSeasons`、`maxOccurrences`、`exclusiveGroup`：重复、冷却和互斥控制。
- `title`、`briefing`：中文事件文本。
- `options`：选项文本、立即效果和结果列表。
- `outcomes[].weight`：按上下文动态计算的结果权重。
- `outcomes[].delayed`：1–6 个赛季后的风险提示与固化效果。

完整机器约束见 `career-event.schema.json`。

## 公式 DSL

禁止 `eval`、JavaScript 表达式和任意函数名。公式只能使用 JSON AST：

- 条件：`all`、`any`、`not`、`eq`、`ne`、`lt`、`lte`、`gt`、`gte`、`in`、`exists`。
- 数值：`add`、`sub`、`mul`、`div`、`min`、`max`、`clamp`、`abs`、`floor`、`ceil`、`round`、`if`。
- 变量只能来自 Schema 的白名单，例如 `player.ability`、`team.form`、`tournament.tier`。
- 除零结果为 0；最终权重取非负整数。
- 每个选项所有结果权重必须至少有一个大于 0。
- 运行时按最大余数法归一化为整数百分比，显示值总和严格为 100；抽签与显示使用同一分布。

能力影响成功概率示例：基础权重 30，加上能力超过 60 的部分。

```json
{
  "op": "max",
  "args": [
    { "const": 1 },
    {
      "op": "add",
      "args": [
        { "const": 30 },
        {
          "op": "sub",
          "left": { "var": "player.ability" },
          "right": { "const": 60 }
        }
      ]
    }
  ]
}
```

## 世界线 JSON

世界线与事件是两个独立数据包：

- `src/data/career-worldlines/*.json` 只定义长期走向、入口条件、阶段和结局描述。
- `src/data/career-events/*.json` 只定义当前局面、选项、不确定结果，以及可选的世界线 transition。
- `src/careerWorldlines.ts` 和 `src/careerWorldlineSystem.ts` 负责世界线加载、校验与阶段变更。
- 引擎存档只保存世界线 ID、阶段、分支和历史，不包含具体剧情代码。

事件可声明所属世界线阶段：

```json
"worldline": {
  "worldlineId": "rising-star",
  "stages": ["attention"],
  "statuses": ["active"]
}
```

选项可改变走向：

```json
"worldlineTransitions": [
  {
    "worldlineId": "rising-star",
    "action": "branch",
    "toStage": "pressure",
    "branchId": "share-resources",
    "note": "把新增资源交给团队共同安排"
  }
]
```

允许动作：`start`、`advance`、`branch`、`pause`、`resume`、`complete`、`abandon`。运行时会校验世界线和阶段均来自已加载 JSON。

## 选项原则

- 每个事件必须有至少两个选项，可以有三个或更多。
- 不设置“正确/错误”“正面/负面”“善/恶”选项字段。
- 每个选项都应同时包含可见收益、代价或不确定性，文本保持模棱两可。
- `outcomes` 表示同一行动的不同现实走向，不是选项的正反评价。
- UI 的概率摘要由 `weight` 计算生成，不在 `detail` 中手写另一套概率。

## AI 接入流程

1. AI 生成符合 Schema 的 JSON，`source.reviewStatus` 初始必须为 `draft`。
2. 服务端或构建流程运行 Schema 校验和 `parseEventPack` 语义校验。
3. 检查虚构赛事方、文本安全、概率边界、重复 ID、公式复杂度和效果幅度。
4. 人工审核后改为 `approved`，计算规范化 JSON 的内容哈希。
5. 发布事件包时更新事件包版本及规则版本；同一种子只在同一包版本下承诺复盘一致。
6. 运行时不调用 AI，不访问实时赛事或阵容数据。

建议 AI 输出一个事件包数组，不输出 Markdown 包裹、注释或额外说明。
