import { createClient } from '@/lib/supabase/server'
import ReportsClient from '@/components/reports/ReportsClient'
import Link from 'next/link'
import { PLAN_LIMITS } from '@/types'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: sub } = await supabase.from('subscriptions').select('plan').eq('user_id', user.id).single()
  const plan = (sub?.plan || 'free') as keyof typeof PLAN_LIMITS

  if (!PLAN_LIMITS[plan].client_reports) {
    return (
      <div className="min-h-full">
        <div className="h-0.5 w-full bg-gradient-to-r from-[var(--qr)] via-[var(--qr-hover)] to-[var(--warn)]" />
        <div className="p-6 lg:p-8 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-[var(--muted2)] mb-6">
            <Link href="/dashboard" className="hover:text-[var(--text)]">Dashboard</Link>
            <span>/</span>
            <span className="text-[var(--text)]">Client Reports</span>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
            <div className="text-5xl mb-4">📋</div>
            <h1 className="text-xl font-bold text-[var(--text)] mb-2">Client Reports</h1>
            <p className="text-sm text-[var(--muted2)] mb-6 max-w-sm mx-auto">
              Create branded, shareable analytics reports for your clients. Available on Agency plan.
            </p>
            <Link
              href="/billing"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: 'var(--qr)' }}
            >
              Upgrade to Agency →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const [{ data: reports }, { data: qrCodes }] = await Promise.all([
    supabase.from('client_reports').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('qr_codes').select('id, name, type, scan_count').eq('user_id', user.id).eq('is_paused', false).order('name'),
  ])

  return <ReportsClient reports={reports || []} qrCodes={qrCodes || []} />
}
