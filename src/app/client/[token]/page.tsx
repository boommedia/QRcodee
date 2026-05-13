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
          <p className="text-2xl mb-2">⏰</p>
          <h1 className="text-lg font-bold text-[var(--text)] mb-2">Report Expired</h1>
          <p className="text-sm text-[var(--muted2)]">This report link has expired. Contact the sender for a new link.</p>
        </div>
      </div>
    )
  }

  // Fetch QR codes for this report
  const { data: qrCodes } = await supabase
    .from('qr_codes')
    .select('id, name, type, short_slug, scan_count, is_paused, created_at')
    .in('id', report.qr_ids)

  // Fetch scans for these QR codes (last 30 days)
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: scans } = await supabase
    .from('scans')
    .select('scanned_at, country, device, qr_id')
    .in('qr_id', report.qr_ids)
    .gte('scanned_at', since)

  const totalScans = qrCodes?.reduce((s, q) => s + (q.scan_count || 0), 0) || 0
  const monthScans = scans?.length || 0

  const branding = report.branding as { logo?: string; company?: string; accent?: string }
  const accent = branding.accent || '#0891b2'

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Branded header */}
      <div className="border-b border-[var(--border)]" style={{ background: `${accent}15` }}>
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            {branding.company && (
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: accent }}>
                {branding.company}
              </p>
            )}
            <h1 className="text-xl font-bold text-[var(--text)]">{report.name}</h1>
            <p className="text-xs text-[var(--muted2)] mt-0.5">
              QR Code Analytics Report · Last 30 days
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--muted2)]">Generated</p>
            <p className="text-xs font-medium text-[var(--text)]">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'QR Codes', value: String(qrCodes?.length || 0) },
            { label: 'All-Time Scans', value: totalScans.toLocaleString() },
            { label: 'Scans This Month', value: monthScans.toLocaleString() },
            { label: 'Active Codes', value: String(qrCodes?.filter(q => !q.is_paused).length || 0) },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-2xl border p-5"
              style={{ borderColor: `${accent}25`, background: `${accent}08` }}
            >
              <p className="text-xs text-[var(--muted2)] mb-2">{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: accent }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* QR code breakdown */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 mb-6">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-4">QR Code Performance</h2>
          <div className="space-y-4">
            {qrCodes?.sort((a, b) => b.scan_count - a.scan_count).map(qr => {
              const pct = totalScans > 0 ? Math.round((qr.scan_count / totalScans) * 100) : 0
              return (
                <div key={qr.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${qr.is_paused ? 'bg-yellow-400' : 'bg-green-400'}`} />
                      <span className="text-sm font-medium text-[var(--text)]">{qr.name}</span>
                      <span className="text-[10px] text-[var(--muted2)] capitalize bg-[var(--surface2)] px-1.5 py-0.5 rounded">
                        {qr.type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-[var(--text)]">{qr.scan_count.toLocaleString()}</span>
                      <span className="text-xs text-[var(--muted2)] ml-1">scans</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--border2)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: accent }}
                    />
                  </div>
                  <p className="text-[10px] text-[var(--muted2)] mt-1 font-mono">
                    qrcodee.online/r/{qr.short_slug} · {pct}% of total
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--muted2)]">
            Powered by{' '}
            <a href="https://qrcodee.online" className="text-[var(--qr)] hover:text-[var(--qr-hover)]">
              QRcodee.online
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
