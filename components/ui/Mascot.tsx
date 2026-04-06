
// Mascot.tsx - ตัวละครแสดงอารมณ์ในหน้า Diary


'use client'
import { useState } from 'react'

type MoodLevel = 'sad' | 'neutral' | 'good' | 'great'

interface MascotProps {
  mood?: MoodLevel
  size?: number
  animated?: boolean
  pct?: number   // 0-100 fill percent
}

const moodColors: Record<MoodLevel, [string, string]> = {
  sad:     ['#6366f1', '#a78bfa'],
  neutral: ['#a78bfa', '#c4b5fd'],
  good:    ['#c4b5fd', '#f9a8d4'],
  great:   ['#f472b6', '#fde68a'],
}

const moodFaces: Record<MoodLevel, React.ReactNode> = {
  sad: (
    <>
      <circle cx="38" cy="44" r="3" fill="currentColor" opacity="0.7"/>
      <circle cx="62" cy="44" r="3" fill="currentColor" opacity="0.7"/>
      <path d="M40 58 Q50 52 60 58" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7"/>
    </>
  ),
  neutral: (
    <>
      <circle cx="38" cy="44" r="3" fill="currentColor" opacity="0.7"/>
      <circle cx="62" cy="44" r="3" fill="currentColor" opacity="0.7"/>
      <line x1="40" y1="57" x2="60" y2="57" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>
    </>
  ),
  good: (
    <>
      <circle cx="38" cy="44" r="3" fill="currentColor" opacity="0.8"/>
      <circle cx="62" cy="44" r="3" fill="currentColor" opacity="0.8"/>
      <path d="M40 54 Q50 62 60 54" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8"/>
    </>
  ),
  great: (
    <>
      <ellipse cx="38" cy="44" rx="4" ry="5" fill="currentColor" opacity="0.9"/>
      <ellipse cx="62" cy="44" rx="4" ry="5" fill="currentColor" opacity="0.9"/>
      <path d="M36 54 Q50 66 64 54" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.9"/>
      <circle cx="34" cy="50" r="5" fill="rgba(255,150,150,0.35)"/>
      <circle cx="66" cy="50" r="5" fill="rgba(255,150,150,0.35)"/>
    </>
  ),
}

export default function Mascot({ mood = 'neutral', size = 120, animated = true, pct = 0 }: MascotProps) {
  const [c1, c2] = moodColors[mood]
  const id = `grad-${mood}-${size}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{
        animation: animated ? 'float 4s ease-in-out infinite' : undefined,
        filter: `drop-shadow(0 8px 24px ${c1}55)`,
        overflow: 'visible',
      }}
    >
      <defs>
        <radialGradient id={id} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor={c2} stopOpacity="0.95"/>
          <stop offset="60%" stopColor={c1} stopOpacity="0.88"/>
          <stop offset="100%" stopColor={c1} stopOpacity="0.70"/>
        </radialGradient>
        {/* fill indicator clip */}
        <clipPath id={`clip-fill-${size}`}>
          <rect x="0" y={100 - pct} width="100" height={pct}/>
        </clipPath>
      </defs>

      {/* Body blob */}
      <ellipse cx="50" cy="52" rx="44" ry="42" fill={`url(#${id})`}/>

      {/* Fill overlay when pct > 0 */}
      {pct > 0 && (
        <ellipse
          cx="50" cy="52" rx="44" ry="42"
          fill="rgba(255,255,255,0.15)"
          clipPath={`url(#clip-fill-${size})`}
        />
      )}

      {/* Highlight */}
      <ellipse cx="38" cy="30" rx="12" ry="8" fill="rgba(255,255,255,0.22)" transform="rotate(-15,38,30)"/>

      {/* Face */}
      <g color="rgba(60,20,80,0.75)">
        {moodFaces[mood]}
      </g>
    </svg>
  )
}