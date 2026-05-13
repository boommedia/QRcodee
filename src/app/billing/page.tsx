import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BillingClient from '@/components/billing/BillingClient'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status, current_period_end, stripe_subscription_id, stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', user.id)
    .single()

  return (
    <BillingClient
      subscription={sub}
      email={profile?.email || user.email || ''}
      name={profile?.full_name || ''}
    />
  )
}
