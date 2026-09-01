# @imcp-pro/dsh-client-background

用随机切换的公开 [Unsplash](https://unsplash.com) 图片替换 dsh Web 客户端的基础背景，并通过半透明的基础表面让图片透出。

一个可独立安装的 dsh **bundle**（适用于 `dsh --profile web`）——本仓库**就是**插件本身：不依赖 monorepo，也不需要框架源码 checkout。

- 仓库：<https://github.com/imcp-pro/dsh-client-background>
- 许可证：MIT

## 作用

- 在 `<body>` 上绘制一张公开图片（`cover`、居中、固定）。
- 把两个基础背景主题 token（`--dsw-alias-bg-base`、`--dsw-specific-sidebar-fill`）覆盖为半透明，让图片透过对话区、详情区和侧边栏显示出来。
- 提前预加载所有图片，使轮换命中浏览器缓存，而不是闪一下底色。
- 每 20 秒随机切换一张图片。

该插件不依赖任何 Cordis 服务——它只注入一张样式表，仅使用浏览器全局对象（`document`、`Image`、`setInterval`），因此对任何发布了基础主题 token 的 dsh 版本都能工作。

## 环境要求

- 一个 dsh Web profile（`dsh --profile web`，即 `dsh web`），带 `web-app` bundle。
- 目标 dsh 版本需要暴露基础主题 token `--dsw-alias-bg-base` / `--dsw-specific-sidebar-fill`，并切换 `body[data-ds-dark-theme]` 暗色模式属性（当前发布版中的稳定事实）。

## 安装

```sh
# 从这个 git 仓库安装（通过 `prepare` 脚本在安装时构建）：
dsh plugin --profile web add github:imcp-pro/dsh-client-background

# 从已发布的 npm 包安装（自带预构建的 lib/）：
dsh plugin --profile web add @imcp-pro/dsh-client-background

# 从本地 checkout 安装（先构建，再链接）：
npm run build
dsh plugin --profile web add .
```

然后重启 `dsh web`；背景即会出现，并在重启后保持。

## 自定义

可调项是 [`src/client/index.ts`](src/client/index.ts) 中的固定常量——修改它们，运行 `npm run build`，再重新安装：

| 常量 | 默认值 | 含义 |
| --- | --- | --- |
| `DEFAULT_IMAGES` | 15 个 Unsplash URL | 轮换的图片列表 |
| `ROTATION_INTERVAL_MS` | `20_000` | 切换间隔（毫秒） |
| `SURFACE_OPACITY` | `0.55` | 表面不透明度；`1` 完全遮住图片，`0` 完全露出图片 |

## 开发

```sh
npm install
npm run build   # esbuild 打包 + tsc 生成声明 → lib/
npm test        # vitest（jsdom）
```

## 发布

```sh
npm publish    # `prepare` 会执行构建；发布 lib/ + cordis.patch.yml
```

本包发布 `lib/` 和 `cordis.patch.yml`（插入 `dsh.client` 行的 bundle 补丁层）。它同时声明 `dsh.bundle.patch`（让 `dsh plugin add` 注册该层）和 `dsh.client`（让 client-modules 宿主提供浏览器半侧）。

## 说明

- **无 `cordis.yml` 配置** —— 客户端半侧收不到配置；可调项就是上面的常量。
- **即时切换，无淡入淡出** —— 预加载消除了加载闪烁，但图片仍是一步切换。
- **`background-attachment: fixed` 在 iOS Safari 上被忽略** —— 在那里图片会随页面滚动。
