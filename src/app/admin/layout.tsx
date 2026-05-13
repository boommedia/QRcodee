import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const ADMIN_EMAILS = ['eric@boommedia.us']

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Admin top bar */}
      <div className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-red-500/20 flex items-center justify-center">
            <span className="text-red-400 text-[10px] font-bold">A</span>
          </div>
          <span className="text-sm font-semibold text-[var(--text)]">QRcodee Admin</span>
          <span className="text-[10px] font-semibold bg-red-900/20 text-red-400 border border-red-700/30 rounded px-2 py-0.5">
            ADMIN
          </span>
        </div>
        <a href="/dashboard" className="text-xs text-[var(--muted2)] hover:text-[var(--text)]">
          ← Back to Dashboard
        </a>
      </div>
      {children}
    </div>
  )
}
