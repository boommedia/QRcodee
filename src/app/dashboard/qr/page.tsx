import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import QRListClient from '@/components/qr/QRListClient'

export default async function QRListPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string; search?: string; type?: string; status?: string }>
}) {
  const { folder, search, type, status } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  let query = supabase
    .from('qr_codes')
    .select('id, name, type, short_slug, scan_count, is_dynamic, is_paused, created_at, folder_id', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (folder) query = query.eq('folder_id', folder)
  if (search) query = query.ilike('name', `%${search}%`)
  if (type) query = query.eq('type', type)
  if (status === 'paused') query = query.eq('is_paused', true)
  if (status === 'active') query = query.eq('is_paused', false)

  const { data: qrCodes, count } = await query.limit(50)

  const { data: folders } = await supabase
    .from('folders')
    .select('id, name, color')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-full">
      <div className="h-0.5 w-full bg-gradient-to-r from-[var(--qr)] via-[var(--qr-hover)] to-[var(--warn)]" />
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-[var(--text)]">QR Codes</h1>
            <p className="text-xs text-[var(--muted2)] mt-0.5">{count || 0} total</p>
          </div>
          <Link
            href="/dashboard/qr/new"
            className="flex items-center gap-2 rounded-xl bg-[var(--qr)] hover:bg-[var(--qr-dim)] text-white text-sm font-semibold px-4 py-2.5 transition-all shadow-lg shadow-[var(--qr)]/20"
          >
            <span className="text-base leading-none">+</span>
            New QR Code
          </Link>
        </div>

        <QRListClient
          qrCodes={qrCodes || []}
          folders={folders || []}
          filters={{ folder, search, type, status }}
        />
      </div>
    </div>
  )
}
