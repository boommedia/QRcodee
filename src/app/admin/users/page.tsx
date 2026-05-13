import { createServiceClient } from '@/lib/supabase/server'

export default async function AdminUsersPage() {
  const supabase = await createServiceClient()

  const { data: users } = await supabase
    .from('profiles')
    .select('id, email, full_name, company, updated_at')
    .order('updated_at', { ascending: false })
    .limit(100)

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('user_id, plan, status, current_period_end')

  const { data: qrCounts } = await supabase
    .from('qr_codes')
    .select('user_id')

  const subMap: Record<string, { plan: string; status: string }> = {}
  subs?.forEach(s => { subMap[s.user_id] = s })

  const qrMap: Record<string, number> = {}
  qrCounts?.forEach(q => { qrMap[q.user_id] = (qrMap[q.user_id] || 0) + 1 })

  const PLAN_COLORS: Record<string, string> = {
    free: 'var(--muted2)', starter: 'var(--starter)', pro: 'var(--pro)', agency: 'var(--agency)',
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[var(--text)]">Users</h1>
        <p className="text-xs text-[var(--muted2)] mt-0.5">{users?.length || 0} total accounts</p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-[var(--border)] bg-[var(--surface2)]">
            <tr>
              {['User', 'Plan', 'Status', 'QR Codes', 'Joined'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-[var(--muted2)] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {users?.map(u => {
              const sub = subMap[u.id]
              const plan = sub?.plan || 'free'
              return (
                <tr key={u.id} className="bg-[var(--surface)] hover:bg-[var(--surface2)] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-[var(--text)]">{u.full_name || '—'}</p>
                    <p className="text-[10px] text-[var(--muted2)]">{u.email}</p>
                    {u.company && <p className="text-[10px] text-[var(--muted2)]">{u.company}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold capitalize" style={{ color: PLAN_COLORS[plan] }}>{plan}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[9px] font-semibold rounded-full px-2 py-0.5 border ${
                      sub?.status === 'active'
                        ? 'bg-green-900/20 text-green-400 border-green-700/30'
                        : 'bg-[var(--surface2)] text-[var(--muted2)] border-[var(--border)]'
                    }`}>
                      {sub?.status || 'inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--text)]">{qrMap[u.id] || 0}</td>
                  <td className="px-4 py-3 text-xs text-[var(--muted2)]">
                    {new Date(u.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
