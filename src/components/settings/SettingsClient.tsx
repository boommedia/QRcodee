'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SettingsClient({
  userId,
  initialName,
  initialEmail,
  initialCompany,
  hasPassword,
}: {
  userId: string
  initialName: string
  initialEmail: string
  initialCompany: string
  hasPassword: boolean
}) {
  const router = useRouter()

  // Profile state
  const [name, setName] = useState(initialName)
  const [company, setCompany] = useState(initialCompany)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Password state
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Delete account state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMsg(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name.trim(), company: company.trim() })
      .eq('id', userId)
    setProfileSaving(false)
    if (error) {
      setProfileMsg({ ok: false, text: error.message })
    } else {
      setProfileMsg({ ok: true, text: 'Profile saved.' })
      router.refresh()
      setTimeout(() => setProfileMsg(null), 3000)
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwMsg(null)
    if (pwNew.length < 8) { setPwMsg({ ok: false, text: 'Password must be at least 8 characters.' }); return }
    if (pwNew !== pwConfirm) { setPwMsg({ ok: false, text: 'Passwords do not match.' }); return }
    setPwSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: pwNew })
    setPwSaving(false)
    if (error) {
      setPwMsg({ ok: false, text: error.message })
    } else {
      setPwMsg({ ok: true, text: 'Password updated.' })
      setPwNew('')
      setPwConfirm('')
      setTimeout(() => setPwMsg(null), 3000)
    }
  }

  async function deleteAccount() {
    if (deleteConfirm !== initialEmail) return
    setDeleting(true)
    const res = await fetch('/api/account/delete', { method: 'DELETE' })
    if (res.ok) {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/')
    } else {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  return (
    <div className="min-h-full">
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(to right, #0891b2, #22d3ee, #f59e0b)' }} />

      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-[var(--muted2)] mb-1">
            <Link href="/dashboard" className="hover:text-[var(--text)] transition-colors">Dashboard</Link>
            <span>/</span>
            <span className="text-[var(--text)]">Settings</span>
          </div>
          <h1 className="text-xl font-bold text-[var(--text)]">Account Settings</h1>
          <p className="text-sm text-[var(--muted2)] mt-1">Manage your profile, password, and account.</p>
        </div>

        {/* ── Profile ─────────────────────────────────────────── */}
        <form onSubmit={saveProfile} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 mb-5">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-5">Profile</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--muted2)] uppercase tracking-wide mb-1.5">Email</label>
              <input
                type="email"
                value={initialEmail}
                disabled
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm text-[var(--muted2)] opacity-60 cursor-not-allowed"
              />
              <p className="text-[10px] text-[var(--muted2)] mt-1">Email address cannot be changed. Contact support if needed.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--muted2)] uppercase tracking-wide mb-1.5">Full Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--qr)] focus:ring-1 focus:ring-[var(--qr)]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--muted2)] uppercase tracking-wide mb-1.5">Company <span className="normal-case font-normal">(optional)</span></label>
              <input
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="Acme Corp"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--qr)] focus:ring-1 focus:ring-[var(--qr)]/40"
              />
            </div>
          </div>

          {profileMsg && (
            <p className={`mt-3 text-xs font-medium ${profileMsg.ok ? 'text-[var(--qr-hover)]' : 'text-red-400'}`}>
              {profileMsg.ok ? '✓ ' : '✕ '}{profileMsg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={profileSaving}
            className="mt-5 rounded-xl py-2.5 px-6 text-sm font-bold text-white transition-all disabled:opacity-60 bg-[var(--qr)] hover:bg-[var(--qr-dim)]"
          >
            {profileSaving ? 'Saving…' : 'Save Profile'}
          </button>
        </form>

        {/* ── Password ─────────────────────────────────────────── */}
        {hasPassword && (
          <form onSubmit={changePassword} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 mb-5">
            <h2 className="text-sm font-semibold text-[var(--text)] mb-1">Change Password</h2>
            <p className="text-xs text-[var(--muted2)] mb-5">Choose a new password for your account.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--muted2)] uppercase tracking-wide mb-1.5">New Password</label>
                <input
                  type="password"
                  value={pwNew}
                  onChange={e => setPwNew(e.target.value)}
                  placeholder="Min. 8 characters"
                  minLength={8}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--qr)] focus:ring-1 focus:ring-[var(--qr)]/40"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted2)] uppercase tracking-wide mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={pwConfirm}
                  onChange={e => setPwConfirm(e.target.value)}
                  placeholder="Repeat new password"
                  minLength={8}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--qr)] focus:ring-1 focus:ring-[var(--qr)]/40"
                />
              </div>
            </div>

            {pwMsg && (
              <p className={`mt-3 text-xs font-medium ${pwMsg.ok ? 'text-[var(--qr-hover)]' : 'text-red-400'}`}>
                {pwMsg.ok ? '✓ ' : '✕ '}{pwMsg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={pwSaving || !pwNew || !pwConfirm}
              className="mt-5 rounded-xl py-2.5 px-6 text-sm font-bold text-white transition-all disabled:opacity-60 bg-[var(--qr)] hover:bg-[var(--qr-dim)]"
            >
              {pwSaving ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        )}

        {/* ── Danger Zone ───────────────────────────────────────── */}
        <div className="rounded-2xl border border-red-800/30 bg-red-900/5 p-6">
          <h2 className="text-sm font-semibold text-red-400 mb-4">Danger Zone</h2>

          <div className="flex items-start justify-between gap-4 py-4 border-b border-red-800/20">
            <div>
              <p className="text-sm font-medium text-[var(--text)]">Sign out everywhere</p>
              <p className="text-xs text-[var(--muted2)] mt-0.5">Sign out of this session and all devices.</p>
            </div>
            <button
              onClick={async () => {
                const supabase = createClient()
                await supabase.auth.signOut()
                router.push('/login')
              }}
              className="shrink-0 rounded-xl border border-[var(--border)] text-xs text-[var(--muted2)] hover:text-[var(--text)] hover:border-[var(--border2)] px-4 py-2 transition-colors"
            >
              Sign Out
            </button>
          </div>

          <div className="flex items-start justify-between gap-4 pt-4">
            <div>
              <p className="text-sm font-medium text-red-400">Delete account</p>
              <p className="text-xs text-[var(--muted2)] mt-0.5">Permanently delete your account and all QR codes. This cannot be undone.</p>
            </div>
            <button
              onClick={() => setDeleteOpen(true)}
              className="shrink-0 rounded-xl border border-red-700/40 text-xs text-red-400 hover:bg-red-900/20 px-4 py-2 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-[var(--text)] mb-2">Delete your account?</h3>
            <p className="text-sm text-[var(--muted2)] mb-5">
              This will permanently delete your account, all QR codes, scans, and data.
              This <strong className="text-[var(--text)]">cannot be undone</strong>.
            </p>
            <p className="text-xs text-[var(--muted2)] mb-2">
              Type <strong className="text-[var(--text)]">{initialEmail}</strong> to confirm:
            </p>
            <input
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder={initialEmail}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-red-500 mb-5"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteOpen(false); setDeleteConfirm('') }}
                className="flex-1 rounded-xl border border-[var(--border)] py-2.5 text-sm font-semibold text-[var(--muted2)] hover:text-[var(--text)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteAccount}
                disabled={deleteConfirm !== initialEmail || deleting}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 transition-colors"
              >
                {deleting ? 'Deleting…' : 'Yes, delete my account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
