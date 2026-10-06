// components/teacher/WeeklyBehaviorAnalytics.tsx - สถิติพฤติกรรมสุขภาพกาย-ใจ 7 วันย้อนหลังสำหรับครูแนะแนว
'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import type { WeeklyBehaviorStats } from '../../types/database'

export default function WeeklyBehaviorAnalytics() {
  const [gradeFilter, setGradeFilter] = useState<'all' | '4' | '5' | '6'>('all')
  const [data, setData] = useState<WeeklyBehaviorStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async (grade: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/teacher/behavior-stats?grade=${grade}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else {
        console.error('Error fetching behavior stats:', res.status)
      }
    } catch (err) {
      console.error('Failed to load behavior stats:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchStats(gradeFilter)
  }, [gradeFilter, fetchStats])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeUp 0.3s ease both' }}>
      {/* Top Header & Filter Controls */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1.5px solid var(--card-border)',
          borderRadius: 22,
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          boxShadow: '0 4px 14px rgba(91,74,63,0.05)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>📈</span>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>
              สถิติพฤติกรรมสุขภาพกาย-ใจ 7 วันย้อนหลัง
            </h3>
          </div>
          <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--text-brown-light)' }}>
            ภาพรวมแนวโน้มการดูแลตนเองและสภาพอากาศทางอารมณ์ของนักเรียนในรอบสัปดาห์
          </p>
        </div>

        {/* Grade Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8F4EC', padding: 4, borderRadius: 12 }}>
          {[
            { key: 'all', label: '🏫 ทั้งหมด' },
            { key: '4', label: 'ม.4' },
            { key: '5', label: 'ม.5' },
            { key: '6', label: 'ม.6' },
          ].map((g) => (
            <button
              key={g.key}
              onClick={() => setGradeFilter(g.key as 'all' | '4' | '5' | '6')}
              style={{
                padding: '6px 14px',
                borderRadius: 9,
                border: 'none',
                background: gradeFilter === g.key ? 'var(--text-brown)' : 'transparent',
                color: gradeFilter === g.key ? '#FFF8EF' : 'var(--text-brown)',
                fontSize: 12.5,
                fontWeight: gradeFilter === g.key ? 700 : 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
                transition: 'all 0.15s',
              }}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div
          style={{
            background: 'rgba(255,255,255,0.92)',
            border: '1.5px solid var(--card-border)',
            borderRadius: 22,
            padding: 40,
            textAlign: 'center',
            color: 'var(--text-brown-light)',
          }}
        >
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 15 }}>กำลังประมวลผลสถิติพฤติกรรม 7 วัน... ⏳</p>
        </div>
      ) : !data || data.totalEntries === 0 ? (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.92)',
            border: '1.5px solid var(--card-border)',
            borderRadius: 22,
            padding: 40,
            textAlign: 'center',
            color: 'var(--text-brown-light)',
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 8 }}>📝</div>
          <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--text-brown)', margin: 0 }}>
            ยังไม่พบข้อมูลบันทึกในรอบ 7 วันสำหรับระดับชั้นนี้
          </h4>
        </div>
      ) : (
        <>
          {/* Summary Badges Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div
              style={{
                background: 'rgba(255,255,255,0.95)',
                border: '1.5px solid var(--card-border)',
                borderRadius: 18,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span style={{ fontSize: 26 }}>📝</span>
              <div>
                <span style={{ fontSize: 11.5, color: 'var(--text-brown-light)', fontFamily: 'var(--font-display)' }}>
                  จำนวนบันทึกในรอบ 7 วัน
                </span>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>
                  {data.totalEntries} ครั้ง
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.95)',
                border: '1.5px solid var(--card-border)',
                borderRadius: 18,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span style={{ fontSize: 26 }}>👥</span>
              <div>
                <span style={{ fontSize: 11.5, color: 'var(--text-brown-light)', fontFamily: 'var(--font-display)' }}>
                  นักเรียนที่มีส่วนร่วมบันทึก
                </span>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>
                  {data.uniqueStudents} คน
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.95)',
                border: '1.5px solid var(--card-border)',
                borderRadius: 18,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span style={{ fontSize: 26 }}>🌤️</span>
              <div>
                <span style={{ fontSize: 11.5, color: 'var(--text-brown-light)', fontFamily: 'var(--font-display)' }}>
                  บรรยากาศอารมณ์พลังบวก
                </span>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#2d7a4f', fontFamily: 'var(--font-display)' }}>
                  {data.moodStats.groups.positive?.pct ?? 0}% ของทั้งหมด
                </div>
              </div>
            </div>
          </div>

          {/* ================= PART 1: ดัชนีพฤติกรรมสุขภาพ 3 ด้าน ================= */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              border: '1.5px solid var(--card-border)',
              borderRadius: 22,
              padding: '20px 22px',
              boxShadow: '0 4px 14px rgba(91,74,63,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>
                  🌿 ดัชนีพฤติกรรมการดูแลตนเอง 3 ด้าน (3-Dimension Health Index)
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-brown-light)' }}>
                  สัดส่วนนักเรียนที่สามารถปฏิบัติพฤติกรรมส่งเสริมสุขภาวะได้สำเร็จ
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {/* ด้านกาย */}
              <div
                style={{
                  background: '#FFFDF9',
                  border: '1.5px solid rgba(217, 107, 39, 0.25)',
                  borderRadius: 18,
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                  <span style={{ fontSize: 18 }}>🏃</span>
                  <h5 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: '#D96B27', fontFamily: 'var(--font-display)' }}>
                    ด้านสุขภาพกาย (Physical Wellness)
                  </h5>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {data.behaviors.body.map((b) => (
                    <div key={b.key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-brown)', fontWeight: 500 }}>{b.label}</span>
                        <span style={{ fontWeight: 700, color: b.pct < 50 ? '#D96B27' : '#2d7a4f', fontFamily: 'var(--font-display)' }}>
                          {b.pct}% ({b.count} ครั้ง)
                        </span>
                      </div>
                      <div style={{ background: '#EFE4D6', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${b.pct}%`,
                            height: '100%',
                            borderRadius: 99,
                            background: b.color,
                            transition: 'width 0.6s ease',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ด้านใจ */}
              <div
                style={{
                  background: '#FFFDF9',
                  border: '1.5px solid rgba(124, 58, 237, 0.25)',
                  borderRadius: 18,
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                  <span style={{ fontSize: 18 }}>🧠</span>
                  <h5 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: '#7C3AED', fontFamily: 'var(--font-display)' }}>
                    ด้านสุขภาพใจ (Mind & Emotion)
                  </h5>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {data.behaviors.mind.map((b) => (
                    <div key={b.key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-brown)', fontWeight: 500 }}>
                          {b.label} {b.isLow && <span style={{ color: '#c0392b', fontSize: 10 }}>⚠️ ควรเสริม</span>}
                        </span>
                        <span style={{ fontWeight: 700, color: b.pct < 50 ? '#c0392b' : '#2d7a4f', fontFamily: 'var(--font-display)' }}>
                          {b.pct}% ({b.count} ครั้ง)
                        </span>
                      </div>
                      <div style={{ background: '#EFE4D6', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${b.pct}%`,
                            height: '100%',
                            borderRadius: 99,
                            background: b.color,
                            transition: 'width 0.6s ease',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ด้านสังคม */}
              <div
                style={{
                  background: '#FFFDF9',
                  border: '1.5px solid rgba(2, 132, 199, 0.25)',
                  borderRadius: 18,
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                  <span style={{ fontSize: 18 }}>🤝</span>
                  <h5 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: '#0284C7', fontFamily: 'var(--font-display)' }}>
                    ด้านสังคม & สัมพันธภาพ (Social Connection)
                  </h5>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {data.behaviors.social.map((b) => (
                    <div key={b.key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-brown)', fontWeight: 500 }}>{b.label}</span>
                        <span style={{ fontWeight: 700, color: '#0284C7', fontFamily: 'var(--font-display)' }}>
                          {b.pct}% ({b.count} ครั้ง)
                        </span>
                      </div>
                      <div style={{ background: '#EFE4D6', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${b.pct}%`,
                            height: '100%',
                            borderRadius: 99,
                            background: b.color,
                            transition: 'width 0.6s ease',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ================= PART 2: สภาพอากาศทางอารมณ์ของโรงเรียน (Mood Climate) ================= */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              border: '1.5px solid var(--card-border)',
              borderRadius: 22,
              padding: '20px 22px',
              boxShadow: '0 4px 14px rgba(91,74,63,0.05)',
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>
                🌤️ สภาพอากาศทางอารมณ์ของโรงเรียน (School Mood Climate)
              </h4>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-brown-light)' }}>
                การกระจายตัวของอารมณ์ 12 แบบที่นักเรียนเช็คอินในรอบ 7 วัน
              </p>
            </div>

            {/* 3 Mood Energy Groups */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 18 }}>
              <div
                style={{
                  background: '#F2F9F2',
                  border: '1.5px solid #B7E4C7',
                  borderRadius: 16,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 24 }}>🍃</span>
                <div>
                  <span style={{ fontSize: 12, color: '#2d7a4f', fontWeight: 600 }}>พลังบวก & ผ่อนคลาย</span>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#2d7a4f', fontFamily: 'var(--font-display)' }}>
                    {data.moodStats.groups.positive?.count ?? 0} ครั้ง ({data.moodStats.groups.positive?.pct ?? 0}%)
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: '#FFFBF0',
                  border: '1.5px solid #FFE1A8',
                  borderRadius: 16,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 24 }}>🥱</span>
                <div>
                  <span style={{ fontSize: 12, color: '#B45309', fontWeight: 600 }}>พลังงานต่ำ & ง่วงเหนื่อย</span>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#B45309', fontFamily: 'var(--font-display)' }}>
                    {data.moodStats.groups.low_energy?.count ?? 0} ครั้ง ({data.moodStats.groups.low_energy?.pct ?? 0}%)
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: '#FFF0F0',
                  border: '1.5px solid #FFB3BA',
                  borderRadius: 16,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 24 }}>😰</span>
                <div>
                  <span style={{ fontSize: 12, color: '#c0392b', fontWeight: 600 }}>เปราะบาง & ต้องการดูแล</span>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#c0392b', fontFamily: 'var(--font-display)' }}>
                    {data.moodStats.groups.distressed?.count ?? 0} ครั้ง ({data.moodStats.groups.distressed?.pct ?? 0}%)
                  </div>
                </div>
              </div>
            </div>

            {/* Mood List with SVG badges */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {data.moodStats.list.map((m) => (
                <div
                  key={m.key}
                  style={{
                    background: '#FFFDF9',
                    border: '1px solid var(--card-border)',
                    borderRadius: 12,
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 2px 6px rgba(91,74,63,0.04)',
                  }}
                >
                  <Image src={`/moodpics/${m.key}.svg`} alt={m.key} width={22} height={22} unoptimized />
                  <div>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-brown)' }}>{m.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-brown-light)', marginLeft: 6 }}>
                      {m.count} ครั้ง ({m.pct}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ================= PART 3: เรื่องกังวลใจสูงสุด ================= */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              border: '1.5px solid var(--card-border)',
              borderRadius: 22,
              padding: '20px 22px',
              boxShadow: '0 4px 14px rgba(91,74,63,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>
                  🎯 จัดอันดับเรื่องที่เด็กกังวลใจสูงสุด (Top Student Concerns)
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-brown-light)' }}>
                  นำข้อมูลไปกำหนดประเด็นพูดคุยในคาบแนะแนวหรือจัด Workshop ประจำสัปดาห์
                </p>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  background: 'rgba(198, 222, 190, 0.45)',
                  color: '#2d7a4f',
                  padding: '4px 10px',
                  borderRadius: 99,
                }}
              >
                ✨ ไม่มีเรื่องกังวล: {data.noConcernCount} ครั้ง ({data.noConcernPct}%)
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.topConcerns.map((tc, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#FFFDF9',
                    border: '1px solid rgba(200,186,168,0.3)',
                    borderRadius: 14,
                    padding: '10px 14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 99,
                          background: idx === 0 ? '#c0392b' : idx === 1 ? '#D96B27' : '#5B4A3F',
                          color: '#FFF',
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-brown)' }}>{tc.concern}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>
                      {tc.count} คน ({tc.pct}%)
                    </span>
                  </div>
                  <div style={{ background: '#EFE4D6', borderRadius: 99, height: 7, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${tc.pct}%`,
                        height: '100%',
                        borderRadius: 99,
                        background: idx === 0 ? '#E11D48' : idx === 1 ? '#F97316' : '#8B5CF6',
                        transition: 'width 0.6s ease',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ================= PART 4: บทวิเคราะห์ & คำแนะนำสำหรับโรงเรียน ================= */}
          <div
            style={{
              background: '#FFFDF9',
              border: '1.5px solid var(--card-border)',
              borderRadius: 22,
              padding: '20px 22px',
              boxShadow: '0 4px 14px rgba(91,74,63,0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 20 }}>💡</span>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>
                บทวิเคราะห์ & ข้อเสนอแนะเชิงกระบวนการสำหรับครูแนะแนว (Guidance Action Insights)
              </h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {/* จุดเด่น */}
              <div style={{ background: '#F2F9F2', border: '1px solid #B7E4C7', borderRadius: 16, padding: '14px 16px' }}>
                <h5 style={{ margin: '0 0 8px', fontSize: 13.5, color: '#2d7a4f', fontWeight: 700 }}>
                  🌟 จุดเด่นประจำสัปดาห์ (Positive Strengths)
                </h5>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: '#1b4d3e', lineHeight: 1.6 }}>
                  {data.insights.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              {/* ข้อควรเฝ้าระวัง */}
              <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 16, padding: '14px 16px' }}>
                <h5 style={{ margin: '0 0 8px', fontSize: 13.5, color: '#C2410C', fontWeight: 700 }}>
                  ⚠️ จุดเฝ้าระวังเชิงระบบ (System Watchlist)
                </h5>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: '#7C2D12', lineHeight: 1.6 }}>
                  {data.insights.watchouts.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>

              {/* คำแนะนำกิจกรรม */}
              <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 16, padding: '14px 16px' }}>
                <h5 style={{ margin: '0 0 8px', fontSize: 13.5, color: '#6D28D9', fontWeight: 700 }}>
                  📌 แนวทางกิจกรรม/ความรู้ที่ควรจัดเพิ่ม (Action Plan)
                </h5>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: '#4C1D95', lineHeight: 1.6 }}>
                  {data.insights.recommendations.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
