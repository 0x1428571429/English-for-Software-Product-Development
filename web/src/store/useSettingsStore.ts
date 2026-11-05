import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'dark' | 'light' | 'system'
export type TtsEngine = 'auto' | 'browser' | 'youdao' | 'baidu' | 'google'
export type TtsAccent = 'us' | 'uk'

export interface SettingsState {
  schemaVersion: 1
  dailyGoal: number
  newCardsPerDay: number
  sessionSize: number
  timerSec: number
  autoPlay: boolean
  ttsRate: number
  ttsVoiceURI: string | null
  ttsEngine: TtsEngine
  ttsAccent: TtsAccent
  asrEnabled: boolean
  theme: ThemeMode
  showTranslation: boolean
  update: (patch: Partial<Omit<SettingsState, 'update' | 'reset' | 'schemaVersion'>>) => void
  reset: () => void
}

const DEFAULTS = {
  schemaVersion: 1 as const,
  dailyGoal: 20,
  newCardsPerDay: 10,
  sessionSize: 20,
  timerSec: 5,
  autoPlay: true,
  ttsRate: 0.95,
  ttsVoiceURI: null,
  ttsEngine: 'auto' as TtsEngine,
  ttsAccent: 'us' as TtsAccent,
  asrEnabled: false,
  theme: 'dark' as ThemeMode,
  showTranslation: true,
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      update: (patch) => set(patch),
      reset: () => set({ ...DEFAULTS }),
    }),
    {
      name: 'efspd.settings.v1',
      version: 1,
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        dailyGoal: state.dailyGoal,
        newCardsPerDay: state.newCardsPerDay,
        sessionSize: state.sessionSize,
        timerSec: state.timerSec,
        autoPlay: state.autoPlay,
        ttsRate: state.ttsRate,
        ttsVoiceURI: state.ttsVoiceURI,
        ttsEngine: state.ttsEngine,
        ttsAccent: state.ttsAccent,
        asrEnabled: state.asrEnabled,
        theme: state.theme,
        showTranslation: state.showTranslation,
      }),
    },
  ),
)
