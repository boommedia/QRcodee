'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Profile = { full_name?: string | null; email?: string | null; company?: string | null; avatar_url?: string | null } | null

export default function SettingsClient({
  profile,
  userId,
  userEmail,
}: {
  profile: Profile
  userId: string
  userEmail: string
}) {
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [company, setCompany] = useState(profile?.company || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwDone, setPwDone] = useState(false)

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    await supabase.from('profiles').update({ full_name: fullName, company }).eq('id', userId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pwNew.length < 8) { setPwError('Password must be at least 8 characters'); return }
    setPwSaving(true)
    setPwError('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: pwNew })
    if (error) { setPwError(error.message); setPwSaving(false); return }
    setPwDone(true)
    setPwCurrent('')
    setPwNew('')
    setPwSaving(false)
    setTimeout(() => setPwDone(false), 3000)
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-full">
      <div className="h-0.5 w-full bg-gradient-to-r from-[var(--qr)] via-[var(--qr-hover)] to-[var(--warn)]" />

      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-[var(--muted2)] mb-1">
            <Link href="/dashboard" className="hover:text-[var(--text)]">Dashboard</Link>
            <span>/</span>
            <span className="text-[var(--text)]">Settings</span>
          </div>
          <h1 className="text-xl font-bold text-[var(--text)]">Account Settings</h1>
        </div>

        {/* Profile */}
        <form onSubmit={saveProfile} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 mb-5">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-5">Profile</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--muted2)] uppercase tracking-wide mb-1.5">Email</label>
              <input
                type="email"
                value={userEmail}
                disabled
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm text-[var(--muted2)] opacity-60 cursor-not-allowed"
              />
              <p className="text-[10px] text-[var(--muted2)] mt-1">Email cannot be changed here. Contact support.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--muted2)] uppercase tracking-wide mb-1.5">Full Name</label>
              <input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--qr)] focus:ring-1 focus:ring-[var(--qr)]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--muted2)] uppercase tracking-wide mb-1.5">Company</label>
              <input
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="Acme Corp"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--qr)] focus:ring-1 focus:ring-[var(--qr)]/40"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-5 rounded-xl py-2.5 px-6 text-sm font-bold text-white transition-all disabled:opacity-50"
            style={{ background: saved ? 'var(--success)' : 'var(--qr)' }}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Profile'}
          </button>
        </form>

        {/* Password */}
        <form onSubmit={changePassword} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 mb-5">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-5">Change Password</h2>

          {pwError && (
            <div className="rounded-lg bg-red-900/20 border border-red-700/40 px-4 py-3 text-xs text-red-400 mb-4">{pwError}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--muted2)] uppercase tracking-wide mb-1.5">New Password</label>
              <input
                type="password"
                value={pwNew}
                onChange={e => setPwNew(e.target.value)}
                placeholder="Min. 8 characters"
                minLength={8}
                required
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--qr)] focus:ring-1 focus:ring-[var(--qr)]/40"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={pwSaving || !pwNew}
            className="mt-5 rounded-xl py-2.5 px-6 text-sm font-bold text-white transition-all disabled:opacity-50"
            style={{ background: pwDone ? 'var(--success)' : 'var(--qr)' }}
          >
            {pwSaving ? 'Updating…' : pwDone ? '✓ Password Updated!' : 'Update Password'}
          </button>
        </form>

        {/* Danger zone */}
        <div className="rounded-2xl border border-red-800/30 bg-red-900/5 p-6">
          <h2 className="text-sm font-semibold text-red-400 mb-4">Account</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text)]">Sign out</p>
              <p className="text-xs text-[var(--muted2)]">Sign out of this device</p>
            </div>
            <button
              onClick={signOut}
              className="rounded-xl border border-[var(--border)] text-xs text-[var(--muted2)] hover:text-[var(--text)] hover:border-[var(--qr)] px-4 py-2 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
