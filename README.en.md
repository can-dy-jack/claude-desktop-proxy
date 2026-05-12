# Claude Desktop Proxy

English version: [README.en.md](./README.en.md) | 中文说明: [README.md](./README.md)

A local proxy client for Claude Desktop (Tauri v2 + React). It forwards Claude Desktop requests to third-party models and supports switching between multiple profile groups.

## Usage

1. Enable third-party configuration in Claude Desktop.
2. Configure the gateway.
   1. Set Gateway base URL to this app's proxy address, usually http://127.0.0.1:15800.
   2. Gateway API key can be any value (it is managed centrally in this app).
   ![](./images/claude-1.png)
   3. Model list only tells Claude which model names are available. It is recommended to keep it consistent with the Claude-to-upstream model mapping in this app. Default examples: claude-sonnet-4-6, claude-opus-4-1, claude-haiku-3-5.
   ![](./images/claude-2.png)
   4. Apply changes locally and restart Claude Desktop.
3. Start this app and manage your model profiles here. After setting the real API base URL, API key, and model mappings, click Apply and enable proxying.
4. During proxy forwarding, requests strictly replace model values according to the mapping (Claude model -> upstream model). If no mapping exists for the requested model, a 400 response is returned.

![](./images/app-1.png)
![](./images/app-2.png)

## Development

### Install dependencies

```bash
npm install
```

### Run locally (development mode)

Recommended:

```bash
npm run tauri:dev
```

### Frontend-only debugging

Run frontend only:

```bash
npm run dev
```

Build frontend static assets:

```bash
npm run build
```

### Build for release

Run:

```bash
npm run tauri:build
```

Default output path (macOS):

- `src-tauri/target/release/bundle/`

### Trigger release pipeline

```bash
git tag v0.1.0
git push origin v0.1.0
```
