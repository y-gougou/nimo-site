# 镜像、容器与 Registry

## 三个核心对象

| 对象 | 含义 | 特点 |
|---|---|---|
| Image 镜像 | 创建容器的只读模板 | 可以打标签、传输和复用 |
| Container 容器 | 镜像创建出的运行实例 | 可以停止、启动、删除和重建 |
| Registry 仓库服务 | 集中保存和分发镜像 | 使用 `push` 上传、`pull` 下载 |

容器更准确的描述是“可丢弃、可重建”，而不是“只能使用一次”。停止容器不会删除它，删除容器后可以用同一个镜像重新创建。

## 完整镜像名怎么读

```text
172.20.10.4:5000/nginx-demo:v1
└──────┬────────┘ └────┬───┘ └┬┘
   Registry 地址       仓库名    标签
```

标准形式：

```text
[HOST[:PORT]/]PATH[:TAG]
```

如果不写 Registry 地址，Docker 默认去 Docker Hub；如果不写标签，默认使用 `latest`。

```text
nginx
= docker.io/library/nginx:latest
```

正式项目应尽量使用明确标签，重要的可复现实验还可以固定镜像 digest。

## 从 Registry 到容器

```powershell
docker pull 172.20.10.4:5000/nginx-demo:v1

docker run -d `
  --name web-server `
  -p 127.0.0.1:8080:80 `
  172.20.10.4:5000/nginx-demo:v1
```

`docker run` 会检查本地镜像；本地没有时也会尝试拉取，然后创建并启动一个新容器。

## 常用生命周期命令

```powershell
docker images                    # 查看本地镜像
docker ps                        # 查看运行中的容器
docker ps -a                     # 查看全部容器
docker stop web-server           # 停止，但不删除
docker start web-server          # 再次启动原容器
docker restart web-server        # 重启
docker rm web-server             # 删除已停止容器
docker rmi 镜像名                 # 删除镜像
```

## 在 Docker Desktop 中允许 HTTP Registry

Docker 默认使用 HTTPS 访问 Registry。内网仓库 `172.20.10.4:5000` 只提供 HTTP，因此需要在 Docker Desktop 的 `Settings → Docker Engine` 中加入：

```json
{
  "builder": {
    "gc": {
      "defaultKeepStorage": "20GB",
      "enabled": true
    }
  },
  "experimental": false,
  "features": {
    "buildkit": true
  },
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://mirror.ccs.tencentyun.com",
    "https://docker.1ms.run"
  ],
  "insecure-registries": [
    "172.20.10.4:5000"
  ]
}
```

应用后重启 Docker Desktop，验证：

```powershell
docker info
```

在 `Insecure Registries` 中应看到：

```text
172.20.10.4:5000
```

也可以检查 Registry API：

```powershell
curl.exe http://172.20.10.4:5000/v2/
```

返回 `{}` 或认证相关响应，说明已经连到了 Registry 服务。

!!! danger "HTTP 不是证书信任"

    `insecure-registries` 的意思是允许不加密的 HTTP，并不是验证仓库可信。镜像内容、认证信息和传输过程可能被内网中的第三方观察或篡改。实验内网可以临时使用，生产环境应配置 HTTPS 和身份认证。

## 构建、打标签和推送

```powershell
docker build -t nginx-demo:v2 .
docker tag nginx-demo:v2 172.20.10.4:5000/nginx-demo:v2
docker push 172.20.10.4:5000/nginx-demo:v2
```

`docker tag` 只是给同一个镜像增加名字，不会复制镜像内容。

Registry 是否要求 `docker login` 取决于服务端是否配置了认证；“内网 Registry”不天然等于“无需登录”。
