'use client'
import { useState } from 'react'

interface MoodCheckerProps {
  onChange?: (mood: string) => void
}

const moods = [
  { label: 'สดชื่น',    emoji: '😊' },
  { label: 'มีความสุข', emoji: '🥰' },
  { label: 'เฉยๆ',     emoji: '😐' },
  { label: 'เหนื่อย',  emoji: '😔' },
  { label: 'เป็นห่วง', emoji: '😟' },
  { label: 'กังวล',    emoji: '😰' },
  { label: 'เครียด',   emoji: '😤' },
]

export default function MoodChecker({ onChange }: MoodCheckerProps) {
  const [selected, setSelected] = useState<string | null>(null)

  const pick = (label: string) => {
    const next = selected === label ? null : label
    setSelected(next)
    onChange?.(next ?? '')
  }

  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 10 }}>
        เลือกได้ 1 อารมณ์ · ไม่นับคะแนน แค่สังเกตตัวเอง
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {moods.map(m => {
          const isOn = selected === m.label
          return (
            <button
              key={m.label}
              onClick={() => pick(m.label)}
              style={{
                padding: '7px 12px', borderRadius: 99,
                border: `1.5px solid ${isOn ? 'rgba(196,181,253,0.5)' : 'rgba(255,255,255,0.1)'}`,
                background: isOn ? 'rgba(196,181,253,0.15)' : 'rgba(255,255,255,0.04)',
                color: isOn ? 'var(--purple-soft)' : 'var(--text-hint)',
                fontSize: 12, fontWeight: isOn ? 500 : 400,
                cursor: 'pointer', transition: 'all 0.15s',
                fontFamily: 'var(--font-body)',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <span style={{ fontSize: 14 }}>{m.emoji}</span> {m.label}
            </button>
          )
        })}
      </div>
      {selected && (
        <p style={{ fontSize: 11, color: 'var(--purple-soft)', marginTop: 8 }}>
          วันนี้รู้สึก: {selected} 💜
        </p>
      )}
    </div>
  )
}