'use client'
import { useState } from 'react'

interface CheckItemProps {
  label: string
  pts: number
  category: 'body' | 'mind' | 'social'
  onChange?: (checked: boolean) => void
  checked?: boolean
}

const catColor = {
  body:   { border: 'rgba(153,246,228,0.25)', glow: 'rgba(153,246,228,0.15)', check: '#99f6e4' },
  mind:   { border: 'rgba(196,181,253,0.25)', glow: 'rgba(196,181,253,0.15)', check: '#c4b5fd' },
  social: { border: 'rgba(249,168,212,0.25)', glow: 'rgba(249,168,212,0.15)', check: '#f9a8d4' },
}

export default function CheckItem({ label, pts, category, onChange, checked: externalChecked }: CheckItemProps) {
  const [internalChecked, setInternalChecked] = useState(false)
  const checked = externalChecked ?? internalChecked
  const colors = catColor[category]

  const toggle = () => {
    setInternalChecked(v => !v)
    onChange?.(!checked)
  }

  return (
    <button
      onClick={toggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '13px 16px',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${checked ? colors.border : 'rgba(255,255,255,0.07)'}`,
        background: checked ? colors.glow : 'rgba(255,255,255,0.04)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s ease',
        boxShadow: checked ? `0 0 20px ${colors.glow}` : 'none',
      }}
    >
      {/* Checkbox */}
      <div style={{
        width: 22, height: 22,
        borderRadius: 7,
        border: `1.5px solid ${checked ? colors.check : 'rgba(255,255,255,0.2)'}`,
        background: checked ? colors.check + '22' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.2s',
      }}>
        {checked && (
          <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
            <path d="M1 4L4.5 7.5L11 1" stroke={colors.check} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>

      {/* Label */}
      <span style={{
        flex: 1,
        fontSize: 14,
        fontFamily: 'var(--font-body)',
        color: checked ? 'var(--text-primary)' : 'var(--text-secondary)',
        transition: 'color 0.2s',
        textDecoration: checked ? 'none' : 'none',
      }}>
        {label}
      </span>

      {/* Points badge */}
      <span style={{
        fontSize: 11,
        fontWeight: 500,
        color: checked ? colors.check : 'var(--text-hint)',
        background: checked ? colors.check + '15' : 'rgba(255,255,255,0.05)',
        padding: '3px 8px',
        borderRadius: 99,
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
      }}>
        +{pts} pt
      </span>
    </button>
  )
}