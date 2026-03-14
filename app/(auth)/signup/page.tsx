'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup() {
    setError('')
    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri.')
      return
    }
    if (password !== confirm) {
      setError('Le password non coincidono.')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message.includes('already registered')
        ? 'Email già registrata. Prova ad accedere.'
        : 'Errore di rete. Riprova.')
      setLoading(false)
      return
    }
    router.push('/profilo/setup')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#1E3A5F' }}>Crea il tuo account</h1>
        <p className="text-sm text-gray-500 mb-6">Inizia a ricevere le opportunità giuste per te.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
              placeholder="min. 6 caratteri"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conferma password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSignup()}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full py-2 rounded-lg text-white text-sm font-medium transition-opacity disabled:opacity-60"
            style={{ backgroundColor: '#2E86C1' }}
          >
            {loading ? 'Registrazione in corso...' : 'Registrati'}
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-6 text-center">
          Hai già un account?{' '}
          <Link href="/login" className="font-medium" style={{ color: '#2E86C1' }}>
            Accedi
          </Link>
        </p>
      </div>
    </div>
  )
}
```

---

Crea la cartella `app/(auth)/login/` e `app/(auth)/signup/`, metti i file dentro, poi:
```
git add .
git commit -m "add auth pages"
git push