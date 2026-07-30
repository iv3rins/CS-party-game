# CS Career 事件标题清单与模板

本文档提供剩余事件的具体标题、场景和JSON模板，可直接用于批量生成。

## 一、魔王降世剩余事件（8条）

### 事件013：BURST淘汰赛对阵克星队伍
```json
{
  "schemaVersion": "1.0",
  "catalogId": "wl-demon-king-013",
  "revision": 1,
  "category": "赛事内关键局",
  "kind": "field",
  "timing": "in-season",
  "title": "BURST淘汰赛对阵克星队伍",
  "briefing": "22岁，BURST淘汰赛你们遇到了过去一年三次击败你们的克星队伍。对手的数据分析师已经把你的所有习惯性位置标记出来。教练问你是否需要临时改变打法。",
  "tags": ["worldline:wl-demon-king:pressure", "克星", "战术"],
  "minAge": 21,
  "maxAge": 24,
  "options": [
    {
      "id": "change-style",
      "label": "临时改变常用位置和打法",
      "detail": "打乱对手预判，但自己也不习惯",
      "changes": {"ability": -2, "teamForm": -2},
      "outcomes": [
        {"id": "surprise-win", "label": "成功打乱对手节奏赢下比赛", "probability": 55, "changes": {"ability": 3, "fame": 6}, "resultPatch": {"placementDelta": 1}},
        {"id": "self-chaos", "label": "自己打得更混乱", "probability": 45, "changes": {"ability": -4, "fame": -5}, "resultPatch": {"placementDelta": -1}}
      ]
    },
    {
      "id": "insist-style",
      "label": "坚持自己的打法硬拼",
      "detail": "相信自己的实力，用执行力碾压",
      "changes": {"health": -3},
      "outcomes": [
        {"id": "execute-better", "label": "执行力更好，证明被研究不等于被破解", "probability": 40, "changes": {"ability": 4, "fame": 8}, "resultPatch": {"placementDelta": 2}},
        {"id": "fully-countered", "label": "每个位置都被针对，惨败", "probability": 60, "changes": {"fame": -10, "highPressureChokingRisk": 5}, "resultPatch": {"placementDelta": -2}}
      ]
    },
    {
      "id": "team-adjust", "label": "让队友承担更多压力", "detail": "分散对手注意力", "changes": {"connections": -3}, "outcomes": []}
  ]
}
```

### 事件014-020标题清单

- **014**：粉丝见面会发生冲突（商业义务vs个人安全）
- **015**：新版本AWP彻底改版（适应vs转型vs退役）
- **016**：年轻替补公开挑战首发（竞争vs导师vs离队）
- **017**：26岁收到最后一份顶级合同（降薪vs二线养老vs退役）
- **018**：老队友重组邀请（重返巅峰vs情怀陷阱）
- **019**：建立个人战队（老板vs球员vs教练）
- **020**：退役仪式准备（体面离场vs不甘心）

## 二、一步之遥完整事件清单（18条）

### first-near-miss阶段（5条）

| ID | 标题 | 场景 | 核心矛盾 |
|----|------|------|---------|
| 001 | Major四强1v3残局 | 14:13领先，你拿到1v3，赢了进决赛 | 冲vs守vs拖时间 |
| 002 | 预选赛最后一场被爆冷 | 必须赢才能晋级，对手世界排名80+ | 轻敌vs紧张vs战术保守 |
| 003 | 决赛加时赛关键失误 | 30:30，你的失误导致丢掉match point | 承认vs辩解vs沉默 |
| 004 | 赛后媒体质疑关键局软脚 | 连续两次关键局失利后的采访 | 回应vs拒绝vs反击 |
| 005 | 队友私下安慰 | 输掉Major后队友来宿舍找你 | 接受安慰vs独自消化vs迁怒队友 |

### repeated-heartbreak阶段（6条）

