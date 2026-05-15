'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PHASE1_TYPES, type Phase1QRType, type QRTypeConfig, encodeQRPayload } from '@/lib/qr/types'
import type { QRDesignConfig } from '@/types'
import QRDesignPanel from './QRDesignPanel'

// ── Default design ────────────────────────────────────────────
const DEFAULT_DESIGN: QRDesignConfig = {
  foreground_color: '#0891b2',
  background_color: '#ffffff',
  dot_style: 'rounded',
  corner_dot_style: 'dot',
  corner_square_style: 'extra-rounded',
  error_correction: 'M',
}

// ── Type icons (emoji stand-ins — replace with SVG if desired) ─
const TYPE_ICONS: Record<string, string> = {
  url: '🌐', text: '📝', phone: '📞', sms: '💬',
  email: '📧', whatsapp: '💚', wifi: '📶', vcard: '👤',
  social: '📱', app_store: '📲', event: '📅',
}

const TYPE_ACCENT: Record<string, string> = {
  url: '#38bdf8', text: '#9ca3af', phone: '#34D399', sms: '#a78bfa',
  email: '#fb923c', whatsapp: '#25D366', wifi: '#fbbf24', vcard: '#34D399',
  social: '#f472b6', app_store: '#818cf8', event: '#fbbf24',
}

// Steps
type Step = 'pick' | 'form' | 'design'

