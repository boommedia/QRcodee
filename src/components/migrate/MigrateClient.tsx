'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Folder = { id: string; name: string; color: string }
type ParsedRow = { name: string; url: string; type: string; valid: boolean; _error?: string }
type ColumnMap = { name: string; url: string; type: string }
type Result = { success: boolean; name: string; error?: string }

type DecodedImage = {
  file: string
  thumb: string
  decodedUrl: string
  name: string
  url: string
  status: 'ok' | 'failed'
  resolving?: boolean
  resolvedUrl?: string
}

const KNOWN_SOURCES = [
  { id: 'qrcodechimp', label: 'QRCodeChimp', columns: { name: 'name', url: 'destination_url', type: 'type' } },
  { id: 'qr-tiger', label: 'QR Tiger', columns: { name: 'Campaign Name', url: 'URL', type: 'Type' } },
  { id: 'beaconstac', label: 'Beaconstac', columns: { name: 'Name', url: 'URL', type: 'QR Type' } },
  { id: 'custom', label: 'Custom CSV', columns: { name: '', url: '', type: '' } },
]

function guessSource(headers: string[]) {
  const h = headers.map(x => x.toLowerCase())
  if (h.includes('destination_url') || h.includes('short_url')) return 'qrcodechimp'
  if (h.includes('campaign name')) return 'qr-tiger'
  if (h.includes('qr type')) return 'beaconstac'
  return 'custom'
}

function parseRows(text: string, colMap: ColumnMap): ParsedRow[] {
  const lines = text.trim().split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const raw = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const idx = (col: string) => raw.findIndex(h => h.toLowerCase() === col.toLowerCase())
  const nameIdx = idx(colMap.name)
  const urlIdx = idx(colMap.url)
  const typeIdx = idx(colMap.type)

  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    const name = nameIdx >= 0 ? cols[nameIdx] || '' : ''
    const url = urlIdx >= 0 ? cols[urlIdx] || '' : ''
    const type = typeIdx >= 0 ? cols[typeIdx] || 'url' : 'url'
    const valid = !!name && !!url && url.startsWith('http')
    return { name, url, type: 'url', valid, _error: !valid ? (!name ? 'Missing name' : 'Invalid URL') : undefined }
  }).filter(r => r.name || r.url)
}

async function decodeQRFromFile(file: File): Promise<{ url: string; thumb: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async e => {
      const dataUrl = e.target?.result as string
      const img = new Image()
      img.onload = async () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('No canvas context')); return }
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        try {
          const jsQR = (await import('jsqr')).default
          const code = jsQR(imageData.data, imageData.width, imageData.height)
          if (code) resolve({ url: code.data, thumb: dataUrl })
          else reject(new Error('No QR code found'))
        } catch {
          reject(new Error('Decode failed'))
        }
      }
      img.onerror = () => reject(new Error('Image load failed'))
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  })
}

