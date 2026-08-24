// SleepSlider.tsx - สไลเดอร์สำหรับบันทึกเวลาหลับในหน้า Diary
'use client'
import { useState } from 'react'

interface SleepSliderProps {
  onChange?: (pts: number, label: string, level: number) => void
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
    onChange?.(lv.pts, lv.label, v)
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
        <span>นอนเต็มอิ่ม</span>
      </div>

      {/* Track container */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: 6,
          borderRadius: 99,
          background: 'linear-gradient(to right, #f87171, #fb923c, #facc15, #86efac, #99f6e4)',
          transform: 'translateY(-50%)',
          opacity: 0.35,
          pointerEvents: 'none',
        }} />
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={val || 3}
          onChange={handleChange}
          style={{
            width: '100%',
            appearance: 'none',
            WebkitAppearance: 'none',
            background: 'transparent',
            cursor: 'pointer',
            height: 24,
            position: 'relative',
            zIndex: 1,
          }}
        />
      </div>

      {/* Selected badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 28,
      }}>
        {current ? (
          <>
            <span style={{
              fontSize: 12,
              fontWeight: 500,
              color: current.color,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'var(--font-body)',
            }}>
              <span style={{ fontSize: 16 }}>{current.emoji}</span>
              {current.label}
            </span>
            <span style={{
              fontSize: 11,
              fontWeight: 500,
              color: current.color,
              background: `${current.color}18`,
              border: `1px solid ${current.color}35`,
              padding: '2px 8px',
              borderRadius: 99,
              fontFamily: 'var(--font-body)',
            }}>
              +{current.pts} pt
            </span>
          </>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text-hint)', fontFamily: 'var(--font-body)' }}>
            เลื่อนเพื่อเลือก
          </span>
        )}
      </div>

      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 0 12px rgba(167,139,250,0.6), 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: transform 0.15s;
        }
        input[type=range]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
      `}</style>
    </div>
  )
}