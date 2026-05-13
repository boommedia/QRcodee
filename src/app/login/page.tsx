'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const HIGHLIGHTS = [
  { icon: '⚡', text: 'Dynamic QR codes — change URLs anytime' },
  { icon: '📊', text: 'Real-time scan analytics by country & device' },
  { icon: '🎨', text: 'Custom design with logo & brand colors' },
  { icon: '📁', text: 'Folders, bulk creation, and CSV export' },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else { router.push('/dashboard'); router.refresh() }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`,
    })
    if (error) { setError(error.message); setLoading(false) }
    else { setResetSent(true); setLoading(false) }
  }

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 border-r border-[var(--border)] bg-[var(--surface)] relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: 'var(--qr)', transform: 'translate(-30%, -30%)' }} />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full blur-3xl opacity-10" style={{ background: 'var(--qr-hover)', transform: 'translate(30%, 30%)' }} />

        <div className="relative">
          <Link href="/" className="flex items-center gap-2.5 mb-12">
            <div className="w-9 h-9 rounded-xl bg-[var(--qr)] flex items-center justify-center shadow-lg shadow-[var(--qr)]/30">
              <span className="text-white text-sm font-bold">QR</span>
            </div>
            <span className="font-bold text-lg text-[var(--text)]">QRcodee</span>
          </Link>

          <h2 className="text-2xl font-bold text-[var(--text)] mb-3">Welcome back.</h2>
          <p className="text-[var(--muted2)] text-sm mb-10 leading-relaxed">
            Your QR codes, analytics, and campaigns are waiting.
          </p>

          <div className="space-y-4">
            {HIGHLIGHTS.map(h => (
              <div key={h.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base" style={{ background: 'var(--qr)18' }}>
                  {h.icon}
                </div>
                <span className="text-sm text-[var(--muted2)]">{h.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5">
            <p className="text-sm text-[var(--text)] font-medium mb-1">&quot;Switched from QRCodeChimp and never looked back. Migration took 10 minutes.&quot;</p>
            <p className="text-xs text-[var(--muted2)]">— Beta user, Restaurant owner</p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--qr)] flex items-center justify-center">
                <span className="text-white text-xs font-bold">QR</span>
              </div>
              <span className="font-bold text-[var(--text)]">QRcodee</span>
            </Link>
          </div>

          {resetSent ? (
            <div className="text-center">
              <div className="text-4xl mb-4">📬</div>
              <h1 className="text-xl font-bold text-[var(--text)] mb-2">Check your email</h1>
              <p className="text-sm text-[var(--muted2)] mb-6">
                We sent a password reset link to <strong className="text-[var(--text)]">{email}</strong>.
              </p>
              <button onClick={() => { setResetMode(false); setResetSent(false) }} className="text-sm text-[var(--qr)] hover:text-[var(--qr-hover)]">
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-[var(--text)]">{resetMode ? 'Reset password' : 'Sign in'}</h1>
                <p className="mt-1 text-sm text-[var(--muted2)]">
                  {resetMode ? 'Enter your email and we\'ll send a reset link.' : 'Sign in to your QRcodee account.'}
                </p>
              </div>

              <form onSubmit={resetMode ? handleReset : handleLogin} className="space-y-4">
                {error && (
                  <div className="rounded-xl bg-red-900/20 border border-red-700/40 px-4 py-3 text-sm text-red-400">{error}</div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[var(--muted2)] uppercase tracking-wide mb-1.5">Email</label>
                  <input
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--qr)] focus:ring-1 focus:ring-[var(--qr)]/40"
                    placeholder="you@example.com"
                  />
                </div>

                {!resetMode && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-[var(--muted2)] uppercase tracking-wide">Password</label>
                      <button type="button" onClick={() => setResetMode(true)} className="text-xs text-[var(--qr)] hover:text-[var(--qr-hover)] transition-colors">
                        Forgot password?
                      </button>
                    </div>
                    <input
                      type="password" required value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--qr)] focus:ring-1 focus:ring-[var(--qr)]/40"
                      placeholder="••••••••"
                    />
                  </div>
                )}

                <button
                  type="submit" disabled={loading}
                  className="w-full rounded-xl bg-[var(--qr)] hover:bg-[var(--qr-dim)] disabled:opacity-60 text-white text-sm font-bold py-3 transition-colors"
                >
                  {loading ? (resetMode ? 'Sending…' : 'Signing in…') : (resetMode ? 'Send Reset Link' : 'Sign In')}
                </button>
              </form>

              {resetMode && (
                <button onClick={() => setResetMode(false)} className="w-full mt-3 text-sm text-[var(--muted2)] hover:text-[var(--text)] transition-colors">
                  ← Back to sign in
                </button>
              )}

              {!resetMode && (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[var(--border)]" />
                    </div>
                    <div className="relative flex justify-center text-xs text-[var(--muted2)]">
                      <span className="bg-[var(--bg)] px-3">or continue with</span>
                    </div>
                  </div>

                  <button
                    onClick={handleGoogle}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface2)] text-sm text-[var(--text)] font-medium py-3 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </button>

                  <p className="mt-6 text-center text-sm text-[var(--muted2)]">
                    No account?{' '}
                    <Link href="/signup" className="text-[var(--qr)] hover:text-[var(--qr-hover)] font-semibold">
                      Sign up free
                    </Link>
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
