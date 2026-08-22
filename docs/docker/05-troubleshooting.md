# Docker 排错手册

## 标准排查顺序

不要一遇到错误就重装。先回答四个问题：

```text
1. Docker Engine 正常吗？
2. 镜像存在吗？
3. 容器创建并运行了吗？
4. 端口和应用响应正常吗？
```

## 第 1 层：Docker Desktop 与 Engine

```powershell
docker desktop status
docker version
docker info
```

判断：

- Client 和 Server 都有：CLI 与 Engine 通信正常。
- 只有 Client：Docker Desktop、WSL 2 或 Engine 没启动。
- `Docker Desktop is unable to start`：继续查看 Desktop 日志和 WSL 状态。

本次 Windows 安装中，Docker Desktop 最初无法启动，日志明确显示：

```text
wsl is not installed
```

安装 WSL、设置默认版本为 2 后，Engine 正常启动。这个案例说明：**先看日志中的前置条件错误，不要把启动失败误认为镜像源问题。**

## 第 2 层：镜像

```powershell
docker images
docker image inspect 172.20.10.4:5000/nginx-demo:v1
```

常见问题：

| 报错 | 含义 |
|---|---|
| `manifest unknown` | 仓库中没有这个名称或标签 |
| `pull access denied` | 名称错误、权限不足或需要登录 |
| `server gave HTTP response to HTTPS client` | HTTP Registry 未加入 `insecure-registries` |
| `connection refused` / `timeout` | 地址、服务、防火墙或网络链路异常 |

## 第 3 层：容器

```powershell
docker ps -a
docker inspect web-server
docker logs --tail 100 web-server
```

重点看：

- 容器名是否拼对
- `STATUS` 是 `Up` 还是 `Exited`
- `ExitCode` 是多少
- 日志是否有配置、权限或依赖错误
- 端口和挂载是否符合预期

常见退出码：

- `0`：程序正常结束
- `1`：应用一般错误
- `126`：命令存在但不能执行
- `127`：命令不存在
- `137`：收到 SIGKILL，也可能与内存不足有关；必须结合日志和 `OOMKilled` 判断

## 第 4 层：端口与 HTTP

```powershell
docker port web-server
Get-NetTCPConnection -LocalPort 8080
curl.exe -v http://127.0.0.1:8080/
```

判断顺序：

1. `docker ps` 是否显示 `8080->80/tcp`。
2. Windows 8080 是否有进程监听。
3. `curl.exe` 是否返回 HTTP 状态码。
4. curl 成功但浏览器失败时，检查是否被浏览器改成 HTTPS、代理是否介入、缓存是否过期。

!!! tip "HTTP 和 HTTPS 不可混用"

    nginx 只监听普通 HTTP 时，应访问 `http://127.0.0.1:8080/`。浏览器自动跳到 `https://127.0.0.1:8080/` 会导致 TLS/连接错误。

## 日常排错四件套

```powershell
docker ps -a
docker logs 容器名
docker inspect 容器名
docker stats
```

补充磁盘检查：

```powershell
docker system df
```

不要在没有确认数据范围时运行：

```text
docker system prune -a --volumes
```

它可能删除未使用的容器、镜像、网络、构建缓存和 Volume。

## 快速故障索引

| 现象 | 优先检查 |
|---|---|
| Docker 命令无法连接 | `docker version`、Desktop 状态、WSL 状态 |
| `No such container` | `docker ps -a`，核对真实名称 |
| 容器一启动就退出 | `docker logs`、`docker inspect` |
| `port is already allocated` | Windows 端口占用、其他容器端口映射 |
| 本机能访问、局域网不能 | 监听地址、Windows 防火墙、网络隔离 |
| curl 成功、浏览器失败 | HTTP/HTTPS、浏览器代理、缓存 |
| 数据删除容器后丢失 | 是否正确使用 Volume 或 Bind Mount |
