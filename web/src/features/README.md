# 功能模块约定

新功能优先放在 `src/features/<module>/` 下，而不是继续堆进 `src/pages/` 和 `src/lib/`。

一个模块至少包含：

```
features/<module>/
├── index.ts          # 唯一公共入口：页面、纯函数、类型
├── <logic>.ts        # 纯逻辑：不依赖 React、不读写存储
├── <logic>.test.ts   # 与逻辑同目录的单元测试
├── <Name>Page.tsx    # 页面 / 会话编排
└── README.md         # 模块边界、数据流、扩展点
```

约束：

1. **外部只从 `index.ts` 导入**，模块内部文件可以自由重构。
2. **规则与 UI 分离**：挖空、判分、生成题干等规则放在纯函数里，页面只负责状态和渲染。
3. **不直接读写 localStorage / IndexedDB**：需要持久化时通过 `src/store/` 暴露的 action。例外：模块私有的纯缓存（如 `features/tts/cache.ts` 的音频缓存）可以自己管理，但不得承载用户进度或需要备份的数据。
4. **可单独测试**：模块的纯逻辑测试不渲染页面，也不需要浏览器 API。
5. **路由集中注册**：在 `src/App.tsx` 引入模块的 `index.ts`；模块自己不注册全局路由。

现有模块：

| 模块 | 内容 |
|------|------|
| `typing/` | 打字 / 填字训练：挖空算法、键盘音效、页面、测试 |
| `tts/` | Edge TTS 协议、音频缓存、测试 |

现有的 `src/pages/*` 是第一版按“页面类型”组织的代码。后续重构时可以逐页迁移到 `features/`，不需要一次性大改：

| 现有页面 | 可迁移模块 |
|----------|------------|
| `DrillPage` | `features/reflection` |
| `ScenarioPage` | `features/scenario` |
| `DialoguePage` | `features/dialogue` |
| `ListeningPage` | `features/listening` |
| `StoryPage` / `StoryEpisodePage` | `features/story` |
| `CareerPage` | `features/career` |
| `WordsPage` + `components/words` | `features/words` |

迁移时保持 `data/`、`store/`、`lib/` 的公共 API 不变，先把页面和纯逻辑搬进模块，再逐步决定哪些 store 也归模块所有。

当前已按此约定实现的模块：

- [`typing`](./typing/README.md)：打字 / 填字训练。
