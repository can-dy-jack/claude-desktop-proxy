# Claude Desktop Proxy

English version: [README.en.md](./README.en.md) | 中文说明: [README.md](./README.md)

> **⚠️ This project is no longer maintained**
>
> This repository no longer receives new features or bug fixes. Please use [**cc-switch**](https://github.com/farion1231/cc-switch) instead — a cross-platform desktop tool for Claude Code, Codex, and more, with active development and broader capabilities.

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

### Build artifact locations

After local packaging, installers are available at:

- macOS: `src-tauri/target/release/bundle/dmg/`
- Windows: `src-tauri/target/release/bundle/msi/` or `src-tauri/target/release/bundle/nsis/`
- Common bundle root: `src-tauri/target/release/bundle/`

After GitHub Actions completes, installers are uploaded to the GitHub Releases page for the corresponding tag.

### Common installation issues

1. Blank console window on Windows

This happens when the app is launched as a console subsystem app. The project now sets:

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
```

So release builds should not show a blank console window.

2. "App is damaged" on macOS

In most cases, this is Gatekeeper blocking an unsigned / unnotarized package, not a corrupted build output.

If you do not have an Apple Developer account, prefer downloading `.app.tar.gz` from Releases (instead of dmg), then run this before first launch:

```bash
xattr -dr com.apple.quarantine "/Applications/Claude Desktop Proxy.app"
codesign --force --deep --sign - "/Applications/Claude Desktop Proxy.app"
```

Notes:

- The first command removes the quarantine flag from downloaded files.
- The second command applies local ad-hoc signing (no developer account required), which helps reduce "app is damaged" / "developer cannot be verified" prompts.

To make macOS installs work smoothly, configure these repository secrets (workflow support is already included):

- `APPLE_CERTIFICATE`
- `APPLE_CERTIFICATE_PASSWORD`
- `APPLE_SIGNING_IDENTITY`
- `APPLE_ID`
- `APPLE_PASSWORD`
- `APPLE_TEAM_ID`

If these variables are not set, builds can still be produced, but macOS may block launching the app.
