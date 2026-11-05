import { useEffect, useRef, useState } from 'react'
import { Download, RotateCcw, Upload, Volume2 } from 'lucide-react'
import { useCorpus } from '../data/CorpusContext'
import { useSettingsStore, type TtsAccent, type TtsEngine } from '../store/useSettingsStore'
import { englishVoices, loadVoices, refreshVoices, speak, voiceQuality } from '../lib/speech'
import { EDGE_VOICES } from '../features/tts'
import { TYPING_SOUND_PACKS, previewTypingSound } from '../features/typing'
import {
  clearAllData,
  createBackup,
  formatBytes,
  importBackup,
  storageStats,
  type StorageStats,
} from '../lib/backup'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { isTauri, saveTextFile } from '../lib/desktop'

const TTS_ENGINES: { value: TtsEngine; label: string; hint: string }[] = [
  { value: 'auto', label: '自动（推荐）', hint: '优先自然系统音色；配置了 Edge 代理时用 Edge，否则用百度在线' },
  { value: 'edge', label: '在线 · Edge Natural', hint: '微软 Edge 同款自然音色，免费；非官方接口，失败会自动回退' },
  { value: 'baidu', label: '在线 · 百度', hint: '美音，国内可直接访问，长句稳定' },
  { value: 'google', label: '在线 · Google', hint: '更自然，但需要能访问 Google' },
  { value: 'browser', label: '系统音色', hint: '使用电脑里安装的英文语音包' },
]

const VOICE_COMPARE: { label: string; engine: TtsEngine; accent: TtsAccent }[] = [
  { label: 'Edge · 美音', engine: 'edge', accent: 'us' },
  { label: '百度 · 美音', engine: 'baidu', accent: 'us' },
  { label: 'Google · 美音', engine: 'google', accent: 'us' },
  { label: 'Google · 英音', engine: 'google', accent: 'uk' },
  { label: '系统', engine: 'browser', accent: 'us' },
]

const PREVIEW_TEXT = "Still on it. Almost there. That's not a bug. That's how the business logic works."

