'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { QR_TYPES, encodeQRPayload, type Phase1QRType } from '@/lib/qr/types'
import type { QRCode, QRDesignConfig } from '@/types'

const SIZES = [
  { label: '256 px', value: 256 },
  { label: '512 px', value: 512 },
  { label: '1024 px', value: 1024 },
  { label: '2048 px', value: 2048 },
]

type Props = { qr: QRCode; plan: string }

export default function DownloadClient({ qr, plan }: Props) {
  const previewRef = useRef<HTMLDivElement>(null)
  const qrRef = useRef<InstanceType<typeof import('qr-code-styling').default> | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  const design = qr.design_config as QRDesignConfig
  const typeConfig = QR_TYPES[qr.type as Phase1QRType]
  const payload = typeConfig
    ? (qr.is_dynamic ? `https://qrcodee.online/r/${qr.short_slug}` : encodeQRPayload(qr.type as Phase1QRType, qr.qr_data as Record<string, string>))
    : qr.destination_url || 'https://qrcodee.online'

  const qrOptions = {
    data: payload,
    dotsOptions: { color: design?.foreground_color || '#000000', type: (design?.dot_style || 'square') as never },
    cornersSquareOptions: { color: design?.foreground_color || '#000000', type: (design?.corner_square_style || 'square') as never },
    cornersDotOptions: { color: design?.foreground_color || '#000000', type: (design?.corner_dot_style || 'square') as never },
    backgroundOptions: { color: design?.background_color || '#ffffff' },
    qrOptions: { errorCorrectionLevel: (design?.error_correction || 'M') as never },
  }

  useEffect(() => {
    let cancelled = false
    async function init() {
      const QRCodeStyling = (await import('qr-code-styling')).default
      if (cancelled || !previewRef.current) return
      qrRef.current = new QRCodeStyling({ width: 280, height: 280, type: 'svg', ...qrOptions })
      previewRef.current.innerHTML = ''
      qrRef.current.append(previewRef.current)
      setReady(true)
    }
    init()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function downloadPNG(size: number) {
    if (!qrRef.current) return
    setDownloading(`png-${size}`)
    const QRCodeStyling = (await import('qr-code-styling')).default
    const hires = new QRCodeStyling({ width: size, height: size, type: 'canvas', ...qrOptions })
    await hires.download({ name: qr.name.replace(/\s+/g, '-').toLowerCase(), extension: 'png' })
    setDownloading(null)
  }

  async function downloadSVG() {
    if (!qrRef.current) return
    setDownloading('svg')
    const QRCodeStyling = (await import('qr-code-styling')).default
    const vec = new QRCodeStyling({ width: 1024, height: 1024, type: 'svg', ...qrOptions })
    await vec.download({ name: qr.name.replace(/\s+/g, '-').toLowerCase(), extension: 'svg' })
    setDownloading(null)
  }

  async function downloadPDF() {
    // Render to canvas, embed in minimal PDF via print dialog
    if (!qrRef.current) return
    setDownloading('pdf')
    const QRCodeStyling = (await import('qr-code-styling')).default
    const hires = new QRCodeStyling({ width: 1024, height: 1024, type: 'canvas', ...qrOptions })
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 1024
    const raw = document.createElement('div')
    document.body.appendChild(raw)
    hires.append(raw)
    await new Promise(r => setTimeout(r, 400))
    const srcCanvas = raw.querySelector('canvas')
    const dataUrl = srcCanvas?.toDataURL('image/png') || ''
    document.body.removeChild(raw)

    const win = window.open('', '_blank')
    if (win) {
      win.document.write(`<!DOCTYPE html><html><head><title>${qr.name}</title>
      <style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff;}
      img{max-width:80vmin;max-height:80vmin;}
      @media print{body{margin:0;}img{width:100%;height:auto;}}</style></head>
      <body><img src="${dataUrl}" /><script>window.onload=()=>{window.print();}<\/script></body></html>`)
      win.document.close()
    }
    setDownloading(null)
  }

  const isPdfGated = plan === 'free' || plan === 'starter'

  return (
    <div className="min-h-full">
      <div className="h-0.5 w-full bg-gradient-to-r from-[var(--qr)] via-[var(--qr-hover)] to-[var(--warn)]" />

      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[var(--muted2)] mb-6">
          <Link href="/dashboard" className="hover:text-[var(--text)]">Dashboard</Link>
          <span>/</span>
          <Link href="/dashboard/qr" className="hover:text-[var(--text)]">QR Codes</Link>
          <span>/</span>
          <Link href={`/dashboard/qr/${qr.id}`} className="hover:text-[var(--text)]">{qr.name}</Link>
          <span>/</span>
          <span className="text-[var(--text)]">Download</span>
        </div>

        <h1 className="text-xl font-bold text-[var(--text)] mb-1">Download QR Code</h1>
        <p className="text-xs text-[var(--muted2)] mb-8">{qr.name}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Preview */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 flex flex-col items-center">
            <div
              ref={previewRef}
              className="rounded-xl overflow-hidden mb-4"
              style={{ width: 280, height: 280, background: design?.background_color || '#fff' }}
            />
            {!ready && (
              <div className="text-xs text-[var(--muted2)]">Rendering…</div>
            )}
            <p className="text-xs text-[var(--muted2)] text-center mt-2">
              {qr.is_dynamic ? 'Dynamic QR — URL can be changed after printing' : 'Static QR code'}
            </p>
          </div>

          {/* Download options */}
          <div className="space-y-4">
            {/* PNG section */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ background: 'var(--qr)22' }}>
                  🖼
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">PNG</p>
                  <p className="text-[10px] text-[var(--muted2)]">Raster image — for print & digital</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SIZES.map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => downloadPNG(value)}
                    disabled={!ready || downloading !== null}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-3 py-2.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--qr)] hover:text-[var(--qr)] disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"
                  >
                    {downloading === `png-${value}` ? (
                      <span className="animate-pulse">Generating…</span>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {label}
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG section */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ background: '#22d3ee22' }}>
                    ✏️
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text)]">SVG</p>
                    <p className="text-[10px] text-[var(--muted2)]">Vector — infinitely scalable</p>
                  </div>
                </div>
              </div>
              <button
                onClick={downloadSVG}
                disabled={!ready || downloading !== null}
                className="w-full rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-40 transition-all hover:opacity-90"
                style={{ background: 'var(--qr)' }}
              >
                {downloading === 'svg' ? 'Generating…' : 'Download SVG'}
              </button>
            </div>

            {/* PDF section */}
            <div className={`rounded-2xl border p-5 ${isPdfGated ? 'border-[var(--border)] opacity-60' : 'border-[var(--border)] bg-[var(--surface)]'}`}
              style={isPdfGated ? { background: 'var(--surface)' } : {}}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ background: '#f59e0b22' }}>
                    📄
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text)]">PDF</p>
                    <p className="text-[10px] text-[var(--muted2)]">Print-ready — Pro & Agency</p>
                  </div>
                </div>
                {isPdfGated && (
                  <Link
                    href="/billing"
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg text-white"
                    style={{ background: 'var(--warn)' }}
                  >
                    Upgrade
                  </Link>
                )}
              </div>
              <button
                onClick={downloadPDF}
                disabled={isPdfGated || !ready || downloading !== null}
                className="w-full rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-40 transition-all hover:opacity-90"
                style={{ background: '#f59e0b' }}
              >
                {downloading === 'pdf' ? 'Generating…' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Link
            href={`/dashboard/qr/${qr.id}`}
            className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted2)] hover:text-[var(--text)] transition-colors"
          >
            ← Back to Edit
          </Link>
          <Link
            href="/dashboard/qr"
            className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted2)] hover:text-[var(--text)] transition-colors"
          >
            All QR Codes
          </Link>
        </div>
      </div>
    </div>
  )
}
