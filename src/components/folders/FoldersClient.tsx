'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Folder = { id: string; name: string; color: string; created_at: string; qr_count: number }

const PRESET_COLORS = [
  '#0891b2', '#22d3ee', '#0e7490', '#06b6d4',
  '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#64748b', '#f97316', '#84cc16',
]

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {PRESET_COLORS.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
          style={{ background: c, borderColor: value === c ? '#fff' : 'transparent' }}
        />
      ))}
    </div>
  )
}

export default function FoldersClient({ folders: initial }: { folders: Folder[] }) {
  const router = useRouter()
  const [folders, setFolders] = useState(initial)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#0891b2')
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function createFolder() {
    if (!newName.trim()) return
    setSaving(true)
    const res = await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), color: newColor }),
    })
    const data = await res.json()
    if (data.folder) {
      setFolders(prev => [{ ...data.folder, qr_count: 0 }, ...prev])
      setNewName('')
      setNewColor('#0891b2')
      setCreating(false)
      router.refresh()
    }
    setSaving(false)
  }

  async function saveEdit(id: string) {
    setSaving(true)
    const res = await fetch(`/api/folders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim(), color: editColor }),
    })
    const data = await res.json()
    if (data.folder) {
      setFolders(prev => prev.map(f => f.id === id ? { ...f, name: data.folder.name, color: data.folder.color } : f))
      setEditId(null)
      router.refresh()
    }
    setSaving(false)
  }

  async function deleteFolder(id: string) {
    setDeleting(true)
    await fetch(`/api/folders/${id}`, { method: 'DELETE' })
    setFolders(prev => prev.filter(f => f.id !== id))
    setDeleteId(null)
    setDeleting(false)
    router.refresh()
  }

  function startEdit(f: Folder) {
    setEditId(f.id)
    setEditName(f.name)
    setEditColor(f.color)
  }

  return (
    <div className="min-h-full">
      <div className="h-0.5 w-full bg-gradient-to-r from-[var(--qr)] via-[var(--qr-hover)] to-[var(--warn)]" />

      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-[var(--muted2)] mb-1">
              <Link href="/dashboard" className="hover:text-[var(--text)]">Dashboard</Link>
              <span>/</span>
              <span className="text-[var(--text)]">Folders</span>
            </div>
            <h1 className="text-xl font-bold text-[var(--text)]">Folders</h1>
            <p className="text-xs text-[var(--muted2)] mt-0.5">Organize your QR codes into folders</p>
          </div>
          <button
            onClick={() => { setCreating(true); setEditId(null) }}
            className="rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'var(--qr)' }}
          >
            + New Folder
          </button>
        </div>

        {/* Create form */}
        {creating && (
          <div className="rounded-2xl border border-[var(--qr)]/40 bg-[var(--surface)] p-5 mb-5">
            <h2 className="text-sm font-semibold text-[var(--text)] mb-4">New Folder</h2>
            <div className="space-y-3">
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') createFolder(); if (e.key === 'Escape') setCreating(false) }}
                placeholder="Folder name…"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--qr)] focus:ring-1 focus:ring-[var(--qr)]/40"
              />
              <div>
                <p className="text-xs text-[var(--muted2)] mb-1">Color</p>
                <ColorPicker value={newColor} onChange={setNewColor} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={createFolder}
                disabled={saving || !newName.trim()}
                className="rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-50 transition-all"
                style={{ background: 'var(--qr)' }}
              >
                {saving ? 'Creating…' : 'Create'}
              </button>
              <button
                onClick={() => setCreating(false)}
                className="rounded-xl px-4 py-2 text-sm text-[var(--muted2)] hover:text-[var(--text)] border border-[var(--border)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Folders grid */}
        {folders.length === 0 && !creating ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-16 text-center">
            <div className="text-4xl mb-3">📁</div>
            <p className="text-sm font-medium text-[var(--text)] mb-1">No folders yet</p>
            <p className="text-xs text-[var(--muted2)] mb-4">Create folders to organize your QR codes</p>
            <button
              onClick={() => setCreating(true)}
              className="rounded-xl px-4 py-2 text-sm font-bold text-white"
              style={{ background: 'var(--qr)' }}
            >
              Create your first folder
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.map(folder => (
              <div
                key={folder.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden group"
              >
                {/* Color bar */}
                <div className="h-1.5" style={{ background: folder.color }} />

                <div className="p-5">
                  {editId === folder.id ? (
                    <div className="space-y-3">
                      <input
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(folder.id); if (e.key === 'Escape') setEditId(null) }}
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--qr)] focus:ring-1 focus:ring-[var(--qr)]/40"
                      />
                      <ColorPicker value={editColor} onChange={setEditColor} />
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => saveEdit(folder.id)}
                          disabled={saving || !editName.trim()}
                          className="rounded-lg px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                          style={{ background: 'var(--qr)' }}
                        >
                          {saving ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="rounded-lg px-3 py-1.5 text-xs text-[var(--muted2)] hover:text-[var(--text)] border border-[var(--border)]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: folder.color + '22' }}>
                            <span style={{ color: folder.color }}>📁</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--text)]">{folder.name}</p>
                            <p className="text-xs text-[var(--muted2)]">{folder.qr_count} QR {folder.qr_count === 1 ? 'code' : 'codes'}</p>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(folder)}
                            className="p-1.5 rounded-lg text-[var(--muted2)] hover:text-[var(--text)] hover:bg-[var(--surface2)] transition-colors"
                            title="Edit"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteId(folder.id)}
                            className="p-1.5 rounded-lg text-[var(--muted2)] hover:text-red-400 hover:bg-red-900/20 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <Link
                        href={`/dashboard?folder=${folder.id}`}
                        className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                        style={{ color: folder.color }}
                      >
                        View QR codes
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 max-w-sm w-full">
            <h3 className="text-base font-bold text-[var(--text)] mb-2">Delete folder?</h3>
            <p className="text-sm text-[var(--muted2)] mb-5">
              The folder will be deleted. QR codes inside will be moved to &quot;No folder&quot;.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => deleteFolder(deleteId)}
                disabled={deleting}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-xl py-2.5 text-sm text-[var(--muted2)] hover:text-[var(--text)] border border-[var(--border)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
