'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState(1)
  const [selectedMood, setSelectedMood] = useState('happy')
  const [wizardStep, setWizardStep] = useState(1)
  const [healingTab, setHealingTab] = useState<'jar' | 'breathe'>('jar')
  const [gratitudeText, setGratitudeText] = useState('')
  const [teacherToggle, setTeacherToggle] = useState(false)

  // Sleep & Food & Concerns state
  const [sleepOpt, setSleepOpt] = useState('😴 นอนพอ (7-8 ชม.)')
  const [foodOpt, setFoodOpt] = useState('🍚 ทานอาหารครบมื้อ')
  const [concerns, setConcerns] = useState<string[]>(['✨ ไม่มีเรื่องกังวล'])

  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([])
  const toastSeqRef = useRef(0)

  const addToast = (msg: string) => {
    toastSeqRef.current += 1
    const id = toastSeqRef.current
    setToasts((prev) => [...prev, { id, msg }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }

  const moodConfig: Record<string, { glow: string; status: string; eyes: React.ReactNode; mouth: React.ReactNode }> = {
    happy: {
      glow: 'var(--mood-happy-glow)',
      status: 'อารมณ์: มีความสุข ✨',
      eyes: (
        <>
          <circle cx="62" cy="86" r="5" fill="#5B4A3F" />
          <circle cx="98" cy="86" r="5" fill="#5B4A3F" />
        </>
      ),
      mouth: <path d="M72 96 Q80 104 88 96" stroke="#5B4A3F" strokeWidth="3" strokeLinecap="round" fill="none" />,
    },
    anxious: {
      glow: 'var(--mood-anxious-glow)',
      status: 'อารมณ์: กังวลใจ 😰',
      eyes: (
        <>
          <circle cx="62" cy="86" r="3" fill="#5B4A3F" />
          <circle cx="98" cy="86" r="3" fill="#5B4A3F" />
        </>
      ),
      mouth: <path d="M72 100 Q80 94 88 100" stroke="#5B4A3F" strokeWidth="3" strokeLinecap="round" fill="none" />,
    },
    tired: {
      glow: 'var(--mood-tired-glow)',
      status: 'อารมณ์: เหนื่อยล้า 🥱',
      eyes: (
        <>
          <path d="M56 86 L68 86" stroke="#5B4A3F" strokeWidth="3" />
          <path d="M92 86 L104 86" stroke="#5B4A3F" strokeWidth="3" />
        </>
      ),
      mouth: <ellipse cx="80" cy="98" rx="5" ry="3" fill="#5B4A3F" />,
    },
    calm: {
      glow: 'var(--mood-calm-glow)',
      status: 'อารมณ์: ผ่อนคลาย 🍃',
      eyes: (
        <>
          <path d="M56 86 Q62 80 68 86" stroke="#5B4A3F" strokeWidth="3" fill="none" />
          <path d="M92 86 Q98 80 104 86" stroke="#5B4A3F" strokeWidth="3" fill="none" />
        </>
      ),
      mouth: <path d="M74 96 Q80 100 86 96" stroke="#5B4A3F" strokeWidth="2.5" strokeLinecap="round" fill="none" />,
    },
    angry: {
      glow: 'var(--mood-angry-glow)',
      status: 'อารมณ์: หงุดหงิด 😤',
      eyes: (
        <>
          <path d="M56 82 L68 88" stroke="#5B4A3F" strokeWidth="3" />
          <path d="M104 82 L92 88" stroke="#5B4A3F" strokeWidth="3" />
        </>
      ),
      mouth: <path d="M72 98 L88 98" stroke="#5B4A3F" strokeWidth="3" strokeLinecap="round" />,
    },
  }

  const handleSelectMood = (key: string) => {
    setSelectedMood(key)
    addToast(`เปลี่ยนอารมณ์เป็น: ${moodConfig[key].status}`)
  }

  const toggleConcern = (item: string) => {
    if (item === '✨ ไม่มีเรื่องกังวล') {
      setConcerns(['✨ ไม่มีเรื่องกังวล'])
    } else {
      const filtered = concerns.filter((c) => c !== '✨ ไม่มีเรื่องกังวล')
      if (filtered.includes(item)) {
        const next = filtered.filter((c) => c !== item)
        setConcerns(next.length ? next : ['✨ ไม่มีเรื่องกังวล'])
      } else {
        setConcerns([...filtered, item])
      }
    }
  }

  const saveToJar = () => {
    if (!gratitudeText.trim()) {
      addToast('กรุณาพิมพ์เรื่องดีๆ ก่อนหยอดลงขวดนะ 🌸')
      return
    }
    addToast('เก็บความรู้สึกดีๆ ลงขวดเรียบร้อยแล้ว! 🫙✨')
    setGratitudeText('')
  }

  const handleNextStep = () => {
    if (wizardStep < 3) {
      setWizardStep(wizardStep + 1)
    } else {
      setActiveTab(3)
      addToast('บันทึกความรู้สึกเสร็จสิ้น! +15 Heart Energy 💖')
    }
  }

  const currentMood = moodConfig[selectedMood]

  return (
    <div className="heartful-app" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      {/* Top Navbar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(255, 248, 239, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '2px solid var(--card-border)',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg viewBox="0 0 40 40" fill="none" style={{ width: 36, height: 36 }}>
            <rect width="40" height="40" rx="12" fill="#FFC7D1" />
            <path
              d="M20 31.5C20 31.5 8 23.5 8 15.5C8 11.5 11 8.5 15 8.5C17.5 8.5 19.2 9.8 20 11C20.8 9.8 22.5 8.5 25 8.5C29 8.5 32 11.5 32 15.5C32 23.5 20 31.5 20 31.5Z"
              fill="#5B4A3F"
            />
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text-brown)' }}>
            Heartful
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <nav style={{ display: 'flex', gap: 8, background: 'rgba(255, 255, 255, 0.8)', padding: 4, borderRadius: 99, border: '1px solid var(--card-border)' }}>
            {[
              { id: 1, label: 'หน้าแรก', icon: 'home' },
              { id: 2, label: 'เช็คอิน', icon: 'edit_note' },
              { id: 3, label: 'รางวัล', icon: 'military_tech' },
              { id: 4, label: 'แดชบอร์ดครู', icon: 'dashboard' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  border: 'none',
                  background: activeTab === tab.id ? 'var(--text-brown)' : 'transparent',
                  color: activeTab === tab.id ? '#FFF8EF' : 'var(--text-brown-light)',
                  padding: '8px 16px',
                  borderRadius: 99,
                  fontFamily: 'var(--font-display)',
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: activeTab === tab.id ? '0 4px 12px rgba(91, 74, 63, 0.2)' : 'none',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </nav>

          <Link
            href="/login"
            style={{
              padding: '8px 18px',
              borderRadius: 99,
              background: 'var(--text-brown)',
              color: '#FFF8EF',
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'var(--font-display)',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(91,74,63,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
            }}
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, width: '100%', maxWidth: 1000, margin: '0 auto', padding: '24px 16px 60px' }}>
        {/* SCREEN 1: Home & Mood Picker */}
        {activeTab === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 480, margin: '0 auto', animation: 'fadeUp 0.35s ease forwards' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>
                  สวัสดี น้องมีนา 🌿
                </h1>
                <p style={{ fontSize: 14, color: 'var(--text-brown-light)' }}>วันนี้เป็นอย่างไรบ้าง?</p>
              </div>
              <div
                style={{
                  background: '#FFF0E5',
                  border: '1.5px solid var(--accent-peach)',
                  padding: '6px 14px',
                  borderRadius: 99,
                  fontFamily: 'var(--font-display)',
                  fontSize: 14,
                  color: '#D96B27',
                  boxShadow: '0 2px 6px rgba(217, 107, 39, 0.12)',
                }}
              >
                🔥 5 วันติด
              </div>
            </div>

            {/* Mascot Stage */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', margin: '16px 0' }}>
              <div
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  background: currentMood.glow,
                  filter: 'blur(25px)',
                  position: 'absolute',
                  zIndex: 1,
                  transition: 'background 0.5s ease',
                }}
              />
              <svg viewBox="0 0 160 160" fill="none" style={{ width: 170, height: 170, zIndex: 2, cursor: 'pointer' }}>
                <ellipse cx="80" cy="95" rx="55" ry="50" fill="#FFFDF9" stroke="#5B4A3F" strokeWidth="4" />
                <path d="M40 55 C35 30 55 35 60 50" fill="#FFDAB8" stroke="#5B4A3F" strokeWidth="3" />
                <path d="M120 55 C125 30 105 35 100 50" fill="#FFDAB8" stroke="#5B4A3F" strokeWidth="3" />
                <path d="M80 45 C65 25 90 15 95 30 C95 40 85 45 80 45Z" fill="#C6D9BE" stroke="#5B4A3F" strokeWidth="3" />
                <ellipse cx="56" cy="94" rx="8" ry="5" fill="#FFC7D1" opacity="0.8" />
                <ellipse cx="104" cy="94" rx="8" ry="5" fill="#FFC7D1" opacity="0.8" />
                <g>{currentMood.eyes}</g>
                <g>{currentMood.mouth}</g>
              </svg>
              <div
                style={{
                  marginTop: 12,
                  fontFamily: 'var(--font-display)',
                  fontSize: 15,
                  color: 'var(--text-brown)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  padding: '6px 18px',
                  borderRadius: 99,
                  border: '1px solid var(--card-border)',
                  zIndex: 2,
                }}
              >
                {currentMood.status}
              </div>
            </div>

            {/* Sticker row */}
            <div>
              <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-brown-light)', marginBottom: 12 }}>
                แตะสติกเกอร์เพื่อบอกความรู้สึก
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { key: 'happy', emoji: '😊', label: 'สุขใจ' },
                  { key: 'anxious', emoji: '😰', label: 'กังวล' },
                  { key: 'tired', emoji: '🥱', label: 'เหนื่อย' },
                  { key: 'calm', emoji: '🍃', label: 'ผ่อนคลาย' },
                  { key: 'angry', emoji: '😤', label: 'หงุดหงิด' },
                ].map((st) => (
                  <button
                    key={st.key}
                    onClick={() => handleSelectMood(st.key)}
                    style={{
                      flex: 1,
                      background: 'var(--card-white)',
                      border: selectedMood === st.key ? '2.5px solid var(--text-brown)' : '2px solid var(--card-border)',
                      transform: selectedMood === st.key ? 'translateY(-4px) scale(1.05)' : 'none',
                      borderRadius: 20,
                      padding: '12px 6px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      boxShadow: selectedMood === st.key ? '0 8px 16px rgba(91, 74, 63, 0.15)' : '0 4px 10px var(--shadow-color)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span style={{ fontSize: 28 }}>{st.emoji}</span>
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-display)', color: 'var(--text-brown)' }}>{st.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setActiveTab(2)
                setWizardStep(1)
              }}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #FFDAB8 0%, #FFC7D1 100%)',
                border: '2px solid #5B4A3F',
                color: '#5B4A3F',
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                fontWeight: 600,
                padding: '16px 20px',
                borderRadius: 24,
                cursor: 'pointer',
                boxShadow: '0 6px 0 #5B4A3F, 0 10px 20px rgba(91, 74, 63, 0.15)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
                marginTop: 12,
              }}
            >
              เริ่มบันทึกประจำวัน (1 นาที){' '}
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                arrow_forward
              </span>
            </button>
          </div>
        )}

        {/* SCREEN 2: 3-Step Wizard */}
        {activeTab === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 520, margin: '0 auto', animation: 'fadeUp 0.35s ease forwards' }}>
            {/* Step Dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
              {[1, 2, 3].map((st) => (
                <div
                  key={st}
                  style={{
                    height: 12,
                    width: wizardStep === st ? 32 : 12,
                    borderRadius: 99,
                    background: wizardStep === st ? 'var(--text-brown)' : wizardStep > st ? 'var(--accent-sage-deep)' : '#E5D5C5',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>

            {/* Wizard Step 1 */}
            {wizardStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: 'var(--card-white)', border: '2px solid var(--card-border)', borderRadius: 24, padding: 20, boxShadow: '0 8px 20px var(--shadow-color)' }}>
                  <h3 style={{ fontSize: 16, fontFamily: 'var(--font-display)', marginBottom: 12 }}>😴 การนอนหลับวันนี้</h3>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {['😴 นอนพอ (7-8 ชม.)', '🥱 นอนไม่พอ / ดึก'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setSleepOpt(opt)}
                        style={{
                          border: sleepOpt === opt ? '2px solid var(--text-brown)' : '1.5px solid var(--card-border)',
                          background: sleepOpt === opt ? 'var(--accent-peach)' : 'var(--bg-cream)',
                          color: 'var(--text-brown)',
                          padding: '8px 16px',
                          borderRadius: 99,
                          fontSize: 14,
                          cursor: 'pointer',
                          fontWeight: sleepOpt === opt ? 600 : 400,
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ background: 'var(--card-white)', border: '2px solid var(--card-border)', borderRadius: 24, padding: 20, boxShadow: '0 8px 20px var(--shadow-color)' }}>
                  <h3 style={{ fontSize: 16, fontFamily: 'var(--font-display)', marginBottom: 12 }}>🍚 อาหารการกิน</h3>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {['🍚 ทานอาหารครบมื้อ', '🍪 ข้ามมื้อ / ทานไม่ลง'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setFoodOpt(opt)}
                        style={{
                          border: foodOpt === opt ? '2px solid var(--text-brown)' : '1.5px solid var(--card-border)',
                          background: foodOpt === opt ? 'var(--accent-peach)' : 'var(--bg-cream)',
                          color: 'var(--text-brown)',
                          padding: '8px 16px',
                          borderRadius: 99,
                          fontSize: 14,
                          cursor: 'pointer',
                          fontWeight: foodOpt === opt ? 600 : 400,
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ background: 'var(--card-white)', border: '2px solid var(--card-border)', borderRadius: 24, padding: 20, boxShadow: '0 8px 20px var(--shadow-color)' }}>
                  <h3 style={{ fontSize: 16, fontFamily: 'var(--font-display)', marginBottom: 12 }}>🏫 ต้นตอความกังวล (เลือกได้หลายข้อ)</h3>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {['🏫 โรงเรียน', '🧑🤝🧑 เพื่อน', '🏠 ครอบครัว', '📚 การเรียน', '✨ ไม่มีเรื่องกังวล'].map((opt) => {
                      const isSel = concerns.includes(opt)
                      return (
                        <button
                          key={opt}
                          onClick={() => toggleConcern(opt)}
                          style={{
                            border: isSel ? '2px solid var(--text-brown)' : '1.5px solid var(--card-border)',
                            background: isSel ? 'var(--accent-peach)' : 'var(--bg-cream)',
                            color: 'var(--text-brown)',
                            padding: '8px 16px',
                            borderRadius: 99,
                            fontSize: 14,
                            cursor: 'pointer',
                            fontWeight: isSel ? 600 : 400,
                          }}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Wizard Step 2 */}
            {wizardStep === 2 && (
              <div style={{ background: 'var(--card-white)', border: '2px solid var(--card-border)', borderRadius: 24, padding: 24, boxShadow: '0 8px 20px var(--shadow-color)' }}>
                <h3 style={{ fontSize: 18, fontFamily: 'var(--font-display)', marginBottom: 16 }}>✨ กิจกรรมเยียวยาใจสั้นๆ</h3>
                
                <div style={{ display: 'flex', background: 'var(--bg-cream)', borderRadius: 16, padding: 4, marginBottom: 20, border: '1px solid var(--card-border)' }}>
                  <button
                    onClick={() => setHealingTab('jar')}
                    style={{
                      flex: 1,
                      border: 'none',
                      background: healingTab === 'jar' ? 'var(--card-white)' : 'transparent',
                      color: healingTab === 'jar' ? 'var(--text-brown)' : 'var(--text-brown-light)',
                      padding: 10,
                      borderRadius: 12,
                      fontFamily: 'var(--font-display)',
                      fontSize: 14,
                      cursor: 'pointer',
                      boxShadow: healingTab === 'jar' ? '0 2px 8px var(--shadow-color)' : 'none',
                    }}
                  >
                    ขวดโหลความรู้สึกดีๆ
                  </button>
                  <button
                    onClick={() => setHealingTab('breathe')}
                    style={{
                      flex: 1,
                      border: 'none',
                      background: healingTab === 'breathe' ? 'var(--card-white)' : 'transparent',
                      color: healingTab === 'breathe' ? 'var(--text-brown)' : 'var(--text-brown-light)',
                      padding: 10,
                      borderRadius: 12,
                      fontFamily: 'var(--font-display)',
                      fontSize: 14,
                      cursor: 'pointer',
                      boxShadow: healingTab === 'breathe' ? '0 2px 8px var(--shadow-color)' : 'none',
                    }}
                  >
                    ฝึกหายใจ 4 วิ
                  </button>
                </div>

                {healingTab === 'jar' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                    <textarea
                      value={gratitudeText}
                      onChange={(e) => setGratitudeText(e.target.value)}
                      placeholder="เขียนเรื่องดีๆ 1 อย่างที่เจอวันนี้... (เช่น ได้กินไอศกรีมอร่อยๆ)"
                      style={{
                        width: '100%',
                        height: 100,
                        border: '2px solid var(--card-border)',
                        borderRadius: 16,
                        padding: 14,
                        fontFamily: 'var(--font-body)',
                        fontSize: 15,
                        color: 'var(--text-brown)',
                        background: '#FFFDF9',
                        resize: 'none',
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={saveToJar}
                      style={{
                        background: 'var(--accent-sage)',
                        border: '1.5px solid var(--text-brown)',
                        color: 'var(--text-brown)',
                        fontFamily: 'var(--font-display)',
                        fontSize: 15,
                        padding: '10px 24px',
                        borderRadius: 99,
                        cursor: 'pointer',
                      }}
                    >
                      ใส่ลงขวด 🫙
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '16px 0' }}>
                    <div
                      style={{
                        width: 130,
                        height: 130,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent-sage) 0%, var(--accent-peach) 100%)',
                        border: '3px solid var(--text-brown)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-brown)',
                        fontFamily: 'var(--font-display)',
                        fontSize: 16,
                        boxShadow: '0 8px 24px rgba(198, 217, 190, 0.4)',
                      }}
                    >
                      หายใจเข้า...
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-brown-light)' }}>ผ่อนคลายตามจังหวะวงกลม 🌸</p>
                  </div>
                )}
              </div>
            )}

            {/* Wizard Step 3 */}
            {wizardStep === 3 && (
              <div style={{ background: 'var(--card-white)', border: '2px solid var(--card-border)', borderRadius: 24, padding: 24, boxShadow: '0 8px 20px var(--shadow-color)' }}>
                <h3 style={{ fontSize: 18, fontFamily: 'var(--font-display)', marginBottom: 16 }}>💌 สัญญาณถึงคุณครูแนะแนว</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-cream)', padding: 16, borderRadius: 16, border: '1px solid var(--card-border)' }}>
                    <span style={{ fontSize: 15, fontWeight: 500 }}>อยากคุยกับครูแบบเงียบๆ วันนี้ไหม?</span>
                    <input
                      type="checkbox"
                      checked={teacherToggle}
                      onChange={(e) => setTeacherToggle(e.target.checked)}
                      style={{ width: 24, height: 24, accentColor: 'var(--accent-pink-deep)', cursor: 'pointer' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-brown-light)', background: '#FFFDF9', padding: '10px 14px', borderRadius: 12, border: '1px dashed var(--card-border)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--accent-sage-deep)' }}>
                      lock
                    </span>
                    ข้อความนี้จะเป็นความลับเฉพาะครูแนะแนวเท่านั้น
                  </div>
                </div>
              </div>
            )}

            {/* Nav Buttons */}
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              {wizardStep > 1 && (
                <button
                  onClick={() => setWizardStep(wizardStep - 1)}
                  style={{
                    flex: 1,
                    background: 'var(--card-white)',
                    border: '2px solid var(--text-brown)',
                    color: 'var(--text-brown)',
                    fontFamily: 'var(--font-display)',
                    fontSize: 16,
                    padding: 14,
                    borderRadius: 20,
                    cursor: 'pointer',
                  }}
                >
                  ย้อนกลับ
                </button>
              )}
              <button
                onClick={handleNextStep}
                style={{
                  flex: 2,
                  background: 'linear-gradient(135deg, #FFDAB8 0%, #FFC7D1 100%)',
                  border: '2px solid #5B4A3F',
                  color: '#5B4A3F',
                  fontFamily: 'var(--font-display)',
                  fontSize: 16,
                  fontWeight: 600,
                  padding: 14,
                  borderRadius: 20,
                  cursor: 'pointer',
                  boxShadow: '0 4px 0 #5B4A3F',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {wizardStep === 3 ? 'เสร็จสิ้น 💖' : 'ถัดไป'}
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 3: Completion */}
        {activeTab === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 460, margin: '0 auto', gap: 20, animation: 'fadeUp 0.35s ease forwards' }}>
            <div>
              <h2 style={{ fontSize: 26, fontFamily: 'var(--font-display)', color: 'var(--text-brown)' }}>บันทึกเรียบร้อย! 🎉</h2>
              <p style={{ fontSize: 15, color: 'var(--text-brown-light)' }}>ขอบคุณที่ดูแลตัวเองในวันนี้</p>
            </div>

            <div
              style={{
                background: 'linear-gradient(180deg, #FFFDF9 0%, #FFF5EA 100%)',
                border: '2.5px solid var(--text-brown)',
                borderRadius: 24,
                padding: '28px 20px',
                width: '100%',
                boxShadow: '0 12px 30px rgba(91, 74, 63, 0.12)',
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  background: 'var(--accent-peach)',
                  border: '1px solid var(--text-brown)',
                  padding: '4px 14px',
                  borderRadius: 99,
                  fontFamily: 'var(--font-display)',
                  fontSize: 13,
                  marginBottom: 14,
                }}
              >
                Daily Affirmation 🌸
              </div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, lineHeight: 1.5, color: 'var(--text-brown)', marginBottom: 16 }}>
                &ldquo;ไม่ต้องเก่งทุกวัน แค่พยายามในแบบของตัวเองก็พอแล้ว&rdquo;
              </p>
              <svg viewBox="0 0 80 80" fill="none" style={{ width: 70, height: 70 }}>
                <path d="M40 70 V40" stroke="#5B4A3F" strokeWidth="3" />
                <path d="M40 50 C25 45 25 30 40 35" fill="#C6D9BE" stroke="#5B4A3F" strokeWidth="2" />
                <path d="M40 45 C55 40 55 25 40 30" fill="#C6D9BE" stroke="#5B4A3F" strokeWidth="2" />
                <circle cx="40" cy="30" r="8" fill="#FFC7D1" stroke="#5B4A3F" strokeWidth="2" />
              </svg>
            </div>

            <div style={{ display: 'flex', gap: 14, width: '100%' }}>
              <div style={{ flex: 1, background: 'var(--card-white)', border: '2px solid var(--card-border)', borderRadius: 20, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>🔥 🔥 🔥 🔥 🔥</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>5 วัน</div>
                <div style={{ fontSize: 12, color: 'var(--text-brown-light)' }}>Heart Streak</div>
              </div>
              <div style={{ flex: 1, background: 'var(--card-white)', border: '2px solid var(--card-border)', borderRadius: 20, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>💖</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: '#D9485C' }}>+15 แต้ม</div>
                <div style={{ fontSize: 12, color: 'var(--text-brown-light)' }}>Heart Energy</div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab(1)}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #FFDAB8 0%, #FFC7D1 100%)',
                border: '2px solid #5B4A3F',
                color: '#5B4A3F',
                fontFamily: 'var(--font-display)',
                fontSize: 17,
                fontWeight: 600,
                padding: '16px 20px',
                borderRadius: 24,
                cursor: 'pointer',
                boxShadow: '0 4px 0 #5B4A3F',
              }}
            >
              กลับหน้าหลัก
            </button>
          </div>
        )}

        {/* SCREEN 4: Desktop Counselor Dashboard */}
        {activeTab === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeUp 0.35s ease forwards' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--card-border)', paddingBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: 'var(--text-brown)' }}>แดชบอร์ดดูแลสุขภาพจิตนักเรียน 🏫</h2>
                <p style={{ fontSize: 14, color: 'var(--text-brown-light)' }}>ภาพรวมความพร้อมทางอารมณ์ ประจำชั้น ม.5/2</p>
              </div>
              <div style={{ background: '#EBF3E8', border: '1px solid var(--accent-sage-deep)', color: '#3B692B', padding: '6px 14px', borderRadius: 99, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  verified_user
                </span>{' '}
                ระบบอัปเดตเรียลไทม์
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 360px) 1fr', gap: 24 }}>
              {/* Left Donut */}
              <div style={{ background: 'var(--bg-cream)', border: '2px solid var(--card-border)', borderRadius: 24, padding: 24, boxShadow: '0 8px 20px var(--shadow-color)' }}>
                <h3 style={{ fontSize: 18, fontFamily: 'var(--font-display)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--accent-sage-deep)' }}>
                    pie_chart
                  </span>{' '}
                  สัดส่วนอารมณ์ห้อง ม.5/2
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                  <div
                    style={{
                      width: 170,
                      height: 170,
                      borderRadius: '50%',
                      background: 'conic-gradient(var(--accent-sage) 0% 80%, var(--accent-peach) 80% 95%, var(--accent-pink) 95% 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div style={{ width: 105, height: 105, borderRadius: '50%', background: 'var(--bg-cream)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600 }}>35</div>
                      <div style={{ fontSize: 11, color: 'var(--text-brown-light)' }}>นักเรียนทั้งหมด</div>
                    </div>
                  </div>

                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-sage)' }} />
                        <span>มีความสุข / ผ่อนคลาย</span>
                      </div>
                      <strong>80% (28 คน)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-peach)' }} />
                        <span>เหนื่อยล้า / เฉยๆ</span>
                      </div>
                      <strong>15% (5 คน)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-pink)' }} />
                        <span>ต้องการการดูแล</span>
                      </div>
                      <strong>5% (2 คน)</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Priority Support List */}
              <div style={{ background: 'var(--bg-cream)', border: '2px solid var(--card-border)', borderRadius: 24, padding: 24, boxShadow: '0 8px 20px var(--shadow-color)' }}>
                <h3 style={{ fontSize: 18, fontFamily: 'var(--font-display)', color: '#D9485C', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined">error</span> ต้องการการดูแลเพิ่มเติม (Priority Support)
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { name: 'นายณภัทร สมบูรณ์ (เลขที่ 12)', bg: 'var(--accent-peach)', letter: 'ณ', tags: [{ text: 'ขอคุยกับครู', type: 'pink' }, { text: 'กังวลใจ 3 วันติด', type: 'orange' }] },
                    { name: 'นางสาวพลอย วงศ์ดี (เลขที่ 5)', bg: 'var(--accent-pink)', letter: 'พ', tags: [{ text: 'ขอคุยกับครู', type: 'pink' }] },
                    { name: 'นายธนกร ใจงาม (เลขที่ 18)', bg: 'var(--accent-sage)', letter: 'ธ', tags: [{ text: 'เหนื่อยล้าสะสม 4 วัน', type: 'orange' }] },
                  ].map((std, i) => (
                    <div key={i} style={{ background: 'var(--card-white)', border: '1.5px solid var(--card-border)', borderRadius: 20, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: std.bg, border: '2px solid var(--text-brown)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 16 }}>
                          {std.letter}
                        </div>
                        <div>
                          <h4 style={{ fontSize: 15, color: 'var(--text-brown)' }}>{std.name}</h4>
                          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                            {std.tags.map((t, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: 11,
                                  padding: '2px 8px',
                                  borderRadius: 99,
                                  fontFamily: 'var(--font-display)',
                                  background: t.type === 'pink' ? '#FFE8EC' : '#FFF0E5',
                                  color: t.type === 'pink' ? '#D9485C' : '#D96B27',
                                  border: t.type === 'pink' ? '1px solid #FFB5C2' : '1px solid #FFD0B0',
                                }}
                              >
                                {t.text}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => addToast(`ส่งข้อความหา ${std.name} เรียบร้อยแล้ว 💌`)}
                        style={{
                          background: 'var(--accent-peach)',
                          border: '1.5px solid var(--text-brown)',
                          color: 'var(--text-brown)',
                          fontFamily: 'var(--font-display)',
                          fontSize: 13,
                          padding: '8px 16px',
                          borderRadius: 99,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          chat
                        </span>{' '}
                        ส่งข้อความ
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Toast Notifications */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background: 'var(--text-brown)',
              color: '#FFF8EF',
              fontFamily: 'var(--font-display)',
              fontSize: 14,
              padding: '12px 20px',
              borderRadius: 16,
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              animation: 'fadeUp 0.3s ease forwards',
            }}
          >
            <span className="material-symbols-outlined" style={{ color: 'var(--accent-peach)' }}>
              auto_awesome
            </span>
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  )
}
