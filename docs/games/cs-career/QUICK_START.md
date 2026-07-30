# CS Career 内容生成快速开始

## 当前状态

✅ **已完成**：
- 核心系统改造（队友、事件JSON化、正邪分叉）
- 5条主轴世界线框架
- 魔王降世12条高质量事件（质量基准）
- 完整生成规范文档

📊 **当前内容**：
- 事件：378条
- 世界线：6条
- 测试：121/121通过
- 构建：成功

🎯 **目标**：
- 事件：600-800条
- 世界线：30-35条

## 快速生成流程

### 步骤1：选择生成方式

**方式A：使用AI助手**（推荐）
```bash
# 将以下文件发给Claude/GPT-4/DeepSeek：
1. docs/games/cs-career/EVENT_GENERATION_GUIDE.md
2. docs/games/cs-career/EVENT_TITLE_CHECKLIST.md
3. src/data/career-events/wl-demon-king-core.json（作为参考）

# 提示词模板：
"请根据EVENT_GENERATION_GUIDE.md的质量标准，为'一步之遥'世界线生成前5条事件（标题见EVENT_TITLE_CHECKLIST.md的first-near-miss阶段）。输出纯JSON数组，不要markdown代码块。"
```

**方式B：手工创作**
```bash
# 1. 复制wl-demon-king-core.json中的一个事件作为模板
# 2. 参考EVENT_TITLE_CHECKLIST.md中的标题
# 3. 严格遵守EVENT_GENERATION_GUIDE.md的检查清单
# 4. 每5-10条提交一次并测试
```

### 步骤2：验证生成内容

每批生成后立即运行：

```bash
npm test
```

如果失败，检查：
- catalogId是否重复
- 概率是否合计100%
- worldlineId引用是否存在
- 数值是否超出范围

### 步骤3：文件放置

```bash
# 主轴世界线事件
src/data/career-events/wl-one-step-away-events.json
src/data/career-events/wl-ten-year-major-events.json
src/data/career-events/wl-mortal-road-events.json
src/data/career-events/wl-uncrowned-king-events.json

# 支线世界线
src/data/career-worldlines/wl-star-teammate-conflict.json
src/data/career-events/wl-star-teammate-events.json

# 桥接事件
src/data/career-events/wl-bridge-events-01.json
```

目录会自动加载所有`.json`文件，无需注册。

### 步骤4：审核与发布

```bash
# 1. 人工审核draft内容：
#    - CS真实性
#    - 权限边界
#    - 文案质量
#    - 数值合理性

# 2. 改为approved：
{
  "source": {
    "type": "ai-generated",
    "generator": "Claude",
    "promptTemplateVersion": "event-gen-v1",
    "reviewStatus": "approved",  // ← 改这里
    "reviewer": "你的名字"
  }
}

# 3. 发布前更新版本：
#    - src/data/career-config/manifest.json的contentVersion
#    - src/careerEngine.ts中的CAREER_SAVE_VERSION
```

## 优先级建议

### 第一批（高优先级）
完成五条主轴世界线剩余事件：
- [ ] 一步之遥 18条
- [ ] 十年一冠 20条
- [ ] 魔王降世 8条（补齐到20条）
- [ ] 凡人长路 18条
- [ ] 无冠强者 16条

### 第二批（中优先级）
核心支线世界线：
- [ ] 明星队友资源竞争 8条
- [ ] 阵容解体与重建 10条
- [ ] 伤病回归 8条
- [ ] 心理健康危机 8条
- [ ] CN复兴责任 10条

### 第三批（常规优先级）
其他支线和桥接事件：
- [ ] 20条支线世界线（每条6-8事件）
- [ ] 50-80条桥接事件

### 第四批（内容丰富）
配置扩充：
- [ ] TOP20采访 +57条
- [ ] 退役评语 +197条
- [ ] 职业称号 +30个

## 常见问题

**Q: 生成的事件被测试拒绝？**
A: 检查：
1. `npm test`错误信息
2. catalogId是否重复
3. worldlineId是否存在于`src/data/career-worldlines/`
4. 概率是否合计100%
5. 使用的变量是否在白名单（见EVENT_GENERATION_GUIDE.md）

**Q: 如何避免AI生成重复内容？**
A: 每次生成时：
1. 明确指定具体的事件标题（从CHECKLIST中选）
2. 提供已有事件作为"禁止重复"示例
3. 要求"语义去重"
4. 每批只生成15-25条

**Q: 如何保证CS真实性？**
A: 使用EVENT_GENERATION_GUIDE.md的检查清单：
- 权限边界（教练暂停、IGL授权）
- 赛事细节（具体比分、经济、时间）
- 合规流程（代言审核、税务、合同）
- 伤病真实性（手腕、背部、视力、睡眠）

**Q: 数值应该多大？**
A: 见EVENT_GENERATION_GUIDE.md的数值范围表：
- 常规变化：ability ±8, health ±12, fame ±12
- 重大事件：Major冠军fame可达+20
- 延迟后果：慢性伤病health可达-20

**Q: 世界线如何衔接？**
A: 使用worldlineTransitions：
```json
{
  "worldlineId": "wl-one-step-away",
  "action": "advance",  // advance|pause|complete
  "toStage": "repeated-heartbreak",
  "branchId": "second-major-loss",
  "note": "连续第二次Major决赛失利"
}
```

## 质量自检

每个事件生成后问自己：

- [ ] 场景是否具体？（年龄、赛事、比分、时间）
- [ ] 矛盾是否真实？（CS职业环境中真实存在）
- [ ] 选项是否有取舍？（不存在稳定支配的万能选项）
- [ ] 权限是否正确？（选手是否有权做这个决定）
- [ ] 文案是否自然？（无AI腔、说教腔）
- [ ] 数值是否合理？（见范围表）
- [ ] 概率是否合计100？
- [ ] 世界线是否存在？

## 联系与反馈

如果遇到问题：
1. 检查`PROJECT_DELIVERY_SUMMARY.md`
2. 查阅`EVENT_GENERATION_GUIDE.md`
3. 参考`wl-demon-king-core.json`
4. 运行`npm test`查看具体错误

---

**开始生成吧！用高质量的CS职业故事，让每个选择都有分量。**
