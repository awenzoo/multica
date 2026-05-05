# 生产环境部署指南

## 概述

直接在本机运行生产环境（非 Docker），前端通过 Next.js rewrites 代理 API 请求，对外只暴露一个端口。

## 架构

```
浏览器 → :13000 (Next.js production) → localhost:18080 (Go binary)
                                         ↓
                                    PostgreSQL (Docker, :5432)
```

## 端口规划

| 服务 | 端口 | 对外暴露 |
|------|------|---------|
| Go 后端 | 18080 | 否（仅 localhost） |
| Next.js 前端 | 13000 | 是 |
| PostgreSQL | 5432 | 否 |

## 部署步骤

### 1. 确保 PostgreSQL 运行
```bash
# 已有 Docker 容器
docker start multica-postgres-1
# 或
make db-up
```

### 2. 配置 .env

关键配置项：
```bash
# 数据库
DATABASE_URL=postgres://multica:multica@localhost:5432/multica?sslmode=disable

# 后端
APP_ENV=development
PORT=18080
MULTICA_DEV_VERIFICATION_CODE=666666
JWT_SECRET=change-me-in-production
REMOTE_API_URL=http://localhost:18080

# 前端（留空，走 Next.js rewrites 代理）
FRONTEND_PORT=13000
FRONTEND_ORIGIN=http://ssc.wenping.asia:13000
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_WS_URL=

# CORS 和 WebSocket
ALLOWED_ORIGINS=http://ssc.wenping.asia:13000,http://192.168.100.3:13000,http://127.0.0.1:13000,http://localhost:13000
MULTICA_SERVER_URL=ws://192.168.100.3:18080/ws
MULTICA_APP_URL=http://ssc.wenping.asia:13000
LOCAL_UPLOAD_BASE_URL=http://192.168.100.3:18080
```

### 3. 构建后端
```bash
make build
# 产物在 server/bin/ 下：server、multica（CLI）、migrate
```

### 4. 构建前端
```bash
NEXT_PUBLIC_API_URL= NEXT_PUBLIC_WS_URL= REMOTE_API_URL=http://localhost:18080 FRONTEND_ORIGIN=http://ssc.wenping.asia:13000 pnpm --filter @multica/web build
# 产物在 apps/web/.next/ 下
```

### 5. 运行迁移
```bash
cd server && ./bin/migrate up
```

### 6. 启动服务
```bash
# 启动后端（需加载 .env）
cd server && nohup env $(grep -v '^#' ../.env | grep -v '^$' | xargs) ./bin/server &>/tmp/multica-backend.log &

# 启动前端
cd apps/web && nohup npx next start -p 13000 -H 0.0.0.0 &>/tmp/multica-frontend.log &
```

### 7. 停止服务
```bash
kill $(lsof -ti:18080) $(lsof -ti:13000)
```

## 构建产物位置

| 组件 | 路径 |
|------|------|
| Go 后端 | `server/bin/server` |
| CLI | `server/bin/multica` |
| 迁移工具 | `server/bin/migrate` |
| Next.js 前端 | `apps/web/.next/` |

## 关键注意事项

1. **NEXT_PUBLIC_API_URL 必须留空** — 前端通过 Next.js rewrites 代理 API 请求，避免跨域和 cookie 问题
2. **REMOTE_API_URL 必须在构建时设置** — Next.js rewrites 在构建时编译，`next.config.ts` 读取此值
3. **nohup 启动后端时需手动加载 .env** — `env $(cat .env | xargs) ./bin/server`
4. **后端监听 0.0.0.0** — Go 代码用 `:18080`，默认监听所有网卡
5. **cookie SameSite=Strict** — 同域同端口下 cookie 正常工作；不同端口会被视为跨站