export default function QRCreator() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('pick')
  const [selectedType, setSelectedType] = useState<QRTypeConfig | null>(null)
  const [name, setName] = useState('')
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [design, setDesign] = useState<QRDesignConfig>(DEFAULT_DESIGN)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const previewRef = useRef<HTMLDivElement>(null)
  const qrRef = useRef<InstanceType<typeof import('qr-code-styling').default> | null>(null)

  // Build QR payload from current form data
  const payload = selectedType && Object.keys(formData).length > 0
    ? encodeQRPayload(selectedType.id, formData)
    : 'https://qrcodee.online'

  // ── qr-code-styling live preview ──────────────────────────
  useEffect(() => {
    if (step === 'pick') return
    let cancelled = false

    async function initQR() {
      const QRCodeStyling = (await import('qr-code-styling')).default
      if (cancelled || !previewRef.current) return

      const cornerColor = design.corner_color || design.foreground_color
      const dotsOpts = design.dot_gradient_enabled && design.dot_gradient_end_color
        ? { type: design.dot_style as never, gradient: { type: (design.dot_gradient_type || 'linear') as never, rotation: 0, colorStops: [{ offset: 0, color: design.foreground_color }, { offset: 1, color: design.dot_gradient_end_color }] } }
        : { type: design.dot_style as never, color: design.foreground_color }

      if (!qrRef.current) {
        qrRef.current = new QRCodeStyling({
          width: 280, height: 280, type: 'svg', data: payload,
          image: design.logo_url || undefined,
          dotsOptions: dotsOpts,
          cornersSquareOptions: { color: cornerColor, type: design.corner_square_style as never },
          cornersDotOptions: { color: cornerColor, type: design.corner_dot_style as never },
          backgroundOptions: { color: design.background_color },
          imageOptions: { crossOrigin: 'anonymous', margin: 4, imageSize: (design.logo_size || 30) / 100, hideBackgroundDots: design.logo_hide_background !== false },
          qrOptions: { errorCorrectionLevel: design.error_correction },
        })
        previewRef.current.innerHTML = ''
        qrRef.current.append(previewRef.current)
      } else {
        qrRef.current.update({
          data: payload,
          image: design.logo_url || undefined,
          dotsOptions: dotsOpts,
          cornersSquareOptions: { color: cornerColor, type: design.corner_square_style as never },
          cornersDotOptions: { color: cornerColor, type: design.corner_dot_style as never },
          backgroundOptions: { color: design.background_color },
          imageOptions: { crossOrigin: 'anonymous', margin: 4, imageSize: (design.logo_size || 30) / 100, hideBackgroundDots: design.logo_hide_background !== false },
          qrOptions: { errorCorrectionLevel: design.error_correction },
        })
      }
    }

    initQR()
    return () => { cancelled = true }
  }, [payload, design, step])

  // ── Save ─────────────────────────────────────────────────
  async function handleSave() {
    if (!selectedType || !name.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType.id,
          name: name.trim(),
          qr_data: formData,
          design_config: design,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create QR code')
      router.push('/dashboard')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setSaving(false)
    }
  }

  // ── Required fields check ─────────────────────────────────
  const missingRequired = selectedType?.fields
    .filter(f => f.required && !formData[f.name]?.trim())
    .map(f => f.label) || []

  const canSave = name.trim() && missingRequired.length === 0

  return (
    <div className="min-h-full">
      <div className="h-0.5 w-full bg-gradient-to-r from-[var(--qr)] via-[var(--qr-hover)] to-[var(--warn)]" />

      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header + breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-[var(--muted2)] mb-2">
            <button onClick={() => router.push('/dashboard')} className="hover:text-[var(--text)]">Dashboard</button>
            <span>/</span>
            <span className="text-[var(--text)]">New QR Code</span>
          </div>
          <h1 className="text-xl font-bold text-[var(--text)]">Create QR Code</h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          {(['pick', 'form', 'design'] as Step[]).map((s, i) => {
            const labels = { pick: 'Choose Type', form: 'Fill Details', design: 'Design' }
            const active = step === s
            const done = (step === 'form' && i === 0) || (step === 'design' && i <= 1)
            return (
              <div key={s} className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (s === 'pick') { setStep('pick'); return }
                    if (s === 'form' && selectedType) { setStep('form'); return }
                    if (s === 'design' && selectedType) { setStep('design'); return }
                  }}
                  disabled={s === 'form' && !selectedType}
                  className="flex items-center gap-2"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      active ? 'bg-[var(--qr)] text-white shadow-lg shadow-[var(--qr)]/30'
                      : done ? 'bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/40'
                      : 'bg-[var(--surface)] text-[var(--muted2)] border border-[var(--border)]'
                    }`}
                  >
                    {done ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${active ? 'text-[var(--text)]' : 'text-[var(--muted2)]'}`}>
                    {labels[s]}
                  </span>
                </button>
                {i < 2 && <div className="w-8 h-px bg-[var(--border)]" />}
              </div>
            )
          })}
        </div>

        {/* ── STEP 1: Type picker ─────────────────────────── */}
        {step === 'pick' && (
          <div>
            <p className="text-sm text-[var(--muted2)] mb-5">What type of QR code do you need?</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {PHASE1_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => {
                    setSelectedType(type)
                    setFormData({})
                    setStep('form')
                  }}
                  className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--qr)] p-5 text-left transition-all hover:shadow-lg hover:shadow-[var(--qr)]/10"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 transition-transform group-hover:scale-110"
                    style={{ background: `${TYPE_ACCENT[type.id]}15` }}
                  >
                    {TYPE_ICONS[type.id]}
                  </div>
                  <p className="font-semibold text-sm text-[var(--text)] mb-0.5">{type.label}</p>
                  <p className="text-[10px] text-[var(--muted2)] leading-relaxed">{type.description}</p>
                  {type.isDynamic && (
                    <span className="mt-2 inline-block text-[9px] font-semibold text-[var(--qr)] bg-[var(--qr)]/10 rounded px-1.5 py-0.5">
                      DYNAMIC
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2 + 3: Form + Design (side by side) ────── */}
        {(step === 'form' || step === 'design') && selectedType && (
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Left panel */}
            <div className="flex-1 min-w-0">

              {/* Step 2: Content form */}
              <div className={`rounded-2xl border ${step === 'form' ? 'border-[var(--qr)]' : 'border-[var(--border)]'} bg-[var(--surface)] p-6 mb-4`}>
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: `${TYPE_ACCENT[selectedType.id]}15` }}
                  >
                    {TYPE_ICONS[selectedType.id]}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[var(--text)]">{selectedType.label}</h2>
                    <button
                      onClick={() => { setStep('pick'); setSelectedType(null); setFormData({}) }}
                      className="text-[10px] text-[var(--qr)] hover:text-[var(--qr-hover)]"
                    >
                      Change type
                    </button>
                  </div>
                </div>

                {/* QR Name */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-[var(--muted2)] uppercase tracking-wide mb-1.5">
                    QR Code Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Restaurant Menu — Summer 2026"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--qr)] focus:ring-1 focus:ring-[var(--qr)]/40"
                  />
                </div>

                {/* Dynamic fields */}
                <div className="space-y-4">
                  {selectedType.fields.map(field => (
                    <div key={field.name}>
                      <label className="block text-xs font-semibold text-[var(--muted2)] uppercase tracking-wide mb-1.5">
                        {field.label}
                        {field.required && <span className="text-red-400 ml-1">*</span>}
                      </label>

                      {field.type === 'textarea' ? (
                        <textarea
                          value={formData[field.name] || ''}
                          onChange={e => setFormData(p => ({ ...p, [field.name]: e.target.value }))}
                          placeholder={field.placeholder}
                          maxLength={field.maxLength}
                          rows={3}
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--qr)] focus:ring-1 focus:ring-[var(--qr)]/40 resize-none"
                        />
                      ) : field.type === 'select' ? (
                        <select
                          value={formData[field.name] || field.options?.[0]?.value || ''}
                          onChange={e => setFormData(p => ({ ...p, [field.name]: e.target.value }))}
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--qr)] focus:ring-1 focus:ring-[var(--qr)]/40"
                        >
                          {field.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
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

                      {field.maxLength && formData[field.name] && (
                        <p className="text-right text-[10px] text-[var(--muted2)] mt-1">
                          {formData[field.name].length} / {field.maxLength}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {step === 'form' && (
                  <button
                    onClick={() => setStep('design')}
                    disabled={!name.trim() || missingRequired.length > 0}
                    className="mt-6 w-full rounded-xl bg-[var(--qr)] hover:bg-[var(--qr-dim)] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 transition-colors"
                  >
                    Next: Design →
                  </button>
                )}
              </div>

              {/* Step 3: Design panel */}
              {step === 'design' && (
                <div className="rounded-2xl border border-[var(--qr)] bg-[var(--surface)] p-6">
                  <h2 className="text-sm font-bold text-[var(--text)] mb-5">Design Your QR Code</h2>
                  <QRDesignPanel design={design} onChange={setDesign} />
                </div>
              )}
            </div>

            {/* Right panel — sticky preview */}
            <div className="w-full lg:w-72 xl:w-80 shrink-0">
              <div className="sticky top-6">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                  <h3 className="text-xs font-semibold text-[var(--muted2)] uppercase tracking-wide mb-4">Live Preview</h3>

                  {/* QR preview */}
                  <div className="flex items-center justify-center rounded-xl p-4 mb-4" style={{ background: design.background_color }}>
                    <div ref={previewRef} className="w-[280px] h-[280px]" />
                  </div>

                  {/* Scan link */}
                  <div className="flex items-center gap-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] px-3 py-2 mb-4">
                    <span className="text-[10px] text-[var(--muted2)] flex-1 truncate">
                      qrcodee.online/r/
                      <span className="text-[var(--qr)]">——————</span>
                    </span>
                  </div>

                  {/* Name preview */}
                  {name && (
                    <p className="text-sm font-medium text-[var(--text)] text-center mb-4 truncate">{name}</p>
                  )}

                  {/* Step nav */}
                  {step === 'form' && (
                    <button
                      onClick={() => setStep('design')}
                      disabled={!name.trim() || missingRequired.length > 0}
                      className="w-full rounded-xl bg-[var(--qr)] hover:bg-[var(--qr-dim)] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 transition-colors mb-2"
                    >
                      Next: Design →
                    </button>
                  )}

                  {step === 'design' && (
                    <>
                      {error && (
                        <p className="text-xs text-red-400 mb-3 text-center">{error}</p>
                      )}
                      <button
                        onClick={handleSave}
                        disabled={saving || !canSave}
                        className="w-full rounded-xl bg-[var(--qr)] hover:bg-[var(--qr-dim)] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold py-3 transition-all shadow-lg shadow-[var(--qr)]/20 mb-2"
                      >
                        {saving ? 'Creating…' : '✓ Create QR Code'}
                      </button>
                      <button
                        onClick={() => setStep('form')}
                        className="w-full text-xs text-[var(--muted2)] hover:text-[var(--text)] py-2 transition-colors"
                      >
                        ← Back to details
                      </button>
                    </>
                  )}

                  {missingRequired.length > 0 && (
                    <p className="text-[10px] text-[var(--muted2)] text-center mt-2">
                      Fill in: {missingRequired.join(', ')}
                    </p>
                  )}
                </div>

                {/* Tips */}
                <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="text-[10px] font-semibold text-[var(--muted2)] uppercase tracking-wide mb-2">Tips</p>
                  <ul className="space-y-1.5 text-[10px] text-[var(--muted2)]">
                    {selectedType.isDynamic ? (
                      <>
                        <li className="flex gap-1.5"><span className="text-[var(--qr)]">●</span> Dynamic — change the destination anytime without reprinting</li>
                        <li className="flex gap-1.5"><span className="text-[var(--qr)]">●</span> Scan analytics tracked automatically</li>
                      </>
                    ) : (
                      <li className="flex gap-1.5"><span className="text-yellow-400">●</span> Static — payload baked in, cannot be changed after printing</li>
                    )}
                    <li className="flex gap-1.5"><span className="text-[var(--muted)]">●</span> Use H error correction if adding a logo</li>
                    <li className="flex gap-1.5"><span className="text-[var(--muted)]">●</span> Test scan before printing at scale</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

