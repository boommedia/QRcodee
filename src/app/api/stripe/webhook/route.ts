import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.STRIPE_STARTER_MONTHLY_PRICE_ID!]: 'starter',
  [process.env.STRIPE_STARTER_ANNUAL_PRICE_ID!]: 'starter',
  [process.env.STRIPE_PRO_MONTHLY_PRICE_ID!]: 'pro',
  [process.env.STRIPE_PRO_ANNUAL_PRICE_ID!]: 'pro',
  [process.env.STRIPE_AGENCY_MONTHLY_PRICE_ID!]: 'agency',
  [process.env.STRIPE_AGENCY_ANNUAL_PRICE_ID!]: 'agency',
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id
      if (!userId || !session.customer) break

      await supabase
        .from('subscriptions')
        .update({ stripe_customer_id: String(session.customer) })
        .eq('user_id', userId)
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.user_id
      if (!userId) break

      const priceId = sub.items.data[0]?.price.id
      const plan = PRICE_TO_PLAN[priceId] || 'free'

      await supabase
        .from('subscriptions')
        .update({
          plan,
          status: sub.status,
          stripe_subscription_id: sub.id,
          stripe_customer_id: String(sub.customer),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        })
        .eq('user_id', userId)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.user_id
      if (!userId) break

      await supabase
        .from('subscriptions')
        .update({ plan: 'free', status: 'inactive', stripe_subscription_id: null })
        .eq('user_id', userId)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = String(invoice.customer)

      await supabase
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('stripe_customer_id', customerId)
      break
    }
  }

  return NextResponse.json({ received: true })
}
