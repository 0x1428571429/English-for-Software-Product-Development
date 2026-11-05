import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createAppStorage } from '../lib/storage'

export type ThemeMode = 'dark' | 'light' | 'system'
export type TtsEngine = 'auto' | 'browser' | 'edge' | 'youdao' | 'baidu' | 'google'
export type TtsAccent = 'us' | 'uk'
export type TypingSoundPack = 'clicky' | 'tactile' | 'thock' | 'typewriter'

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
  ttsEdgeVoice: string
  ttsEdgeProxy: string
  ttsAccent: TtsAccent
  typingSoundEnabled: boolean
  typingSoundPack: TypingSoundPack
  typingSoundVolume: number
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
  ttsEdgeVoice: 'en-US-AriaNeural',
  ttsEdgeProxy: '',
  ttsAccent: 'us' as TtsAccent,
  typingSoundEnabled: true,
  typingSoundPack: 'clicky' as TypingSoundPack,
  typingSoundVolume: 0.5,
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
          ttsEdgeVoice: state.ttsEdgeVoice,
          ttsEdgeProxy: state.ttsEdgeProxy,
          ttsAccent: state.ttsAccent,
          typingSoundEnabled: state.typingSoundEnabled,
          typingSoundPack: state.typingSoundPack,
          typingSoundVolume: state.typingSoundVolume,
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
          ttsEdgeVoice: snapshot.ttsEdgeVoice ?? state.ttsEdgeVoice,
          ttsEdgeProxy: snapshot.ttsEdgeProxy ?? state.ttsEdgeProxy,
          ttsAccent: snapshot.ttsAccent ?? state.ttsAccent,
          typingSoundEnabled: snapshot.typingSoundEnabled ?? state.typingSoundEnabled,
          typingSoundPack: snapshot.typingSoundPack ?? state.typingSoundPack,
          typingSoundVolume: snapshot.typingSoundVolume ?? state.typingSoundVolume,
          asrEnabled: snapshot.asrEnabled ?? state.asrEnabled,
          theme: snapshot.theme ?? state.theme,
          showTranslation: snapshot.showTranslation ?? state.showTranslation,
        })),
      reset: () => set({ ...DEFAULTS }),
    }),
    {
      name: 'efspd.settings.v1',
      storage: createAppStorage(),
      version: 2,
      migrate: (persisted, version) => {
        const state = persisted as Partial<SettingsState> | undefined
        if (!state) return persisted as SettingsState
        // v2: 默认音效从闷响的 thock 改成更清脆的 clicky。
        if (version < 2 && state.typingSoundPack === 'thock') {
          return { ...state, typingSoundPack: 'clicky' } as SettingsState
        }
        return state as SettingsState
      },
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
        ttsEdgeVoice: state.ttsEdgeVoice,
        ttsEdgeProxy: state.ttsEdgeProxy,
        ttsAccent: state.ttsAccent,
        typingSoundEnabled: state.typingSoundEnabled,
        typingSoundPack: state.typingSoundPack,
        typingSoundVolume: state.typingSoundVolume,
        asrEnabled: state.asrEnabled,
        theme: state.theme,
        showTranslation: state.showTranslation,
      }),
    },
  ),
)
