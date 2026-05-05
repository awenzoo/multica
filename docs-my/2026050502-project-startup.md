# 项目启动指南

> 日期：2026-05-05

## 一键启动（推荐）

```bash
make dev
```

自动完成：环境检查 → 安装依赖 → 启动数据库 → 迁移 → 启动前后端。

## 分步启动

### 1. 启动 PostgreSQL

```bash
# 启动 Docker 容器
docker compose up -d postgres

# 验证
docker ps | grep postgres
```

数据库配置（docker-compose.yml）：
- 镜像：`pgvector/pgvector:pg17`
- 端口：5432
- 数据库名：multica
- 用户/密码：multica/multica

### 2. 初始化（首次）

```bash
make setup
```

执行：pnpm install → 确保 PostgreSQL 运行 → 创建数据库 → 运行 67 个迁移文件。

### 3. 启动服务

```bash
make start
```

同时启动：
- **Go 后端**：`http://localhost:8080`（API 服务，不提供页面）
- **Next.js 前端**：`http://localhost:3000`（Web UI，访问这个）

### 4. 仅启动前端

```bash
pnpm dev:web
```

## 服务架构

| 服务 | 端口 | 说明 |
|---|---|---|
| PostgreSQL | 5432 | Docker 容器，数据持久化 |
| Go 后端 | 8080 | API + WebSocket，不提供 HTML |
| Next.js | 3000 | 前端页面，代理 API 请求到 8080 |

前端通过 `next.config.ts` 的 rewrites 将 `/api/*`、`/auth/*`、`/ws`、`/uploads/*` 代理到后端。

## 常见问题

### 端口占用

```bash
# 查看占用进程
lsof -i:3000 -P -n
lsof -i:8080 -P -n

# 释放端口
fuser -k 3000/tcp
fuser -k 8080/tcp
```

### 清除 Next.js 缓存

```bash
rm -rf apps/web/.next
```

### 停止所有服务

```bash
make stop       # 停止前后端
make db-down    # 停止数据库
```

## 登录

因为没有配置邮件服务（`RESEND_API_KEY`），验证码会打印在后端日志中：

1. 打开 `http://localhost:3000`，跳转到登录页
2. 输入邮箱，点击 Continue
3. 查看后端终端输出中的验证码：`[DEV] Verification code for xxx@xxx.com: 123456`
4. 输入验证码完成登录
