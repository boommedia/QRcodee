import { createClient } from '@/lib/supabase/server'
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard'
import { PLAN_LIMITS, type PlanTier } from '@/types'

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ qr?: string; range?: string }>
}) {
  const { qr, range } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: sub }, { data: qrCodes }] = await Promise.all([
    supabase.from('subscriptions').select('plan').eq('user_id', user.id).single(),
    supabase.from('qr_codes').select('id, name, type').eq('user_id', user.id).order('name'),
  ])

  const plan = (sub?.plan || 'free') as PlanTier
  const maxDays = PLAN_LIMITS[plan].analytics_days

  return (
    <AnalyticsDashboard
      qrCodes={qrCodes || []}
      plan={plan}
      maxDays={maxDays}
      initialQR={qr}
      initialRange={range || '30'}
    />
  )
}
