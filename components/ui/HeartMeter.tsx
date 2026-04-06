
// HeartMeter.tsx - แสดงระดับความสุขในรูปแบบหัวใจ

'use client'

interface HeartMeterProps {
  pct: number      // 0–100
  pts: number
  maxPts: number
  size?: number
}

export default function HeartMeter({ pct, pts, maxPts, size = 140 }: HeartMeterProps) {
  // heart path scaled to viewBox 0 0 100 90
  const heartPath = "M50 82 C50 82 10 55 10 28 C10 14 20 6 32 6 C39 6 45 10 50 16 C55 10 61 6 68 6 C80 6 90 14 90 28 C90 55 50 82 50 82Z"
  const fillY = 90 - (pct / 100) * 84  // how far from top to start fill
  const isComplete = pct >= 100

  return (
    <div style={{ textAlign: 'center', position: 'relative', display: 'inline-block' }}>
      <svg
        width={size}
        height={size * 0.9}
        viewBox="0 0 100 90"
        overflow="visible"
        style={{
          filter: isComplete
            ? 'drop-shadow(0 0 20px rgba(244,114,182,0.7)) drop-shadow(0 0 40px rgba(244,114,182,0.4))'
            : 'drop-shadow(0 4px 16px rgba(167,139,250,0.3))',
          animation: isComplete ? 'pulse-heart 1.2s ease-in-out infinite' : undefined,
          transition: 'filter 0.6s',
        }}
      >
        <defs>
          <linearGradient id="heartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f472b6" stopOpacity="0.95"/>
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.85"/>
          </linearGradient>
          <linearGradient id="heartEmpty" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.08)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0.03)"/>
          </linearGradient>
          <clipPath id="heartClip">
            <path d={heartPath}/>
          </clipPath>
        </defs>

        {/* Empty heart bg */}
        <path d={heartPath} fill="url(#heartEmpty)" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>

        {/* Fill layer (rises with pct) */}
        <g clipPath="url(#heartClip)">
          <rect
            x="0" y={fillY} width="100" height={90 - fillY}
            fill="url(#heartFill)"
            style={{ transition: 'y 0.6s cubic-bezier(.34,1.56,.64,1), height 0.6s cubic-bezier(.34,1.56,.64,1)' }}
          />
          {/* Shimmer on fill */}
          <rect
            x="-100%" y={fillY} width="300%" height="6"
            fill="rgba(255,255,255,0.18)"
            style={{
              animation: 'shimmer 2.5s linear infinite',
              backgroundSize: '200% auto',
            }}
          />
        </g>

        {/* Heart outline overlay */}
        <path d={heartPath} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>

        {/* Percentage text */}
        <text
          x="50" y="48"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="16"
          fontWeight="500"
          fontFamily="DM Sans, sans-serif"
          fill={pct > 50 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)'}
          style={{ transition: 'fill 0.4s' }}
        >
          {Math.round(pct)}%
        </text>
      </svg>

      {/* Points label below */}
      <div style={{
        marginTop: 10,
        fontSize: 13,
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-body)',
      }}>
        <span style={{ color: 'var(--purple-soft)', fontWeight: 500 }}>{pts}</span>
        <span style={{ opacity: 0.5 }}> / {maxPts} คะแนน</span>
      </div>
    </div>
  )
}