| ID | 标题 | 场景 | 核心矛盾 |
|----|------|------|---------|
| 006 | 连续第三次止步四强 | 又一个Major四强，媒体开始统计你的失利次数 | 继续冲vs换队vs换定位 |
| 007 | 被贴上无冠核心标签 | 社交媒体热议"最强无冠选手" | 用数据证明vs接受标签vs退出社交媒体 |
| 008 | 转会到强队仍然失利 | 降薪加入争冠队，第一个赛季又是亚军 | 坚持vs怀疑自己vs再次转会 |
| 009 | 年轻队友拿冠军你替补 | 你因伤打替补，年轻人夺冠 | 真心祝贺vs嫉妒vs后悔 |
| 010 | 教练建议心理辅导 | 教练认为你需要专业心理干预 | 接受vs拒绝vs认为侮辱 |
| 011 | 合同到期多支队伍观望 | 虽然数据好但都担心你的关键局 | 降薪证明vs接受现实vs退役 |

### mental-burden阶段（4条）

| ID | 标题 | 场景 | 核心矛盾 |
|----|------|------|---------|
| 012 | 残局肌肉记忆犹豫 | 1v1优势局，你犹豫0.3秒被翻盘 | 承认心魔vs归因运气vs加大训练 |
| 013 | 睡前反复回放失利 | 每晚睡前脑海里都是那些失误 | 心理治疗vs安眠药vs接受失眠 |
| 014 | 队友不敢给你残局 | IGL开始避免让你打关键残局 | 主动要求vs接受vs质疑IGL |
| 015 | 考虑换定位逃避 | 想转辅助避开关键局压力 | 转型vs坚持vs退役 |

### redemption-or-acceptance阶段（3条）

| ID | 标题 | 场景 | 核心矛盾 |
|----|------|------|---------|
| 016 | 心理师帮助复盘 | 系统的认知行为疗法 | 接受治疗vs自己解决vs认为没用 |
| 017 | 降级打低压力赛事 | 主动去二线队重建信心 | 降级vs坚持一线vs退役 |
| 018 | 老将身份帮队友夺冠 | 28岁，放下执念做体系角色 | 牺牲个人vs继续冲vs退役 |

## 三、十年一冠完整事件清单（20条）

### promising-start阶段（5条）

| ID | 标题 | 年龄 | 场景 |
|----|------|------|------|
| 001 | 二线队连续高Rating | 19 | T2队伍打出Rating 1.18，获得试训 |
| 002 | 第一次试训被拒 | 20 | T1队伍试训后认为"差一点意思" |
| 003 | 被当备胎最后没签 | 20 | 强队让你等，最后签了别人 |
| 004 | 阵容突然解散 | 21 | 俱乐部财务问题，队伍解散 |
| 005 | 第一次成为自由人 | 21 | 合同到期，三个月没有报价 |

### wandering-years阶段（8条）

| ID | 标题 | 年龄 | 场景 |
|----|------|------|------|
| 006 | 第一次换队失败 | 22 | 新队伍成绩不好，半年后又成自由人 |
| 007 | 自由人窗口开直播 | 23 | 靠直播收入维持生活 |
| 008 | 替补席上保持训练 | 23 | 坐了一年替补但没放弃 |
| 009 | 手腕伤病休养 | 24 | 伤病让你离开赛场半年 |
| 010 | 合同纠纷仲裁 | 24 | 俱乐部拖欠工资，打官司 |
| 011 | 第二次换队 | 25 | 又一次"最后的机会" |
| 012 | 降级T2联赛 | 25 | 接受现实去二线队 |
| 013 | 考虑退役去工作 | 26 | 收到普通公司offer |

### transformation阶段（5条）

| ID | 标题 | 年龄 | 场景 |
|----|------|------|------|
| 014 | 教练建议转辅助 | 26 | 枪法下降，学习辅助价值 |
| 015 | 跟IGL学习指挥 | 27 | 开始承担部分指挥责任 |
| 016 | 接受体系角色 | 27 | Rating降到0.95但队伍赢球 |
| 017 | 牺牲数据换信任 | 28 | 用闪光和信息帮助队友 |
| 018 | 老将定位确立 | 28 | 不再追求数据，成为胶水 |

### final-push阶段（2条）

| ID | 标题 | 年龄 | 场景 |
|----|------|------|------|
| 019 | 29岁最后的Major机会 | 29 | 队伍打进Major，你是最老的 |
| 020 | 老将拼图身份夺冠 | 30 | 十年后终于拿到Major |

## 四、凡人长路完整事件清单（18条）

### discipline-path阶段（5条）
- 每天额外2小时录像复盘
- 严格作息与健康管理
- 拒绝捷径只练基本功
- 天赋不够用努力弥补
- 能力从62缓慢提升到68

