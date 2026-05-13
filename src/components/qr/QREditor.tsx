'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { QR_TYPES, type Phase1QRType, encodeQRPayload } from '@/lib/qr/types'
import type { QRCode, QRDesignConfig } from '@/types'

const TYPE_ICONS: Record<string, string> = {
  url: '🌐', text: '📝', phone: '📞', sms: '💬',
  email: '📧', whatsapp: '💚', wifi: '📶', vcard: '👤',
  social: '📱', app_store: '📲', event: '📅',
}

export default function QREditor({ qr }: { qr: QRCode }) {
  const router = useRouter()
  const [name, setName] = useState(qr.name)
  const [formData, setFormData] = useState<Record<string, string>>(
    (qr.qr_data as Record<string, string>) || {}
  )
  const [design, setDesign] = useState<QRDesignConfig>(qr.design_config)
  const [isPaused, setIsPaused] = useState(qr.is_paused)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const qrRef = useRef<InstanceType<typeof import('qr-code-styling').default> | null>(null)

  const typeConfig = QR_TYPES[qr.type as Phase1QRType]

  const payload = typeConfig
    ? encodeQRPayload(qr.type as Phase1QRType, formData)
    : qr.destination_url || 'https://qrcodee.online'

  useEffect(() => {
    let cancelled = false
    async function initQR() {
      const QRCodeStyling = (await import('qr-code-styling')).default
      if (cancelled || !previewRef.current) return
      if (!qrRef.current) {
        qrRef.current = new QRCodeStyling({
          width: 220, height: 220, type: 'svg',
          data: payload,
          dotsOptions: { color: design.foreground_color, type: design.dot_style as never },
          cornersSquareOptions: { color: design.foreground_color, type: design.corner_square_style as never },
          cornersDotOptions: { color: design.foreground_color, type: design.corner_dot_style as never },
          backgroundOptions: { color: design.background_color },
          qrOptions: { errorCorrectionLevel: design.error_correction },
        })
        previewRef.current.innerHTML = ''
        qrRef.current.append(previewRef.current)
      } else {
        qrRef.current.update({
          data: payload,
          dotsOptions: { color: design.foreground_color, type: design.dot_style as never },
          cornersSquareOptions: { color: design.foreground_color, type: design.corner_square_style as never },
          cornersDotOptions: { color: design.foreground_color, type: design.corner_dot_style as never },
          backgroundOptions: { color: design.background_color },
          qrOptions: { errorCorrectionLevel: design.error_correction },
        })
      }
    }
    initQR()
    return () => { cancelled = true }
  }, [payload, design])

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch(`/api/qr/${qr.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, qr_data: formData, design_config: design, is_paused: isPaused }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Save failed')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${qr.name}"? This cannot be undone.`)) return
    await fetch(`/api/qr/${qr.id}`, { method: 'DELETE' })
    router.push('/dashboard')
  }

  async function handleDownload() {
    if (!qrRef.current) return
    await qrRef.current.download({ name: qr.name.replace(/\s+/g, '-').toLowerCase(), extension: 'svg' })
  }

  return (
    <div className="min-h-full">
      <div className="h-0.5 w-full bg-gradient-to-r from-[var(--qr)] via-[var(--qr-hover)] to-[var(--warn)]" />

      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-[var(--muted2)] mb-1">
              <button onClick={() => router.push('/dashboard')} className="hover:text-[var(--text)]">Dashboard</button>
              <span>/</span>
              <span className="text-[var(--text)] truncate max-w-xs">{qr.name}</span>
            </div>
            <h1 className="text-xl font-bold text-[var(--text)]">Edit QR Code</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface2)] text-xs text-[var(--muted2)] hover:text-[var(--text)] px-4 py-2 transition-colors"
            >
              ↓ Download SVG
            </button>
            <button
              onClick={handleDelete}
              className="rounded-xl border border-red-800/40 text-xs text-red-400 hover:bg-red-900/20 px-4 py-2 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: edit panels */}
          <div className="flex-1 space-y-4">

            {/* Content */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-[var(--qr)]/10 flex items-center justify-center text-lg">
                  {TYPE_ICONS[qr.type] || '📄'}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[var(--text)]">Content</h2>
                  <p className="text-[10px] text-[var(--muted2)] capitalize">{qr.type.replace('_', ' ')}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[10px] text-[var(--muted2)]">Paused</span>
                  <button
                    onClick={() => setIsPaused(p => !p)}
                    className={`w-10 h-5 rounded-full transition-all relative ${isPaused ? 'bg-yellow-600' : 'bg-[var(--qr)]'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${isPaused ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-[var(--muted2)] uppercase tracking-wide mb-1.5">Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--qr)] focus:ring-1 focus:ring-[var(--qr)]/40"
                />
              </div>

              {typeConfig && (
                <div className="space-y-4">
                  {typeConfig.fields.map(field => (
                    <div key={field.name}>
                      <label className="block text-xs font-semibold text-[var(--muted2)] uppercase tracking-wide mb-1.5">
                        {field.label}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          value={formData[field.name] || ''}
                          onChange={e => setFormData(p => ({ ...p, [field.name]: e.target.value }))}
                          placeholder={field.placeholder}
                          rows={3}
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--qr)] focus:ring-1 focus:ring-[var(--qr)]/40 resize-none"
                        />
                      ) : field.type === 'select' ? (
                        <select
                          value={formData[field.name] || field.options?.[0]?.value || ''}
                          onChange={e => setFormData(p => ({ ...p, [field.name]: e.target.value }))}
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--qr)]"
                        >
                          {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          value={formData[field.name] || ''}
                          onChange={e => setFormData(p => ({ ...p, [field.name]: e.target.value }))}
                          placeholder={field.placeholder}
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--qr)] focus:ring-1 focus:ring-[var(--qr)]/40"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Design */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <h2 className="text-sm font-bold text-[var(--text)] mb-5">Design</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <ColorFieldInline label="QR Color" value={design.foreground_color} onChange={v => setDesign(p => ({ ...p, foreground_color: v }))} />
                <ColorFieldInline label="Background" value={design.background_color} onChange={v => setDesign(p => ({ ...p, background_color: v }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted2)] uppercase tracking-wide mb-2">Dot Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded'] as const).map(style => (
                    <button key={style} onClick={() => setDesign(p => ({ ...p, dot_style: style }))}
                      className={`rounded-lg border px-2 py-1.5 text-xs capitalize transition-all ${design.dot_style === style ? 'border-[var(--qr)] bg-[var(--qr)]/10 text-[var(--qr)]' : 'border-[var(--border)] text-[var(--muted2)] hover:border-[var(--qr)]/40'}`}>
                      {style.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <h2 className="text-sm font-bold text-[var(--text)] mb-4">Stats</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[var(--muted2)]">Total Scans</p>
                  <p className="text-2xl font-bold text-[var(--text)]">{qr.scan_count}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--muted2)]">Short URL</p>
                  <p className="text-xs font-mono text-[var(--qr)] mt-1">/r/{qr.short_slug}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[var(--border)]">
                <a
                  href={`https://qrcodee.online/r/${qr.short_slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--qr)] hover:text-[var(--qr-hover)]"
                >
                  Test scan link →
                </a>
              </div>
            </div>
          </div>

          {/* Right: preview */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="sticky top-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <h3 className="text-xs font-semibold text-[var(--muted2)] uppercase tracking-wide mb-4">Preview</h3>
              <div className="flex items-center justify-center rounded-xl p-4 mb-4" style={{ background: design.background_color }}>
                <div ref={previewRef} className="w-[220px] h-[220px]" />
              </div>

              {error && <p className="text-xs text-red-400 mb-3 text-center">{error}</p>}

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all shadow-lg mb-2"
                style={{
                  background: saved ? 'var(--success)' : 'var(--qr)',
                  boxShadow: `0 4px 16px ${saved ? '#4ADE8030' : 'var(--qr)30'}`,
                }}
              >
                {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Changes'}
              </button>

              <button
                onClick={handleDownload}
                className="w-full rounded-xl border border-[var(--border)] text-xs text-[var(--muted2)] hover:text-[var(--text)] hover:bg-[var(--surface2)] py-2 transition-colors"
              >
                ↓ Download SVG
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ColorFieldInline({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--muted2)] uppercase tracking-wide mb-2">{label}</label>
      <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-3 py-2">
        <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-[var(--border)] shrink-0">
          <input type="color" value={value} onChange={e => onChange(e.target.value)} className="absolute inset-0 w-full h-full cursor-pointer opacity-0" />
          <div className="w-full h-full rounded-lg" style={{ background: value }} />
        </div>
        <input
          type="text" value={value.toUpperCase()}
          onChange={e => { const v = e.target.value; if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v) }}
          className="flex-1 bg-transparent text-xs text-[var(--text)] font-mono outline-none"
          maxLength={7}
        />
      </div>
    </div>
  )
}
