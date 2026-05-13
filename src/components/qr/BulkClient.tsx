'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { QR_TYPES, type Phase1QRType } from '@/lib/qr/types'

type Folder = { id: string; name: string; color: string }
type Row = { type: Phase1QRType; name: string; url: string; _error?: string }
type Result = { success: boolean; name: string; id?: string; error?: string }

const CSV_TEMPLATE = `name,type,url
My Website,url,https://example.com
Contact Page,url,https://example.com/contact
Product A,url,https://example.com/products/a`

function parseCSV(text: string): Row[] {
  const lines = text.trim().split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const header = lines[0].toLowerCase().split(',').map(h => h.trim())
  const nameIdx = header.indexOf('name')
  const typeIdx = header.indexOf('type')
  const urlIdx = header.indexOf('url')

  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    const name = nameIdx >= 0 ? cols[nameIdx] || '' : cols[0] || ''
    const type = (typeIdx >= 0 ? cols[typeIdx] : 'url') as Phase1QRType
    const url = urlIdx >= 0 ? cols[urlIdx] || '' : cols[typeIdx >= 0 ? 2 : 1] || ''
    const validType = QR_TYPES[type] ? type : 'url'
    return { name, type: validType, url }
  }).filter(r => r.name && r.url)
}

export default function BulkClient({ plan, batchLimit, folders }: {
  plan: string
  batchLimit: number
  folders: Folder[]
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [folderId, setFolderId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<Result[] | null>(null)
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const parsed = parseCSV(text)
      setRows(parsed.slice(0, batchLimit === Infinity ? 10000 : batchLimit))
      setStep('preview')
    }
    reader.readAsText(file)
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'qrcodee-bulk-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function runImport() {
    if (rows.length === 0) return
    setSubmitting(true)
    setProgress(0)

    const BATCH = 50
    const allResults: Result[] = []

    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH)
      const items = chunk.map(r => ({
        type: r.type,
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
      setProgress(Math.round(((i + chunk.length) / rows.length) * 100))
    }

    setResults(allResults)
    setStep('done')
    setSubmitting(false)
    router.refresh()
  }

  const succeeded = results?.filter(r => r.success).length ?? 0
  const failed = results?.filter(r => !r.success).length ?? 0

  return (
    <div className="min-h-full">
      <div className="h-0.5 w-full bg-gradient-to-r from-[var(--qr)] via-[var(--qr-hover)] to-[var(--warn)]" />

      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 text-xs text-[var(--muted2)] mb-6">
          <Link href="/dashboard" className="hover:text-[var(--text)]">Dashboard</Link>
          <span>/</span>
          <span className="text-[var(--text)]">Bulk Create</span>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-[var(--text)]">Bulk QR Creation</h1>
            <p className="text-xs text-[var(--muted2)] mt-0.5">
              {batchLimit === Infinity ? 'Unlimited' : batchLimit.toLocaleString()} QR codes per batch · {plan} plan
            </p>
          </div>
          {step !== 'upload' && (
            <button
              onClick={() => { setStep('upload'); setRows([]); setResults(null) }}
              className="text-xs text-[var(--muted2)] hover:text-[var(--text)] border border-[var(--border)] rounded-xl px-3 py-2 transition-colors"
            >
              Start Over
            </button>
          )}
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8">
          {(['upload', 'preview', 'done'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s ? 'text-white' : (
                  ['upload', 'preview', 'done'].indexOf(step) > i
                    ? 'text-white opacity-60'
                    : 'text-[var(--muted2)] border border-[var(--border)]'
                )
              }`} style={{ background: step === s || ['upload','preview','done'].indexOf(step) > i ? 'var(--qr)' : 'transparent' }}>
                {i + 1}
              </div>
              <span className={`text-xs ${step === s ? 'text-[var(--text)] font-semibold' : 'text-[var(--muted2)]'}`}>
                {s === 'upload' ? 'Upload CSV' : s === 'preview' ? 'Preview' : 'Complete'}
              </span>
              {i < 2 && <span className="text-[var(--border)] mx-1">→</span>}
            </div>
          ))}
        </div>

        {/* Upload step */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              className="rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-[var(--qr)] p-12 text-center cursor-pointer transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault()
                const file = e.dataTransfer.files[0]
                if (file) handleFile(file)
              }}
            >
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
              <div className="text-4xl mb-3">📤</div>
              <p className="text-sm font-semibold text-[var(--text)] mb-1">Drop your CSV here</p>
              <p className="text-xs text-[var(--muted2)] mb-4">or click to browse · .csv files only</p>
              <button
                type="button"
                className="rounded-xl px-4 py-2 text-sm font-bold text-white"
                style={{ background: 'var(--qr)' }}
              >
                Browse File
              </button>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-[var(--text)]">CSV Format</p>
                <button
                  onClick={downloadTemplate}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--muted2)] hover:text-[var(--text)] transition-colors"
                >
                  Download Template
                </button>
              </div>
              <pre className="text-xs text-[var(--muted2)] bg-[var(--surface2)] rounded-xl p-4 overflow-x-auto">
{`name,type,url
My Website,url,https://example.com
My vCard,vcard,https://example.com/contact`}
              </pre>
              <p className="text-[10px] text-[var(--muted2)] mt-2">
                Supported types: {Object.keys(QR_TYPES).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Preview step */}
        {step === 'preview' && rows.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--muted2)]">
                <span className="font-semibold text-[var(--text)]">{rows.length}</span> QR codes ready to create
              </p>
              {folders.length > 0 && (
                <select
                  value={folderId}
                  onChange={e => setFolderId(e.target.value)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--qr)]"
                >
                  <option value="">No folder</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              <div className="grid grid-cols-3 gap-0 border-b border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5">
                <span className="text-[10px] font-semibold text-[var(--muted2)] uppercase tracking-wide">Name</span>
                <span className="text-[10px] font-semibold text-[var(--muted2)] uppercase tracking-wide">Type</span>
                <span className="text-[10px] font-semibold text-[var(--muted2)] uppercase tracking-wide">URL / Data</span>
              </div>
              <div className="divide-y divide-[var(--border)] max-h-96 overflow-y-auto">
                {rows.slice(0, 100).map((row, i) => (
                  <div key={i} className="grid grid-cols-3 gap-0 px-4 py-3">
                    <span className="text-xs text-[var(--text)] truncate pr-2">{row.name}</span>
                    <span className="text-xs text-[var(--muted2)]">{row.type}</span>
                    <span className="text-xs text-[var(--muted2)] truncate">{row.url}</span>
                  </div>
                ))}
                {rows.length > 100 && (
                  <div className="px-4 py-3 text-xs text-[var(--muted2)] text-center">
                    + {rows.length - 100} more rows
                  </div>
                )}
              </div>
            </div>

            {submitting && (
              <div className="rounded-2xl border border-[var(--qr)]/40 bg-[var(--surface)] p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-[var(--text)]">Creating QR codes…</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--qr)' }}>{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--surface2)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%`, background: 'var(--qr)' }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={runImport}
                disabled={submitting}
                className="rounded-xl px-6 py-3 text-sm font-bold text-white disabled:opacity-50 transition-all hover:opacity-90"
                style={{ background: 'var(--qr)' }}
              >
                {submitting ? `Creating… ${progress}%` : `Create ${rows.length} QR Codes`}
              </button>
              <button
                onClick={() => setStep('upload')}
                disabled={submitting}
                className="rounded-xl px-4 py-3 text-sm text-[var(--muted2)] hover:text-[var(--text)] border border-[var(--border)] transition-colors disabled:opacity-50"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Done step */}
        {step === 'done' && results && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-green-700/30 bg-green-900/10 p-6 text-center">
                <p className="text-3xl font-black text-green-400 mb-1">{succeeded}</p>
                <p className="text-xs text-[var(--muted2)]">Created successfully</p>
              </div>
              <div className={`rounded-2xl border p-6 text-center ${failed > 0 ? 'border-red-700/30 bg-red-900/10' : 'border-[var(--border)] bg-[var(--surface)]'}`}>
                <p className={`text-3xl font-black mb-1 ${failed > 0 ? 'text-red-400' : 'text-[var(--muted2)]'}`}>{failed}</p>
                <p className="text-xs text-[var(--muted2)]">Failed</p>
              </div>
            </div>

            {failed > 0 && (
              <div className="rounded-2xl border border-red-700/30 bg-red-900/5 p-4">
                <p className="text-xs font-semibold text-red-400 mb-2">Failed items:</p>
                <div className="space-y-1">
                  {results.filter(r => !r.success).map((r, i) => (
                    <div key={i} className="text-xs text-[var(--muted2)] flex gap-2">
                      <span className="text-red-400">✗</span>
                      <span className="font-medium">{r.name}</span>
                      <span>— {r.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Link
                href="/dashboard/qr"
                className="rounded-xl px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: 'var(--qr)' }}
              >
                View All QR Codes
              </Link>
              <button
                onClick={() => { setStep('upload'); setRows([]); setResults(null) }}
                className="rounded-xl px-4 py-3 text-sm text-[var(--muted2)] hover:text-[var(--text)] border border-[var(--border)] transition-colors"
              >
                Create Another Batch
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