### support-value阶段（6条）
- 主动要求打闪光位
- 牺牲击杀换队友生存
- 不抱怨从不拿MVP
- 数据平平但教练信任
- 队友私下感谢
- 续约时俱乐部认可价值

### system-core阶段（5条）
- 成为阵容稳定器
- Rating 0.92但从不被换
- 年轻人请教你经验
- 市场开始理解体系价值
- 教练公开表扬

### recognition阶段（2条）
- Major决赛获得EVP
- 退役后转教练被尊重

## 五、无冕强者完整事件清单（16条）

### high-stats-low-trophies阶段（6条）
- 连续三年Rating 1.15+无冠
- TOP20榜单但无Major
- 被质疑"数据刷子"
- 弱队扛不动
- 队友状态太差
- 个人数据vs团队成绩

### contract-crossroads阶段（6条）
- 弱队顶薪续约邀请
- 强队底薪只给轮换
- 首发承诺的真实性
- 降薪加入豪门
- 合同陷阱识别
- 经纪人建议

### sacrifice-or-persist阶段（4条）
- 牺牲Rating建立体系
- 坚持打法接受无冠
- 28岁转型指挥
- 迟到的奖杯vs永恒假设

## 六、JSON模板速查

### 基础事件模板
```json
{
  "schemaVersion": "1.0",
  "catalogId": "wl-[worldline]-[nnn]",
  "revision": 1,
  "category": "赛事内关键局|训练状态|伤病健康|队内体系|教练管理|合同转会|角色转职|舆论媒体|商业赞助|合规风险|家庭生活|CN生态|救赎线|退役转型",
  "kind": "field|offseason|annual",
  "timing": "in-season|post-report",
  "title": "具体标题8-20字",
  "briefing": "年龄、场景、矛盾。60-140字。",
  "tags": ["worldline:[worldline-id]:[stage]", "主题1", "主题2"],
  "source": {"type": "human-authored", "reviewStatus": "approved", "reviewer": "career-event-design"},
  "minAge": 18,
  "maxAge": 30,
  "roles": ["awper"],
  "eligibility": {},
  "triggerWeight": {"const": 70},
  "cooldownSeasons": 4,
  "maxOccurrences": 2,
  "worldline": {"worldlineId": "wl-xxx", "stages": ["stage1"], "statuses": ["active"]},
  "options": []
}
```

### 选项模板
```json
{
  "id": "option-id",
  "label": "动词开头8-18字",
  "detail": "说明代价和影响20-60字",
  "changes": {"ability": 2, "fame": -3, "health": -2},
  "worldlineTransitions": [],
  "outcomes": [
    {
      "id": "result-success",
      "label": "具体描述发生了什么20-60字",
      "probability": 60,
      "changes": {"ability": 3, "fame": 5},
      "resultPatch": {"placementDelta": 1},
      "delayed": {
        "tag": "risk-tag",
        "riskHint": "风险提示",
        "minSeasons": 2,
        "maxSeasons": 4,
        "changes": {"health": -10},
        "revealText": "延迟后果描述"
      }
    },
    {
      "id": "result-fail",
      "label": "失败后果",
      "probability": 40,
      "changes": {"ability": -2, "fame": -4}
    }
  ]
}
```

## 七、快速生成检查表

生成每个事件后立即检查：

- [ ] catalogId格式正确且唯一
- [ ] briefing包含年龄、场景、矛盾
- [ ] 2-4个选项
- [ ] 每个选项2-4个结果
- [ ] 概率合计100%
- [ ] changes在合理范围
- [ ] 选项label不是通用模板
- [ ] 权限边界正确
- [ ] 世界线引用存在
- [ ] source为draft

---

## 使用建议

1. **每次生成15-25条事件**
2. **立即运行`npm test`验证**
3. **记录到生成日志**
4. **人工审核后改为approved**
5. **发布前更新contentVersion**

当前进度：
- ✅ 魔王降世 12/20
- ⏳ 一步之遥 0/18
- ⏳ 十年一冠 0/20
- ⏳ 凡人长路 0/18
- ⏳ 无冕强者 0/16
- ⏳ 25条支线世界线
- ⏳ 50-80条桥接事件

目标总数：600-800条事件
