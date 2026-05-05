# Multica CLI 功能指南

## 安装

### Homebrew (macOS/Linux)
```bash
brew install multica-ai/tap/multica
```

### 从源码构建
```bash
cd /home/awen/workspace/multica
make build
cp server/bin/multica /usr/local/bin/multica
```

## 核心功能

### 一键配置
```bash
multica setup              # 云端版
multica setup self-host    # 自部署版
```

### 认证管理
```bash
multica login                    # 浏览器 OAuth 登录
multica login --token <mul_...>  # Token 登录
multica auth status              # 查看认证状态
multica auth logout              # 登出
```

### Agent Daemon（本地 Agent 运行时）
```bash
multica daemon start             # 启动（自动检测本机 AI CLI）
multica daemon start --foreground  # 前台运行（调试用）
multica daemon stop              # 停止
multica daemon status            # 状态（PID、检测到的 Agent、Watched 工作区）
multica daemon logs              # 查看日志
multica daemon logs -f           # 实时追踪日志
```

支持的 AI CLI 自动检测：Claude Code、Codex、Copilot、Gemini、OpenCode、Cursor Agent 等。

### Workspace 管理
```bash
multica workspace list           # 列出工作区（* 标记为 watched）
multica workspace watch <id>     # 监控工作区
multica workspace unwatch <id>   # 取消监控
multica workspace get <id>       # 查看详情
multica workspace members <id>   # 列出成员
```

### Issue 管理
```bash
multica issue create --title "Fix bug" --priority high --assignee "Lambda"
multica issue list                              # 列出
multica issue list --status in_progress         # 按状态过滤
multica issue get <id>                          # 查看详情
multica issue update <id> --title "New title"   # 更新
multica issue assign <id> --to "Lambda"         # 分配
multica issue status <id> in_progress           # 改状态
multica issue comment add <id> --content "..."  # 评论
multica issue runs <id>                         # Agent 执行历史
```

### Project 管理
```bash
multica project create --title "Sprint" --icon "🏃"
multica project list / get / update / delete
```

### Autopilot（自动化）
```bash
multica autopilot create --title "Nightly triage" --agent "Lambda" --mode create_issue
multica autopilot trigger <id>              # 手动触发
multica autopilot trigger-add <id> --cron "0 9 * * 1-5"  # 定时触发
```

### 其他
```bash
multica config show / set          # 配置管理
multica agent list                 # 列出 Agent
multica version / update           # 版本/更新
```

### Daemon 配置项

| 配置 | 环境变量 | 默认值 |
|------|---------|--------|
| 轮询间隔 | MULTICA_DAEMON_POLL_INTERVAL | 3s |
| 心跳间隔 | MULTICA_DAEMON_HEARTBEAT_INTERVAL | 15s |
| Agent 超时 | MULTICA_AGENT_TIMEOUT | 2h |
| 最大并发 | MULTICA_DAEMON_MAX_CONCURRENT_TASKS | 20 |
| Claude 路径 | MULTICA_CLAUDE_PATH | claude |
| Claude 模型 | MULTICA_CLAUDE_MODEL | - |
| Claude 额外参数 | MULTICA_CLAUDE_ARGS | - |
