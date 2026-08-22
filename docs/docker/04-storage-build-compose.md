# 数据、构建与 Compose

## 为什么要把数据放到容器外

容器的可写层跟随容器生命周期。删除容器后，这一层的数据也会删除。

长期数据通常放在：

- Bind Mount：你管理宿主机目录
- Volume：Docker 管理存储位置

## Bind Mount

适合源码、配置、实验数据和需要直接查看的文件：

```bash
docker run --rm \
  --mount type=bind,source="$HOME/project",target=/workspace \
  ubuntu ls /workspace
```

原始数据建议只读挂载：

```bash
docker run --rm \
  --mount type=bind,source="$HOME/dataset",target=/data,readonly \
  ubuntu ls /data
```

在 Windows + WSL 2 开发 Linux 项目时，频繁读写或依赖文件变更监听的源码放在 WSL Linux 文件系统中通常更合适。

## Volume

适合数据库和由程序维护的数据：

```powershell
docker volume create mysql-data

docker run -d `
  --name mysql `
  -e MYSQL_ROOT_PASSWORD=example `
  -v mysql-data:/var/lib/mysql `
  mysql:8
```

!!! warning "Volume 不是备份"

    Volume 仍然保存在这台电脑的磁盘中。磁盘损坏、Docker 数据被重置或电脑丢失时，Volume 也可能丢失。重要数据仍需外部备份。

## Dockerfile：把环境写成代码

目录：

```text
nginx-demo/
├─ Dockerfile
└─ index.html
```

Dockerfile：

```dockerfile
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
```

构建和运行：

```powershell
docker build -t nginx-demo:v2 .
docker run --rm -d -p 127.0.0.1:8081:80 --name web-v2 nginx-demo:v2
```

重要概念：

- `FROM`：选择基础镜像
- `COPY`：把构建上下文中的文件放进镜像
- `RUN`：构建镜像时执行
- `CMD`：容器每次启动时执行默认命令
- `.dockerignore`：排除无关文件、缓存和敏感内容

API Key、密码和 SSH 私钥不要写进 Dockerfile，也不要复制进镜像。

## Compose：描述整个应用

`compose.yaml`：

```yaml
services:
  web:
    image: 172.20.10.4:5000/nginx-demo:v1
    ports:
      - "127.0.0.1:8080:80"
    restart: unless-stopped

  redis:
    image: redis:alpine
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

常用命令：

```powershell
docker compose config       # 先检查最终配置
docker compose up -d        # 创建或更新并启动
docker compose ps           # 查看状态
docker compose logs -f      # 持续查看日志
docker compose down         # 删除容器和默认网络
```

`docker compose down` 默认不会删除声明的命名 Volume；只有明确执行 `docker compose down -v` 才会连卷一起删除，使用前必须确认数据是否可丢弃。

## 一套可迁移的项目结构

```text
project/
├─ src/
├─ configs/
├─ Dockerfile
├─ compose.yaml
├─ requirements.txt / lock 文件
├─ .dockerignore
└─ README.md
```

资产分工：

```text
代码和配置 → Git
镜像       → Registry
数据       → Volume / 外部存储 / 备份
```
