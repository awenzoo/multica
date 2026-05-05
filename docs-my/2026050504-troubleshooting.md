# 踩坑与问题排查记录

> 日期：2026-05-05

## 问题 1：端口 3000 被占用

**现象**：`make start` 时 Next.js 报 `EADDRINUSE: address already in use :::3000`

**原因**：之前的进程没有完全退出。

**解决**：

```bash
fuser -k 3000/tcp
fuser -k 8080/tcp
```

## 问题 2：Docker Hub 拉取超时

**现象**：`docker compose up` 报 `Client.Timeout exceeded while awaiting headers`

**原因**：国内网络无法直接访问 Docker Hub。

**解决**：配置镜像加速

```bash
sudo bash -c 'cat > /etc/docker/daemon.json << EOF
{ "registry-mirrors": ["https://docker.1ms.run"] }
EOF
systemctl restart docker'
```

## 问题 3：Docker socket 权限不足

**现象**：`permission denied while trying to connect to the Docker daemon socket`

**原因**：当前用户不在 docker 组或未重新登录。

**解决**：

```bash
sudo chmod 666 /var/run/docker.sock
```

## 问题 4：Runtimes/Skills/Settings 等页面 404

**现象**：点击侧边栏的"运行环境"、"技能"、"设置"菜单，页面返回 404。Issues 和 Agents 页面正常。

**原因**：`next-intl/plugin`（`createNextIntlPlugin`）默认启用路由国际化，会在 URL 前注入 `/zh/` locale 前缀，这与 `[workspaceSlug]` 动态路由冲突，导致路径匹配失败。

**排查过程**：
1. 确认路由文件都存在：`apps/web/app/[workspaceSlug]/(dashboard)/settings/page.tsx` 等
2. `curl http://localhost:3000/test-ws/issues` 返回 200，`curl http://localhost:3000/test-ws/settings` 返回 404
3. 检查 `.next/dev/server/` 发现 plugin 生成了 middleware 文件
4. 确认是 next-intl plugin 的路由拦截问题

**解决**：保持 `createNextIntlPlugin` 但不在 i18n 配置中启用路由 locale，纯 cookie/静态模式。

## 问题 5：Module not found: Can't resolve messages/zh.json

**现象**：Next.js 编译报 `Module not found: Can't resolve '../../messages/zh.json'` 或 `'../messages/zh.json'`

**原因**：Turbopack 从 `apps/web/` 作为工作目录解析路径，`i18n.ts` 位于 `apps/web/i18n.ts`，所以 `./messages/zh.json` 才是正确路径。

**错误路径尝试**：
- `../../messages/zh.json` → 解析到 `apps/messages/`（不存在）
- `../messages/zh.json` → 解析到 `messages/`（不存在）

**正确路径**：`./messages/${locale}.json`

## 问题 6：前端进程启动但端口不监听

**现象**：`ps aux` 显示 `next-server` 进程运行中，但 `lsof -i:3000` 无监听。

**原因**：编译阶段（特别是首次或清除 `.next` 缓存后）前端进程存在但还没完成编译绑定端口。另外 `head -30` 管道会导致 Next.js 进程提前退出。

**解决**：
- 不要用 `| head -30` 管道截断 make start 输出
- 耐心等待编译完成，首次编译可能需要 30-60 秒

## 问题 7：登录页 Continue 按钮灰色不可点击

**现象**：输入邮箱后 Continue 按钮仍为灰色 `disabled`。

**代码分析**：按钮条件 `disabled={!email || loading}`，email 状态绑定正常。

**可能原因**：`next-intl` 的 `NextIntlClientProvider` 在根布局导致客户端水合（hydration）失败，React 状态无法更新。

**状态**：待排查。可能需要将 `NextIntlClientProvider` 从根布局移到特定页面。
