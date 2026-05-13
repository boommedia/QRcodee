import { createClient } from '@/lib/supabase/server'
import BulkClient from '@/components/qr/BulkClient'
import Link from 'next/link'
import { PLAN_LIMITS } from '@/types'

export default async function BulkPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', user.id)
    .single()

  const plan = (sub?.plan || 'free') as keyof typeof PLAN_LIMITS
  const limits = PLAN_LIMITS[plan]

  if (limits.bulk_batch === 0) {
    return (
      <div className="min-h-full">
        <div className="h-0.5 w-full bg-gradient-to-r from-[var(--qr)] via-[var(--qr-hover)] to-[var(--warn)]" />
        <div className="p-6 lg:p-8 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-[var(--muted2)] mb-6">
            <Link href="/dashboard" className="hover:text-[var(--text)]">Dashboard</Link>
            <span>/</span>
            <span className="text-[var(--text)]">Bulk Create</span>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
            <div className="text-5xl mb-4">⚡</div>
            <h1 className="text-xl font-bold text-[var(--text)] mb-2">Bulk QR Creation</h1>
            <p className="text-sm text-[var(--muted2)] mb-6 max-w-sm mx-auto">
              Create hundreds of QR codes at once from a spreadsheet. Available on Pro and Agency plans.
            </p>
            <Link
              href="/billing"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: 'var(--qr)' }}
            >
              Upgrade to Pro →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { data: folders } = await supabase
    .from('folders')
    .select('id, name, color')
    .eq('user_id', user.id)
    .order('name')

  return <BulkClient plan={plan} batchLimit={limits.bulk_batch} folders={folders || []} />
}
