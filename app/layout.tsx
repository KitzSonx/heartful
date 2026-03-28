import type { Metadata } from 'next'
import { Itim } from 'next/font/google' // 1. เปลี่ยนเป็นนำเข้าฟอนต์ Itim
import '../styles/globals.css'

// 2. ตั้งค่าการใช้งานฟอนต์ Itim
const itim = Itim({
  subsets: ['thai', 'latin'],
  weight: ['400'], // Itim ปกติจะมีน้ำหนักเดียวคือ 400 ครับ
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Heartful — รักตัวเองทุกวัน',
  description: 'ติดตามสุขภาพกาย ใจ และสังคม เพื่อชีวิตที่ดีขึ้นทุกวัน',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      {/* 3. ใส่ className ของฟอนต์ Itim ที่ body */}
      <body className={itim.className}>
        <div className="ambient-orb orb-1" />
        <div className="ambient-orb orb-2" />
        <div className="ambient-orb orb-3" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  )
}