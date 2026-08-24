import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ejomodzoobwaqgyrvhcx.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqb21vZHpvb2J3YXFneXJ2aGN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTE0OTM4NSwiZXhwIjoyMTAwNzI1Mzg1fQ.SPDUgmg-ZsJGdq1ipkzyD17oLLRIJ9tGQCE50MjJc4M'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function seedTeacher() {
  const email = 'counselor@teacher.heartful.school'
  const password = 'Counselor@2026'
  const fullName = 'ครูแนะแนว (ผู้ดูแลระบบ)'

  console.log(`Setting up teacher user: ${email}...`)

  // 1. Check if user already exists
  const { data: usersData, error: listErr } = await supabase.auth.admin.listUsers()
  if (listErr) {
    console.error('List users error:', listErr)
    return
  }

  const existing = usersData.users.find(u => u.email === email)
  let userId

  if (existing) {
    console.log(`User already exists (${existing.id}), updating password and metadata...`)
    const { data: updateData, error: updateErr } = await supabase.auth.admin.updateUserById(existing.id, {
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        room: 'ห้องแนะแนว',
        role: 'teacher',
      },
    })
    if (updateErr) {
      console.error('Update error:', updateErr)
      return
    }
    userId = updateData.user.id
  } else {
    console.log('Creating new user in Auth...')
    const { data: createData, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        room: 'ห้องแนะแนว',
        role: 'teacher',
      },
    })
    if (createErr) {
      console.error('Create error:', createErr)
      return
    }
    userId = createData.user.id
  }

  // 2. Upsert profile
  const { error: profErr } = await supabase.from('profiles').upsert({
    id: userId,
    full_name: fullName,
    room: 'ห้องแนะแนว',
    role: 'teacher',
  })

  if (profErr) {
    console.error('Profile upsert error:', profErr)
  } else {
    console.log('✅ Teacher account created & profile updated successfully!')
  }

  // 3. Test sign in
  const anonClient = createClient(SUPABASE_URL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqb21vZHpvb2J3YXFneXJ2aGN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNDkzODUsImV4cCI6MjEwMDcyNTM4NX0.KFpfjWADFoCOLYLk2zfWCmdBjuE1DzifSZDxuQAJg88')
  const { data: signInData, error: signInErr } = await anonClient.auth.signInWithPassword({
    email,
    password,
  })

  if (signInErr) {
    console.error('Test login failed:', signInErr)
  } else {
    console.log('🎉 Test sign in verified successfully! Session user ID:', signInData.user.id)
  }
}

seedTeacher()
