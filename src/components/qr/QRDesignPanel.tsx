'use client'

import { useRef } from 'react'
import type { QRDesignConfig } from '@/types'

const COLOR_PRESETS: Array<{ fg: string; bg: string; corner?: string }> = [
  { fg: '#000000', bg: '#ffffff' },
  { fg: '#1e293b', bg: '#ffffff', corner: '#ef4444' },
  { fg: '#7c3aed', bg: '#ffffff', corner: '#3b82f6' },
  { fg: '#0891b2', bg: '#ffffff', corner: '#1e40af' },
  { fg: '#16a34a', bg: '#ffffff', corner: '#15803d' },
  { fg: '#ec4899', bg: '#ffffff', corner: '#7c3aed' },
  { fg: '#dc2626', bg: '#ffffff', corner: '#9f1239' },
  { fg: '#f59e0b', bg: '#ffffff', corner: '#b45309' },
  { fg: '#0f172a', bg: '#f1f5f9', corner: '#0ea5e9' },
  { fg: '#1e40af', bg: '#eff6ff', corner: '#1e3a8a' },
  { fg: '#047857', bg: '#f0fdf4', corner: '#065f46' },
  { fg: '#9333ea', bg: '#faf5ff', corner: '#7e22ce' },
]

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-[var(--muted2)] uppercase tracking-wide mb-1.5">{label}</label>
      <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-3 py-2">
        <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-[var(--border)] shrink-0">
          <input type="color" value={value} onChange={e => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full cursor-pointer opacity-0" />
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

export default function QRDesignPanel({
  design, onChange,
}: {
  design: QRDesignConfig
  onChange: (d: QRDesignConfig) => void
}) {
  const logoRef = useRef<HTMLInputElement>(null)
  const set = (patch: Partial<QRDesignConfig>) => onChange({ ...design, ...patch })

  function handleLogoFile(file: File) {
    if (file.size > 200 * 1024) { alert('Logo must be under 200KB'); return }
    const reader = new FileReader()
    reader.onload = e => set({ logo_url: e.target?.result as string })
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-5">

      {/* ── Color Presets ── */}
      <div>
        <label className="block text-[10px] font-semibold text-[var(--muted2)] uppercase tracking-wide mb-2">Presets</label>
        <div className="grid grid-cols-6 gap-2">
          {COLOR_PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => set({ foreground_color: p.fg, background_color: p.bg, corner_color: p.corner })}
              title={`${p.fg} / ${p.corner || 'same'}`}
              className="w-10 h-10 rounded-full border-2 border-[var(--border)] hover:border-[var(--qr)] overflow-hidden transition-all hover:scale-110 relative"
            >
              <div className="absolute inset-0" style={{ background: p.bg }} />
              <div className="absolute top-0 left-0 w-1/2 h-full" style={{ background: p.fg }} />
              <div className="absolute top-0 right-0 w-1/2 h-full" style={{ background: p.corner || p.fg }} />
            </button>
          ))}
        </div>
        <p className="text-[9px] text-[var(--muted2)] mt-1.5">Left = dot color · Right = corner color</p>
      </div>

      {/* ── QR Color + Gradient ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] font-semibold text-[var(--muted2)] uppercase tracking-wide">QR Color</label>
          <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface2)] p-0.5">
            <button
              onClick={() => set({ dot_gradient_enabled: false })}
              className={`rounded px-2.5 py-1 text-[10px] font-medium transition-all ${!design.dot_gradient_enabled ? 'bg-[var(--qr)] text-white' : 'text-[var(--muted2)]'}`}
            >Solid</button>
            <button
              onClick={() => set({ dot_gradient_enabled: true, dot_gradient_end_color: design.dot_gradient_end_color || '#000000' })}
              className={`rounded px-2.5 py-1 text-[10px] font-medium transition-all ${design.dot_gradient_enabled ? 'bg-[var(--qr)] text-white' : 'text-[var(--muted2)]'}`}
            >Gradient</button>
          </div>
        </div>

        {design.dot_gradient_enabled ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <ColorPicker label="Start Color" value={design.foreground_color} onChange={v => set({ foreground_color: v })} />
              <ColorPicker label="End Color" value={design.dot_gradient_end_color || '#000000'} onChange={v => set({ dot_gradient_end_color: v })} />
            </div>
            <div className="flex gap-2">
              {(['linear', 'radial'] as const).map(t => (
                <button key={t} onClick={() => set({ dot_gradient_type: t })}
                  className={`flex-1 rounded-lg border py-1.5 text-xs capitalize transition-all ${(design.dot_gradient_type || 'linear') === t ? 'border-[var(--qr)] bg-[var(--qr)]/10 text-[var(--qr)]' : 'border-[var(--border)] text-[var(--muted2)]'}`}>
                  {t}
                </button>
              ))}
            </div>
            <ColorPicker label="Background" value={design.background_color} onChange={v => set({ background_color: v })} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <ColorPicker label="QR Color" value={design.foreground_color} onChange={v => set({ foreground_color: v })} />
            <ColorPicker label="Background" value={design.background_color} onChange={v => set({ background_color: v })} />
          </div>
        )}
      </div>

      {/* ── Corner Accent Color ── */}
      <div>
        <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5 mb-2">
          <span className="text-xs text-[var(--muted2)]">Custom corner (eye) color</span>
          <button
            onClick={() => set({ corner_color: design.corner_color ? undefined : design.foreground_color })}
            className={`w-9 h-5 rounded-full transition-all relative ${design.corner_color ? 'bg-[var(--qr)]' : 'bg-[var(--border)]'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${design.corner_color ? 'left-4' : 'left-0.5'}`} />
          </button>
        </div>
        {design.corner_color && (
          <ColorPicker label="Corner Color" value={design.corner_color} onChange={v => set({ corner_color: v })} />
        )}
      </div>

      {/* ── Logo ── */}
      <div>
        <label className="block text-[10px] font-semibold text-[var(--muted2)] uppercase tracking-wide mb-2">Center Logo</label>
        {design.logo_url ? (
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface2)] p-3">
            <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center overflow-hidden shrink-0 border border-[var(--border)]">
              <img src={design.logo_url} alt="logo" className="max-w-full max-h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="mb-2">
                <label className="text-[10px] text-[var(--muted2)]">Size: {design.logo_size || 30}%</label>
                <input type="range" min={10} max={80} value={design.logo_size || 30}
                  onChange={e => set({ logo_size: Number(e.target.value) })}
                  className="w-full accent-[var(--qr)]" />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-[10px] text-[var(--muted2)] cursor-pointer">
                  <input type="checkbox" checked={design.logo_hide_background !== false}
                    onChange={e => set({ logo_hide_background: e.target.checked })}
                    className="rounded" />
                  White background
                </label>
                <button onClick={() => set({ logo_url: undefined })} className="text-[10px] text-red-400 hover:text-red-300">Remove</button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden"
              onChange={e => { if (e.target.files?.[0]) handleLogoFile(e.target.files[0]) }} />
            <button
              onClick={() => logoRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--qr)] py-4 text-xs text-[var(--muted2)] hover:text-[var(--qr)] transition-all"
            >
              + Upload logo (PNG, SVG — max 200KB)
            </button>
            <p className="text-[9px] text-[var(--muted2)] mt-1">Use H error correction when adding a logo</p>
          </div>
        )}
      </div>

      {/* ── Dot Style ── */}
      <div>
        <label className="block text-[10px] font-semibold text-[var(--muted2)] uppercase tracking-wide mb-2">Dot Style</label>
        <div className="grid grid-cols-3 gap-2">
          {(['square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded'] as const).map(style => (
            <button key={style} onClick={() => set({ dot_style: style })}
              className={`rounded-lg border px-2 py-1.5 text-xs capitalize transition-all ${design.dot_style === style ? 'border-[var(--qr)] bg-[var(--qr)]/10 text-[var(--qr)]' : 'border-[var(--border)] text-[var(--muted2)] hover:border-[var(--qr)]/40'}`}>
              {style.replace(/-/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ── Corner Styles ── */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-semibold text-[var(--muted2)] uppercase tracking-wide mb-2">Corner Square</label>
          <div className="flex gap-1.5">
            {(['square', 'dot', 'extra-rounded'] as const).map(style => (
              <button key={style} onClick={() => set({ corner_square_style: style })}
                className={`flex-1 rounded-lg border py-1.5 text-[10px] capitalize transition-all ${design.corner_square_style === style ? 'border-[var(--qr)] bg-[var(--qr)]/10 text-[var(--qr)]' : 'border-[var(--border)] text-[var(--muted2)] hover:border-[var(--qr)]/40'}`}>
                {style.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-[var(--muted2)] uppercase tracking-wide mb-2">Corner Dot</label>
          <div className="flex gap-1.5">
            {(['square', 'dot'] as const).map(style => (
              <button key={style} onClick={() => set({ corner_dot_style: style })}
                className={`flex-1 rounded-lg border py-1.5 text-xs capitalize transition-all ${design.corner_dot_style === style ? 'border-[var(--qr)] bg-[var(--qr)]/10 text-[var(--qr)]' : 'border-[var(--border)] text-[var(--muted2)] hover:border-[var(--qr)]/40'}`}>
                {style}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Error Correction ── */}
      <div>
        <label className="block text-[10px] font-semibold text-[var(--muted2)] uppercase tracking-wide mb-2">Error Correction</label>
        <div className="flex gap-2">
          {([{ v: 'L', label: 'Low 7%' }, { v: 'M', label: 'Med 15%' }, { v: 'Q', label: 'High 25%' }, { v: 'H', label: 'Max 30%' }] as const).map(({ v, label }) => (
            <button key={v} onClick={() => set({ error_correction: v })}
              className={`flex-1 rounded-lg border py-1.5 text-[10px] transition-all ${design.error_correction === v ? 'border-[var(--qr)] bg-[var(--qr)]/10 text-[var(--qr)]' : 'border-[var(--border)] text-[var(--muted2)] hover:border-[var(--qr)]/40'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
