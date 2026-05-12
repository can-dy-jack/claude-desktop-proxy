# Claude Desktop Proxy

中文说明: [README.md](./README.md) | English version: [README.en.md](./README.en.md)

Claude Desktop 的本地代理客户端（Tauri v2 + React），用于将 Claude Desktop 请求中转到第三方模型，并支持多配置组切换。


## 软件使用

1. 打开 claude desktop 的三方配置功能
2. 设置gateway
  1. Gateway base URL 配置为本软件的代理地址，一般是 http://127.0.0.1:15800
  2. Gateway API key随便填一个（这个在本软件里统一管理）
  ![](./images/claude-1.png)
  3. Model list 仅用于告诉 Claude 可选模型名。建议与本软件里的 Claude 模型映射一致；默认可使用：claude-sonnet-4-6、claude-opus-4-1、claude-haiku-3-5。
  ![](./images/claude-2.png)
  4. 应用到本地，软件重启。
3. 启动本软件，在这里管理你的模型组。设置真正的接口地址、api Key 以及模型映射之后，点击生效，并开启代理即可代理成功。
4. 代理转发时会严格按“Claude 模型 -> 上游模型”映射替换请求中的 model；如果请求模型未配置映射，会返回 400。
![](./images/app-1.png)
![](./images/app-2.png)



## 参与开发

### 安装依赖

```bash
npm install
```

### 本地运行（开发模式）

推荐直接使用：

```bash
npm run tauri:dev
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

默认产物位置（macOS）：

- `src-tauri/target/release/bundle/`

### 触发流水线

```bash
git tag v0.1.0
git push origin v0.1.0
```

