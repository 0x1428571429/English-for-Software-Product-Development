import { useEffect, useRef, useState } from 'react'
import { Pause, Play, Volume2 } from 'lucide-react'
import type { Dialogue, DialogueLine } from '../../data/types'
import { cancelSpeech, speak, speakSequence } from '../../lib/speech'
import { useSettingsStore } from '../../store/useSettingsStore'
import { Button } from '../ui/Button'

export function DialogueView({
  dialogue,
  showTranslation,
  highlightLineId,
  onLineClick,
}: {
  dialogue: Dialogue
  showTranslation: boolean
  highlightLineId?: string | null
  onLineClick?: (line: DialogueLine) => void
}) {
  const settings = useSettingsStore()
  const [playing, setPlaying] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      cancelSpeech()
    }
  }, [])

  const playable = dialogue.lines.filter((line) => !line.isChannel && !line.isStage)

  const playAll = async () => {
    if (playing) {
      abortRef.current?.abort()
      cancelSpeech()
      setPlaying(false)
      setActiveIndex(null)
      return
    }
    setPlaying(true)
    abortRef.current = new AbortController()
    await speakSequence(
      playable.map((line) => line.text),
      {
        rate: settings.ttsRate,
        voiceURI: settings.ttsVoiceURI,
        gapMs: 420,
        signal: abortRef.current.signal,
        onLine: (index) => setActiveIndex(index),
      },
    )
    setPlaying(false)
    setActiveIndex(null)
  }

  const playLine = (line: DialogueLine) => {
    void speak(line.text, { rate: settings.ttsRate, voiceURI: settings.ttsVoiceURI })
  }

  if (dialogue.format === 'chat') {
    return (
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-muted">聊天记录 · {playable.length} 条消息</p>
          <Button variant="ghost" size="sm" onClick={playAll}>
            {playing ? <Pause size={14} /> : <Play size={14} />}
            {playing ? '停止' : '整段播放'}
          </Button>
        </div>
        <div className="space-y-1.5">
          {dialogue.lines.map((line) => {
            if (line.isChannel) {
              return (
                <div key={line.id} className="flex items-center gap-3 py-3">
                  <div className="h-px flex-1 bg-line" />
                  <span className="font-mono text-xs text-muted">{line.text}</span>
                  <div className="h-px flex-1 bg-line" />
                </div>
              )
            }
            return (
              <div
                key={line.id}
                className={`group flex gap-2 rounded-lg px-2 py-1.5 ${highlightLineId === line.id ? 'bg-accent/10' : 'hover:bg-panel-2/60'}`}
                onClick={() => onLineClick?.(line)}
              >
                <div className="w-20 shrink-0 pt-1 text-right">
                  <span className="text-xs font-medium text-cream/80">{line.speaker}</span>
                  {line.timestamp && <span className="ml-1 text-[10px] text-muted">{line.timestamp}</span>}
                </div>
                <div className="min-w-0 flex-1 rounded-xl rounded-tl-sm border border-line/70 bg-panel px-3 py-2">
                  <p className="text-sm leading-6 text-cream">{line.text}</p>
                  {showTranslation && (
                    <p className="mt-1 text-xs leading-5 text-muted">
                      {line.zh ?? '暂无翻译'}
                    </p>
                  )}
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    playLine(line)
                  }}
                  className="mt-1 self-start rounded p-1 text-muted opacity-0 transition-opacity hover:text-accent group-hover:opacity-100"
                  aria-label="播放"
                >
                  <Volume2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-muted">口语对话 · {playable.length} 句</p>
        <Button variant="ghost" size="sm" onClick={playAll}>
          {playing ? <Pause size={14} /> : <Play size={14} />}
          {playing ? '停止' : '整段播放'}
        </Button>
      </div>
      <div className="space-y-3">
        {dialogue.lines.map((line, index) => {
          if (line.isStage) {
            return (
              <p key={line.id} className="py-1 text-center text-xs italic text-muted">
                {line.text}
              </p>
            )
          }
          const isActive = activeIndex !== null && playable[activeIndex]?.id === line.id
          const alignRight = index % 2 === 1
          return (
            <div
              key={line.id}
              className={`flex gap-2 ${alignRight ? 'flex-row-reverse' : ''} ${highlightLineId === line.id ? 'rounded-xl bg-accent/10 p-1' : ''}`}
              onClick={() => onLineClick?.(line)}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-panel-2 text-[11px] font-medium text-muted">
                {line.speaker === '?' ? '·' : line.speaker}
              </div>
              <div
                className={`group max-w-[85%] rounded-2xl border px-4 py-2.5 ${
                  isActive ? 'border-accent/40 bg-accent/10' : 'border-line/70 bg-panel'
                } ${alignRight ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
              >
                <div className="flex items-start gap-2">
                  <div>
                    <p className="text-sm leading-6 text-cream">{line.text}</p>
                    {showTranslation && <p className="mt-1 text-xs leading-5 text-muted">{line.zh ?? '暂无翻译'}</p>}
                  </div>
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      playLine(line)
                    }}
                    className="mt-1 rounded p-0.5 text-muted opacity-0 transition-opacity hover:text-accent group-hover:opacity-100"
                    aria-label="播放"
                  >
                    <Volume2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