export function SettingsPage() {
  const { corpus, loading } = useCorpus()
  const settings = useSettingsStore()
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voicesLoaded, setVoicesLoaded] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [stats, setStats] = useState<StorageStats | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const refreshStats = () => {
    void storageStats().then(setStats)
  }

  useEffect(() => {
    refreshStats()
  }, [])

  useEffect(() => {
    void loadVoices().then((all) => {
      setVoices(englishVoices(all))
      setVoicesLoaded(true)
    })
  }, [])

  const reloadVoices = () => {
    setVoicesLoaded(false)
    void refreshVoices().then((all) => {
      setVoices(englishVoices(all))
      setVoicesLoaded(true)
    })
  }

  const preview = (engine: TtsEngine, accent: TtsAccent = settings.ttsAccent) => {
    void speak(PREVIEW_TEXT, {
      engine,
      accent,
      rate: settings.ttsRate,
      voiceURI: settings.ttsVoiceURI,
    })
  }

  if (loading || !corpus) {
    return <div className="py-24 text-center text-muted">正在加载语料…</div>
  }

  const download = async () => {
    const payload = createBackup()
    const contents = JSON.stringify(payload, null, 2)
    const filename = `blurt-backup-${new Date().toISOString().slice(0, 10)}.json`

    // 桌面壳里 WebView2 的下载行为不可靠，直接用原生保存对话框。
    if (isTauri()) {
      try {
        const path = await saveTextFile(filename, contents)
        setMessage(path ? `全部数据已导出到 ${path}` : '已取消导出。')
        refreshStats()
      } catch {
        setMessage('导出失败：无法写入所选位置。')
      }
      return
    }

    const blob = new Blob([contents], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
    setMessage('全部数据已导出（进度、设置、剧情、生词本）。')
    refreshStats()
  }

  const handleFile = async (file: File) => {
    try {
      const text = await file.text()
      const payload = JSON.parse(text) as unknown
      if (!window.confirm('导入会覆盖对应模块的当前数据。建议先导出备份。继续？')) return
      const result = importBackup(payload)
      setMessage(
        `已导入：${result.imported.join('、') || '无'}${result.skipped.length ? `；已跳过未知模块：${result.skipped.join('、')}` : ''}。`,
      )
      refreshStats()
    } catch {
      setMessage('文件解析失败。请确认这是脱口导出的 JSON 备份。')
    }
  }

  const handleClearAll = async () => {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    await clearAllData()
    setConfirmClear(false)
    setMessage('全部本地数据已清空。')
    refreshStats()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-muted">Settings</p>
        <h1 className="mt-1 text-3xl font-semibold">设置</h1>
        <p className="mt-2 text-sm text-muted">训练节奏、语音和进度备份都在这里。</p>
      </div>

      <section className="card-surface space-y-5 p-5">
        <h2 className="text-sm font-medium text-cream">训练节奏</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            label="每日目标（张）"
            value={settings.dailyGoal}
            min={5}
            max={200}
            step={5}
            onChange={(value) => settings.update({ dailyGoal: value })}
            hint="首页环形进度按这个算"
          />
          <NumberField
            label="每日新卡上限"
            value={settings.newCardsPerDay}
            min={0}
            max={100}
            step={5}
            onChange={(value) => settings.update({ newCardsPerDay: value })}
            hint="到期复习不受此限制"
          />
          <NumberField
            label="每组卡片数"
            value={settings.sessionSize}
            min={5}
            max={100}
            step={5}
            onChange={(value) => settings.update({ sessionSize: value })}
            hint="一组做完可结算"
          />
          <label className="block">
            <span className="text-xs text-muted">每题限时</span>
            <select
              value={settings.timerSec}
              onChange={(event) => settings.update({ timerSec: Number(event.target.value) })}
              className="mt-1 w-full rounded-xl border border-line bg-panel px-3 py-2.5 text-sm text-cream outline-none focus:border-accent/60"
            >
              <option value={3}>3 秒（高压）</option>
              <option value={5}>5 秒（推荐）</option>
              <option value={8}>8 秒（宽松）</option>
              <option value={0}>不限时</option>
            </select>
            <span className="mt-1 block text-xs text-muted">超时自动揭示，不计入正确</span>
          </label>
        </div>
      </section>

      <section className="card-surface space-y-4 p-5">
        <div>
          <h2 className="text-sm font-medium text-cream">声音与输入</h2>
          <p className="mt-1 text-xs leading-5 text-muted">
            系统里只有中文发音时，直接读英文会很生硬。在线引擎不需要安装语音包，按你听到的效果选一个就行。
          </p>
        </div>

        <div className="space-y-2">
          <span className="text-xs text-muted">发音引擎</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {TTS_ENGINES.map((engine) => {
              const active = settings.ttsEngine === engine.value
              return (
                <button
                  key={engine.value}
                  type="button"
                  onClick={() => settings.update({ ttsEngine: engine.value })}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    active
                      ? 'border-accent/60 bg-accent/10'
                      : 'border-line bg-panel hover:border-accent/30'
                  }`}
                >
                  <span className={`text-sm ${active ? 'text-accent' : 'text-cream'}`}>
                    {engine.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-4 text-muted">
                    {engine.hint}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-muted">口音</span>
            <select
              value={settings.ttsAccent}
              onChange={(event) => settings.update({ ttsAccent: event.target.value as TtsAccent })}
              disabled={settings.ttsEngine === 'baidu'}
              className="rounded-lg border border-line bg-panel px-2 py-1.5 text-xs text-cream outline-none disabled:opacity-50"
            >
              <option value="us">美音</option>
              <option value="uk">英音</option>
            </select>
            <span className="text-xs text-muted">百度只有美音；系统音色取决于安装的语音包</span>
          </div>

          {(settings.ttsEngine === 'edge' || settings.ttsEngine === 'auto') && (
            <div className="block pt-1">
              <span className="text-xs text-muted">Edge 音色</span>
              <select
                value={settings.ttsEdgeVoice}
                onChange={(event) => settings.update({ ttsEdgeVoice: event.target.value })}
                className="mt-1 w-full rounded-xl border border-line bg-panel px-3 py-2.5 text-sm text-cream outline-none focus:border-accent/60"
              >
                {EDGE_VOICES.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.label}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs leading-4 text-muted">
                自动模式只在系统没有自然英文音色时使用 Edge；失败会回退到百度 / Google / 系统音色。
              </span>
              <label className="mt-3 block">
                <span className="text-xs text-muted">Edge 代理地址（可选）</span>
                <input
                  value={settings.ttsEdgeProxy}
                  onChange={(event) => settings.update({ ttsEdgeProxy: event.target.value })}
                  placeholder="http://127.0.0.1:8787"
                  className="mt-1 w-full rounded-xl border border-line bg-panel px-3 py-2.5 text-sm text-cream outline-none placeholder:text-muted/60 focus:border-accent/60"
                />
                <span className="mt-1 block text-xs leading-4 text-muted">
                  浏览器直连会被微软握手校验拦截（403）。本地运行 <code>npm run tts:proxy</code>，
                  把地址填到这里即可；留空则尝试直连并自动回退。
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-line bg-panel-2/30 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => preview(settings.ttsEngine)}>
              <Volume2 size={14} /> 试听当前
            </Button>
            <span className="text-xs text-muted">对比音色：</span>
            {VOICE_COMPARE.map((item) => (
              <button
                key={`${item.engine}-${item.accent}`}
                type="button"
                onClick={() => preview(item.engine, item.accent)}
                className="rounded-full border border-line px-2.5 py-1 text-xs text-muted transition-colors hover:border-accent/40 hover:text-accent"
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs leading-4 text-muted">
            试听句：Still on it. Almost there. That's not a bug. That's how the business logic works.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex-1">
            <span className="text-xs text-muted">系统英文音色（自动 / 系统引擎使用）</span>
            <select
              value={settings.ttsVoiceURI ?? ''}
              onChange={(event) => settings.update({ ttsVoiceURI: event.target.value || null })}
              className="mt-1 w-full rounded-xl border border-line bg-panel px-3 py-2.5 text-sm text-cream outline-none focus:border-accent/60"
            >
              <option value="">自动选择最佳音色</option>
              {voices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang} · {voiceQuality(voice) === 'natural' ? '自然/在线' : '本地'})
                </option>
              ))}
            </select>
          </label>
          <Button variant="ghost" size="sm" onClick={reloadVoices}>
            重新检测
          </Button>
        </div>

        {voicesLoaded && voices.length === 0 && (
          <p className="rounded-xl border border-warn/30 bg-warn/10 p-3 text-xs leading-5 text-warn">
            没有检测到英文系统音色。浏览器会用中文发音去读英文，听起来会很生硬。建议保持「自动」或选在线引擎；也可以安装英文语音包，或改用 Edge 浏览器（自带更自然的英文音色）。
          </p>
        )}

        <label className="block">
          <span className="text-xs text-muted">朗读速度 · {settings.ttsRate.toFixed(2)}×</span>
          <input
            type="range"
            min={0.6}
            max={1.3}
            step={0.05}
            value={settings.ttsRate}
            onChange={(event) => settings.update({ ttsRate: Number(event.target.value) })}
            className="mt-2 w-full accent-[var(--color-accent)]"
          />
        </label>

        <div className="space-y-4 border-t border-line/60 pt-4">
          <Toggle
            label="揭示后自动播放答案"
            description="使用上面选择的发音引擎朗读标准答案"
            checked={settings.autoPlay}
            onChange={(checked) => settings.update({ autoPlay: checked })}
          />
          <Toggle
            label="显示中文翻译"
            description="对话和例句里显示中文；关闭后更接近真实语境"
            checked={settings.showTranslation}
            onChange={(checked) => settings.update({ showTranslation: checked })}
          />
          <Toggle
            label="启用语音识别"
            description="仅 Chrome / Edge 支持；识别结果只作提示，最终仍由你自评"
            checked={settings.asrEnabled}
            onChange={(checked) => settings.update({ asrEnabled: checked })}
          />
        </div>
      </section>

      <section className="card-surface space-y-4 p-5">
        <div>
          <h2 className="text-sm font-medium text-cream">打字音效</h2>
          <p className="mt-1 text-xs leading-5 text-muted">
            只在打字 / 填字训练的输入框里播放，本地加载，不会上传输入内容。音效来自开源项目 thock（CC0）。
          </p>
        </div>

        <div className="space-y-3">
          <Toggle
            label="启用打字音效"
            description="按键按下和回弹都会发声；可在训练页右上角快速静音"
            checked={settings.typingSoundEnabled}
            onChange={(checked) => settings.update({ typingSoundEnabled: checked })}
          />

          <div className="space-y-2">
            <span className="text-xs text-muted">音效包（点一下试听）</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {TYPING_SOUND_PACKS.map((pack) => {
                const active = settings.typingSoundPack === pack.value
                return (
                  <button
                    key={pack.value}
                    type="button"
                    onClick={() => {
                      settings.update({ typingSoundPack: pack.value, typingSoundEnabled: true })
                      void previewTypingSound(pack.value, settings.typingSoundVolume)
                    }}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      active ? 'border-accent/60 bg-accent/10' : 'border-line bg-panel hover:border-accent/30'
                    }`}
                  >
                    <span className={`text-sm ${active ? 'text-accent' : 'text-cream'}`}>{pack.label}</span>
                    <span className="mt-0.5 block text-xs leading-4 text-muted">{pack.hint}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex min-w-56 flex-1 items-center gap-3 text-xs text-muted">
              音量
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.typingSoundVolume}
                onChange={(event) => settings.update({ typingSoundVolume: Number(event.target.value) })}
                className="min-w-24 flex-1 accent-[var(--color-accent)]"
              />
              <span className="w-9 text-right tabular-nums">{Math.round(settings.typingSoundVolume * 100)}%</span>
            </label>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                settings.update({ typingSoundEnabled: true })
                void previewTypingSound(settings.typingSoundPack, settings.typingSoundVolume)
              }}
            >
              <Volume2 size={14} /> 试听当前
            </Button>
          </div>
        </div>
      </section>

      <section className="card-surface space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-cream">数据备份与存储</h2>
            <p className="mt-1 text-xs leading-5 text-muted">
              进度、设置、剧情和生词本保存在本机 IndexedDB。换设备或清理浏览器前，先导出完整 JSON。
              导入兼容旧版「仅进度」备份，未知模块会被跳过，不会破坏现有数据。
            </p>
          </div>
          <Badge tone={stats?.supported ? 'accent' : 'warn'}>
            {stats?.supported ? 'IndexedDB 已启用' : '降级到 localStorage'}
          </Badge>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-line/70 bg-ink/40 p-3">
            <p className="text-2xs text-muted">存储模块</p>
            <p className="mt-0.5 text-lg font-semibold text-cream">{stats?.keys.length ?? 0}</p>
          </div>
          <div className="rounded-xl border border-line/70 bg-ink/40 p-3">
            <p className="text-2xs text-muted">已用空间</p>
            <p className="mt-0.5 text-lg font-semibold text-cream">
              {stats ? formatBytes(stats.usage) : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-line/70 bg-ink/40 p-3">
            <p className="text-2xs text-muted">可用配额</p>
            <p className="mt-0.5 text-lg font-semibold text-cream">
              {stats?.quota ? formatBytes(stats.quota) : '—'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => void download()}>
            <Download size={16} /> 导出全部数据
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> 导入备份
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleFile(file)
              event.target.value = ''
            }}
          />
          <Button variant={confirmClear ? 'danger' : 'ghost'} onClick={() => void handleClearAll()}>
            <RotateCcw size={16} /> {confirmClear ? '再点一次确认清空' : '清空全部数据'}
          </Button>
        </div>
        {message && <p className="text-sm text-accent">{message}</p>}
        <p className="text-xs leading-5 text-muted">
          备份格式：<code className="rounded bg-panel-2 px-1 py-0.5">efspd-backup / formatVersion 1</code>。
          每个模块独立版本号，升级时只迁移对应模块，不会互相覆盖。
        </p>
      </section>

      <section className="card-surface space-y-3 p-5">
        <h2 className="text-sm font-medium text-cream">语料信息</h2>
        <div className="flex flex-wrap gap-1.5">
          <Badge>{corpus.report.cards} 张卡</Badge>
          <Badge>{corpus.report.dialogueLines} 句对话</Badge>
          <Badge>{corpus.report.expressions} 个表达</Badge>
          <Badge>{corpus.report.vocab} 个词汇</Badge>
          <Badge>{corpus.report.pronunciation} 个发音词</Badge>
          <Badge tone="muted">内容版本 {corpus.contentVersion}</Badge>
        </div>
        <p className="text-xs leading-5 text-muted">
          语料来自 GitHub 仓库 English-for-Software-Product-Development，构建时解析 Markdown 生成。第 10 章（Slack）和第 15 章（用户指导）的对话翻译较少，已自动降级为角色扮演/听力素材。
        </p>
      </section>
    </div>
  )
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  hint,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  hint: string
  onChange: (value: number) => void
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value)
          if (Number.isFinite(next)) onChange(Math.max(min, Math.min(max, next)))
        }}
        className="mt-1 w-full rounded-xl border border-line bg-panel px-3 py-2.5 text-sm text-cream outline-none focus:border-accent/60"
      />
      <span className="mt-1 block text-xs text-muted">{hint}</span>
    </label>
  )
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm text-cream">{label}</p>
        <p className="mt-0.5 text-xs text-muted">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink ${
          checked ? 'border-accent/50 bg-accent/30' : 'border-line bg-panel-2'
        }`}
        role="switch"
        aria-checked={checked}
        aria-label={label}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-[18px] w-[18px] rounded-full bg-cream shadow-sm transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
