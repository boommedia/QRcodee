'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { PlanTier } from '@/types'

type ByDay = { date: string; count: number }
type Breakdown = { label: string; count: number }
type QRItem = { id: string; name: string; type: string; scans: number; short_slug?: string }

interface AnalyticsData {
  total: number
  days: number
  plan: string
  maxDays: number
  byDay: ByDay[]
  byCountry: Breakdown[]
  byDevice: Breakdown[]
  byOS: Breakdown[]
  byBrowser: Breakdown[]
  topQR: QRItem[]
  qrCodes: { id: string; name: string; type: string }[]
}

const RANGES = [
  { label: '7d', value: '7', minPlan: 'free' },
  { label: '30d', value: '30', minPlan: 'starter' },
  { label: '90d', value: '90', minPlan: 'pro' },
  { label: 'All', value: '365', minPlan: 'pro' },
]

const PLAN_ORDER = ['free', 'starter', 'pro', 'agency']

function planGte(plan: string, min: string) {
  return PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(min)
}

export default function AnalyticsDashboard({
  qrCodes,
  plan,
  maxDays,
  initialQR,
  initialRange,
}: {
  qrCodes: { id: string; name: string; type: string }[]
  plan: PlanTier
  maxDays: number
  initialQR?: string
  initialRange: string
}) {
  const [range, setRange] = useState(initialRange)
  const [selectedQR, setSelectedQR] = useState(initialQR || '')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ range })
    if (selectedQR) params.set('qr_id', selectedQR)
    fetch(`/api/analytics?${params}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [range, selectedQR])

  const maxBar = data?.byDay ? Math.max(...data.byDay.map(d => d.count), 1) : 1

  return (
    <div className="min-h-full">
      <div className="h-0.5 w-full bg-gradient-to-r from-[var(--qr)] via-[var(--qr-hover)] to-[var(--warn)]" />

      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-[var(--text)]">Analytics</h1>
            <p className="text-xs text-[var(--muted2)] mt-0.5 capitalize">{plan} plan</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* QR filter */}
            <select
              value={selectedQR}
              onChange={e => setSelectedQR(e.target.value)}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text)] px-3 py-2 outline-none"
            >
              <option value="">All QR Codes</option>
              {qrCodes.map(q => (
                <option key={q.id} value={q.id}>{q.name}</option>
              ))}
            </select>

            {/* Date range */}
            <div className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1">
              {RANGES.map(r => {
                const allowed = planGte(plan, r.minPlan)
                return (
                  <button
                    key={r.value}
                    onClick={() => allowed && setRange(r.value)}
                    title={!allowed ? `Upgrade to ${r.minPlan} plan` : undefined}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all relative ${
                      range === r.value
                        ? 'bg-[var(--qr)] text-white'
                        : allowed
                        ? 'text-[var(--muted2)] hover:text-[var(--text)]'
                        : 'text-[var(--muted)] cursor-not-allowed opacity-40'
                    }`}
                  >
                    {r.label}
                    {!allowed && <span className="absolute -top-1 -right-1 text-[8px] bg-[var(--warn)] text-black rounded-full w-3 h-3 flex items-center justify-center">↑</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--qr)] border-t-transparent animate-spin" />
          </div>
        ) : !data || data.total === 0 ? (
          <EmptyAnalytics />
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <GlowStat label="Total Scans" value={data.total.toLocaleString()} accent="#38bdf8" />
              <GlowStat
                label="Daily Average"
                value={(data.total / data.days).toFixed(1)}
                sub={`over ${data.days} days`}
                accent="#34D399"
              />
              <GlowStat
                label="Top Country"
                value={data.byCountry[0]?.label || '—'}
                sub={data.byCountry[0] ? `${data.byCountry[0].count} scans` : ''}
                accent="#f59e0b"
              />
              <GlowStat
                label="Top Device"
                value={data.byDevice[0]?.label || '—'}
                sub={data.byDevice[0] ? `${Math.round((data.byDevice[0].count / data.total) * 100)}%` : ''}
                accent="#a78bfa"
              />
            </div>

            {/* Scans over time — bar chart */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 mb-6">
              <h2 className="text-sm font-semibold text-[var(--text)] mb-5">Scans Over Time</h2>
              <div className="flex items-end gap-0.5 h-40 overflow-x-auto">
                {data.byDay.map(d => {
                  const pct = maxBar > 0 ? (d.count / maxBar) * 100 : 0
                  const isToday = d.date === new Date().toISOString().slice(0, 10)
                  return (
                    <div key={d.date} className="group relative flex flex-col items-center flex-1 min-w-[4px]">
                      <div
                        className="w-full rounded-t-sm transition-all"
                        style={{
                          height: `${Math.max(pct, d.count > 0 ? 4 : 1)}%`,
                          background: isToday
                            ? 'var(--qr-hover)'
                            : d.count > 0
                            ? 'var(--qr)'
                            : 'var(--border2)',
                          opacity: d.count > 0 ? 1 : 0.4,
                        }}
                      />
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[var(--surface2)] border border-[var(--border)] rounded-lg px-2 py-1 text-[10px] text-[var(--text)] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
                        <span className="text-[var(--muted2)]">{d.date.slice(5)}</span> · {d.count}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between text-[10px] text-[var(--muted2)] mt-2">
                <span>{data.byDay[0]?.date}</span>
                <span>{data.byDay[data.byDay.length - 1]?.date}</span>
              </div>
            </div>

            {/* Breakdown grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              <BreakdownCard title="Countries" icon="🌍" items={data.byCountry} total={data.total} />
              <BreakdownCard title="Devices" icon="📱" items={data.byDevice} total={data.total} />
              <BreakdownCard title="Operating Systems" icon="💻" items={data.byOS} total={data.total} />
              <BreakdownCard title="Browsers" icon="🌐" items={data.byBrowser} total={data.total} />
            </div>

            {/* Top QR codes */}
            {data.topQR.length > 1 && (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                <h2 className="text-sm font-semibold text-[var(--text)] mb-4">Top QR Codes</h2>
                <div className="space-y-3">
                  {data.topQR.slice(0, 8).map((qr, i) => {
                    const pct = data.total > 0 ? Math.round((qr.scans / data.total) * 100) : 0
                    return (
                      <div key={qr.id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-bold text-[var(--muted2)] w-4 shrink-0">#{i + 1}</span>
                            <Link href={`/dashboard/qr/${qr.id}`} className="text-xs font-medium text-[var(--text)] hover:text-[var(--qr)] truncate">
                              {qr.name}
                            </Link>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 ml-3">
                            <span className="text-xs text-[var(--muted2)]">{pct}%</span>
                            <span className="text-xs font-semibold text-[var(--text)]">{qr.scans.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--border2)] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              background: `linear-gradient(90deg, var(--qr), var(--qr-hover))`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Plan upgrade nudge */}
            {maxDays !== Infinity && (
              <div className="mt-6 rounded-2xl border border-[var(--warn)]/20 bg-[var(--warn)]/5 p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--warn)]">Unlock full analytics history</p>
                  <p className="text-xs text-[var(--muted2)] mt-0.5">
                    You&apos;re on the {plan} plan — limited to {maxDays} days. Pro gives you unlimited history.
                  </p>
                </div>
                <Link
                  href="/billing"
                  className="shrink-0 rounded-xl bg-[var(--warn)] hover:opacity-90 text-black text-xs font-bold px-4 py-2 transition-opacity ml-4"
                >
                  Upgrade
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function GlowStat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div className="rounded-2xl border p-5 relative overflow-hidden" style={{ borderColor: `${accent}25`, background: `${accent}08` }}>
      <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-20" style={{ background: accent }} />
      <p className="text-xs text-[var(--muted2)] mb-2 relative">{label}</p>
      <p className="text-2xl font-bold relative" style={{ color: accent }}>{value}</p>
      {sub && <p className="text-[10px] text-[var(--muted2)] mt-0.5 relative">{sub}</p>}
    </div>
  )
}

function BreakdownCard({ title, icon, items, total }: { title: string; icon: string; items: Breakdown[]; total: number }) {
  if (!items.length) return null
  const max = items[0]?.count || 1
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <h3 className="text-xs font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h3>
      <div className="space-y-3">
        {items.slice(0, 6).map(item => {
          const pct = Math.round((item.count / total) * 100)
          const barPct = Math.round((item.count / max) * 100)
          return (
            <div key={item.label}>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[var(--text)] font-medium truncate max-w-[120px]">{item.label}</span>
                <span className="text-[var(--muted2)] shrink-0 ml-2">{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--border2)] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${barPct}%`,
                    background: 'linear-gradient(90deg, var(--qr), var(--qr-hover))',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EmptyAnalytics() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-[var(--border2)] py-20 text-center">
      <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-[var(--qr)]/10 flex items-center justify-center text-2xl">📊</div>
      <h3 className="text-base font-semibold text-[var(--text)] mb-2">No scan data yet</h3>
      <p className="text-sm text-[var(--muted2)] max-w-xs mx-auto mb-6">
        Scans will appear here as soon as someone uses your QR codes.
      </p>
      <Link
        href="/dashboard/qr/new"
        className="inline-flex items-center gap-2 rounded-xl bg-[var(--qr)] hover:bg-[var(--qr-dim)] text-white text-sm font-semibold px-5 py-2.5 transition-all"
      >
        Create a QR Code
      </Link>
    </div>
  )
}
