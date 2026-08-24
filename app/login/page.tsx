// app/login/page.tsx - หน้าเข้าสู่ระบบและสมัครสมาชิก (Style เข้ากับหน้าหลัก - Warm Pastel)
'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTarget = searchParams.get('redirect')

  const [roleTab, setRoleTab] = useState<'student' | 'teacher'>('student')
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Student Form State
  const [studentId, setStudentId] = useState('')
  const [studentFullName, setStudentFullName] = useState('')
  const [studentGrade, setStudentGrade] = useState<'4' | '5' | '6' | ''>('')
  const [studentRoomNum, setStudentRoomNum] = useState('')
  const [studentNumber, setStudentNumber] = useState('')
  const [studentPassword, setStudentPassword] = useState('')

  const studentRoom = studentGrade && studentRoomNum ? `${studentGrade}.${studentRoomNum}` : ''

  // Teacher Form State
  const [teacherUsername, setTeacherUsername] = useState('')
  const [teacherPassword, setTeacherPassword] = useState('')
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0)

  // ตรวจสอบสถานะ Lockout ของครู (ป้องกัน Brute Force)
  useEffect(() => {
    const checkLockout = () => {
      const lockUntilStr = localStorage.getItem('teacher_lockout_until')
      if (lockUntilStr) {
        const lockUntil = Number(lockUntilStr)
        const now = Date.now()
        if (now < lockUntil) {
          setLockoutRemaining(Math.ceil((lockUntil - now) / 1000))
        } else {
          setLockoutRemaining(0)
          localStorage.removeItem('teacher_lockout_until')
          localStorage.removeItem('teacher_failed_attempts')
        }
      }
    }

    checkLockout()
    const timer = setInterval(checkLockout, 1000)
    return () => clearInterval(timer)
  }, [])

  const getStudentEmail = (idStr: string) => {
    const clean = idStr.trim()
    return clean.includes('@') ? clean : `${clean}@heartful.school`
  }

  const handleStudentAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setLoading(true)
    try {
      if (authMode === 'signup') {
        if (!studentId.trim() || !studentFullName.trim() || !studentGrade || !studentRoomNum || !studentNumber || !studentPassword) {
          setErrorMsg('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง')
          setLoading(false)
          return
        }
        if (studentPassword.length < 6) {
          setErrorMsg('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร')
          setLoading(false)
          return
        }
        const email = getStudentEmail(studentId)
        const { data, error } = await supabase.auth.signUp({
          email,
          password: studentPassword,
          options: {
            data: {
              student_id: studentId.trim(),
              full_name: studentFullName.trim(),
              room: studentRoom,
              student_number: Number(studentNumber),
              role: 'student',
            },
          },
        })
        if (error) {
          setErrorMsg(error.message.includes('already registered') ? 'รหัสนักเรียนนี้มีในระบบแล้ว กรุณาเข้าสู่ระบบ' : error.message)
          setLoading(false)
          return
        }
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            student_id: studentId.trim(),
            full_name: studentFullName.trim(),
            room: studentRoom,
            student_number: Number(studentNumber),
            role: 'student',
          })
        }
        if (data.session) {
          router.push(redirectTarget || '/diary')
          router.refresh()
        } else {
          setSuccessMsg('สมัครสมาชิกสำเร็จ! กำลังเข้าสู่ระบบ...')
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: studentPassword })
          if (!signInErr) {
            router.push(redirectTarget || '/diary')
            router.refresh()
          } else {
            setAuthMode('signin')
          }
        }
      } else {
        if (!studentId.trim() || !studentPassword) {
          setErrorMsg('กรุณากรอกรหัสนักเรียนและรหัสผ่าน')
          setLoading(false)
          return
        }
        const email = getStudentEmail(studentId)
        const { error } = await supabase.auth.signInWithPassword({ email, password: studentPassword })
        if (error) { setErrorMsg('รหัสนักเรียนหรือรหัสผ่านไม่ถูกต้อง'); setLoading(false); return }
        router.push(redirectTarget || '/diary')
        router.refresh()
      }
    } catch { setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง') }
    setLoading(false)
  }

  // ระบบเข้าสู่ระบบครูแบบปลอดภัย (Sign-in Only + Anti-Brute-Force Rate Limiting)
  const handleTeacherAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (lockoutRemaining > 0) {
      setErrorMsg(`⚠️ บัญชีครูถูกล็อคชั่วคราวเพื่อความปลอดภัย กรุณารออีก ${lockoutRemaining} วินาที`)
      return
    }

    if (!teacherUsername.trim() || !teacherPassword) {
      setErrorMsg('กรุณากรอกชื่อผู้ใช้และรหัสผ่านครู')
      return
    }

    setLoading(true)
    try {
      // เรียก API หลังบ้านเพื่อตรวจสอบรหัสและสร้าง Session
      const res = await fetch('/api/auth/teacher-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: teacherUsername,
          password: teacherPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        // คำนวณจำนวนครั้งที่ใส่ผิด
        const currentAttempts = Number(localStorage.getItem('teacher_failed_attempts') || '0') + 1
        localStorage.setItem('teacher_failed_attempts', String(currentAttempts))

        if (currentAttempts >= 5) {
          const lockTime = Date.now() + 60 * 1000 // ล็อค 60 วินาที
          localStorage.setItem('teacher_lockout_until', String(lockTime))
          setLockoutRemaining(60)
          setErrorMsg('⚠️ คุณใส่รหัสผ่านผิดเกิน 5 ครั้ง ระบบทำการล็อคชั่วคราว 60 วินาทีเพื่อความปลอดภัย')
        } else {
          setErrorMsg(`ชื่อผู้ใช้หรือรหัสผ่านครูไม่ถูกต้อง (เหลือโอกาสลองอีก ${5 - currentAttempts} ครั้ง)`)
        }
        setLoading(false)
        return
      }

      // เข้าสู่ระบบสำเร็จ -> รีเซ็ตประวัติการล็อกอินผิด
      localStorage.removeItem('teacher_failed_attempts')
      localStorage.removeItem('teacher_lockout_until')

      if (data.session) {
        await supabase.auth.setSession(data.session)
      }

      router.push(data.redirect || redirectTarget || '/teacher')
      router.refresh()
    } catch {
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
      fontFamily: 'var(--font-body)',
      background: 'var(--bg-cream)',
      backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(255,218,184,0.4) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(198,217,190,0.35) 0%, transparent 40%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient blobs */}
      <div style={{ position: 'fixed', top: -80, right: -80, width: 380, height: 380, borderRadius: '50%', background: 'rgba(255,192,144,0.25)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '10%', left: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(198,217,190,0.3)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: '40%', left: '30%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,199,209,0.2)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>

        {/* Header Mascot & Title */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', marginBottom: 16 }}>
            <div style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'rgba(255,217,102,0.45)',
              filter: 'blur(22px)',
              position: 'absolute',
              zIndex: 0,
            }} />
            <svg viewBox="0 0 160 160" fill="none" style={{ width: 120, height: 120, zIndex: 1, position: 'relative' }}>
              <ellipse cx="80" cy="95" rx="55" ry="50" fill="#FFFDF9" stroke="#5B4A3F" strokeWidth="4" />
              <path d="M40 55 C35 30 55 35 60 50" fill="#FFDAB8" stroke="#5B4A3F" strokeWidth="3" />
              <path d="M120 55 C125 30 105 35 100 50" fill="#FFDAB8" stroke="#5B4A3F" strokeWidth="3" />
              <path d="M80 45 C65 25 90 15 95 30 C95 40 85 45 80 45Z" fill="#C6D9BE" stroke="#5B4A3F" strokeWidth="3" />
              <ellipse cx="56" cy="94" rx="8" ry="5" fill="#FFC7D1" opacity="0.8" />
              <ellipse cx="104" cy="94" rx="8" ry="5" fill="#FFC7D1" opacity="0.8" />
              <circle cx="62" cy="86" r="5" fill="#5B4A3F" />
              <circle cx="98" cy="86" r="5" fill="#5B4A3F" />
              <path d="M72 96 Q80 104 88 96" stroke="#5B4A3F" strokeWidth="3" strokeLinecap="round" fill="none" />
            </svg>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, color: 'var(--text-brown)', letterSpacing: '0.01em' }}>
            Heartful
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-brown-light)', marginTop: 4 }}>
            โรงเรียนเทศบาล 6 นครเชียงราย · วิชาแนะแนว
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid var(--card-border)',
          borderRadius: 24,
          padding: '24px 22px',
          boxShadow: '0 8px 32px rgba(91,74,63,0.08), 0 2px 8px rgba(91,74,63,0.04)',
        }}>

          {/* Role Tabs */}
          <div style={{
            display: 'flex',
            background: '#F5ECE1',
            borderRadius: 14,
            padding: 4,
            marginBottom: 20,
            gap: 4,
          }}>
            <button
              type="button"
              onClick={() => { setRoleTab('student'); setErrorMsg(''); setSuccessMsg('') }}
              style={{
                flex: 1,
                padding: '9px 0',
                borderRadius: 10,
                border: 'none',
                background: roleTab === 'student' ? '#FFFDF9' : 'transparent',
                color: roleTab === 'student' ? 'var(--text-brown)' : 'var(--text-brown-light)',
                fontWeight: roleTab === 'student' ? 600 : 400,
                fontSize: 14,
                fontFamily: 'var(--font-display)',
                cursor: 'pointer',
                boxShadow: roleTab === 'student' ? '0 2px 8px rgba(91,74,63,0.1)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              🎓 สำหรับนักเรียน
            </button>

            <button
              type="button"
              onClick={() => { setRoleTab('teacher'); setErrorMsg(''); setSuccessMsg('') }}
              style={{
                flex: 1,
                padding: '9px 0',
                borderRadius: 10,
                border: 'none',
                background: roleTab === 'teacher' ? '#FFFDF9' : 'transparent',
                color: roleTab === 'teacher' ? 'var(--text-brown)' : 'var(--text-brown-light)',
                fontWeight: roleTab === 'teacher' ? 600 : 400,
                fontSize: 14,
                fontFamily: 'var(--font-display)',
                cursor: 'pointer',
                boxShadow: roleTab === 'teacher' ? '0 2px 8px rgba(91,74,63,0.1)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              👩‍🏫 สำหรับคุณครู
            </button>
          </div>

          {/* Mode Switcher */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-brown)', fontFamily: 'var(--font-display)' }}>
              {roleTab === 'student'
                ? (authMode === 'signin' ? 'เข้าสู่ระบบนักเรียน' : 'ลงทะเบียนนักเรียนใหม่')
                : 'เข้าสู่ระบบครู (Teacher Portal)'}
            </h2>
            {roleTab === 'student' ? (
              <button
                type="button"
                onClick={() => { setAuthMode(authMode === 'signin' ? 'signup' : 'signin'); setErrorMsg('') }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-brown-light)',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  textDecoration: 'underline',
                  textUnderlineOffset: 3,
                }}
              >
                {authMode === 'signin' ? 'ยังไม่มีบัญชี? สมัครที่นี่' : 'มีบัญชีแล้ว? เข้าสู่ระบบ'}
              </button>
            ) : (
              <span style={{ fontSize: 11.5, color: '#9E7D62', background: '#F5ECE1', padding: '3px 8px', borderRadius: 6, fontWeight: 500 }}>
                🔒 ครูแนะแนวเท่านั้น
              </span>
            )}
          </div>

          {/* Student Form */}
          {roleTab === 'student' && (
            <form onSubmit={handleStudentAuth} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div>
                <label style={labelStyle}>รหัสนักเรียน (Student ID)</label>
                <input type="text" value={studentId} onChange={e => setStudentId(e.target.value)}
                  placeholder="เช่น 12345" required style={inputStyle} />
              </div>

              {authMode === 'signup' && (
                <>
                  <div>
                    <label style={labelStyle}>ชื่อ-นามสกุล</label>
                    <input type="text" value={studentFullName} onChange={e => setStudentFullName(e.target.value)}
                      placeholder="เช่น สมชาย ใจดี" required style={inputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <div>
                      <label style={labelStyle}>ระดับชั้น</label>
                      <select
                        value={studentGrade}
                        onChange={e => {
                          const g = e.target.value as '4' | '5' | '6' | ''
                          setStudentGrade(g)
                          if (g !== '4' && Number(studentRoomNum) > 18) {
                            setStudentRoomNum('')
                          }
                        }}
                        required
                        style={{ ...inputStyle, cursor: 'pointer' }}
                      >
                        <option value="">ชั้น...</option>
                        <option value="4">ม.4</option>
                        <option value="5">ม.5</option>
                        <option value="6">ม.6</option>
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>ห้อง</label>
                      <select
                        value={studentRoomNum}
                        onChange={e => setStudentRoomNum(e.target.value)}
                        disabled={!studentGrade}
                        required
                        style={{ ...inputStyle, cursor: studentGrade ? 'pointer' : 'not-allowed', opacity: studentGrade ? 1 : 0.6 }}
                      >
                        <option value="">ห้อง...</option>
                        {studentGrade && Array.from(
                          { length: studentGrade === '4' ? 19 : 18 },
                          (_, i) => i + 1
                        ).map(r => (
                          <option key={r} value={String(r)}>ห้อง {r}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>เลขที่</label>
                      <select
                        value={studentNumber}
                        onChange={e => setStudentNumber(e.target.value)}
                        required
                        style={{ ...inputStyle, cursor: 'pointer' }}
                      >
                        <option value="">เลขที่...</option>
                        {Array.from({ length: 50 }, (_, i) => i + 1).map(n => (
                          <option key={n} value={String(n)}>{n}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {studentRoom && (
                    <div style={{ fontSize: 12, color: 'var(--text-brown-light)', textAlign: 'right', marginTop: -4 }}>
                      ชั้น/ห้อง: <strong style={{ color: 'var(--text-brown)' }}>{studentRoom}</strong> (ม.{studentGrade}/{studentRoomNum})
                    </div>
                  )}
                </>
              )}

              <div>
                <label style={labelStyle}>
                  รหัสผ่าน {authMode === 'signup' && <span style={{ color: 'var(--text-brown-light)', fontWeight: 400 }}>(อย่างน้อย 6 ตัว)</span>}
                </label>
                <input type="password" value={studentPassword} onChange={e => setStudentPassword(e.target.value)}
                  placeholder="••••••••" required style={inputStyle} />
              </div>

              {errorMsg && <AlertBox type="error" msg={errorMsg} />}
              {successMsg && <AlertBox type="success" msg={successMsg} />}

              <button type="submit" disabled={loading} style={submitStyle(loading)}>
                {loading ? 'กำลังดำเนินการ...' : authMode === 'signin' ? 'เข้าสู่ระบบ' : 'ลงทะเบียนและเริ่มใช้งาน'}
              </button>
            </form>
          )}

          {/* Teacher Form (Sign-in Only with Anti-Brute-Force Protection) */}
          {roleTab === 'teacher' && (
            <form onSubmit={handleTeacherAuth} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div>
                <label style={labelStyle}>ชื่อผู้ใช้คุณครู (Teacher Username)</label>
                <input
                  type="text"
                  value={teacherUsername}
                  onChange={e => setTeacherUsername(e.target.value)}
                  disabled={lockoutRemaining > 0}
                  placeholder="เช่น admin หรือ counselor"
                  required
                  style={{ ...inputStyle, opacity: lockoutRemaining > 0 ? 0.6 : 1 }}
                />
              </div>

              <div>
                <label style={labelStyle}>รหัสผ่าน (Password)</label>
                <input
                  type="password"
                  value={teacherPassword}
                  onChange={e => setTeacherPassword(e.target.value)}
                  disabled={lockoutRemaining > 0}
                  placeholder="••••••••"
                  required
                  style={{ ...inputStyle, opacity: lockoutRemaining > 0 ? 0.6 : 1 }}
                />
              </div>

              {lockoutRemaining > 0 && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  fontSize: 13,
                  background: '#FFF0F0',
                  color: '#C0392B',
                  border: '1.5px solid #FFCDD2',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <span>⏳</span>
                  <span>ระงับการเข้าสู่ระบบชั่วคราว: กรุณารอ <strong>{lockoutRemaining} วินาที</strong></span>
                </div>
              )}

              {errorMsg && !lockoutRemaining && <AlertBox type="error" msg={errorMsg} />}
              {successMsg && <AlertBox type="success" msg={successMsg} />}

              <button
                type="submit"
                disabled={loading || lockoutRemaining > 0}
                style={submitStyle(loading || lockoutRemaining > 0)}
              >
                {lockoutRemaining > 0
                  ? `รออีก ${lockoutRemaining} วินาที...`
                  : loading
                  ? 'กำลังตรวจสอบ...'
                  : 'เข้าสู่ระบบครู'}
              </button>
            </form>
          )}
        </div>

        {/* Footer note */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-brown-light)' }}>
          ระบบไดอารี่สุขภาพ · โรงเรียนเทศบาล 6 นครเชียงราย
        </p>
      </div>
    </div>
  )
}

// Styles
const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--text-brown)',
  display: 'block',
  marginBottom: 6,
  fontFamily: 'var(--font-display)',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  background: '#FFFDF9',
  border: '1.5px solid var(--card-border)',
  borderRadius: 10,
  fontSize: 14,
  color: 'var(--text-brown)',
  fontFamily: 'var(--font-body)',
  outline: 'none',
  transition: 'border-color 0.2s',
}

const submitStyle = (loading: boolean): React.CSSProperties => ({
  padding: '13px',
  borderRadius: 12,
  border: 'none',
  background: loading ? 'rgba(91,74,63,0.4)' : 'var(--text-brown)',
  color: '#FFF8EF',
  fontSize: 15,
  fontWeight: 500,
  fontFamily: 'var(--font-display)',
  cursor: loading ? 'not-allowed' : 'pointer',
  marginTop: 4,
  boxShadow: loading ? 'none' : '0 4px 14px rgba(91,74,63,0.25)',
  transition: 'all 0.2s',
  letterSpacing: '0.01em',
})

function AlertBox({ type, msg }: { type: 'error' | 'success'; msg: string }) {
  const isErr = type === 'error'
  return (
    <div style={{
      padding: '10px 14px',
      borderRadius: 10,
      background: isErr ? 'rgba(255,154,162,0.15)' : 'rgba(163,194,151,0.2)',
      border: `1.5px solid ${isErr ? 'rgba(255,154,162,0.5)' : 'rgba(163,194,151,0.5)'}`,
      color: isErr ? '#c0392b' : '#27622d',
      fontSize: 12.5,
      textAlign: 'center',
    }}>
      {msg}
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-cream)', color: 'var(--text-brown-light)', fontFamily: 'var(--font-body)' }}>
        กำลังโหลด...
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
