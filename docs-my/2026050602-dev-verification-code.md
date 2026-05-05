# 本地开发验证码配置

## 问题

自部署 Multica 未配置邮件发送服务（Resend），注册时收不到验证码。

## 解决方案

使用开发模式固定验证码，跳过邮件发送。

### 配置方法

在 `.env` 中设置：
```bash
APP_ENV=development
MULTICA_DEV_VERIFICATION_CODE=666666
```

### 原理

相关代码在 `server/internal/handler/auth.go`：

- `MULTICA_DEV_VERIFICATION_CODE` 环境变量定义固定验证码（第 39 行）
- `isDevVerificationCode()` 函数检查：`APP_ENV` 不是 `production` 且验证码为 6 位数字时生效（第 97-108 行）
- `VerifyCode` 接口同时验证真实验证码和 dev 验证码（第 345-346 行）

### 注意事项

- `APP_ENV` 必须不是 `production`，否则 dev 验证码被忽略
- Docker 自部署默认 `APP_ENV=production`，需要显式设为 `development`
- 如果不设 `MULTICA_DEV_VERIFICATION_CODE`，未配置 Resend 时验证码会打印到后端标准输出（`[DEV] Verification code for xxx@xxx.com: 123456`）
- 也可直接查数据库：`SELECT email, code FROM verification_codes ORDER BY created_at DESC LIMIT 5;`

### 当前配置

```
APP_ENV=development
MULTICA_DEV_VERIFICATION_CODE=666666
```
