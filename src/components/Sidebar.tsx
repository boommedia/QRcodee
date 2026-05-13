'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { clsx } from 'clsx'

interface SidebarProps {
  user: {
    name: string
    email: string
    avatarUrl?: string | null
    plan: string
  }
}

const NAV = [
  {
    section: 'MY QR CODES',
    items: [
      { label: 'QR Codes List', href: '/dashboard/qr', icon: QRIcon },
      { label: 'Analytics', href: '/dashboard/analytics', icon: AnalyticsIcon },
      { label: 'Folders', href: '/dashboard/folders', icon: FolderIcon },
    ],
  },
  {
    section: 'BULK OPTIONS',
    items: [
      { label: 'Bulk QR Codes', href: '/dashboard/bulk', icon: BulkIcon, badge: 'Pro' },
    ],
  },
  {
    section: 'EXPORTS',
    items: [
      { label: 'Downloads', href: '/dashboard/downloads', icon: DownloadIcon },
    ],
  },
  {
    section: 'ACCOUNT',
    items: [
      { label: 'Settings', href: '/dashboard/settings', icon: SettingsIcon },
      { label: 'Billing', href: '/billing', icon: BillingIcon },
    ],
  },
]

const PLAN_COLORS: Record<string, string> = {
  free: 'text-[var(--muted2)] border-[var(--border)]',
  starter: 'text-[var(--starter)] border-green-700/40',
  pro: 'text-[var(--pro)] border-cyan-700/40',
  agency: 'text-[var(--agency)] border-yellow-700/40',
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <aside className="flex flex-col w-56 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] h-screen">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-[var(--border)]">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[var(--qr)] flex items-center justify-center">
            <span className="text-white text-xs font-bold">QR</span>
          </div>
          <span className="font-bold text-[var(--text)] text-sm">QRcodee</span>
        </Link>
      </div>

      {/* Create button */}
      <div className="px-3 py-3 border-b border-[var(--border)]">
        <Link
          href="/dashboard/qr/new"
          className="flex items-center justify-center gap-2 w-full rounded-lg bg-[var(--qr)] hover:bg-[var(--qr-dim)] text-white text-xs font-semibold py-2.5 transition-colors"
        >
          <span className="text-base leading-none">+</span>
          Create QR Code
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV.map(group => (
          <div key={group.section}>
            <p className="px-2 mb-1 text-[10px] font-semibold tracking-widest text-[var(--muted)] uppercase">
              {group.section}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(item => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={clsx(
                        'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors',
                        active
                          ? 'bg-[var(--qr)]/10 text-[var(--qr)]'
                          : 'text-[var(--muted2)] hover:bg-[var(--border)] hover:text-[var(--text)]'
                      )}
                    >
                      <item.icon className={clsx('w-4 h-4 shrink-0', active ? 'text-[var(--qr)]' : 'text-[var(--muted)]')} />
                      {item.label}
                      {item.badge && (
                        <span className="ml-auto text-[9px] font-semibold bg-[var(--qr)]/20 text-[var(--qr)] rounded px-1.5 py-0.5">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-[var(--border)] p-3">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-7 h-7 rounded-full bg-[var(--qr)]/20 flex items-center justify-center shrink-0">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold text-[var(--qr)]">{initials}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[var(--text)] truncate">{user.name || user.email}</p>
            <p className={clsx('text-[10px] font-semibold capitalize border rounded px-1 inline-block mt-0.5', PLAN_COLORS[user.plan] || PLAN_COLORS.free)}>
              {user.plan}
            </p>
          </div>
        </div>
        {user.plan === 'free' || user.plan === 'starter' ? (
          <Link
            href="/billing"
            className="block w-full text-center rounded-lg border border-[var(--qr)] text-[var(--qr)] hover:bg-[var(--qr)] hover:text-white text-xs font-semibold py-1.5 transition-colors mb-2"
          >
            Upgrade
          </Link>
        ) : null}
        <button
          onClick={handleSignOut}
          className="block w-full text-center rounded-lg text-[var(--muted2)] hover:text-[var(--text)] text-xs py-1 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}

// ── Icons ────────────────────────────────────────────────────

function QRIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75H16.5v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75H16.5v-.75Z" />
    </svg>
  )
}

function AnalyticsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  )
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
    </svg>
  )
}

function BulkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
    </svg>
  )
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

function BillingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
    </svg>
  )
}
