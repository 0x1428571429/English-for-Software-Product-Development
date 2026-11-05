/**
 * 打字 / 填字功能模块的公共入口。
 *
 * 页面通过 `TypingPage` 接入路由；其他模块若需要复用挖空或校验能力，
 * 只从这里导入，避免直接依赖内部文件。
 */
export { TypingPage } from './TypingPage'
export {
  buildCloze,
  checkCloze,
  hashString,
  maskWord,
  normalizeWord,
  splitSurfaceToken,
  suggestTypingGrade,
  wordsMatch,
  type ClozeBlank,
  type ClozeCheck,
  type ClozeOptions,
  type ClozePrompt,
  type ClozeToken,
  type TypingGradeSuggestion,
} from './cloze'
export {
  TYPING_SOUND_PACKS,
  classifyTypingKey,
  configureTypingSound,
  playTypingKey,
  previewTypingSound,
  primeTypingSound,
  typingSoundFile,
  type TypingKeyKind,
  type TypingKeyPhase,
} from './sound'
