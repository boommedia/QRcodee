import { createServiceClient } from '@/lib/supabase/server'

export default async function AdminQRPage() {
  const supabase = await createServiceClient()

  const { data: qrCodes, count } = await supabase
    .from('qr_codes')
    .select('id, name, type, short_slug, scan_count, is_dynamic, is_paused, created_at, user_id, profiles(email)', { count: 'exact' })
    .order('scan_count', { ascending: false })
    .limit(200)

  const byType: Record<string, number> = {}
  qrCodes?.forEach(q => { byType[q.type] = (byType[q.type] || 0) + 1 })
  const topTypes = Object.entries(byType).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const totalScans = qrCodes?.reduce((s, q) => s + (q.scan_count || 0), 0) || 0

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text)]">QR Codes</h1>
        <p className="text-sm text-[var(--muted2)] mt-0.5">{count?.toLocaleString()} total · top 200 by scan count shown</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="text-xs text-[var(--muted2)] mb-1">Total QR Codes</p>
          <p className="text-2xl font-bold text-[var(--text)]">{count?.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="text-xs text-[var(--muted2)] mb-1">Total Scans</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--qr)' }}>{totalScans.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="text-xs text-[var(--muted2)] mb-1">Dynamic</p>
          <p className="text-2xl font-bold text-green-400">{qrCodes?.filter(q => q.is_dynamic).length || 0}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="text-xs text-[var(--muted2)] mb-1">Paused</p>
          <p className="text-2xl font-bold text-yellow-400">{qrCodes?.filter(q => q.is_paused).length || 0}</p>
        </div>
      </div>

      {/* Type breakdown */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 mb-6">
        <h2 className="text-sm font-semibold text-[var(--text)] mb-4">By Type</h2>
        <div className="flex flex-wrap gap-3">
          {topTypes.map(([type, n]) => (
            <div key={type} className="flex items-center gap-2 rounded-xl bg-[var(--surface2)] px-3 py-2">
              <span className="text-xs font-semibold text-[var(--text)] capitalize">{type.replace('_', ' ')}</span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--qr)22', color: 'var(--qr)' }}>{n}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="grid grid-cols-[1fr_90px_80px_80px_100px_80px] gap-0 border-b border-[var(--border)] bg-[var(--surface2)] px-5 py-3">
          {['Name / User', 'Type', 'Scans', 'Dynamic', 'Slug', 'Status'].map(h => (
            <span key={h} className="text-[10px] font-semibold text-[var(--muted2)] uppercase tracking-wide">{h}</span>
          ))}
        </div>
        <div className="divide-y divide-[var(--border)]">
          {qrCodes?.map(q => {
            const profile = q.profiles as { email?: string } | null
            return (
              <div key={q.id} className="grid grid-cols-[1fr_90px_80px_80px_100px_80px] gap-0 px-5 py-3 items-center hover:bg-[var(--surface2)] transition-colors">
                <div className="min-w-0 pr-4">
                  <p className="text-xs font-medium text-[var(--text)] truncate">{q.name}</p>
                  <p className="text-[10px] text-[var(--muted2)] truncate">{profile?.email || q.user_id}</p>
                </div>
                <span className="text-[10px] text-[var(--muted2)] capitalize">{q.type.replace('_', ' ')}</span>
                <span className="text-xs font-bold text-[var(--text)]">{q.scan_count?.toLocaleString()}</span>
                <span className={`text-[10px] font-semibold ${q.is_dynamic ? 'text-green-400' : 'text-[var(--muted2)]'}`}>
                  {q.is_dynamic ? 'Dynamic' : 'Static'}
                </span>
                <span className="text-[10px] text-[var(--muted2)] font-mono">{q.short_slug}</span>
                <span className={`text-[10px] font-semibold ${q.is_paused ? 'text-yellow-400' : 'text-green-400'}`}>
                  {q.is_paused ? 'Paused' : 'Active'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
