# 项目架构概要

> 日期：2026-05-05
> 详见项目根目录 CLAUDE.md

## 技术栈

- **后端**：Go（Chi 路由、sqlc 数据库、gorilla/websocket）
- **前端**：Next.js 16 + TypeScript + Turborepo + pnpm workspaces
- **数据库**：PostgreSQL 17 + pgvector

## Monorepo 结构

```
multica/
├── server/           # Go 后端
├── apps/
│   ├── web/          # Next.js 前端（App Router）
│   └── desktop/      # Electron 桌面客户端（可跳过）
├── packages/
│   ├── core/         # 无头业务逻辑（零 react-dom、零 localStorage）
│   ├── ui/           # 原子 UI 组件（零业务逻辑）
│   ├── views/        # 共享业务页面/组件（零 next/*、零 react-router）
│   └── tsconfig/     # 共享 TypeScript 配置
├── docker-compose.yml
├── Makefile
├── CLAUDE.md          # AI 开发指南
└── docs/
    └── multica-chinese-guide.md  # 中文化方案文档
```

## 依赖方向

```
views/ → core/ + ui/
```

- core 和 UI 互相独立
- views 不导入 `next/*` 或 `react-router-dom`
- 各 app 的 `platform/` 目录处理框架特定代码

## 关键设计

- **Internal Packages**：共享包导出原始 `.ts/.tsx`，由消费 app 的 bundler 编译（零配置 HMR）
- **pnpm catalog**：`pnpm-workspace.yaml` 的 `catalog:` 统一版本
- **平台桥接**：`CoreProvider` 初始化 API 客户端、认证、WS 连接、QueryClient
- **状态管理**：TanStack Query（服务端状态）+ Zustand（客户端状态）
