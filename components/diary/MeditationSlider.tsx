// MeditationSlider.tsx - สไลเดอร์สำหรับบันทึกเวลาทำสมาธิในหน้า Diary
'use client'
import { useState } from 'react'

interface MeditationSliderProps {
  onChange?: (pts: number, label: string) => void
}

const levels = [
  { label: 'ไม่ได้ทำ',        emoji: '😶', pts: 0, color: '#888780' },
  { label: 'น้อยกว่า 5 นาที', emoji: '🙂', pts: 1, color: '#facc15' },
  { label: '5–15 นาที',       emoji: '😊', pts: 2, color: '#86efac' },
  { label: '15–30 นาที',      emoji: '🧘', pts: 3, color: '#99f6e4' },
  { label: 'มากกว่า 30 นาที', emoji: '✨', pts: 4, color: '#c4b5fd' },
]

export default function MeditationSlider({ onChange }: MeditationSliderProps) {
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
        🧘 สมาธิ
      </span>
      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{
          position: 'absolute', top: '50%', left: 0, right: 0, height: 5,
          borderRadius: 99,
          background: 'linear-gradient(to right, #888780, #facc15, #86efac, #99f6e4, #c4b5fd)',
          transform: 'translateY(-50%)', opacity: 0.4, pointerEvents: 'none',
        }} />
        <input
          type="range" min="0" max="4" step="1"
          value={val ?? 0}
          onChange={handleChange}
          style={{ width: '100%', appearance: 'none' as any, background: 'transparent', cursor: 'pointer', height: 22, position: 'relative' }}
        />
      </div>
      <div style={{ minWidth: 96, textAlign: 'right' }}>
        {current ? (
          <span style={{ fontSize: 11, fontWeight: 500, color: current.color, background: current.color + '18', padding: '3px 8px', borderRadius: 99, whiteSpace: 'nowrap' }}>
            {current.emoji} {current.label} {current.pts > 0 ? `+${current.pts}pt` : '0pt'}
          </span>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>เลื่อนเพื่อเลือก</span>
        )}
      </div>
      <style>{`
        input[type=range]::-webkit-slider-thumb { appearance: none; width: 20px; height: 20px; border-radius: 50%; background: white; box-shadow: 0 0 10px rgba(196,181,253,0.5), 0 2px 4px rgba(0,0,0,0.3); cursor: pointer; }
        input[type=range]::-webkit-slider-runnable-track { height: 5px; border-radius: 99px; background: rgba(255,255,255,0.08); }
      `}</style>
    </div>
  )
}