// home page - หน้าแรกต้อนรับผู้ใช้ด้วยภาพรวมและลิงก์ไปยังฟีเจอร์ต่างๆ
import Link from 'next/link'
import Mascot from '../components/ui/Mascot'

export default function HomePage() {
  return (
    <div style={{
      maxWidth: 480,
      margin: '0 auto',
      padding: '60px 24px 48px',
      textAlign: 'center',
      fontFamily: 'var(--font-body)',
      animation: 'fadeUp 0.6s ease both',
    }}>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <Mascot mood="great" size={160} />
      </div>

      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 40, fontWeight: 400,
        lineHeight: 1.1,
        marginBottom: 12,
      }}>
        <span className="grad-text">Heartful</span>
      </h1>

      <p style={{
        fontSize: 16,
        color: 'var(--text-secondary)',
        lineHeight: 1.7,
        marginBottom: 40,
        maxWidth: 340,
        margin: '0 auto 40px',
      }}>
        ติดตามสุขภาพ <strong style={{ color: 'var(--teal-soft)' }}>กาย</strong>{' '}
        <strong style={{ color: 'var(--purple-soft)' }}>ใจ</strong>{' '}
        และ<strong style={{ color: 'var(--pink-soft)' }}>สังคม</strong> ทุกวัน
        <br/>เพื่อหัวใจที่เต็มเปี่ยม ❤
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 300, margin: '0 auto' }}>
        <Link href="/diary" style={{
          display: 'block',
          padding: '16px 24px',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, #a78bfa, #ec4899)',
          color: 'white',
          fontWeight: 500,
          fontSize: 15,
          textDecoration: 'none',
          boxShadow: '0 8px 32px rgba(167,139,250,0.35)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}>
          บันทึกวันนี้ 🌟
        </Link>

        <Link href="/teacher" style={{
          display: 'block',
          padding: '14px 24px',
          borderRadius: 'var(--radius-lg)',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'var(--text-secondary)',
          fontSize: 14,
          textDecoration: 'none',
          transition: 'background 0.2s',
        }}>
          เข้าสู่ระบบครู
        </Link>
      </div>

      {/* Features row */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 48 }}>
        {[
          { icon: '💪', label: 'ติดตามร่างกาย',  color: '#99f6e4' },
          { icon: '🧘', label: 'ดูแลจิตใจ',      color: '#c4b5fd' },
          { icon: '🤝', label: 'เชื่อมสังคม',    color: '#f9a8d4' },
        ].map(f => (
          <div key={f.label} style={{
            flex: 1,
            padding: '14px 8px',
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${f.color}20`,
            borderRadius: 16,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{f.icon}</div>
            <div style={{ fontSize: 11, color: f.color }}>{f.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}