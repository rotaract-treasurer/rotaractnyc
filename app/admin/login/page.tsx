'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { signInWithEmailAndPassword } from 'firebase/auth'
import {
  getFirebaseAuth,
  getMissingFirebaseClientEnvVars,
  isFirebaseClientConfigured,
} from '@/lib/firebase/client'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!isFirebaseClientConfigured()) {
        const missing = getMissingFirebaseClientEnvVars()
        const missingText = missing.length ? `Missing: ${missing.join(', ')}` : 'Missing Firebase env vars.'
        setError(
          `Firebase is not configured. ${missingText} (Set these in .env.local for local dev, or in Vercel Project Settings → Environment Variables, then redeploy.)`
        )
        return
      }

      const auth = getFirebaseAuth()
      if (!auth) {
        setError('Firebase Auth is not initialized.')
        return
      }

      const credential = await signInWithEmailAndPassword(auth, email, password)
      const idToken = await credential.user.getIdToken()

      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })

      if (res.status === 403) {
        setError('This email is not allowed to access the admin portal.')
        await auth.signOut()
        return
      }

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as null | { error?: string }
        const details = payload?.error ? ` (${payload.error})` : ''
        setError(`Unable to start admin session. Check Firebase Admin credentials.${details}`)
        await auth.signOut()
        return
      }

      router.push('/admin/dashboard')
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code

      if (code === 'auth/user-not-found') {
        setError(
          'No Firebase Auth user exists for this email. Create the user in Firebase Console → Authentication → Users, or use a password reset if already invited.'
        )
        return
      }

      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Incorrect password for this email.')
        return
      }

      if (code === 'auth/invalid-email') {
        setError('That email address is not valid.')
        return
      }

      if (code === 'auth/operation-not-allowed') {
        setError(
          'Email/Password sign-in is disabled for this Firebase project. Enable it in Firebase Console → Authentication → Sign-in method.'
        )
        return
      }

      if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a bit and try again.')
        return
      }

      setError('Unable to sign in. Double-check the email/password and Firebase project configuration.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 space-y-8 relative z-10 border border-gray-100">
        <div className="text-center">
          <Image
            src="/Rotaract%20Logo%20(1).png"
            alt="Rotaract Logo"
            width={100}
            height={100}
            className="mx-auto"
          />
          <h2 className="mt-6 text-3xl font-bold text-primary">
            Admin Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to manage the website
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="admin@rotaractnyc.org"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="text-center text-xs text-gray-500 mt-4">
          <p>Sign in with a Firebase Auth admin account.</p>
        </div>
      </div>
    </div>
  )
}
