# .env 配置变更清单

## 当前生效的 .env 关键配置

### 端口
```bash
PORT=18080                    # Go 后端端口（原 8080）
FRONTEND_PORT=13000           # Next.js 前端端口（原 3000）
POSTGRES_PORT=5432            # PostgreSQL 端口（未改）
```

### 开发验证码
```bash
APP_ENV=development           # 原为空，允许 dev 验证码
MULTICA_DEV_VERIFICATION_CODE=666666  # 原为空
```

### 网络（多地址访问）
```bash
FRONTEND_ORIGIN=http://ssc.wenping.asia:13000     # 原为 http://localhost:3000
REMOTE_API_URL=http://localhost:18080              # 原为空/注释
NEXT_PUBLIC_API_URL=                               # 原为空，中间改过外网地址，最终留空走代理
NEXT_PUBLIC_WS_URL=                                # 同上
ALLOWED_ORIGINS=http://ssc.wenping.asia:13000,http://192.168.100.3:13000,http://127.0.0.1:13000,http://localhost:13000  # 原为空
MULTICA_SERVER_URL=ws://192.168.100.3:18080/ws     # 原为 ws://localhost:8080/ws
MULTICA_APP_URL=http://ssc.wenping.asia:13000      # 原为 http://localhost:3000
LOCAL_UPLOAD_BASE_URL=http://192.168.100.3:18080   # 原为 http://localhost:8080
GOOGLE_REDIRECT_URI=http://ssc.wenping.asia:13000/auth/callback  # 原为 http://localhost:3000/auth/callback
```

### 未改动的重要配置
```bash
DATABASE_URL=postgres://multica:multica@localhost:5432/multica?sslmode=disable
JWT_SECRET=change-me-in-production
RESEND_API_KEY=              # 未配置邮件服务
ALLOW_SIGNUP=true
```

## 代码改动

### apps/web/package.json
```diff
- "dev": "sh -c 'next dev --port \"${FRONTEND_PORT:-3000}\"'",
+ "dev": "sh -c 'next dev --port \"${FRONTEND_PORT:-3000}\" -H 0.0.0.0'",
```
让 Next.js dev 模式监听所有网卡（局域网可访问）。

### apps/web/next-env.d.ts
Next.js 生产构建自动更新的类型引用路径，非手动改动：
```diff
- import "./.next/dev/types/routes.d.ts";
+ import "./.next/types/routes.d.ts";
```

## .env 文件位置

- 主配置：`/home/awen/workspace/multica/.env`
- `.env` 在 `.gitignore` 中，不会被提交
