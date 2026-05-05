# 网络访问与 CORS 配置

## 问题背景

需要同时支持以下地址访问 Multica：
- `http://ssc.wenping.asia:13000`（外网域名）
- `http://192.168.100.3:13000`（局域网 IP）
- `http://localhost:13000` / `http://127.0.0.1:13000`（本机）

## 解决方案

### 核心策略：Next.js API 代理

通过 `next.config.ts` 的 rewrites，将所有 API/WS 请求通过前端服务器代理到后端：

```typescript
// next.config.ts 中的 rewrites
{
  source: "/api/:path*",
  destination: `${remoteApiUrl}/api/:path*`,
},
{
  source: "/ws",
  destination: `${remoteApiUrl}/ws`,
},
{
  source: "/auth/:path*",
  destination: `${remoteApiUrl}/auth/:path*`,
},
```

这样浏览器只与前端 `13000` 端口通信，不存在跨域问题。

### ALLOWED_ORIGINS 配置

后端需要接受来自所有来源的 CORS 和 WebSocket 请求：

```bash
ALLOWED_ORIGINS=http://ssc.wenping.asia:13000,http://192.168.100.3:13000,http://127.0.0.1:13000,http://localhost:13000
```

CORS 检查链（代码在 `server/cmd/server/router.go` 和 `server/internal/realtime/hub.go`）：
```
ALLOWED_ORIGINS → CORS_ALLOWED_ORIGINS → FRONTEND_ORIGIN → 默认 localhost:3000
```

## 遇到的问题与解决

### 问题 1：WebSocket origin 被拒绝

**现象：** `ws: rejected origin origin=http://192.168.100.3:13000`

**原因：** WebSocket 的 `CheckOrigin` 函数检查 origin 是否在白名单中，白名单未包含该 origin。

**解决：** 添加到 `ALLOWED_ORIGINS`。

### 问题 2：Cookie 未携带（auth: no token found）

**现象：** 登录成功后，后续 API 请求返回 401 `no token found`

**原因：**
- 前端 `ssc.wenping.asia:13000`，后端 `ssc.wenping.asia:18080`
- 端口不同 = 不同 origin
- Cookie `SameSite=Strict` 阻止跨站携带

**解决：** 使用 Next.js rewrites 代理 API 请求，同域同端口，cookie 正常工作。`NEXT_PUBLIC_API_URL` 留空。

### 问题 3：本机代理干扰

**现象：** 本机 curl 通过 `192.168.100.2:37890` HTTP 代理访问局域网 IP 失败

**原因：** `http_proxy` 环境变量包含了局域网请求

**解决：** 测试时用 `--noproxy '*'` 或添加到 `no_proxy`。其他设备不受影响。

### 问题 4：Next.js rewrites 连接 8080 而非 18080

**现象：** `Error: connect ECONNREFUSED 127.0.0.1:8080`

**原因：** `next.config.ts` 读取 `REMOTE_API_URL` 的 fallback 是 `http://localhost:8080`

**解决：** 在 `.env` 中设置 `REMOTE_API_URL=http://localhost:18080`，并确保构建时被正确读取。

## Cookie 机制参考

代码位于 `server/internal/auth/cookie.go`：

- Auth cookie: `multica_auth`（HttpOnly, SameSite=Strict）
- CSRF cookie: `multica_csrf`（可读, SameSite=Strict）
- `Secure` 标志由 `FRONTEND_ORIGIN` 的 scheme 决定（https → Secure）
- `Domain` 由 `COOKIE_DOMAIN` 控制（IP 地址会被忽略，符合 RFC 6265）
- 两个 cookie 的 MaxAge 都是 30 天

## 网络架构总结

```
外网用户 → ssc.wenping.asia:13000 ─┐
局域网  → 192.168.100.3:13000 ────┤
本机    → localhost:13000 ─────────┤
                                    ↓
                          Next.js (:13000)
                          ├─ 静态页面/SSR
                          └─ rewrites 代理 → localhost:18080 (Go 后端)
                                              ↓
                                         PostgreSQL (:5432, Docker)
```

对外只需暴露 13000 端口，18080 不需要外网访问。
