import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = await createServiceClient()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

  const [
    { count: totalUsers },
    { count: newUsersMonth },
    { count: totalQR },
    { count: totalScans },
    { count: scansMonth },
    { data: planBreakdown },
    { data: recentUsers },
    { data: recentQR },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('updated_at', monthStart),
    supabase.from('qr_codes').select('id', { count: 'exact', head: true }),
    supabase.from('scans').select('id', { count: 'exact', head: true }),
    supabase.from('scans').select('id', { count: 'exact', head: true }).gte('scanned_at', monthStart),
    supabase.from('subscriptions').select('plan'),
    supabase.from('profiles').select('id, email, full_name, updated_at').order('updated_at', { ascending: false }).limit(10),
    supabase.from('qr_codes').select('id, name, type, scan_count, user_id, created_at').order('created_at', { ascending: false }).limit(10),
  ])

  // Plan counts
  const plans = { free: 0, starter: 0, pro: 0, agency: 0 } as Record<string, number>
  planBreakdown?.forEach(s => { if (s.plan in plans) plans[s.plan]++ })

  // Rough MRR
  const MRR = plans.starter * 19 + plans.pro * 49 + plans.agency * 149

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text)]">Admin Overview</h1>
        <p className="text-sm text-[var(--muted2)] mt-0.5">{now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <AdminStat label="Total Users" value={String(totalUsers || 0)} sub={`+${newUsersMonth || 0} this month`} accent="#38bdf8" />
        <AdminStat label="Est. MRR" value={`$${MRR.toLocaleString()}`} sub={`${(plans.starter + plans.pro + plans.agency)} paying`} accent="#34D399" />
        <AdminStat label="QR Codes" value={String(totalQR || 0)} accent="#a78bfa" />
        <AdminStat label="Scans This Month" value={String(scansMonth || 0)} sub={`${totalScans || 0} all-time`} accent="#f59e0b" />
      </div>

      {/* Plan breakdown */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 mb-6">
        <h2 className="text-sm font-semibold text-[var(--text)] mb-5">Plan Distribution</h2>
        <div className="grid grid-cols-4 gap-4">
          {[
            { plan: 'free', price: '$0', color: 'var(--muted2)' },
            { plan: 'starter', price: '$19', color: 'var(--starter)' },
            { plan: 'pro', price: '$49', color: 'var(--pro)' },
            { plan: 'agency', price: '$149', color: 'var(--agency)' },
          ].map(({ plan, price, color }) => {
            const count = plans[plan] || 0
            const total = totalUsers || 1
            const pct = Math.round((count / total) * 100)
            return (
              <div key={plan} className="text-center">
                <p className="text-2xl font-bold mb-1" style={{ color }}>{count}</p>
                <p className="text-xs font-semibold capitalize" style={{ color }}>{plan}</p>
                <p className="text-[10px] text-[var(--muted2)]">{price}/mo · {pct}%</p>
                <div className="mt-2 h-1.5 rounded-full bg-[var(--border2)] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--text)]">Recent Users</h2>
            <Link href="/admin/users" className="text-xs text-[var(--qr)] hover:text-[var(--qr-hover)]">View all →</Link>
          </div>
          <div className="space-y-3">
            {recentUsers?.map(u => (
              <div key={u.id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[var(--qr)]/10 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-[var(--qr)]">
                    {(u.full_name || u.email || '?')[0].toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--text)] truncate">{u.full_name || '—'}</p>
                  <p className="text-[10px] text-[var(--muted2)] truncate">{u.email}</p>
                </div>
                <p className="text-[10px] text-[var(--muted2)] shrink-0 ml-auto">
                  {new Date(u.updated_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent QR codes */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--text)]">Recent QR Codes</h2>
            <Link href="/admin/qr" className="text-xs text-[var(--qr)] hover:text-[var(--qr-hover)]">View all →</Link>
          </div>
          <div className="space-y-3">
            {recentQR?.map(q => (
              <div key={q.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--text)] truncate">{q.name}</p>
                  <p className="text-[10px] text-[var(--muted2)] capitalize">{q.type.replace('_', ' ')}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-[var(--text)]">{q.scan_count}</p>
                  <p className="text-[10px] text-[var(--muted2)]">scans</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Admin nav cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[
          { href: '/admin/users', icon: '👥', label: 'Users', sub: `${totalUsers} total` },
          { href: '/admin/qr', icon: '📱', label: 'QR Codes', sub: `${totalQR} total` },
          { href: '/admin/subscriptions', icon: '💳', label: 'Subscriptions', sub: `${MRR} MRR` },
          { href: '/admin/analytics', icon: '📊', label: 'Platform Analytics', sub: `${totalScans} scans` },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--qr)] p-5 transition-all group"
          >
            <div className="text-2xl mb-3">{item.icon}</div>
            <p className="text-sm font-semibold text-[var(--text)] group-hover:text-[var(--qr)] transition-colors">{item.label}</p>
            <p className="text-[10px] text-[var(--muted2)]">{item.sub}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

function AdminStat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div className="rounded-2xl border p-5 relative overflow-hidden" style={{ borderColor: `${accent}25`, background: `${accent}08` }}>
      <div className="absolute -top-4 -right-4 w-14 h-14 rounded-full blur-xl opacity-20" style={{ background: accent }} />
      <p className="text-xs text-[var(--muted2)] mb-2 relative">{label}</p>
      <p className="text-2xl font-bold relative" style={{ color: accent }}>{value}</p>
      {sub && <p className="text-[10px] text-[var(--muted2)] mt-0.5 relative">{sub}</p>}
    </div>
  )
}
