'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Folder = { id: string; name: string; color: string }

type ParsedRow = {
  name: string
  url: string
  type: string
  valid: boolean
  _error?: string
}

type ColumnMap = {
  name: string
  url: string
  type: string
}

type Result = { success: boolean; name: string; error?: string }

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

export default function MigrateClient({ plan, folders }: { plan: string; folders: Folder[] }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<'source' | 'map' | 'preview' | 'importing' | 'done'>('source')
  const [rawText, setRawText] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [source, setSource] = useState('qrcodechimp')
  const [colMap, setColMap] = useState<ColumnMap>({ name: 'name', url: 'destination_url', type: 'type' })
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [folderId, setFolderId] = useState('')
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<Result[]>([])

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
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

  function applyMap() {
    const parsed = parseRows(rawText, colMap)
    setRows(parsed)
    setStep('preview')
  }

  async function runImport() {
    const valid = rows.filter(r => r.valid)
    if (valid.length === 0) return
    setStep('importing')
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
        body: JSON.stringify({ items }),
      })
      const data = await res.json()
      if (data.results) allResults.push(...data.results)
      else if (data.error) allResults.push(...chunk.map(r => ({ success: false, name: r.name, error: data.error })))
      setProgress(Math.round(((i + chunk.length) / valid.length) * 100))
    }

    setResults(allResults)
    setStep('done')
    router.refresh()
  }

  const validCount = rows.filter(r => r.valid).length
  const invalidCount = rows.filter(r => !r.valid).length
  const succeeded = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  return (
    <div className="min-h-full">
      <div className="h-0.5 w-full bg-gradient-to-r from-[var(--qr)] via-[var(--qr-hover)] to-[var(--warn)]" />

      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-xs text-[var(--muted2)] mb-6">
          <Link href="/dashboard" className="hover:text-[var(--text)]">Dashboard</Link>
          <span>/</span>
          <span className="text-[var(--text)]">Migrate QR Codes</span>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-[var(--text)]">Migrate from Another Service</h1>
            <p className="text-xs text-[var(--muted2)] mt-0.5">Import QR codes from QRCodeChimp, QR Tiger, Beaconstac, or any CSV</p>
          </div>
          {step !== 'source' && step !== 'done' && (
            <button
              onClick={() => { setStep('source'); setRawText(''); setRows([]); setResults([]) }}
              className="text-xs text-[var(--muted2)] hover:text-[var(--text)] border border-[var(--border)] rounded-xl px-3 py-2 transition-colors"
            >
              Start Over
            </button>
          )}
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { id: 'source', label: 'Upload' },
            { id: 'map', label: 'Map Columns' },
            { id: 'preview', label: 'Preview' },
            { id: 'done', label: 'Complete' },
          ].map((s, i, arr) => {
            const stepOrder = ['source', 'map', 'preview', 'importing', 'done']
            const current = stepOrder.indexOf(step)
            const mine = stepOrder.indexOf(s.id)
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  current === mine ? 'text-white' : current > mine ? 'text-white opacity-60' : 'text-[var(--muted2)] border border-[var(--border)]'
                }`} style={{ background: current >= mine ? 'var(--qr)' : 'transparent' }}>
                  {i + 1}
                </div>
                <span className={`text-xs ${current === mine ? 'text-[var(--text)] font-semibold' : 'text-[var(--muted2)]'}`}>{s.label}</span>
                {i < arr.length - 1 && <span className="text-[var(--border)] mx-1">→</span>}
              </div>
            )
          })}
        </div>

        {/* Step: Upload */}
        {step === 'source' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {KNOWN_SOURCES.map(src => (
                <div key={src.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
                  <p className="text-sm font-semibold text-[var(--text)] mb-3">{src.label}</p>
                  {src.id === 'qrcodechimp' && (
                    <p className="text-[10px] text-[var(--muted2)] mb-2">Auto-detected</p>
                  )}
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
              <button type="button" className="rounded-xl px-4 py-2 text-sm font-bold text-white" style={{ background: 'var(--qr)' }}>
                Choose File
              </button>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="text-sm font-semibold text-[var(--text)] mb-2">How to export from QRCodeChimp</p>
              <ol className="text-xs text-[var(--muted2)] space-y-1.5 list-decimal list-inside">
                <li>Go to QRCodeChimp → My QR Codes</li>
                <li>Select all QR codes → Export → CSV</li>
                <li>Upload the downloaded file here</li>
                <li>Your short URLs are preserved — dynamic QRs keep tracking</li>
              </ol>
            </div>
          </div>
        )}

        {/* Step: Map columns */}
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
                {headers.map(h => (
                  <span key={h} className="text-[10px] px-2 py-1 rounded-lg bg-[var(--surface2)] text-[var(--muted2)]">{h}</span>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={applyMap}
                disabled={!colMap.name || !colMap.url}
                className="rounded-xl px-6 py-3 text-sm font-bold text-white disabled:opacity-50 transition-all hover:opacity-90"
                style={{ background: 'var(--qr)' }}
              >
                Preview Import
              </button>
            </div>
          </div>
        )}

        {/* Step: Preview */}
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
                <select
                  value={folderId}
                  onChange={e => setFolderId(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--qr)]"
                >
                  <option value="">No folder</option>
                  {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            )}

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              <div className="grid grid-cols-2 gap-0 border-b border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5">
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
                {rows.length > 50 && (
                  <div className="px-4 py-3 text-xs text-[var(--muted2)] text-center">+ {rows.length - 50} more rows</div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={runImport}
                disabled={validCount === 0}
                className="rounded-xl px-6 py-3 text-sm font-bold text-white disabled:opacity-50 transition-all hover:opacity-90"
                style={{ background: 'var(--qr)' }}
              >
                Import {validCount} QR Codes
              </button>
              <button
                onClick={() => setStep('map')}
                className="rounded-xl px-4 py-3 text-sm text-[var(--muted2)] hover:text-[var(--text)] border border-[var(--border)] transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Step: Importing */}
        {step === 'importing' && (
          <div className="rounded-2xl border border-[var(--qr)]/40 bg-[var(--surface)] p-8 text-center">
            <div className="text-4xl mb-4">⚡</div>
            <p className="text-base font-bold text-[var(--text)] mb-1">Importing your QR codes…</p>
            <p className="text-xs text-[var(--muted2)] mb-6">Don't close this tab</p>
            <div className="h-2 rounded-full bg-[var(--surface2)] overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%`, background: 'var(--qr)' }}
              />
            </div>
            <p className="text-sm font-bold" style={{ color: 'var(--qr)' }}>{progress}%</p>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
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

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="text-sm font-semibold text-[var(--text)] mb-2">What&apos;s next?</p>
              <ul className="text-xs text-[var(--muted2)] space-y-1.5 list-disc list-inside">
                <li>Your QR codes are dynamic — update URLs anytime without reprinting</li>
                <li>If you had custom domains in QRCodeChimp, point your CNAME to <code className="text-[var(--qr)]">cname.qrcodee.online</code></li>
                <li>Old QRCodeChimp short URLs will keep working while you transition</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Link
                href="/dashboard/qr"
                className="rounded-xl px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: 'var(--qr)' }}
              >
                View Imported QR Codes
              </Link>
              <button
                onClick={() => { setStep('source'); setRawText(''); setRows([]); setResults([]) }}
                className="rounded-xl px-4 py-3 text-sm text-[var(--muted2)] hover:text-[var(--text)] border border-[var(--border)] transition-colors"
              >
                Import Another File
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
