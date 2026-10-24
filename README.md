# Nimo 的麦迪逊花园

Nimo 的个人学习站点，使用 MkDocs Material 整理学习笔记、主题手册与交互式学习页面。

[访问站点](https://y-gougou.github.io/nimo-site/)

## 内容

- [Docker 知识库](docs/docker/index.md)：运行架构、镜像与容器、网络、存储、Compose 和排错。
- [学习日志](docs/log/index.md)：按日期记录学习过程与实践经验。
- [软件包与代理入门](docs/course/index.md)：Linux 软件包、代理基础及常见问题排查。
- [Codex CLI 交互式工作台](docs/codex-cli/index.html)：配套学习页面。

## 本地预览

在仓库根目录执行。GitHub Actions 使用 Python 3.13，依赖版本由 `requirements.txt` 指定。

```bash
python -m pip install -r requirements.txt
mkdocs serve
```

打开终端输出的本地地址即可预览。修改 `docs/` 中的内容后，预览页面会自动更新。

## 构建检查

```bash
mkdocs build --strict
```

构建结果写入 `site/`，该目录已由 `.gitignore` 排除。

## 目录与维护

| 路径 | 用途 |
| --- | --- |
| `docs/` | 文档、图片、脚本与静态页面 |
| `mkdocs.yml` | 站点信息、主题、导航与插件配置 |
| `requirements.txt` | Python 文档依赖 |
| `.github/workflows/deploy.yml` | GitHub Pages 部署流程 |

新增文档后，在 `mkdocs.yml` 的 `nav` 中配置需要展示的导航入口。

推送到 `main` 后，现有 GitHub Actions 流程会安装依赖，并执行 `mkdocs gh-deploy --force --strict` 构建和部署；也可在 Actions 页面手动触发该流程。
