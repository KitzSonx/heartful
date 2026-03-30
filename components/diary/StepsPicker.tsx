'use client'
import { useState } from 'react'

interface StepsPickerProps {
  onChange?: (pts: number, level?: number) => void
}

const options = [
  { label: 'น้อยกว่า\n3,000',   emoji: '🐢', pts: 1 },
  { label: '3,000–\n6,000',     emoji: '🚶', pts: 2 },
  { label: '6,000–\n10,000',    emoji: '🏃', pts: 3 },
  { label: '10,000+',            emoji: '⚡', pts: 4 },
]

export default function StepsPicker({ onChange }: StepsPickerProps) {
  const [sel, setSel] = useState<number | null>(null)

  const pick = (i: number) => {
    setSel(i)
    onChange?.(options[i].pts)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
      {options.map((o, i) => (
        <button
          key={i}
          onClick={() => pick(i)}
          style={{
            padding: '12px 6px',
            borderRadius: 14,
            border: `1.5px solid ${sel === i ? 'rgba(196,181,253,0.5)' : 'rgba(255,255,255,0.07)'}`,
            background: sel === i ? 'rgba(196,181,253,0.12)' : 'rgba(255,255,255,0.04)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s',
            boxShadow: sel === i ? '0 0 16px rgba(196,181,253,0.2)' : 'none',
          }}
        >
          <span style={{ fontSize: 22 }}>{o.emoji}</span>
          <span style={{
            fontSize: 11,
            color: sel === i ? 'var(--purple-soft)' : 'var(--text-hint)',
            textAlign: 'center',
            lineHeight: 1.4,
            whiteSpace: 'pre-line',
            fontFamily: 'var(--font-body)',
          }}>
            {o.label}
          </span>
          {sel === i && (
            <span style={{ fontSize: 10, color: 'var(--purple-soft)', fontWeight: 500 }}>
              +{o.pts} pt
            </span>
          )}
        </button>
      ))}
    </div>
  )
}