import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createAppStorage } from '../lib/storage'

export type ThemeMode = 'dark' | 'light' | 'system'
export type TtsEngine = 'auto' | 'browser' | 'youdao' | 'baidu' | 'google'
export type TtsAccent = 'us' | 'uk'

export interface SettingsSnapshot {
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
}

export interface SettingsState extends SettingsSnapshot {
  update: (patch: Partial<Omit<SettingsState, 'update' | 'reset' | 'schemaVersion' | 'exportSettings' | 'importSettings'>>) => void
  exportSettings: () => SettingsSnapshot
  importSettings: (snapshot: Partial<SettingsSnapshot>) => void
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
    (set, get) => ({
      ...DEFAULTS,
      update: (patch) => set(patch),
      exportSettings: () => {
        const state = get()
        return {
          schemaVersion: 1,
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
        }
      },
      importSettings: (snapshot) =>
        set((state) => ({
          ...state,
          schemaVersion: 1,
          dailyGoal: snapshot.dailyGoal ?? state.dailyGoal,
          newCardsPerDay: snapshot.newCardsPerDay ?? state.newCardsPerDay,
          sessionSize: snapshot.sessionSize ?? state.sessionSize,
          timerSec: snapshot.timerSec ?? state.timerSec,
          autoPlay: snapshot.autoPlay ?? state.autoPlay,
          ttsRate: snapshot.ttsRate ?? state.ttsRate,
          ttsVoiceURI: snapshot.ttsVoiceURI ?? state.ttsVoiceURI,
          ttsEngine: snapshot.ttsEngine ?? state.ttsEngine,
          ttsAccent: snapshot.ttsAccent ?? state.ttsAccent,
          asrEnabled: snapshot.asrEnabled ?? state.asrEnabled,
          theme: snapshot.theme ?? state.theme,
          showTranslation: snapshot.showTranslation ?? state.showTranslation,
        })),
      reset: () => set({ ...DEFAULTS }),
    }),
    {
      name: 'efspd.settings.v1',
      storage: createAppStorage(),
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
