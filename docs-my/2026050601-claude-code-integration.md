# Claude Code 接入 Multica

## 概述

Claude Code 通过 Multica CLI 的 Agent Daemon 桥接到 Multica 平台，实现"网页上分配任务 → 本地 Claude Code 自动执行"的闭环。

## 接入步骤

### 1. 安装 Multica CLI
```bash
brew install multica-ai/tap/multica
# 或从源码构建
cd multica && make build && cp server/bin/multica /usr/local/bin/
```

### 2. 连接到自部署服务
```bash
# 一键配置（推荐）
multica setup self-host

# 或手动配置
multica config set server_url http://192.168.100.3:18080
multica config set app_url http://192.168.100.3:13000
multica login
```

### 3. 启动 Daemon
```bash
multica daemon start
```

Daemon 启动后自动：
- 检测 PATH 中的 `claude` 命令
- 将 Claude Code 注册为可用 runtime
- 开始轮询服务器获取任务

### 4. 验证
```bash
multica daemon status
```
确认状态 `running`、检测到 `claude` agent、至少一个 workspace 被 watch。

## 工作流程

```
网页端分配 Issue → 服务器下发任务 → Daemon 接收
→ 创建隔离工作目录 → 启动 claude 命令执行
→ 流式回传结果 → 网页端实时显示
```

## 注意事项

- `claude` 必须在 `$PATH` 中可用（`which claude` 验证）
- Daemon 默认后台运行，日志在 `~/.multica/daemon.log`
- 工作目录默认在 `~/multica_workspaces/`
- 支持 profile 机制同时运行多个 daemon（生产/测试环境）
