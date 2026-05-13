import { createServiceClient } from '@/lib/supabase/server'

export default async function AdminAnalyticsPage() {
  const supabase = await createServiceClient()

  const now = new Date()
  const days30ago = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const days7ago = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: scans30 },
    { data: countryBreakdown },
    { data: deviceBreakdown },
    { data: newUsersDaily },
  ] = await Promise.all([
    supabase.from('scans').select('scanned_at').gte('scanned_at', days30ago),
    supabase.from('scans').select('country').gte('scanned_at', days30ago).not('country', 'is', null),
    supabase.from('scans').select('device').gte('scanned_at', days30ago).not('device', 'is', null),
    supabase.from('profiles').select('updated_at').gte('updated_at', days30ago),
  ])

  // Build 30-day scan chart
  const scansByDay: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    scansByDay[d.toISOString().slice(0, 10)] = 0
  }
  scans30?.forEach(s => {
    const day = s.scanned_at.slice(0, 10)
    if (day in scansByDay) scansByDay[day]++
  })
  const scanDays = Object.entries(scansByDay)
  const maxScans = Math.max(...scanDays.map(([, v]) => v), 1)

  // Build user signups chart
  const usersByDay: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    usersByDay[d.toISOString().slice(0, 10)] = 0
  }
  newUsersDaily?.forEach(u => {
    const day = u.updated_at.slice(0, 10)
    if (day in usersByDay) usersByDay[day]++
  })
  const userDays = Object.entries(usersByDay)
  const maxUsers = Math.max(...userDays.map(([, v]) => v), 1)

  // Tally breakdowns
  function tally(arr: { [k: string]: string | null }[], key: string) {
    const counts: Record<string, number> = {}
    arr.forEach(r => { const v = r[key]; if (v) counts[v] = (counts[v] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }
  const countries = tally(countryBreakdown as never[] || [], 'country')
  const devices = tally(deviceBreakdown as never[] || [], 'device')

  const total30 = scans30?.length || 0
  const week7 = scans30?.filter(s => s.scanned_at >= days7ago).length || 0

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text)]">Platform Analytics</h1>
        <p className="text-sm text-[var(--muted2)] mt-0.5">All users · Last 30 days</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Scans (30d)', value: total30.toLocaleString(), color: 'var(--qr)' },
          { label: 'Scans (7d)', value: week7.toLocaleString(), color: '#22d3ee' },
          { label: 'Daily Avg (30d)', value: (total30 / 30).toFixed(1), color: '#a78bfa' },
          { label: 'New Users (30d)', value: String(newUsersDaily?.length || 0), color: '#34d399' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-xs text-[var(--muted2)] mb-1">{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Scans chart */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 mb-6">
        <h2 className="text-sm font-semibold text-[var(--text)] mb-5">Scans per Day — Last 30 Days</h2>
        <div className="flex items-end gap-0.5 h-32">
          {scanDays.map(([day, count]) => {
            const pct = (count / maxScans) * 100
            const isToday = day === now.toISOString().slice(0, 10)
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[var(--surface2)] border border-[var(--border)] text-[10px] text-[var(--text)] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                  {count} · {day.slice(5)}
                </div>
                <div
                  className="w-full rounded-t-sm transition-all"
                  style={{
                    height: `${Math.max(pct, count > 0 ? 4 : 1)}%`,
                    background: isToday ? 'var(--qr-hover)' : 'var(--qr)',
                    opacity: count === 0 ? 0.2 : 1,
                    minHeight: 2,
                  }}
                />
              </div>
            )
          })}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-[var(--muted2)]">{scanDays[0]?.[0]?.slice(5)}</span>
          <span className="text-[10px] text-[var(--muted2)]">Today</span>
        </div>
      </div>

      {/* Signups chart */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 mb-6">
        <h2 className="text-sm font-semibold text-[var(--text)] mb-5">New User Signups — Last 30 Days</h2>
        <div className="flex items-end gap-0.5 h-24">
          {userDays.map(([day, count]) => {
            const pct = (count / maxUsers) * 100
            return (
              <div key={day} className="flex-1 flex flex-col items-center group relative">
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[var(--surface2)] border border-[var(--border)] text-[10px] text-[var(--text)] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                  {count} · {day.slice(5)}
                </div>
                <div
                  className="w-full rounded-t-sm"
                  style={{
                    height: `${Math.max(pct, count > 0 ? 8 : 1)}%`,
                    background: '#34d399',
                    opacity: count === 0 ? 0.2 : 1,
                    minHeight: 2,
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[
          { title: 'Top Countries', data: countries, total: total30 },
          { title: 'Device Types', data: devices, total: total30 },
        ].map(({ title, data, total }) => (
          <div key={title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="text-sm font-semibold text-[var(--text)] mb-4">{title}</h2>
            <div className="space-y-3">
              {data.map(([label, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[var(--text)] capitalize">{label}</span>
                      <span className="text-xs font-semibold text-[var(--muted2)]">{count.toLocaleString()} <span className="text-[var(--muted)]">({pct}%)</span></span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--surface2)] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--qr)' }} />
                    </div>
                  </div>
                )
              })}
              {data.length === 0 && <p className="text-xs text-[var(--muted2)]">No data yet</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
