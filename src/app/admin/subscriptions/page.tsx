import { createServiceClient } from '@/lib/supabase/server'

export default async function AdminSubscriptionsPage() {
  const supabase = await createServiceClient()

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('*, profiles(email, full_name)')
    .order('updated_at', { ascending: false })

  const plans = { free: 0, starter: 0, pro: 0, agency: 0 } as Record<string, number>
  subs?.forEach(s => { if (s.plan in plans) plans[s.plan]++ })
  const MRR = plans.starter * 19 + plans.pro * 49 + plans.agency * 149
  const paying = plans.starter + plans.pro + plans.agency

  const PLAN_COLOR: Record<string, string> = {
    free: 'var(--muted2)',
    starter: '#34d399',
    pro: '#38bdf8',
    agency: '#f59e0b',
  }
  const STATUS_COLOR: Record<string, string> = {
    active: 'text-green-400 bg-green-900/20',
    trialing: 'text-blue-400 bg-blue-900/20',
    past_due: 'text-yellow-400 bg-yellow-900/20',
    canceled: 'text-red-400 bg-red-900/20',
    inactive: 'text-[var(--muted2)] bg-[var(--surface2)]',
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text)]">Subscriptions</h1>
        <p className="text-sm text-[var(--muted2)] mt-0.5">All user plans and billing status</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="rounded-2xl border border-green-700/30 bg-green-900/10 p-5 lg:col-span-1">
          <p className="text-xs text-[var(--muted2)] mb-1">Est. MRR</p>
          <p className="text-2xl font-bold text-green-400">${MRR.toLocaleString()}</p>
          <p className="text-[10px] text-[var(--muted2)]">{paying} paying</p>
        </div>
        {[
          { plan: 'starter', price: '$19', color: '#34d399' },
          { plan: 'pro', price: '$49', color: '#38bdf8' },
          { plan: 'agency', price: '$149', color: '#f59e0b' },
          { plan: 'free', price: '$0', color: 'var(--muted2)' },
        ].map(({ plan, price, color }) => (
          <div key={plan} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-xs text-[var(--muted2)] mb-1 capitalize">{plan}</p>
            <p className="text-2xl font-bold" style={{ color }}>{plans[plan] || 0}</p>
            <p className="text-[10px] text-[var(--muted2)]">{price}/mo</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_100px_120px_120px] gap-0 border-b border-[var(--border)] bg-[var(--surface2)] px-5 py-3">
          {['User', 'Plan', 'Status', 'Period End', 'Customer ID'].map(h => (
            <span key={h} className="text-[10px] font-semibold text-[var(--muted2)] uppercase tracking-wide">{h}</span>
          ))}
        </div>
        <div className="divide-y divide-[var(--border)]">
          {subs?.map(s => {
            const profile = s.profiles as { email?: string; full_name?: string } | null
            return (
              <div key={s.id} className="grid grid-cols-[1fr_100px_100px_120px_120px] gap-0 px-5 py-3.5 items-center hover:bg-[var(--surface2)] transition-colors">
                <div className="min-w-0 pr-4">
                  <p className="text-xs font-medium text-[var(--text)] truncate">{profile?.full_name || '—'}</p>
                  <p className="text-[10px] text-[var(--muted2)] truncate">{profile?.email || s.user_id}</p>
                </div>
                <span className="text-xs font-bold capitalize" style={{ color: PLAN_COLOR[s.plan] || 'var(--muted2)' }}>
                  {s.plan}
                </span>
                <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 capitalize inline-block ${STATUS_COLOR[s.status] || ''}`}>
                  {s.status}
                </span>
                <span className="text-[10px] text-[var(--muted2)]">
                  {s.current_period_end
                    ? new Date(s.current_period_end).toLocaleDateString()
                    : '—'}
                </span>
                <span className="text-[10px] text-[var(--muted2)] font-mono truncate">
                  {s.stripe_customer_id ? s.stripe_customer_id.slice(0, 14) + '…' : '—'}
                </span>
              </div>
            )
          })}
          {!subs?.length && (
            <div className="px-5 py-8 text-center text-sm text-[var(--muted2)]">No subscriptions yet</div>
          )}
        </div>
      </div>
    </div>
  )
}
