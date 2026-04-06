
// WaterSlider.tsx - สไลเดอร์สำหรับบันทึกปริมาณน้ำดื่มในหน้า Diary


'use client'
import { useState } from 'react'

interface WaterSliderProps {
  onChange?: (pts: number, glasses: number) => void
}

function getPts(glasses: number) {
  if (glasses <= 1) return 0
  if (glasses <= 3) return 1
  if (glasses <= 5) return 2
  if (glasses <= 7) return 3
  return 4
}

function getColor(glasses: number) {
  if (glasses <= 1) return '#f87171'
  if (glasses <= 3) return '#fb923c'
  if (glasses <= 5) return '#facc15'
  if (glasses <= 7) return '#86efac'
  return '#99f6e4'
}

export default function WaterSlider({ onChange }: WaterSliderProps) {
  const [glasses, setGlasses] = useState<number | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    setGlasses(v)
    onChange?.(getPts(v), v)
  }

  const color = glasses !== null ? getColor(glasses) : '#888'
  const pts = glasses !== null ? getPts(glasses) : null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
      <span style={{ fontSize: 11, color: 'var(--text-hint)', whiteSpace: 'nowrap', width: 56 }}>
        💧 น้ำเปล่า
      </span>
      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{
          position: 'absolute', top: '50%', left: 0, right: 0, height: 5,
          borderRadius: 99,
          background: 'linear-gradient(to right, #f87171, #fb923c, #facc15, #86efac, #99f6e4)',
          transform: 'translateY(-50%)', opacity: 0.35, pointerEvents: 'none',
        }} />
        <input
          type="range" min="0" max="10" step="1"
          value={glasses ?? 0}
          onChange={handleChange}
          style={{ width: '100%', appearance: 'none' as any, background: 'transparent', cursor: 'pointer', height: 22, position: 'relative' }}
        />
      </div>
      <div style={{ minWidth: 88, textAlign: 'right' }}>
        {glasses !== null ? (
          <span style={{ fontSize: 11, fontWeight: 500, color, background: color + '18', padding: '3px 8px', borderRadius: 99, whiteSpace: 'nowrap' }}>
            💧 {glasses} แก้ว {pts! > 0 ? `+${pts}pt` : '0pt'}
          </span>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--text-hint)' }}>เลื่อนเพื่อเลือก</span>
        )}
      </div>
      <style>{`
        input[type=range]::-webkit-slider-thumb { appearance: none; width: 20px; height: 20px; border-radius: 50%; background: white; box-shadow: 0 0 10px rgba(99,153,246,0.5), 0 2px 4px rgba(0,0,0,0.3); cursor: pointer; }
        input[type=range]::-webkit-slider-runnable-track { height: 5px; border-radius: 99px; background: rgba(255,255,255,0.08); }
      `}</style>
    </div>
  )
}