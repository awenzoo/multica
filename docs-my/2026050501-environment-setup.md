# 环境搭建记录

> 日期：2026-05-05
> 系统：Ubuntu 25.10

## 前置条件

项目要求：Node.js v20+、pnpm v10.28+、Go v1.26+、Docker

## 已有环境

- **Node.js** v22.22.2 ✅（系统已有）

## 安装步骤

### 1. pnpm

```bash
npm install -g pnpm
# 验证
pnpm --version  # 10.28.2
```

### 2. Go

```bash
sudo apt install -y golang-go
# 验证
go version  # go1.24.4（项目要求 1.26+，实测可用）
```

### 3. Docker

```bash
sudo apt install -y docker.io docker-compose-v2
sudo systemctl start docker
```

#### Docker 权限问题

当前用户无权访问 Docker socket，需修复：

```bash
# 方式一：临时修复（推荐，避免重新登录）
sudo chmod 666 /var/run/docker.sock

# 方式二：永久修复（需重新登录生效）
sudo usermod -aG docker $USER
```

#### Docker Hub 镜像加速

国内网络拉取 Docker 镜像超时，需配置镜像：

```bash
sudo bash -c 'cat > /etc/docker/daemon.json << EOF
{
  "registry-mirrors": ["https://docker.1ms.run"]
}
EOF
systemctl restart docker'
```

### 4. 跳过 Electron（仅 Web UI）

项目默认安装 Electron 桌面客户端，下载 Chromium 非常慢。如果只需要 Web UI：

```bash
pnpm install --ignore-scripts
```

Electron 位于 `apps/desktop/`，Web UI 不依赖它。

## 注意事项

- sudo 密码：`wen123123`（当前用户 awen）
- Docker compose 服务名是 `postgres` 不是 `db`（查看 docker-compose.yml 确认）
- Go 版本 1.24 < 要求的 1.26，但实际编译运行正常
