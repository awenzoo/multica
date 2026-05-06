---
name: multica-archive-context
description: |
  将当前对话上下文按类别归档为多个 MD 文档到 docs-my 目录。
  当用户说"归档"、"记录到docs-my"、"保存上下文"、"归档上下文"、
  "archive context"时使用此技能。也适用于对话结束时用户希望
  把本次工作内容持久化为文档归档的场景。
---

# Multica 上下文归档

将对话中产生的知识、修复、配置等内容，按类别拆分为多个独立的 MD 文档，写入 `docs-my/` 目录。

## 命名规则

文件名格式：`YYYYMMDDNN-描述.md`

- `YYYYMMDD`：当天日期
- `NN`：当天已有文件最大编号 +1（从 00 开始，每份文档递增）
- `描述`：英文小写短横线连接，2-4 个单词概括内容

**示例：**
```
2026050600-multica-cli-guide.md
2026050601-chat-hooks-fix.md
2026050602-network-and-cors.md
```

## 分类策略

扫描对话上下文，按以下类别拆分（只创建有内容的类别）：

| 类别标识 | 适用内容 | 命名示例 |
|---------|---------|---------|
| bug-fix | Bug 修复、问题排查 | `bug-fix-chat-hooks.md` |
| feature | 新功能、功能增强 | `feature-windows-install.md` |
| config | 环境配置、部署变更 | `config-env-changes.md` |
| docs | 文档更新、翻译 | `docs-self-hosting.md` |
| refactor | 代码重构、架构调整 | `refactor-chat-store.md` |
| ops | 运维操作、Git 操作 | `ops-git-operations.md` |
| research | 技术调研、方案分析 | `research-auth-providers.md` |

如果内容不属于以上任何类别，用自定义的简短英文描述。

## 归档步骤

### 1. 扫描上下文

回顾当前对话的所有内容，识别出可归档的知识点。排除：
- 临时性交互（如"你好"、"确认"）
- 已有文档覆盖的重复内容
- 纯代码变更（已在 git commit 中记录）

### 2. 按类别分组

将识别出的内容按上面的分类策略分组。同一类别的多条记录归入同一份文档，按时间顺序排列。

### 3. 确定编号

读取 `docs-my/` 目录下当天已有的文件，取最大编号，从 +1 开始递增。

### 4. 写入文档

每份文档的格式：

```markdown
# 标题

> 日期：YYYY-MM-DD

---

## 条目标题 1

### 问题（可选）
简述问题背景。

### 修复/方案
具体内容和步骤。

### 涉及文件
- `path/to/file.tsx`

### 关联 commit
- `commit_hash commit message`

---

## 条目标题 2
...
```

### 5. 确认

写完所有文档后，列出创建的文件清单供用户确认。

## 注意事项

- 每份文档聚焦一个类别，不要把不相关的内容混在一起
- 内容要精炼，记录 WHY（为什么）和 HOW（怎么做），不重复代码本身
- commit hash 和涉及文件路径要准确，方便后续追溯
- 如果某条内容太少（一句话能说清），可以合并到相近类别的文档中
