'use client'
import { useState } from 'react'

interface SleepSliderProps {
  onChange?: (pts: number, label: string) => void
}

const levels = [
  { label: 'น้อยกว่า 4 ชม.', emoji: '😵', pts: 1, color: '#f87171' },
  { label: '4–5 ชั่วโมง',    emoji: '😴', pts: 2, color: '#fb923c' },
  { label: '5–6 ชั่วโมง',    emoji: '🙂', pts: 3, color: '#facc15' },
  { label: '6–7 ชั่วโมง',    emoji: '😊', pts: 4, color: '#86efac' },
  { label: '7–8 ชั่วโมง',    emoji: '🌟', pts: 5, color: '#99f6e4' },
]

export default function SleepSlider({ onChange }: SleepSliderProps) {
  const [val, setVal] = useState(0) // 0 = unset
  const current = val > 0 ? levels[val - 1] : null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    setVal(v)
    const lv = levels[v - 1]
    onChange?.(lv.pts, lv.label)
  }

  return (
    <div style={{ padding: '4px 0 8px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 11,
        color: 'var(--text-hint)',
        marginBottom: 10,
        fontFamily: 'var(--font-body)',
      }}>
        <span>น้อยมาก</span>
        <span>เพียงพอ 🌟</span>
      </div>

      <div style={{ position: 'relative', padding: '0 4px' }}>
        {/* Gradient track background */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: 4, right: 4,
          height: 6,
          borderRadius: 99,
          background: 'linear-gradient(to right, #f87171, #fb923c, #facc15, #86efac, #99f6e4)',
          transform: 'translateY(-50%)',
          opacity: 0.35,
          pointerEvents: 'none',
        }}/>

        <input
          type="range" min="1" max="5" step="1"
          value={val || 1}
          onChange={handleChange}
          style={{
            width: '100%',
            appearance: 'none',
            background: 'transparent',
            cursor: 'pointer',
            height: 24,
            position: 'relative',
          }}
        />
      </div>

      {/* Result display */}
      <div style={{
        marginTop: 10,
        minHeight: 36,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        borderRadius: 10,
        background: current ? 'rgba(255,255,255,0.05)' : 'transparent',
        transition: 'all 0.3s',
      }}>
        {current ? (
          <>
            <span style={{ fontSize: 22 }}>{current.emoji}</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1 }}>{current.label}</span>
            <span style={{
              fontSize: 12, fontWeight: 500,
              color: current.color,
              background: current.color + '18',
              padding: '3px 9px', borderRadius: 99,
            }}>
              +{current.pts} pt
            </span>
          </>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text-hint)' }}>เลือกชั่วโมงที่คุณนอนหลับ...</span>
        )}
      </div>

      {/* Range input styles */}
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          appearance: none;
          width: 22px; height: 22px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 0 12px rgba(167,139,250,0.6), 0 2px 6px rgba(0,0,0,0.4);
          cursor: pointer;
          transition: transform 0.15s;
        }
        input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.15); }
        input[type=range]::-webkit-slider-runnable-track {
          height: 6px; border-radius: 99px;
          background: rgba(255,255,255,0.08);
        }
      `}</style>
    </div>
  )
}