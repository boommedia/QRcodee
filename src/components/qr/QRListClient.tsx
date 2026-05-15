'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

type QRItem = {
  id: string
  name: string
  type: string
  short_slug: string
  scan_count: number
  is_dynamic: boolean
  is_paused: boolean
  created_at: string
  folder_id: string | null
}

type Folder = { id: string; name: string; color: string }

const TYPE_COLORS: Record<string, string> = {
  url: '#38bdf8', text: '#9ca3af', phone: '#34D399', sms: '#a78bfa',
  email: '#fb923c', whatsapp: '#25D366', wifi: '#fbbf24', vcard: '#34D399',
  social: '#f472b6', app_store: '#818cf8', event: '#fbbf24',
}

export default function QRListClient({
  qrCodes,
  folders,
  filters,
}: {
  qrCodes: QRItem[]
  folders: Folder[]
  filters: { folder?: string; search?: string; type?: string; status?: string }
}) {
  const router = useRouter()
  const [search, setSearch] = useState(filters.search || '')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const folderMap: Record<string, Folder> = {}
  folders.forEach(f => { folderMap[f.id] = f })

  function applyFilter(key: string, val: string) {
    const params = new URLSearchParams()
    if (filters.folder) params.set('folder', filters.folder)
    if (filters.type) params.set('type', filters.type)
    if (filters.status) params.set('status', filters.status)
    if (search) params.set('search', search)
    if (val) params.set(key, val)
    else params.delete(key)
    startTransition(() => router.push(`/dashboard/qr?${params.toString()}`))
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    applyFilter('search', search)
  }

  function toggleSelect(id: string) {
    setSelected(s => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  async function bulkPause(paused: boolean) {
    await Promise.all([...selected].map(id =>
      fetch(`/api/qr/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_paused: paused }) })
    ))
    setSelected(new Set())
    router.refresh()
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selected.size} QR code(s)? This cannot be undone.`)) return
    await Promise.all([...selected].map(id => fetch(`/api/qr/${id}`, { method: 'DELETE' })))
    setSelected(new Set())
    router.refresh()
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <form onSubmit={handleSearch} className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
          <svg className="w-3.5 h-3.5 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="bg-transparent text-xs text-[var(--text)] placeholder:text-[var(--muted)] outline-none w-40"
          />
        </form>

        <select
          value={filters.status || ''}
          onChange={e => applyFilter('status', e.target.value)}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--muted2)] px-3 py-2 outline-none cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
        </select>

        <select
          value={filters.type || ''}
          onChange={e => applyFilter('type', e.target.value)}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--muted2)] px-3 py-2 outline-none cursor-pointer"
        >
          <option value="">All Types</option>
          {['url', 'text', 'phone', 'sms', 'email', 'whatsapp', 'wifi', 'vcard', 'social', 'app_store', 'event'].map(t => (
            <option key={t} value={t}>{t.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}</option>
          ))}
        </select>

        {folders.length > 0 && (
          <select
            value={filters.folder || ''}
            onChange={e => applyFilter('folder', e.target.value)}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--muted2)] px-3 py-2 outline-none cursor-pointer"
          >
            <option value="">All Folders</option>
            {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        )}

        {/* View toggle */}
        <div className="ml-auto flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1">
          <button
            onClick={() => setView('grid')}
            className={`rounded-lg px-3 py-1.5 text-xs transition-all ${view === 'grid' ? 'bg-[var(--qr)] text-white' : 'text-[var(--muted2)] hover:text-[var(--text)]'}`}
          >
            Grid
          </button>
          <button
            onClick={() => setView('table')}
            className={`rounded-lg px-3 py-1.5 text-xs transition-all ${view === 'table' ? 'bg-[var(--qr)] text-white' : 'text-[var(--muted2)] hover:text-[var(--text)]'}`}
          >
            Table
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--qr)]/30 bg-[var(--qr)]/5 px-4 py-3 mb-5">
          <span className="text-xs font-semibold text-[var(--qr)]">{selected.size} selected</span>
          <button onClick={() => bulkPause(true)} className="text-xs text-[var(--muted2)] hover:text-[var(--text)] border border-[var(--border)] rounded-lg px-3 py-1.5 transition-colors">
            Pause all
          </button>
          <button onClick={() => bulkPause(false)} className="text-xs text-[var(--muted2)] hover:text-[var(--text)] border border-[var(--border)] rounded-lg px-3 py-1.5 transition-colors">
            Resume all
          </button>
          <button onClick={bulkDelete} className="text-xs text-red-400 border border-red-800/40 rounded-lg px-3 py-1.5 hover:bg-red-900/10 transition-colors">
            Delete all
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-[var(--muted2)] hover:text-[var(--text)]">
            Clear
          </button>
        </div>
      )}

      {/* Empty */}
      {qrCodes.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-[var(--border2)] py-16 text-center">
          <p className="text-[var(--muted2)] text-sm mb-4">No QR codes found</p>
          <Link
            href="/dashboard/qr/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--qr)] hover:bg-[var(--qr-dim)] text-white text-sm font-semibold px-5 py-2.5 transition-colors"
          >
            + Create QR Code
          </Link>
        </div>
      )}

      {/* Grid view */}
      {view === 'grid' && qrCodes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {qrCodes.map(qr => {
            const accent = TYPE_COLORS[qr.type] || '#38bdf8'
            const isSelected = selected.has(qr.id)
            const folder = qr.folder_id ? folderMap[qr.folder_id] : null
            return (
              <div
                key={qr.id}
                className={`group relative rounded-2xl border bg-[var(--surface)] transition-all duration-200 overflow-hidden cursor-pointer flex flex-col ${isSelected ? 'border-[var(--qr)] ring-1 ring-[var(--qr)]/30' : 'border-[var(--border)] hover:border-[var(--qr)]'}`}
                onClick={() => toggleSelect(qr.id)}
              >
                <div className="h-0.5 w-full shrink-0" style={{ background: accent }} />
                <div className="p-4 flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className="text-[9px] font-bold rounded-full px-2 py-0.5 uppercase tracking-widest"
                      style={{ background: `${accent}18`, color: accent }}
                    >
                      {qr.type.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {qr.is_dynamic && (
                        <span className={`w-1.5 h-1.5 rounded-full ${qr.is_paused ? 'bg-yellow-400' : 'bg-[var(--qr)] animate-pulse'}`} />
                      )}
                      {isSelected && (
                        <div className="w-4 h-4 rounded bg-[var(--qr)] flex items-center justify-center text-white text-[8px] font-bold">✓</div>
                      )}
                    </div>
                  </div>
                  <p className="font-semibold text-sm text-[var(--text)] truncate mb-1">{qr.name}</p>
                  <p className="text-[10px] text-[var(--muted2)] truncate mb-3 font-mono">/r/{qr.short_slug}</p>
                  {folder && (
                    <div className="flex items-center gap-1 mb-3">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: folder.color }} />
                      <span className="text-[10px] text-[var(--muted2)]">{folder.name}</span>
                    </div>
                  )}
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xl font-bold text-[var(--text)]">{(qr.scan_count || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-[var(--muted2)]">scans</p>
                    </div>
                    {qr.is_paused && (
                      <span className="text-[9px] font-semibold bg-yellow-900/20 text-yellow-400 border border-yellow-700/30 rounded-full px-2 py-0.5">
                        Paused
                      </span>
                    )}
                  </div>
                </div>
                <div className="border-t border-[var(--border)] bg-[var(--surface2)] px-4 py-2 flex items-center justify-between">
                  <Link href={`/dashboard/qr/${qr.id}`} onClick={e => e.stopPropagation()} className="text-[10px] text-[var(--qr)] hover:text-[var(--qr-hover)] font-medium">Edit</Link>
                  <Link href={`/dashboard/analytics?qr=${qr.id}`} onClick={e => e.stopPropagation()} className="text-[10px] text-[var(--muted2)] hover:text-[var(--text)]">Analytics</Link>
                  <Link href={`/dashboard/qr/${qr.id}/download`} onClick={e => e.stopPropagation()} className="text-[10px] text-[var(--muted2)] hover:text-[var(--text)]">Download</Link>
                </div>
              </div>
            )
          })}
          <Link
            href="/dashboard/qr/new"
            className="rounded-2xl border-2 border-dashed border-[var(--border2)] hover:border-[var(--qr)] flex flex-col items-center justify-center gap-2 py-10 transition-all group"
          >
            <span className="w-10 h-10 rounded-xl bg-[var(--qr)]/10 group-hover:bg-[var(--qr)]/20 flex items-center justify-center text-[var(--qr)] text-xl font-bold transition-colors">+</span>
            <span className="text-xs font-medium text-[var(--muted2)] group-hover:text-[var(--qr)] transition-colors">New QR Code</span>
          </Link>
        </div>
      )}

      {/* Table view */}
      {view === 'table' && qrCodes.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-[var(--border)] bg-[var(--surface2)]">
              <tr>
                <th className="px-4 py-3 text-left w-8">
                  <input type="checkbox" onChange={e => {
                    if (e.target.checked) setSelected(new Set(qrCodes.map(q => q.id)))
                    else setSelected(new Set())
                  }} className="rounded" />
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold text-[var(--muted2)] uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold text-[var(--muted2)] uppercase tracking-wide">Type</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold text-[var(--muted2)] uppercase tracking-wide">Scans</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold text-[var(--muted2)] uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold text-[var(--muted2)] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {qrCodes.map(qr => {
                const accent = TYPE_COLORS[qr.type] || '#38bdf8'
                return (
                  <tr key={qr.id} className="bg-[var(--surface)] hover:bg-[var(--surface2)] transition-colors">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(qr.id)} onChange={() => toggleSelect(qr.id)} className="rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-[var(--text)]">{qr.name}</p>
                      <p className="text-[10px] font-mono text-[var(--muted2)]">/r/{qr.short_slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[9px] font-bold rounded-full px-2 py-0.5 uppercase tracking-wide" style={{ background: `${accent}18`, color: accent }}>
                        {qr.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-sm text-[var(--text)]">{qr.scan_count || 0}</td>
                    <td className="px-4 py-3">
                      {qr.is_paused
                        ? <span className="text-[9px] font-semibold bg-yellow-900/20 text-yellow-400 border border-yellow-700/30 rounded-full px-2 py-0.5">Paused</span>
                        : <span className="text-[9px] font-semibold bg-green-900/20 text-green-400 border border-green-700/30 rounded-full px-2 py-0.5">Active</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link href={`/dashboard/qr/${qr.id}`} className="text-xs text-[var(--qr)] hover:text-[var(--qr-hover)]">Edit</Link>
                        <Link href={`/dashboard/analytics?qr=${qr.id}`} className="text-xs text-[var(--muted2)] hover:text-[var(--text)]">Analytics</Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
