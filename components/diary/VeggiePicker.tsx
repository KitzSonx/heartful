'use client'
import { useState } from 'react'

interface VeggiePickerProps {
  onChange?: (pts: number, meals: number) => void
}

const options = [
  { meals: 0, label: 'ไม่กินเลย', pts: 0, color: '#f87171', emoji: '😅' },
  { meals: 1, label: '1 มื้อ',    pts: 1, color: '#fb923c', emoji: '🥦' },
  { meals: 2, label: '2 มื้อ',    pts: 2, color: '#86efac', emoji: '🥦🥦' },
  { meals: 3, label: '3 มื้อ',    pts: 3, color: '#99f6e4', emoji: '🥦🥦🥦' },
]

export default function VeggiePicker({ onChange }: VeggiePickerProps) {
  const [sel, setSel] = useState<number | null>(null)

  const pick = (i: number) => {
    setSel(i)
    onChange?.(options[i].pts, options[i].meals)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
      <span style={{ fontSize: 11, color: 'var(--text-hint)', whiteSpace: 'nowrap', width: 56 }}>
        🥗 ผักผลไม้
      </span>
      <div style={{ display: 'flex', gap: 6, flex: 1 }}>
        {options.map((o, i) => (
          <button
            key={i}
            onClick={() => pick(i)}
            style={{
              flex: 1, padding: '7px 4px', borderRadius: 10,
              border: `1.5px solid ${sel === i ? o.color + '80' : 'rgba(255,255,255,0.08)'}`,
              background: sel === i ? o.color + '15' : 'rgba(255,255,255,0.03)',
              cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: 13 }}>{o.emoji}</div>
            <div style={{ fontSize: 10, color: sel === i ? o.color : 'var(--text-hint)', marginTop: 3, fontFamily: 'var(--font-body)', fontWeight: sel === i ? 500 : 400 }}>
              {o.label}
            </div>
            {sel === i && o.pts > 0 && (
              <div style={{ fontSize: 10, color: o.color, fontWeight: 500 }}>+{o.pts}pt</div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}