async function testTeacherLogin() {
  try {
    const res = await fetch('http://localhost:3001/api/auth/teacher-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'counselor',
        password: 'Counselor@2026',
      }),
    })

    const data = await res.json()
    console.log('Status:', res.status)
    console.log('Result:', data)
  } catch (err) {
    console.error('Test error:', err)
  }
}

testTeacherLogin()
