# 打字音效

打字 / 填字训练在输入框里播放机械键盘音效，目的是给拼写过程一个即时、低压力的反馈，不播放页面其他位置的按键声。

## 已接入

| 音效包 | 听感 | 用途 |
| --- | --- | --- |
| Clicky（默认） | 清脆、短促，接近青轴 | 默认；高频瞬态最明显 |
| Tactile | 有段落感，声音干净 | 喜欢茶轴段落感 |
| Thock | 低沉、闷响，接近润滑线性轴 | 办公室/夜间，存在感低 |
| Typewriter | 老式打字机，机械感重 | 想要更强节奏感 |

实现位于 `src/features/typing/sound.ts`：

- `classifyTypingKey` 把按键映射到 `key / space / enter / backspace`，修饰键和方向键不发声。
- 按下、回弹各播放一个采样，回弹音量更低；Backspace 回弹复用 `key_release.wav`。
- 采样通过 Web Audio 解码后缓存为 `AudioBuffer`，首屏预加载当前音效包。
- 每次播放随机微调音高（`playbackRate` 1.00–1.08）和音量（±6%），并加 180 Hz 高通，避免连续打字像复读机、也去掉低频闷响。
- 只在 `INPUT` / `TEXTAREA` 内、且处于训练阶段时发声；输入法组合、`Ctrl/Meta/Alt` 组合键和长按 repeat 都会跳过。
- 设置页可开关、切换音效包、调音量、试听；训练页右上角可快速静音。
- WAV 已加入 PWA 预缓存（`vite.config.ts` 的 `globPatterns`），离线可用。

设置持久化在 `useSettingsStore`：`typingSoundEnabled`、`typingSoundPack`、`typingSoundVolume`。persist 版本为 2，旧版本默认的 `thock` 会迁移到 `clicky`。

## 素材来源与许可证

当前打包的 4 套采样来自 [ArahKarya/thock](https://github.com/ArahKarya/thock)：

- 仓库代码：MIT
- `src-tauri/sounds/{thock,clicky,tactile,typewriter}/*.wav`：CC0-1.0（程序化合成，公共领域）
- 本仓库只保留打字训练用到的 `key / space / enter / backspace` 按下与回弹采样，共 32 个 WAV，约 184 KB。
- 完整声明见 [`public/sounds/LICENSE.txt`](../public/sounds/LICENSE.txt)。

## 调研过的项目

| 项目 | 许可证 | 结论 |
| --- | --- | --- |
| [ArahKarya/thock](https://github.com/ArahKarya/thock) | MIT（代码）/ CC0-1.0（音效） | **已采用**：音效可自由打包，体积小，4 套风格齐全 |
| [sunilband/thock-mania](https://github.com/sunilband/thock-mania) | Apache-2.0 | Web Audio 打字测试的参考实现；未直接复制代码 |
| [orhun/daktilo](https://github.com/orhun/daktilo) | Apache-2.0 | Rust 终端打字音效，声音设计参考；技术栈不同，未接入 |
| [ZacharyL2/KeyEcho](https://github.com/ZacharyL2/KeyEcho) | AGPL-3.0 | 不直接复制代码或素材，避免把整个项目拖入 AGPL |
| TypingClub / edclub | 专有版权 | **未使用**，见下 |

## 为什么没有用 TypingClub 的素材

TypingClub 是商业产品，页面和音频默认受版权保护。其 [Terms of Service](https://www.edclub.com/terms) 写明：

> The Service and all content (the "Content") on the TypingClub website is the proprietary intellectual property of TypingClub

并禁止 “use, copy, modify or create derivative works of the Services or Content or any part thereof” 以及再分发。因此本项目没有下载、复制或打包 TypingClub 的音频/图片，只把它当作「清脆反馈」的交互参考。

如果确实拿到了 TypingClub / edclub 的书面授权，或拥有其他可商用采样，可以按下面的扩展点接入。

## 新增音效包

1. 把 8 个 WAV 放到 `public/sounds/<pack>/`：
   `key_press.wav`、`key_release.wav`、`space_press.wav`、`space_release.wav`、`enter_press.wav`、`enter_release.wav`、`backspace_press.wav`；Backspace 回弹复用 `key_release.wav`。
2. 在 `src/store/useSettingsStore.ts` 的 `TypingSoundPack` 联合类型中加入新值。
3. 在 `src/features/typing/sound.ts` 的 `TYPING_SOUND_PACKS` 中加一项（值、名称、听感说明）。
4. 在 `public/sounds/LICENSE.txt` 记录来源、作者、许可证和原始 URL。
5. 运行 `npm run typecheck && npm run test && npm run build`，确认 WAV 被 PWA 预缓存。
