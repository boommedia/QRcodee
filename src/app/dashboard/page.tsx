import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PLAN_LIMITS, type PlanTier } from '@/types'

const TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  url:       { bg: 'rgba(8,145,178,0.15)',   text: '#38bdf8', label: 'URL' },
  vcard:     { bg: 'rgba(52,211,153,0.15)',  text: '#34D399', label: 'vCard' },
  wifi:      { bg: 'rgba(251,191,36,0.15)',  text: '#fbbf24', label: 'Wi-Fi' },
  sms:       { bg: 'rgba(167,139,250,0.15)', text: '#a78bfa', label: 'SMS' },
  email:     { bg: 'rgba(251,146,60,0.15)',  text: '#fb923c', label: 'Email' },
  phone:     { bg: 'rgba(52,211,153,0.15)',  text: '#34D399', label: 'Phone' },
  whatsapp:  { bg: 'rgba(52,211,153,0.15)',  text: '#25D366', label: 'WhatsApp' },
  social:    { bg: 'rgba(244,114,182,0.15)', text: '#f472b6', label: 'Social' },
  app_store: { bg: 'rgba(99,102,241,0.15)',  text: '#818cf8', label: 'App Store' },
  event:     { bg: 'rgba(251,191,36,0.15)',  text: '#fbbf24', label: 'Event' },
  text:      { bg: 'rgba(156,163,175,0.15)', text: '#9ca3af', label: 'Text' },
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalQR },
    { count: dynamicActive },
    { count: staticCount },
    { data: qrList },
    { count: totalScansMonth },
    { count: totalScansWeek },
    { data: folders },
    { data: sub },
  ] = await Promise.all([
    supabase.from('qr_codes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('qr_codes').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_dynamic', true).eq('is_paused', false),
    supabase.from('qr_codes').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_dynamic', false),
    supabase.from('qr_codes').select('id, name, type, short_slug, scan_count, is_dynamic, is_paused, created_at, folder_id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(24),
    supabase.from('scans').select('id', { count: 'exact', head: true }).gte('scanned_at', monthStart),
    supabase.from('scans').select('id', { count: 'exact', head: true }).gte('scanned_at', weekStart),
    supabase.from('folders').select('id, name, color').eq('user_id', user.id).order('created_at', { ascending: false }).limit(8),
    supabase.from('subscriptions').select('plan, status').eq('user_id', user.id).single(),
  ])

  const plan = (sub?.plan || 'free') as PlanTier
  const planLimit = PLAN_LIMITS[plan].qr_codes
  const totalScans = qrList?.reduce((s, q) => s + (q.scan_count || 0), 0) || 0

  const folderCounts: Record<string, number> = {}
  const folderMap: Record<string, { name: string; color: string }> = {}
  qrList?.forEach(q => { if (q.folder_id) folderCounts[q.folder_id] = (folderCounts[q.folder_id] || 0) + 1 })
  folders?.forEach(f => { folderMap[f.id] = { name: f.name, color: f.color } })

  const usagePct = planLimit === Infinity ? 0 : Math.min(Math.round(((totalQR || 0) / planLimit) * 100), 100)

  return (
    <div className="min-h-full">
      {/* Top gradient band */}
      <div className="h-1 w-full bg-gradient-to-r from-[var(--qr)] via-[var(--qr-hover)] to-[var(--warn)]" />

      <div className="p-6 lg:p-8 max-w-7xl mx-auto">

        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">Dashboard</h1>
            <p className="text-sm text-[var(--muted2)] mt-0.5">
              <span className="capitalize font-medium" style={{ color: plan === 'agency' ? 'var(--agency)' : plan === 'pro' ? 'var(--pro)' : plan === 'starter' ? 'var(--starter)' : 'var(--muted2)' }}>
                {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
              </span>
              {planLimit !== Infinity && ` · ${totalQR || 0} / ${planLimit} QR codes`}
            </p>
          </div>
          <Link
            href="/dashboard/qr/new"
            className="group flex items-center gap-2 rounded-xl bg-[var(--qr)] hover:bg-[var(--qr-hover)] text-white text-sm font-semibold px-5 py-2.5 transition-all shadow-lg shadow-[var(--qr)]/20 hover:shadow-[var(--qr-hover)]/30"
          >
            <span className="text-lg leading-none group-hover:rotate-90 transition-transform duration-200">+</span>
            New QR Code
          </Link>
        </div>

        {/* Stats — 4 glowing cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <GlowCard
            label="All-Time Scans"
            value={totalScans.toLocaleString()}
            sub={`↑ ${(totalScansWeek || 0)} this week`}
            accent="#818cf8"
          />
          <GlowCard
            label="This Month"
            value={(totalScansMonth || 0).toLocaleString()}
            sub="scan events"
            accent="#34D399"
          />
          <GlowCard
            label="Dynamic Active"
            value={String(dynamicActive || 0)}
            sub={planLimit === Infinity ? 'unlimited' : `of ${planLimit} total`}
            accent="var(--qr)"
          />
          <GlowCard
            label="Static Codes"
            value={String(staticCount || 0)}
            sub="embedded payloads"
            accent="#fbbf24"
          />
        </div>

        {/* Plan usage bar */}
        {planLimit !== Infinity && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 mb-8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">QR Code Usage</p>
                <p className="text-xs text-[var(--muted2)]">{totalQR || 0} of {planLimit} codes used</p>
              </div>
              {usagePct >= 80 && (
                <Link href="/billing" className="text-xs font-semibold text-[var(--warn)] border border-yellow-700/30 rounded-lg px-3 py-1.5 hover:bg-yellow-900/10 transition-colors">
                  Upgrade Plan →
                </Link>
              )}
            </div>
            <div className="h-2.5 rounded-full bg-[var(--border2)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${usagePct}%`,
                  background: usagePct >= 90
                    ? 'var(--warn)'
                    : 'linear-gradient(90deg, var(--qr), var(--qr-hover))',
                  boxShadow: `0 0 8px ${usagePct >= 90 ? 'var(--warn)' : 'var(--qr)'}40`,
                }}
              />
            </div>
          </div>
        )}

        {/* Folders strip */}
        {(folders?.length ?? 0) > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[var(--text)] uppercase tracking-wide">Folders</h2>
              <Link href="/dashboard/folders" className="text-xs text-[var(--qr)] hover:text-[var(--qr-hover)]">Manage</Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {folders?.map(f => (
                <Link
                  key={f.id}
                  href={`/dashboard/qr?folder=${f.id}`}
                  className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--qr)] px-3 py-2 text-xs font-medium text-[var(--text)] transition-colors"
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: f.color }} />
                  {f.name}
                  <span className="ml-1 text-[10px] text-[var(--muted2)]">{folderCounts[f.id] || 0}</span>
                </Link>
              ))}
              <Link
                href="/dashboard/folders/new"
                className="flex items-center gap-1 rounded-xl border border-dashed border-[var(--border2)] hover:border-[var(--qr)] px-3 py-2 text-xs text-[var(--muted2)] hover:text-[var(--qr)] transition-colors"
              >
                + New folder
              </Link>
            </div>
          </div>
        )}

        {/* QR code cards grid — our signature look */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[var(--text)] uppercase tracking-wide">
            Your QR Codes
            {totalQR ? <span className="ml-2 text-[10px] text-[var(--muted2)] font-normal normal-case">{totalQR} total</span> : null}
          </h2>
          <Link href="/dashboard/qr" className="text-xs text-[var(--qr)] hover:text-[var(--qr-hover)]">View all →</Link>
        </div>

        {!qrList?.length ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {qrList.map(qr => {
              const typeStyle = TYPE_COLORS[qr.type] || TYPE_COLORS.url
              return (
                <div key={qr.id} className="group relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--qr)] transition-all duration-200 overflow-hidden">
                  {/* Top accent line */}
                  <div className="h-0.5 w-full" style={{ background: typeStyle.text }} />

                  <div className="p-4">
                    {/* Type badge + pause indicator */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="text-[10px] font-semibold rounded-full px-2 py-0.5 uppercase tracking-wide"
                        style={{ background: typeStyle.bg, color: typeStyle.text }}
                      >
                        {typeStyle.label}
                      </span>
                      {qr.is_dynamic ? (
                        <span className="flex items-center gap-1 text-[10px] text-[var(--qr)]">
                          <span className={`w-1.5 h-1.5 rounded-full ${qr.is_paused ? 'bg-yellow-400' : 'bg-[var(--qr)] animate-pulse'}`} />
                          {qr.is_paused ? 'Paused' : 'Live'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[var(--muted2)]">Static</span>
                      )}
                    </div>

                    {/* Name */}
                    <p className="font-semibold text-[var(--text)] truncate mb-1">{qr.name}</p>
                    <p className="text-[10px] text-[var(--muted2)] truncate mb-3">
                      /r/{qr.short_slug}
                    </p>
                    {qr.folder_id && folderMap[qr.folder_id] && (
                      <p className="text-[10px] text-[var(--muted2)] mb-3 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: folderMap[qr.folder_id].color }} />
                        {folderMap[qr.folder_id].name}
                      </p>
                    )}

                    {/* Scan count */}
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold text-[var(--text)]">{(qr.scan_count || 0).toLocaleString()}</p>
                        <p className="text-[10px] text-[var(--muted2)]">scans</p>
                      </div>
                      {/* Mini scan bar visualization */}
                      <ScanMiniBar count={qr.scan_count || 0} />
                    </div>
                  </div>

                  {/* Hover action bar */}
                  <div className="border-t border-[var(--border)] bg-[var(--surface2)] px-4 py-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/dashboard/qr/${qr.id}`} className="text-[10px] text-[var(--qr)] hover:text-[var(--qr-hover)] font-medium">
                      Edit
                    </Link>
                    <Link href={`/dashboard/analytics?qr=${qr.id}`} className="text-[10px] text-[var(--muted2)] hover:text-[var(--text)]">
                      Analytics
                    </Link>
                    <Link href={`/dashboard/qr/${qr.id}/download`} className="text-[10px] text-[var(--muted2)] hover:text-[var(--text)]">
                      Download
                    </Link>
                  </div>
                </div>
              )
            })}

            {/* New QR card */}
            <Link
              href="/dashboard/qr/new"
              className="rounded-2xl border-2 border-dashed border-[var(--border2)] hover:border-[var(--qr)] flex flex-col items-center justify-center gap-3 py-10 transition-all group"
            >
              <span className="w-10 h-10 rounded-xl bg-[var(--qr)]/10 group-hover:bg-[var(--qr)]/20 flex items-center justify-center text-[var(--qr)] text-xl font-bold transition-colors">+</span>
              <span className="text-sm font-medium text-[var(--muted2)] group-hover:text-[var(--qr)] transition-colors">New QR Code</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function GlowCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div
      className="rounded-2xl border p-5 relative overflow-hidden"
      style={{
        borderColor: `${accent}30`,
        background: `${accent}08`,
      }}
    >
      {/* glow orb */}
      <div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-30"
        style={{ background: accent }}
      />
      <p className="text-xs font-medium text-[var(--muted2)] mb-2 relative">{label}</p>
      <p className="text-3xl font-bold relative" style={{ color: accent }}>{value}</p>
      <p className="text-[10px] text-[var(--muted2)] mt-1 relative">{sub}</p>
    </div>
  )
}

function ScanMiniBar({ count }: { count: number }) {
  const bars = 5
  const max = Math.max(count, 1)
  const heights = Array.from({ length: bars }, (_, i) =>
    Math.max(20, Math.min(100, Math.round((Math.random() * count / max) * 100)))
  )
  return (
    <div className="flex items-end gap-0.5 h-8">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-1.5 rounded-sm"
          style={{
            height: `${h}%`,
            background: i === bars - 1 ? 'var(--qr)' : 'var(--border2)',
          }}
        />
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-[var(--border2)] py-20 text-center">
      <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-[var(--qr)]/10 flex items-center justify-center">
        <span className="text-3xl">📱</span>
      </div>
      <h3 className="text-base font-semibold text-[var(--text)] mb-2">No QR codes yet</h3>
      <p className="text-sm text-[var(--muted2)] mb-6 max-w-xs mx-auto">
        Create your first dynamic QR code in seconds. Link to any URL, vCard, Wi-Fi, and more.
      </p>
      <Link
        href="/dashboard/qr/new"
        className="inline-flex items-center gap-2 rounded-xl bg-[var(--qr)] hover:bg-[var(--qr-dim)] text-white text-sm font-semibold px-6 py-3 transition-all shadow-lg shadow-[var(--qr)]/20"
      >
        <span className="text-lg leading-none">+</span>
        Create your first QR code
      </Link>
    </div>
  )
}
