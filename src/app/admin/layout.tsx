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
      <div className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-3 flex items-center justify-between sticky top-0 z-10">
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

      {/* Admin sub-nav */}
      <div className="border-b border-[var(--border)] bg-[var(--surface)] px-6 flex gap-1 overflow-x-auto">
        {[
          { href: '/admin', label: 'Overview', icon: '📊' },
          { href: '/admin/users', label: 'Users', icon: '👥' },
          { href: '/admin/subscriptions', label: 'Subscriptions', icon: '💳' },
          { href: '/admin/qr', label: 'QR Codes', icon: '📱' },
          { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
        ].map(item => (
          <a
            key={item.href}
            href={item.href}
            className="flex items-center gap-1.5 px-3 py-3 text-xs font-medium text-[var(--muted2)] hover:text-[var(--text)] whitespace-nowrap border-b-2 border-transparent hover:border-[var(--qr)] transition-colors"
          >
            <span>{item.icon}</span>
            {item.label}
          </a>
        ))}
      </div>

      {children}
    </div>
  )
}
