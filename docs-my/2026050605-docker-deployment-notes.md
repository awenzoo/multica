# Docker 部署尝试记录

## 状态

已尝试，因 Go 依赖下载过慢放弃，改用直接部署。

## Docker 文件

| 文件 | 用途 |
|------|------|
| `Dockerfile` | Go 后端镜像 |
| `Dockerfile.web` | Next.js 前端镜像 |
| `docker-compose.selfhost.yml` | 生产 Docker Compose 配置 |
| `docker-compose.selfhost.build.yml` | 从源码构建的 overlay |

## 端口映射

docker-compose 通过 `.env` 变量控制端口映射：

```yaml
backend:
  ports:
    - "${PORT:-8080}:8080"    # 宿主机端口:容器内端口
frontend:
  ports:
    - "${FRONTEND_PORT:-3000}:3000"
```

容器内部固定 8080/3000，`PORT` 和 `FRONTEND_PORT` 只控制宿主机映射。

## 遇到的问题

### Go 依赖下载超时

```
go: github.com/aws/aws-sdk-go-v2@v1.41.5: Get "https://proxy.golang.org/...": dial tcp 142.250.196.209:443: i/o timeout
```

Docker daemon 代理只对**拉取镜像**生效，`RUN` 命令中的网络请求不一定走代理。

### 尝试的解决方案

```bash
# 方案 1：传入 GOPROXY 国内镜像
docker compose build --build-arg GOPROXY=https://goproxy.cn,direct

# 方案 2：同时传入 HTTP 代理
docker compose build \
  --build-arg GOPROXY=https://goproxy.cn,direct \
  --build-arg HTTP_PROXY=http://192.168.100.2:37890 \
  --build-arg HTTPS_PROXY=http://192.168.100.2:37890
```

### Docker 代理配置

Docker daemon 代理配置位置（已配置）：
```
HTTP Proxy: http://192.168.100.2:37890
HTTPS Proxy: http://192.168.100.2:37890
No Proxy: localhost,127.0.0.0/8,::1
```

Docker 客户端配置（`~/.docker/config.json`）可设置所有构建的代理：
```json
{
  "proxies": {
    "default": {
      "httpProxy": "http://192.168.100.2:37890",
      "httpsProxy": "http://192.168.100.2:37890",
      "noProxy": "localhost,127.0.0.1,192.168.100.0/24"
    }
  }
}
```

## 如果要重新尝试

```bash
docker compose -f docker-compose.selfhost.yml -f docker-compose.selfhost.build.yml build \
  --build-arg GOPROXY=https://goproxy.cn,direct \
  --build-arg HTTP_PROXY=http://192.168.100.2:37890 \
  --build-arg HTTPS_PROXY=http://192.168.100.2:37890

docker compose -f docker-compose.selfhost.yml -f docker-compose.selfhost.build.yml up -d
```

## 数据存储

Docker volume: `multica_pgdata` → `/var/lib/docker/volumes/multica_pgdata/_data`
删除容器不会丢数据，需要 `docker volume rm multica_pgdata` 才会清除。
