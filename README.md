# Claude Desktop Proxy

Claude Desktop 的本地代理客户端（Tauri v2 + React），用于将 Claude Desktop 请求中转到第三方模型，并支持多配置组切换。

## 环境要求

- macOS（当前已实现 Claude Desktop 配置写入）
- Node.js 18+
- Rust stable（建议通过 rustup 安装）
- Xcode Command Line Tools（macOS 打包需要）

## 安装依赖

```bash
npm install
```

## 软件使用

### 1) 启动应用

开发环境启动：

```bash
npm run tauri:dev
```

如果你使用已打包版本，双击打开应用即可。

### 2) 新建并启用配置组

打开主窗口后：

- 新增配置组（填写 Provider Base URL、API Key）
- 配置模型映射（Claude 模型 ID -> 上游模型 ID）
- 将目标配置组设为 active

### 3) 启动代理

- 在主界面点击启动代理
- 或在系统托盘菜单点击“启动代理”

默认监听本地端口（可在运行参数里修改）。代理启动后会转发：

- `GET /v1/models`
- `POST /v1/messages`

### 4) 切换配置组

可在两处切换：

- 主界面切换 active 配置组
- 系统托盘“切换配置组”子菜单一键切换

如果代理正在运行，切换 active 配置后会自动重启代理并应用新配置。

### 5) 应用到 Claude Desktop

在主界面执行“应用到 Claude Desktop”后，会把当前 active 配置写入 Claude Desktop 的 3P 配置。

### 6) 菜单栏常驻

- 关闭主窗口不会退出程序，只会隐藏到托盘
- 托盘可进行：打开设置、启动/停止代理、切换配置组、退出程序

## 参与开发

### 本地运行（开发模式）

推荐直接使用：

```bash
npm run tauri:dev
```

说明：

- 这条命令会自动启动前端 dev server（Vite）并启动 Tauri 应用。
- 你之前执行 `npm run tauri` 返回退出码 2，是因为它只是 tauri CLI 入口，没有指定子命令。
- 如果你仍想用原入口，需要写成：

```bash
npm run tauri -- dev
```

### 前端单独调试

只跑前端页面：

```bash
npm run dev
```

构建前端静态资源：

```bash
npm run build
```

### 打包发布

执行：

```bash
npm run tauri:build
```

或使用原入口：

```bash
npm run tauri -- build
```

默认产物位置（macOS）：

- `src-tauri/target/release/bundle/`

常见子目录包括：

- `dmg/`
- `macos/`
- `app/`

### 常见问题

### 1) `npm run tauri` 直接退出（exit code 2）

原因：未指定 tauri 子命令。

正确方式：

- `npm run tauri:dev`
- `npm run tauri:build`
- 或 `npm run tauri -- dev/build`

### 2) `cargo check` 通过但 `tauri build` 失败

通常与系统签名、图标、或打包环境有关。可先验证：

```bash
cd src-tauri
cargo check
```

再执行：

```bash
npm run tauri:build
```

## 当前功能

- 多配置组管理（Provider Base URL / API Key）
- 模型映射（Claude 模型 ID -> 上游模型 ID）
- 本地代理转发：
  - `GET /v1/models`
  - `POST /v1/messages`
- 设置生效后写入 Claude Desktop 3P 配置
- 切换 active 配置时，代理运行中会自动重启
- 支持运行参数设置（端口、自启动）

## 下一步规划

- 菜单栏托盘快速切换（系统托盘）
- 更完整的 SSE 流式透传和错误映射
- API Key 从本地 JSON 迁移到 Keychain
- Windows 配置路径支持
