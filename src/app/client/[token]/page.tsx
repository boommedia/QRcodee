import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function ClientReportPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createServiceClient()

  const { data: report } = await supabase
    .from('client_reports')
    .select('*')
    .eq('token', token)
    .single()

  if (!report) notFound()

  if (report.expires_at && new Date(report.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <p className="text-3xl mb-3">⏰</p>
          <h1 className="text-lg font-bold text-[var(--text)] mb-2">Report Expired</h1>
          <p className="text-sm text-[var(--muted2)]">This report link has expired. Contact the sender for a new link.</p>
        </div>
      </div>
    )
  }

  const { data: qrCodes } = await supabase
    .from('qr_codes')
    .select('id, name, type, short_slug, scan_count, is_paused, created_at')
    .in('id', report.qr_ids)

  // Last 30 days scans
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: scans } = await supabase
    .from('scans')
    .select('scanned_at, country, device, qr_id')
    .in('qr_id', report.qr_ids)
    .gte('scanned_at', since30)

  const now = new Date()
  const totalScans = qrCodes?.reduce((s, q) => s + (q.scan_count || 0), 0) || 0
  const monthScans = scans?.length || 0

  // Build 30-day chart
  const scansByDay: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    scansByDay[d.toISOString().slice(0, 10)] = 0
  }
  scans?.forEach(s => {
    const day = s.scanned_at.slice(0, 10)
    if (day in scansByDay) scansByDay[day]++
  })
  const scanDays = Object.entries(scansByDay)
  const maxScans = Math.max(...scanDays.map(([, v]) => v), 1)

  // Breakdowns
  function tally(arr: { [k: string]: string | null }[], key: string) {
    const counts: Record<string, number> = {}
    arr.forEach(r => { const v = r[key]; if (v) counts[v] = (counts[v] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }
  const countries = tally(scans as never[] || [], 'country')
  const devices = tally(scans as never[] || [], 'device')

  const branding = report.branding as { logo?: string; company?: string; accent?: string }
  const accent = branding.accent || '#0891b2'

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Branded header */}
      <div className="border-b border-[var(--border)]" style={{ background: `${accent}18` }}>
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            {branding.company && (
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: accent }}>
                {branding.company}
              </p>
            )}
            <h1 className="text-2xl font-bold text-[var(--text)]">{report.name}</h1>
            <p className="text-xs text-[var(--muted2)] mt-1">QR Code Performance Report · Last 30 days</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--muted2)]">Generated</p>
            <p className="text-sm font-semibold text-[var(--text)]">
              {now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            {report.expires_at && (
              <p className="text-[10px] text-[var(--muted2)] mt-0.5">
                Expires {new Date(report.expires_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'QR Codes', value: String(qrCodes?.length || 0) },
            { label: 'All-Time Scans', value: totalScans.toLocaleString() },
            { label: 'Scans (30 days)', value: monthScans.toLocaleString() },
            { label: 'Active Codes', value: String(qrCodes?.filter(q => !q.is_paused).length || 0) },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border p-5" style={{ borderColor: `${accent}25`, background: `${accent}08` }}>
              <p className="text-xs text-[var(--muted2)] mb-2">{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: accent }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Daily scan chart */}
        {monthScans > 0 && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 mb-6">
            <h2 className="text-sm font-semibold text-[var(--text)] mb-5">Daily Scans — Last 30 Days</h2>
            <div className="flex items-end gap-0.5 h-28">
              {scanDays.map(([day, count]) => {
                const pct = (count / maxScans) * 100
                const label = day.slice(5)
                return (
                  <div key={day} className="flex-1 flex flex-col items-center group relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] text-[var(--text)] bg-[var(--surface2)] border border-[var(--border)] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                      {count} · {label}
                    </div>
                    <div
                      className="w-full rounded-t-sm"
                      style={{
                        height: `${Math.max(pct, count > 0 ? 4 : 1)}%`,
                        background: accent,
                        opacity: count === 0 ? 0.15 : 0.85,
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
        )}

        {/* QR code performance */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 mb-6">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-5">QR Code Performance</h2>
          <div className="space-y-5">
            {qrCodes?.sort((a, b) => b.scan_count - a.scan_count).map(qr => {
              const pct = totalScans > 0 ? Math.round((qr.scan_count / totalScans) * 100) : 0
              return (
                <div key={qr.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${qr.is_paused ? 'bg-yellow-400' : 'bg-green-400'}`} />
                      <span className="text-sm font-semibold text-[var(--text)]">{qr.name}</span>
                      <span className="text-[10px] text-[var(--muted2)] bg-[var(--surface2)] px-1.5 py-0.5 rounded capitalize">
                        {qr.type.replace('_', ' ')}
                      </span>
                      {qr.is_paused && (
                        <span className="text-[10px] text-yellow-400 bg-yellow-900/20 px-1.5 py-0.5 rounded font-semibold">Paused</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-base font-bold text-[var(--text)]">{qr.scan_count.toLocaleString()}</span>
                      <span className="text-xs text-[var(--muted2)] ml-1">scans</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--border2)] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accent }} />
                  </div>
                  <p className="text-[10px] text-[var(--muted2)] mt-1 font-mono">
                    qrcodee.online/r/{qr.short_slug} · {pct}% of total
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Country + Device breakdowns */}
        {(countries.length > 0 || devices.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {[
              { title: 'Top Countries', data: countries },
              { title: 'Devices', data: devices },
            ].map(({ title, data }) => data.length > 0 && (
              <div key={title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                <h2 className="text-sm font-semibold text-[var(--text)] mb-4">{title}</h2>
                <div className="space-y-3">
                  {data.map(([label, count]) => {
                    const pct = monthScans > 0 ? Math.round((count / monthScans) * 100) : 0
                    return (
                      <div key={label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[var(--text)] capitalize">{label}</span>
                          <span className="text-xs font-semibold text-[var(--muted2)]">{count} <span className="text-[var(--muted)]">({pct}%)</span></span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--surface2)] overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accent }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-6 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--muted2)]">
            Powered by{' '}
            <a href="https://qrcodee.online" className="hover:text-[var(--qr)] transition-colors" style={{ color: accent }}>
              QRcodee.online
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
