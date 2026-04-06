// SectionHeader.tsx - หัวข้อส่วนในหน้า Diary พร้อมแสดงคะแนนและไอคอนตามหมวดหมู่
interface SectionHeaderProps {
  category: 'body' | 'mind' | 'social'
  title: string
  subtitle?: string
  pts: number
  maxPts: number
}

const catConfig = {
  body:   { pill: 'pill-body',   icon: '💪', label: 'กาย',   accent: '#99f6e4' },
  mind:   { pill: 'pill-mind',   icon: '🧘', label: 'ใจ',    accent: '#c4b5fd' },
  social: { pill: 'pill-social', icon: '🤝', label: 'สังคม', accent: '#f9a8d4' },
}

export default function SectionHeader({ category, title, subtitle, pts, maxPts }: SectionHeaderProps) {
  const cfg = catConfig[category]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <span style={{ fontSize: 20 }}>{cfg.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--text-primary)',
          }}>
            {title}
          </span>
          <span className={`pill ${cfg.pill}`}>{cfg.label}</span>
        </div>
        {subtitle && (
          <p style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 2 }}>{subtitle}</p>
        )}
      </div>
      <span style={{
        fontSize: 12,
        color: cfg.accent,
        fontWeight: 500,
        background: cfg.accent + '15',
        padding: '3px 10px',
        borderRadius: 99,
      }}>
        {pts}/{maxPts} pt
      </span>
    </div>
  )
}