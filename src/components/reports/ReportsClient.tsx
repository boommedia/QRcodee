'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Report = { id: string; name: string; token: string; qr_ids: string[]; branding: Record<string, string>; expires_at: string | null; created_at: string }
type QRCode = { id: string; name: string; type: string; scan_count: number }

const PRESET_COLORS = ['#0891b2', '#22d3ee', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
const EXPIRE_OPTIONS = [
  { label: 'Never', value: 0 },
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
]

export default function ReportsClient({ reports: initial, qrCodes }: { reports: Report[]; qrCodes: QRCode[] }) {
  const router = useRouter()
  const [reports, setReports] = useState(initial)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [selectedQRs, setSelectedQRs] = useState<string[]>([])
  const [company, setCompany] = useState('')
  const [accent, setAccent] = useState('#0891b2')
  const [expireDays, setExpireDays] = useState(0)

  function toggleQR(id: string) {
    setSelectedQRs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function createReport() {
    if (!name.trim() || selectedQRs.length === 0) return
    setSaving(true)
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        qr_ids: selectedQRs,
        branding: { company: company.trim(), accent },
        expires_days: expireDays || null,
      }),
    })
    const data = await res.json()
    if (data.report) {
      setReports(prev => [data.report, ...prev])
      setCreating(false)
      setName('')
      setSelectedQRs([])
      setCompany('')
      setAccent('#0891b2')
      setExpireDays(0)
      router.refresh()
    }
    setSaving(false)
  }

  async function deleteReport(id: string) {
    await fetch(`/api/reports/${id}`, { method: 'DELETE' })
    setReports(prev => prev.filter(r => r.id !== id))
    setDeleteId(null)
    router.refresh()
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(`${window.location.origin}/client/${token}`)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  const isExpired = (r: Report) => r.expires_at && new Date(r.expires_at) < new Date()

  return (
    <div className="min-h-full">
      <div className="h-0.5 w-full bg-gradient-to-r from-[var(--qr)] via-[var(--qr-hover)] to-[var(--warn)]" />

      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-[var(--muted2)] mb-1">
              <Link href="/dashboard" className="hover:text-[var(--text)]">Dashboard</Link>
              <span>/</span>
              <span className="text-[var(--text)]">Client Reports</span>
            </div>
            <h1 className="text-xl font-bold text-[var(--text)]">Client Reports</h1>
            <p className="text-xs text-[var(--muted2)] mt-0.5">Branded shareable analytics links for your clients</p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: 'var(--qr)' }}
          >
            + New Report
          </button>
        </div>

        {/* Create form */}
        {creating && (
          <div className="rounded-2xl border border-[var(--qr)]/40 bg-[var(--surface)] p-6 mb-6">
            <h2 className="text-sm font-semibold text-[var(--text)] mb-5">New Client Report</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted2)] uppercase tracking-wide mb-1.5">Report Name</label>
                  <input
                    autoFocus
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Q2 Performance Report"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--qr)] focus:ring-1 focus:ring-[var(--qr)]/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted2)] uppercase tracking-wide mb-1.5">Client / Company Name</label>
                  <input
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--qr)] focus:ring-1 focus:ring-[var(--qr)]/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted2)] uppercase tracking-wide mb-1.5">Brand Color</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAccent(c)}
                        className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                        style={{ background: c, borderColor: accent === c ? '#fff' : 'transparent' }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted2)] uppercase tracking-wide mb-1.5">Link Expires</label>
                  <div className="flex gap-2">
                    {EXPIRE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setExpireDays(opt.value)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                        style={{
                          background: expireDays === opt.value ? 'var(--qr)' : 'var(--surface2)',
                          color: expireDays === opt.value ? '#fff' : 'var(--muted2)',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: QR selection */}
              <div>
                <label className="block text-xs font-semibold text-[var(--muted2)] uppercase tracking-wide mb-2">
                  Include QR Codes <span className="text-[var(--qr)] font-bold">{selectedQRs.length > 0 ? `(${selectedQRs.length})` : ''}</span>
                </label>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface2)] divide-y divide-[var(--border)] max-h-52 overflow-y-auto">
                  {qrCodes.map(qr => (
                    <button
                      key={qr.id}
                      type="button"
                      onClick={() => toggleQR(qr.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--border)] transition-colors"
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                        selectedQRs.includes(qr.id) ? 'border-[var(--qr)] bg-[var(--qr)]' : 'border-[var(--border)]'
                      }`}>
                        {selectedQRs.includes(qr.id) && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-[var(--text)] truncate">{qr.name}</p>
                        <p className="text-[10px] text-[var(--muted2)]">{qr.scan_count} scans · {qr.type}</p>
                      </div>
                    </button>
                  ))}
                  {qrCodes.length === 0 && (
                    <p className="text-xs text-[var(--muted2)] p-4 text-center">No active QR codes</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={createReport}
                disabled={saving || !name.trim() || selectedQRs.length === 0}
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 transition-all hover:opacity-90"
                style={{ background: 'var(--qr)' }}
              >
                {saving ? 'Creating…' : 'Create Report'}
              </button>
              <button
                onClick={() => setCreating(false)}
                className="rounded-xl px-4 py-2.5 text-sm text-[var(--muted2)] hover:text-[var(--text)] border border-[var(--border)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Reports list */}
        {reports.length === 0 && !creating ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-16 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm font-medium text-[var(--text)] mb-1">No client reports yet</p>
            <p className="text-xs text-[var(--muted2)] mb-4">Create a branded shareable report link for a client</p>
            <button
              onClick={() => setCreating(true)}
              className="rounded-xl px-4 py-2 text-sm font-bold text-white"
              style={{ background: 'var(--qr)' }}
            >
              Create first report
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(report => {
              const expired = isExpired(report)
              const branding = report.branding as { company?: string; accent?: string }
              const color = branding.accent || 'var(--qr)'
              return (
                <div
                  key={report.id}
                  className={`rounded-2xl border bg-[var(--surface)] overflow-hidden ${expired ? 'opacity-50' : 'border-[var(--border)]'}`}
                >
                  <div className="h-1" style={{ background: color }} />
                  <div className="p-5 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-[var(--text)]">{report.name}</p>
                        {expired && <span className="text-[10px] text-red-400 font-bold bg-red-900/20 px-1.5 py-0.5 rounded">Expired</span>}
                      </div>
                      <p className="text-xs text-[var(--muted2)]">
                        {branding.company && <><span className="font-medium">{branding.company}</span> · </>}
                        {report.qr_ids.length} QR {report.qr_ids.length === 1 ? 'code' : 'codes'}
                        {report.expires_at && !expired && (
                          <> · expires {new Date(report.expires_at).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`/client/${report.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg px-3 py-2 text-xs font-semibold border border-[var(--border)] text-[var(--muted2)] hover:text-[var(--text)] transition-colors"
                      >
                        Preview
                      </a>
                      <button
                        onClick={() => copyLink(report.token)}
                        className="rounded-lg px-3 py-2 text-xs font-bold text-white transition-all hover:opacity-90"
                        style={{ background: copied === report.token ? '#10b981' : color }}
                      >
                        {copied === report.token ? '✓ Copied!' : 'Copy Link'}
                      </button>
                      <button
                        onClick={() => setDeleteId(report.id)}
                        className="p-2 rounded-lg text-[var(--muted2)] hover:text-red-400 hover:bg-red-900/20 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 max-w-sm w-full">
            <h3 className="text-base font-bold text-[var(--text)] mb-2">Delete report?</h3>
            <p className="text-sm text-[var(--muted2)] mb-5">The shareable link will stop working immediately.</p>
            <div className="flex gap-3">
              <button onClick={() => deleteReport(deleteId)} className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-500 transition-colors">Delete</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 rounded-xl py-2.5 text-sm text-[var(--muted2)] hover:text-[var(--text)] border border-[var(--border)] transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
