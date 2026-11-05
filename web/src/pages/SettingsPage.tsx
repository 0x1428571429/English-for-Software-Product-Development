import { useEffect, useRef, useState } from 'react'
import { Download, RotateCcw, Upload, Volume2 } from 'lucide-react'
import { useCorpus } from '../data/CorpusContext'
import { useSettingsStore, type TtsAccent, type TtsEngine } from '../store/useSettingsStore'
import { useProgressStore, type ProgressExport } from '../store/useProgressStore'
import { englishVoices, loadVoices, refreshVoices, speak, voiceQuality } from '../lib/speech'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'

const TTS_ENGINES: { value: TtsEngine; label: string; hint: string }[] = [
  { value: 'auto', label: '自动（推荐）', hint: '有自然的系统英文音色就用系统，否则用百度在线' },
  { value: 'baidu', label: '在线 · 百度', hint: '美音，国内可直接访问，长句稳定' },
  { value: 'google', label: '在线 · Google', hint: '更自然，但需要能访问 Google' },
  { value: 'browser', label: '系统音色', hint: '使用电脑里安装的英文语音包' },
]

const VOICE_COMPARE: { label: string; engine: TtsEngine; accent: TtsAccent }[] = [
  { label: '百度 · 美音', engine: 'baidu', accent: 'us' },
  { label: 'Google · 美音', engine: 'google', accent: 'us' },
  { label: 'Google · 英音', engine: 'google', accent: 'uk' },
  { label: '系统', engine: 'browser', accent: 'us' },
]

const PREVIEW_TEXT = "Still on it. Almost there. That's not a bug. That's how the business logic works."

export function SettingsPage() {
  const { corpus, loading } = useCorpus()
  const settings = useSettingsStore()
  const exportProgress = useProgressStore((state) => state.exportProgress)
  const importProgress = useProgressStore((state) => state.importProgress)
  const resetAll = useProgressStore((state) => state.resetAll)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voicesLoaded, setVoicesLoaded] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

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

  const download = () => {
    const payload = exportProgress()
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `reflex-english-progress-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    setMessage('进度已导出。')
  }

  const handleFile = async (file: File) => {
    try {
      const text = await file.text()
      const payload = JSON.parse(text) as ProgressExport
      if (payload.app !== 'efspd-trainer' || !payload.cards) {
        setMessage('这个文件不是有效的反射英语进度备份。')
        return
      }
      if (!window.confirm('导入会覆盖当前进度。建议先导出备份。继续？')) return
      importProgress(payload)
      setMessage('进度已导入。')
    } catch {
      setMessage('文件解析失败，请确认是导出的 JSON。')
    }
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
            <span className="mt-1 block text-[11px] text-muted">超时自动揭示，不计入正确</span>
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
                  <span className="mt-0.5 block text-[11px] leading-4 text-muted">
                    {engine.hint}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] text-muted">口音</span>
            <select
              value={settings.ttsAccent}
              onChange={(event) => settings.update({ ttsAccent: event.target.value as TtsAccent })}
              disabled={settings.ttsEngine === 'baidu'}
              className="rounded-lg border border-line bg-panel px-2 py-1.5 text-xs text-cream outline-none disabled:opacity-50"
            >
              <option value="us">美音</option>
              <option value="uk">英音</option>
            </select>
            <span className="text-[11px] text-muted">百度只有美音；系统音色取决于安装的语音包</span>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-panel-2/30 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => preview(settings.ttsEngine)}>
              <Volume2 size={14} /> 试听当前
            </Button>
            <span className="text-[11px] text-muted">对比音色：</span>
            {VOICE_COMPARE.map((item) => (
              <button
                key={`${item.engine}-${item.accent}`}
                type="button"
                onClick={() => preview(item.engine, item.accent)}
                className="rounded-full border border-line px-2.5 py-1 text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-accent"
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-4 text-muted">
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
        <h2 className="text-sm font-medium text-cream">进度备份</h2>
        <p className="text-xs leading-5 text-muted">
          进度保存在本机浏览器。换设备或清理浏览器前，先导出 JSON；导入会覆盖当前进度。
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={download}>
            <Download size={16} /> 导出进度
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> 导入进度
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
          <Button
            variant={confirmReset ? 'danger' : 'ghost'}
            onClick={() => {
              if (!confirmReset) {
                setConfirmReset(true)
                return
              }
              resetAll()
              setConfirmReset(false)
              setMessage('进度已重置。')
            }}
          >
            <RotateCcw size={16} /> {confirmReset ? '确认清空？' : '重置进度'}
          </Button>
        </div>
        {message && <p className="text-sm text-accent">{message}</p>}
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
      <span className="mt-1 block text-[11px] text-muted">{hint}</span>
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
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
          checked ? 'border-accent/50 bg-accent/30' : 'border-line bg-panel-2'
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`absolute top-0.5 h-4.5 w-4.5 rounded-full bg-cream transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
          style={{ height: 18, width: 18 }}
        />
      </button>
    </div>
  )
}