function MigrationGuide() {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] mb-6 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">📋</span>
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">How to migrate from QRCodeChimp</p>
            <p className="text-[10px] text-[var(--muted2)]">Step-by-step process to move your active QR codes to QRcodee</p>
          </div>
        </div>
        <span className="text-[var(--muted2)] text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="border-t border-[var(--border)] px-5 py-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                step: '1',
                title: 'Download your QR images',
                detail: 'In QRCodeChimp, go to My QR Codes → select each code → Download as PNG or SVG. Download all the codes you want to migrate.',
                color: 'var(--qr)',
              },
              {
                step: '2',
                title: 'Upload images here → Decode QR mode',
                detail: 'Switch to "Decode QR Images" tab above. Drop all your downloaded QR images. We automatically decode each one and follow its redirect to find the real destination URL.',
                color: 'var(--qr)',
              },
              {
                step: '3',
                title: 'Review & confirm destinations',
                detail: 'Check that the destination URLs look correct. The old QRCodeChimp short URL will be shown struck-through — the resolved real destination is pre-filled for you. Edit any names or URLs as needed.',
                color: 'var(--qr)',
              },
              {
                step: '4',
                title: 'Click Import',
                detail: 'QRcodee creates new dynamic QR codes for each one. Future scans go directly through qrcodee.online — no dependency on QRCodeChimp.',
                color: 'var(--qr)',
              },
              {
                step: '5',
                title: 'Download new QR images from QRcodee',
                detail: 'Go to your QR Codes list, open each migrated code → Edit → Download SVG. Or use Bulk actions to download all at once.',
                color: '#f59e0b',
              },
              {
                step: '6',
                title: 'Replace everywhere the old codes appear',
                detail: 'Update: your website, Google Business Profile, menus (print new ones), social media, flyers, packaging. Once replaced, the new codes go through QRcodee where you control the destination.',
                color: '#f59e0b',
              },
            ].map(({ step, title, detail, color }) => (
              <div key={step} className="flex gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 mt-0.5" style={{ background: color }}>
                  {step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text)] mb-1">{title}</p>
                  <p className="text-xs text-[var(--muted2)] leading-relaxed">{detail}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-yellow-700/30 bg-yellow-900/10 p-4">
            <p className="text-xs font-semibold text-yellow-400 mb-1">⚠️ Important: old printed codes</p>
            <p className="text-xs text-[var(--muted2)]">QRCodeChimp codes encode a QRCodeChimp URL — once you close your account there, any code you haven&apos;t physically replaced will stop working. Always replace the image before closing the account.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MigrateClient({ plan, folders }: { plan: string; folders: Folder[] }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLInputElement>(null)

  // CSV mode state
  const [step, setStep] = useState<'source' | 'map' | 'preview' | 'importing' | 'done'>('source')
  const [rawText, setRawText] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [source, setSource] = useState('qrcodechimp')
  const [colMap, setColMap] = useState<ColumnMap>({ name: 'name', url: 'destination_url', type: 'type' })
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [folderId, setFolderId] = useState('')
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<Result[]>([])

  // Image decode mode state
  const [mode, setMode] = useState<'csv' | 'images'>('csv')
  const [decoded, setDecoded] = useState<DecodedImage[]>([])
  const [decoding, setDecoding] = useState(false)
  const [imgStep, setImgStep] = useState<'upload' | 'review' | 'importing' | 'done'>('upload')

  function handleFile(file: File) {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      alert('Please upload a CSV file. To export from QRCodeChimp: go to My QR Codes → select all → Export → CSV.')
      return
    }
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      if (text.startsWith('%PDF')) {
        alert('This looks like a PDF, not a CSV. Please export your QR codes as a CSV file from your provider.')
        return
      }
      setRawText(text)
      const firstLine = text.split('\n')[0]
      const hdrs = firstLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''))
      setHeaders(hdrs)
      const guessed = guessSource(hdrs)
      setSource(guessed)
      const srcConfig = KNOWN_SOURCES.find(s => s.id === guessed)
      if (srcConfig) setColMap(srcConfig.columns)
      setStep('map')
    }
    reader.readAsText(file)
  }

  async function handleImages(files: FileList) {
    setDecoding(true)
    const items: DecodedImage[] = []
    for (const file of Array.from(files)) {
      const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
      try {
        const { url, thumb } = await decodeQRFromFile(file)
        items.push({ file: file.name, thumb, decodedUrl: url, name: baseName, url, status: 'ok', resolving: true })
      } catch {
        items.push({ file: file.name, thumb: '', decodedUrl: '', name: baseName, url: '', status: 'failed', resolving: false })
      }
    }
    setDecoded(items)
    setDecoding(false)
    setImgStep('review')

    // Follow redirects on each decoded URL concurrently to get the real final destination
    await Promise.all(items.map(async (item, i) => {
      if (item.status === 'failed') return
      try {
        const res = await fetch('/api/resolve-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: item.decodedUrl }),
        })
        const data = await res.json()
        const resolved: string = data.resolved || item.decodedUrl
        setDecoded(prev => prev.map((x, j) => j === i ? { ...x, url: resolved, resolvedUrl: resolved, resolving: false } : x))
      } catch {
        setDecoded(prev => prev.map((x, j) => j === i ? { ...x, resolving: false } : x))
      }
    }))
  }

  function applyMap() {
    const parsed = parseRows(rawText, colMap)
    setRows(parsed)
    setStep('preview')
  }

  async function runImport(importRows?: { name: string; url: string }[]) {
    const valid = importRows
      ? importRows.filter(r => r.name && r.url.startsWith('http'))
      : rows.filter(r => r.valid)
    if (valid.length === 0) return

    if (importRows) setImgStep('importing')
    else setStep('importing')
    setProgress(0)

    const BATCH = 50
    const allResults: Result[] = []

    for (let i = 0; i < valid.length; i += BATCH) {
      const chunk = valid.slice(i, i + BATCH)
      const items = chunk.map(r => ({
        type: 'url',
        name: r.name,
        qr_data: { url: r.url },
        folder_id: folderId || undefined,
      }))
      const res = await fetch('/api/qr/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, migration: true }),
      })
      const data = await res.json()
      if (data.results) allResults.push(...data.results)
      else if (data.error) allResults.push(...chunk.map(r => ({ success: false, name: r.name, error: data.error })))
      setProgress(Math.round(((i + chunk.length) / valid.length) * 100))
    }

    setResults(allResults)
    if (importRows) setImgStep('done')
    else setStep('done')
    router.refresh()
  }

  const validCount = rows.filter(r => r.valid).length
  const invalidCount = rows.filter(r => !r.valid).length
  const succeeded = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  const decodedOk = decoded.filter(d => d.status === 'ok')

  const isDone = step === 'done' || imgStep === 'done'

  function resetAll() {
    setStep('source'); setRawText(''); setRows([]); setResults([])
    setImgStep('upload'); setDecoded([])
  }

  return (
    <div className="min-h-full">
      <div className="h-0.5 w-full bg-gradient-to-r from-[var(--qr)] via-[var(--qr-hover)] to-[var(--warn)]" />

      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-xs text-[var(--muted2)] mb-6">
          <Link href="/dashboard" className="hover:text-[var(--text)]">Dashboard</Link>
          <span>/</span>
          <span className="text-[var(--text)]">Migrate QR Codes</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-[var(--text)]">Migrate from Another Service</h1>
            <p className="text-xs text-[var(--muted2)] mt-0.5">Import from QRCodeChimp, QR Tiger, Beaconstac — via CSV or QR image decoding</p>
          </div>
          {!isDone && (step !== 'source' || imgStep !== 'upload') && (
            <button
              onClick={resetAll}
              className="text-xs text-[var(--muted2)] hover:text-[var(--text)] border border-[var(--border)] rounded-xl px-3 py-2 transition-colors"
            >
              Start Over
            </button>
          )}
        </div>

        {(step === 'source' && imgStep === 'upload') && <MigrationGuide />}

        {/* Mode toggle — only show on first step */}
        {(step === 'source' && imgStep === 'upload') && (
          <div className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 mb-6 w-fit">
            <button
              onClick={() => setMode('csv')}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${mode === 'csv' ? 'bg-[var(--qr)] text-white' : 'text-[var(--muted2)] hover:text-[var(--text)]'}`}
            >
              📄 Upload CSV
            </button>
            <button
              onClick={() => setMode('images')}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${mode === 'images' ? 'bg-[var(--qr)] text-white' : 'text-[var(--muted2)] hover:text-[var(--text)]'}`}
            >
              🔍 Decode QR Images
            </button>
          </div>
        )}

        {/* ── IMAGE DECODE MODE ── */}
        {mode === 'images' && (
          <>
            {imgStep === 'upload' && (
              <div className="space-y-4">
                <div
                  className="rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-[var(--qr)] p-12 text-center cursor-pointer transition-colors"
                  onClick={() => imgRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); if (e.dataTransfer.files.length) handleImages(e.dataTransfer.files) }}
                >
                  <input
                    ref={imgRef} type="file" accept=".png,.jpg,.jpeg,.svg,.webp" multiple className="hidden"
                    onChange={e => { if (e.target.files?.length) handleImages(e.target.files) }}
                  />
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-sm font-semibold text-[var(--text)] mb-1">Drop your QR code images here</p>
                  <p className="text-xs text-[var(--muted2)] mb-4">PNG, JPG, SVG — upload multiple at once. We&apos;ll decode the URL from each one.</p>
                  <button type="button" className="rounded-xl px-4 py-2 text-sm font-bold text-white" style={{ background: 'var(--qr)' }}>
                    Choose Images
                  </button>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                  <p className="text-sm font-semibold text-[var(--text)] mb-2">How this works</p>
                  <ol className="text-xs text-[var(--muted2)] space-y-1.5 list-decimal list-inside">
                    <li>Download your QR code images from QRCodeChimp (PNG or SVG)</li>
                    <li>Upload them all here — we decode the embedded URL from each one</li>
                    <li>Review the decoded URLs, update any you want to change</li>
                    <li>Click Import — your QR codes are recreated in QRcodee</li>
                  </ol>
                </div>
              </div>
            )}

            {decoding && (
              <div className="rounded-2xl border border-[var(--qr)]/40 bg-[var(--surface)] p-8 text-center">
                <div className="w-8 h-8 rounded-full border-2 border-[var(--qr)] border-t-transparent animate-spin mx-auto mb-4" />
                <p className="text-sm font-bold text-[var(--text)]">Decoding QR codes…</p>
              </div>
            )}

            {imgStep === 'review' && !decoding && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
                    <p className="text-2xl font-black text-[var(--text)]">{decoded.length}</p>
                    <p className="text-[10px] text-[var(--muted2)]">Images uploaded</p>
                  </div>
                  <div className="rounded-2xl border border-green-700/30 bg-green-900/10 p-4 text-center">
                    <p className="text-2xl font-black text-green-400">{decodedOk.length}</p>
                    <p className="text-[10px] text-[var(--muted2)]">Successfully decoded</p>
                  </div>
                  <div className={`rounded-2xl border p-4 text-center ${decoded.length - decodedOk.length > 0 ? 'border-red-700/30 bg-red-900/10' : 'border-[var(--border)] bg-[var(--surface)]'}`}>
                    <p className={`text-2xl font-black ${decoded.length - decodedOk.length > 0 ? 'text-red-400' : 'text-[var(--muted2)]'}`}>{decoded.length - decodedOk.length}</p>
                    <p className="text-[10px] text-[var(--muted2)]">Failed to decode</p>
                  </div>
                </div>

                {folders.length > 0 && (
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <label className="block text-xs font-semibold text-[var(--muted2)] uppercase tracking-wide mb-2">Add to folder (optional)</label>
                    <select
                      value={folderId} onChange={e => setFolderId(e.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--qr)]"
                    >
                      <option value="">No folder</option>
                      {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                )}

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                  <div className="grid grid-cols-[40px_1fr_1fr] gap-0 border-b border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5">
                    <span />
                    <span className="text-[10px] font-semibold text-[var(--muted2)] uppercase tracking-wide">Name</span>
                    <span className="text-[10px] font-semibold text-[var(--muted2)] uppercase tracking-wide">Destination URL <span className="normal-case font-normal">(editable)</span></span>
                  </div>
                  <div className="divide-y divide-[var(--border)] max-h-96 overflow-y-auto">
                    {decoded.map((d, i) => (
                      <div key={i} className={`grid grid-cols-[40px_1fr_1fr] gap-2 px-4 py-3 items-start ${d.status === 'failed' ? 'opacity-50' : ''}`}>
                        {d.thumb
                          ? <img src={d.thumb} alt="" className="w-8 h-8 rounded object-contain bg-white mt-0.5" />
                          : <div className="w-8 h-8 rounded bg-[var(--surface2)] flex items-center justify-center text-xs mt-0.5">?</div>
                        }
                        <input
                          value={d.name}
                          onChange={e => setDecoded(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                          className="rounded-lg border border-[var(--border)] bg-[var(--surface2)] px-2 py-1.5 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--qr)] w-full"
                          placeholder="QR code name"
                        />
                        {d.status === 'failed' ? (
                          <span className="text-xs text-red-400">Failed to decode</span>
                        ) : d.resolving ? (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full border border-[var(--qr)] border-t-transparent animate-spin shrink-0" />
                            <span className="text-[10px] text-[var(--muted2)]">Resolving redirect…</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {d.resolvedUrl && d.resolvedUrl !== d.decodedUrl && (
                              <p className="text-[9px] text-[var(--muted2)] font-mono truncate line-through opacity-50">{d.decodedUrl.slice(0, 50)}</p>
                            )}
                            <input
                              value={d.url}
                              onChange={e => setDecoded(prev => prev.map((x, j) => j === i ? { ...x, url: e.target.value } : x))}
                              className="rounded-lg border border-[var(--qr)]/40 bg-[var(--surface2)] px-2 py-1.5 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--qr)] w-full"
                              placeholder="https://your-destination.com"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-[var(--muted2)]">
                  ✅ We automatically follow any redirects to find the real destination URL. Edit any field before importing.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => runImport(decodedOk.map(d => ({ name: d.name, url: d.url })))}
                    disabled={decodedOk.filter(d => d.url.startsWith('http')).length === 0}
                    className="rounded-xl px-6 py-3 text-sm font-bold text-white disabled:opacity-50 transition-all hover:opacity-90"
                    style={{ background: 'var(--qr)' }}
                  >
                    Import {decodedOk.filter(d => d.url.startsWith('http')).length} QR Codes
                  </button>
                  <button
                    onClick={() => { setImgStep('upload'); setDecoded([]) }}
                    className="rounded-xl px-4 py-3 text-sm text-[var(--muted2)] hover:text-[var(--text)] border border-[var(--border)] transition-colors"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {imgStep === 'importing' && (
              <div className="rounded-2xl border border-[var(--qr)]/40 bg-[var(--surface)] p-8 text-center">
                <div className="text-4xl mb-4">⚡</div>
                <p className="text-base font-bold text-[var(--text)] mb-1">Importing your QR codes…</p>
                <p className="text-xs text-[var(--muted2)] mb-6">Don&apos;t close this tab</p>
                <div className="h-2 rounded-full bg-[var(--surface2)] overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: 'var(--qr)' }} />
                </div>
                <p className="text-sm font-bold" style={{ color: 'var(--qr)' }}>{progress}%</p>
              </div>
            )}

            {imgStep === 'done' && <DoneScreen succeeded={succeeded} failed={failed} results={results} onReset={resetAll} />}
          </>
        )}

        {/* ── CSV MODE ── */}
        {mode === 'csv' && (
          <>
            {/* Step indicators */}
            {step !== 'done' && (
              <div className="flex items-center gap-2 mb-8">
                {[{ id: 'source', label: 'Upload' }, { id: 'map', label: 'Map Columns' }, { id: 'preview', label: 'Preview' }, { id: 'done', label: 'Complete' }].map((s, i, arr) => {
                  const stepOrder = ['source', 'map', 'preview', 'importing', 'done']
                  const current = stepOrder.indexOf(step)
                  const mine = stepOrder.indexOf(s.id)
                  return (
                    <div key={s.id} className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${current === mine ? 'text-white' : current > mine ? 'text-white opacity-60' : 'text-[var(--muted2)] border border-[var(--border)]'}`} style={{ background: current >= mine ? 'var(--qr)' : 'transparent' }}>
                        {i + 1}
                      </div>
                      <span className={`text-xs ${current === mine ? 'text-[var(--text)] font-semibold' : 'text-[var(--muted2)]'}`}>{s.label}</span>
                      {i < arr.length - 1 && <span className="text-[var(--border)] mx-1">→</span>}
                    </div>
                  )
                })}
              </div>
            )}

            {step === 'source' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {KNOWN_SOURCES.map(src => (
                    <div key={src.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
                      <p className="text-sm font-semibold text-[var(--text)] mb-3">{src.label}</p>
                      {src.id === 'qrcodechimp' && <p className="text-[10px] text-[var(--muted2)] mb-2">Auto-detected</p>}
                    </div>
                  ))}
                </div>
                <div
                  className="rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-[var(--qr)] p-12 text-center cursor-pointer transition-colors"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
                >
                  <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
                  <div className="text-4xl mb-3">📂</div>
                  <p className="text-sm font-semibold text-[var(--text)] mb-1">Upload your exported CSV</p>
                  <p className="text-xs text-[var(--muted2)] mb-4">From QRCodeChimp, QR Tiger, Beaconstac, or your own format</p>
                  <button type="button" className="rounded-xl px-4 py-2 text-sm font-bold text-white" style={{ background: 'var(--qr)' }}>Choose File</button>
                </div>
              </div>
            )}

            {step === 'map' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                  <p className="text-sm font-semibold text-[var(--text)] mb-1">Detected source: <span style={{ color: 'var(--qr)' }}>{KNOWN_SOURCES.find(s => s.id === source)?.label}</span></p>
                  <p className="text-xs text-[var(--muted2)] mb-5">Map your CSV columns to QRcodee fields. We auto-detected these — adjust if needed.</p>
                  <div className="space-y-4">
                    {([['name', 'QR Code Name'], ['url', 'Destination URL'], ['type', 'QR Type (optional)']] as const).map(([field, label]) => (
                      <div key={field}>
                        <label className="block text-xs font-semibold text-[var(--muted2)] uppercase tracking-wide mb-1.5">{label}</label>
                        <select
                          value={colMap[field]}
                          onChange={e => setColMap(prev => ({ ...prev, [field]: e.target.value }))}
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--qr)]"
                        >
                          <option value="">— skip —</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="text-xs font-semibold text-[var(--muted2)] mb-2">Available columns in your file:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {headers.map(h => <span key={h} className="text-[10px] px-2 py-1 rounded-lg bg-[var(--surface2)] text-[var(--muted2)]">{h}</span>)}
                  </div>
                </div>
                <button onClick={applyMap} disabled={!colMap.name || !colMap.url} className="rounded-xl px-6 py-3 text-sm font-bold text-white disabled:opacity-50 transition-all hover:opacity-90" style={{ background: 'var(--qr)' }}>
                  Preview Import
                </button>
              </div>
            )}

            {step === 'preview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
                    <p className="text-2xl font-black text-[var(--text)]">{rows.length}</p>
                    <p className="text-[10px] text-[var(--muted2)]">Total rows</p>
                  </div>
                  <div className="rounded-2xl border border-green-700/30 bg-green-900/10 p-4 text-center">
                    <p className="text-2xl font-black text-green-400">{validCount}</p>
                    <p className="text-[10px] text-[var(--muted2)]">Ready to import</p>
                  </div>
                  <div className={`rounded-2xl border p-4 text-center ${invalidCount > 0 ? 'border-red-700/30 bg-red-900/10' : 'border-[var(--border)] bg-[var(--surface)]'}`}>
                    <p className={`text-2xl font-black ${invalidCount > 0 ? 'text-red-400' : 'text-[var(--muted2)]'}`}>{invalidCount}</p>
                    <p className="text-[10px] text-[var(--muted2)]">Will be skipped</p>
                  </div>
                </div>
                {folders.length > 0 && (
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <label className="block text-xs font-semibold text-[var(--muted2)] uppercase tracking-wide mb-2">Add to folder (optional)</label>
                    <select value={folderId} onChange={e => setFolderId(e.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--qr)]">
                      <option value="">No folder</option>
                      {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                  <div className="grid grid-cols-2 border-b border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5">
                    <span className="text-[10px] font-semibold text-[var(--muted2)] uppercase tracking-wide">Name</span>
                    <span className="text-[10px] font-semibold text-[var(--muted2)] uppercase tracking-wide">Destination URL</span>
                  </div>
                  <div className="divide-y divide-[var(--border)] max-h-80 overflow-y-auto">
                    {rows.slice(0, 50).map((row, i) => (
                      <div key={i} className={`grid grid-cols-2 gap-0 px-4 py-3 ${!row.valid ? 'opacity-40' : ''}`}>
                        <div className="flex items-center gap-2 pr-2">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${row.valid ? 'bg-green-400' : 'bg-red-400'}`} />
                          <span className="text-xs text-[var(--text)] truncate">{row.name}</span>
                        </div>
                        <span className="text-xs text-[var(--muted2)] truncate">{row._error || row.url}</span>
                      </div>
                    ))}
                    {rows.length > 50 && <div className="px-4 py-3 text-xs text-[var(--muted2)] text-center">+ {rows.length - 50} more rows</div>}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => runImport()} disabled={validCount === 0} className="rounded-xl px-6 py-3 text-sm font-bold text-white disabled:opacity-50 transition-all hover:opacity-90" style={{ background: 'var(--qr)' }}>
                    Import {validCount} QR Codes
                  </button>
                  <button onClick={() => setStep('map')} className="rounded-xl px-4 py-3 text-sm text-[var(--muted2)] hover:text-[var(--text)] border border-[var(--border)] transition-colors">Back</button>
                </div>
              </div>
            )}

            {step === 'importing' && (
              <div className="rounded-2xl border border-[var(--qr)]/40 bg-[var(--surface)] p-8 text-center">
                <div className="text-4xl mb-4">⚡</div>
                <p className="text-base font-bold text-[var(--text)] mb-1">Importing your QR codes…</p>
                <p className="text-xs text-[var(--muted2)] mb-6">Don&apos;t close this tab</p>
                <div className="h-2 rounded-full bg-[var(--surface2)] overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: 'var(--qr)' }} />
                </div>
                <p className="text-sm font-bold" style={{ color: 'var(--qr)' }}>{progress}%</p>
              </div>
            )}

            {step === 'done' && <DoneScreen succeeded={succeeded} failed={failed} results={results} onReset={resetAll} />}
          </>
        )}
      </div>
    </div>
  )
}

function DoneScreen({ succeeded, failed, results, onReset }: { succeeded: number; failed: number; results: Result[]; onReset: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-green-700/30 bg-green-900/10 p-8 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-black text-green-400 mb-1">Migration complete!</h2>
        <p className="text-sm text-[var(--muted2)]">
          <span className="font-bold text-[var(--text)]">{succeeded}</span> QR codes imported successfully
          {failed > 0 && <>, <span className="font-bold text-red-400">{failed}</span> failed</>}
        </p>
      </div>
      {failed > 0 && (
        <div className="rounded-2xl border border-red-700/30 bg-red-900/5 p-4">
          <p className="text-xs font-semibold text-red-400 mb-2">Failed items:</p>
          {results.filter(r => !r.success).slice(0, 10).map((r, i) => (
            <div key={i} className="text-xs text-[var(--muted2)] flex gap-2">
              <span className="text-red-400">✗</span>
              <span className="font-medium">{r.name}</span>
              <span>— {r.error}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-3">
        <Link href="/dashboard/qr" className="rounded-xl px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-90" style={{ background: 'var(--qr)' }}>
          View Imported QR Codes
        </Link>
        <button onClick={onReset} className="rounded-xl px-4 py-3 text-sm text-[var(--muted2)] hover:text-[var(--text)] border border-[var(--border)] transition-colors">
          Import More
        </button>
      </div>
    </div>
  )
}
