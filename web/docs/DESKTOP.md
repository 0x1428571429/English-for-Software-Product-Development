# 桌面版（Tauri v2）

Web 版可以直接在浏览器 / PWA 里用；桌面版用 Tauri v2 + 系统 WebView（Windows 上是 WebView2）打包成原生窗口和安装包，界面与数据逻辑完全复用 `web/`。

## 前置

- Node.js 22+
- Rust stable（MSVC 工具链）
- Visual Studio Build Tools（C++ 桌面开发 + Windows SDK）
- Windows 10/11 自带 WebView2 Runtime

检查：

```bash
rustc --version
cargo --version
npm run tauri -- --version
```

## 开发

```bash
cd web
npm install
npm run desktop:dev
```

`desktop:dev` 会先启动 Vite（`beforeDevCommand`），再编译 Rust 并打开原生窗口。首次编译需要下载 crates，时间取决于网络。

## 构建

```bash
cd web
npm run desktop:build
```

产物：

- 可执行文件：`web/src-tauri/target/release/blurt.exe`
- 安装包：`web/src-tauri/target/release/bundle/nsis/Blurt_1.0.1_x64-setup.exe`

只编译、不打安装包：

```bash
npm run tauri -- build --no-bundle
```

## 桌面端与 Web 版的差异

| 项目 | Web / PWA | 桌面版 |
|---|---|---|
| Service Worker | 启用，可离线安装 | 关闭（Tauri 直接加载本地 dist，不需要 SW） |
| 数据存储 | 浏览器 IndexedDB | WebView2 profile 内的 IndexedDB，与浏览器数据独立 |
| 导出备份 | Blob 下载 | 原生保存对话框（Rust `save_backup` 命令），失败/取消有提示 |
| 语音识别 | Chrome/Edge 支持 | WebView2 不支持 `webkitSpeechRecognition`，相关入口按特性检测自动隐藏 |
| TTS | 系统音色 / 百度 / Google / Edge 代理 | 相同；Edge Natural 仍需要本地 `npm run tts:proxy`，未配置时自动回退百度或系统音色 |
| 安装 | 浏览器安装 PWA | NSIS 安装包，当前用户安装，无需管理员 |

## 数据与升级

- 桌面版数据在 WebView2 的用户数据目录里，升级安装包不会清空。
- 应用标识仍保留 `com.reflexenglish.trainer`，所以从旧名「Reflex English」改名到「Blurt（脱口）」不会切换数据目录；旧版本可以手动卸载，数据会保留。
- 换机或重装前，在设置页「导出全部数据」，再到新机器导入。
- Web 版与桌面版的数据默认不互通，需要备份文件迁移。

## 已做的适配

1. `vite.config.ts` 支持 `--mode desktop`：桌面构建不注册 PWA、不生成 Service Worker。
2. `src/lib/desktop.ts` 检测 Tauri 环境。
3. 设置页导出在桌面版调用 `save_backup`，由 Rust 弹原生保存框并写文件。
4. `src-tauri/` 只包含窗口、图标、备份命令和最小权限，前端仍是一个普通 Vite 应用。

## 已知限制

- Edge TTS 代理尚未内置到桌面进程：需要单独运行 `npm run tts:proxy`，并在设置里填 `http://127.0.0.1:8787`。后续可以把代理端口用 Rust 重写或作为 sidecar 打包。
- WebView2 的语音识别能力取决于运行时版本；当前按不支持处理。
- 还没有自动更新（Tauri updater）和代码签名，安装包首次运行可能触发 SmartScreen 提示。
