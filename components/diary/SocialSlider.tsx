'use client'
import { useState } from 'react'

interface SocialSliderProps {
  onChange?: (pts: number, label: string) => void
}

const levels = [
  { label: 'มากกว่า 3 ชม.',  emoji: '😵', pts: 0, color: '#f87171' },
  { label: '2–3 ชั่วโมง',    emoji: '😬', pts: 1, color: '#fb923c' },
  { label: '1–2 ชั่วโมง',    emoji: '😐', pts: 2, color: '#facc15' },
  { label: 'น้อยกว่า 1 ชม.', emoji: '😊', pts: 3, color: '#86efac' },
  { label: 'ไม่เล่นเลย',     emoji: '🌟', pts: 3, color: '#99f6e4' },
]

export default function SocialSlider({ onChange }: SocialSliderProps) {
  const [val, setVal] = useState<number | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    setVal(v)
    onChange?.(levels[v].pts, levels[v].label)
  }

  const current = val !== null ? levels[val] : null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
      <span style={{ fontSize: 11, color: 'var(--text-hint)', whiteSpace: 'nowrap', width: 56 }}>
        📱 โซเชียล
      </span>
      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{
          position: 'absolute', top: '50%', left: 0, right: 0, height: 5,
          borderRadius: 99,
          background: 'linear-gradient(to right, #f87171, #fb923c, #facc15, #86efac, #99f6e4)',
          transform: 'translateY(-50%)', opacity: 0.4, pointerEvents: 'none',
        }} />
        <input
          type="range" min="0" max="4" step="1"
          value={val ?? 2}
          onChange={handleChange}
          style={{ width: '100%', appearance: 'none' as any, background: 'transparent', cursor: 'pointer', height: 22, position: 'relative' }}
        />
      </div>
      <div style={{ minWidth: 110, textAlign: 'right' }}>
        {current ? (
          <span style={{ fontSize: 11, fontWeight: 500, color: current.color, background: current.color + '18', padding: '3px 8px', borderRadius: 99, whiteSpace: 'nowrap' }}>
            {current.emoji} {current.label} {current.pts > 0 ? `+${current.pts}pt` : '0pt'}
          </span>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>เลื่อนเพื่อเลือก</span>
        )}
      </div>
      <style>{`
        input[type=range]::-webkit-slider-thumb { appearance: none; width: 20px; height: 20px; border-radius: 50%; background: white; box-shadow: 0 0 10px rgba(167,139,250,0.5), 0 2px 4px rgba(0,0,0,0.3); cursor: pointer; }
        input[type=range]::-webkit-slider-runnable-track { height: 5px; border-radius: 99px; background: rgba(255,255,255,0.08); }
      `}</style>
    </div>
  )
}