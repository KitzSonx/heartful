import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ejomodzoobwaqgyrvhcx.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqb21vZHpvb2J3YXFneXJ2aGN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNDkzODUsImV4cCI6MjEwMDcyNTM4NX0.KFpfjWADFoCOLYLk2zfWCmdBjuE1DzifSZDxuQAJg88'

const supabase = createClient(SUPABASE_URL, ANON_KEY)

async function createTeacherUser() {
  const email = 'counselor@teacher.heartful.school'
  const password = 'Counselor@2026'
  const fullName = 'ครูแนะแนว (ผู้ดูแลระบบ)'

  console.log('Attempting sign in...')
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (!signInErr && signInData.user) {
    console.log('✅ Teacher already exists and can sign in! User ID:', signInData.user.id)
    return
  }

  console.log('Sign in failed:', signInErr?.message, '-> Attempting sign up...')
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        room: 'ห้องแนะแนว',
        role: 'teacher',
      },
    },
  })

  if (signUpErr) {
    console.error('Sign up error:', signUpErr)
  } else {
    console.log('✅ Sign up succeeded! User ID:', signUpData.user?.id)
  }
}

createTeacherUser()
