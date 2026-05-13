'use client'

import { useState } from 'react'
import Link from 'next/link'

type Sub = {
  plan: string
  status: string
  current_period_end?: string
  stripe_subscription_id?: string
  stripe_customer_id?: string
} | null

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    monthly: 0,
    annual: 0,
    color: 'var(--muted2)',
    features: ['3 QR codes', '7-day analytics', 'All QR types', 'Custom design'],
  },
  {
    id: 'starter',
    name: 'Starter',
    monthly: 19,
    annual: 15,
    color: 'var(--starter)',
    features: ['100 QR codes', '30-day analytics', '1 custom domain', 'Priority support'],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 49,
    annual: 39,
    color: 'var(--pro)',
    features: ['Unlimited QR codes', 'Full analytics history', 'Bulk creation (500)', 'AI suggestions', 'CSV export'],
    popular: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    monthly: 149,
    annual: 119,
    color: 'var(--agency)',
    features: ['Everything in Pro', 'White-label branding', 'Client reports', 'Unlimited domains', 'API access'],
  },
]

const PLAN_ORDER = ['free', 'starter', 'pro', 'agency']

export default function BillingClient({
  subscription,
  email,
  name,
}: {
  subscription: Sub
  email: string
  name: string
}) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)

  const currentPlan = subscription?.plan || 'free'
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing'

  async function handleUpgrade(planId: string) {
    if (planId === 'free') return
    setLoading(planId)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, interval: billing }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Something went wrong')
      setLoading(null)
    }
  }

  async function handlePortal() {
    setLoading('portal')
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Something went wrong')
      setLoading(null)
    }
  }

  const currentPlanData = PLANS.find(p => p.id === currentPlan)

  return (
    <div className="min-h-full">
      <div className="h-0.5 w-full bg-gradient-to-r from-[var(--qr)] via-[var(--qr-hover)] to-[var(--warn)]" />

      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-[var(--muted2)] mb-1">
              <Link href="/dashboard" className="hover:text-[var(--text)]">Dashboard</Link>
              <span>/</span>
              <span className="text-[var(--text)]">Billing</span>
            </div>
            <h1 className="text-xl font-bold text-[var(--text)]">Billing & Plans</h1>
          </div>
        </div>

        {/* Current plan card */}
        <div
          className="rounded-2xl border p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{
            borderColor: `${currentPlanData?.color || 'var(--border)'}30`,
            background: `${currentPlanData?.color || 'transparent'}08`,
          }}
        >
          <div>
            <p className="text-xs text-[var(--muted2)] mb-1">Current Plan</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-extrabold capitalize" style={{ color: currentPlanData?.color || 'var(--text)' }}>
                {currentPlan}
              </p>
              <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 border ${
                isActive
                  ? 'bg-green-900/20 text-green-400 border-green-700/30'
                  : 'bg-[var(--surface2)] text-[var(--muted2)] border-[var(--border)]'
              }`}>
                {subscription?.status || 'active'}
              </span>
            </div>
            {subscription?.current_period_end && currentPlan !== 'free' && (
              <p className="text-xs text-[var(--muted2)] mt-1">
                Renews {new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            )}
          </div>

          {currentPlan !== 'free' && subscription?.stripe_customer_id && (
            <button
              onClick={handlePortal}
              disabled={loading === 'portal'}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface2)] text-sm text-[var(--muted2)] hover:text-[var(--text)] px-5 py-2.5 transition-colors disabled:opacity-50"
            >
              {loading === 'portal' ? 'Loading…' : 'Manage Subscription →'}
            </button>
          )}
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1">
            <button
              onClick={() => setBilling('monthly')}
              className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${billing === 'monthly' ? 'bg-[var(--qr)] text-white' : 'text-[var(--muted2)] hover:text-[var(--text)]'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`rounded-lg px-5 py-2 text-sm font-medium transition-all flex items-center gap-2 ${billing === 'annual' ? 'bg-[var(--qr)] text-white' : 'text-[var(--muted2)] hover:text-[var(--text)]'}`}
            >
              Annual
              <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${billing === 'annual' ? 'bg-white/20' : 'bg-[var(--warn)]/20 text-[var(--warn)]'}`}>
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {PLANS.map(plan => {
            const isCurrent = plan.id === currentPlan
            const isDowngrade = PLAN_ORDER.indexOf(plan.id) < PLAN_ORDER.indexOf(currentPlan)
            const price = billing === 'annual' ? plan.annual : plan.monthly

            return (
              <div
                key={plan.id}
                className={`rounded-2xl border p-5 flex flex-col relative transition-all ${
                  isCurrent
                    ? 'border-[var(--qr)] shadow-lg shadow-[var(--qr)]/10'
                    : plan.popular
                    ? 'border-[var(--qr)]/40'
                    : 'border-[var(--border)] bg-[var(--surface)]'
                }`}
                style={isCurrent ? { background: 'rgba(8,145,178,0.05)' } : undefined}
              >
                {plan.popular && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--qr)]/10 border border-[var(--qr)]/30 text-[var(--qr)] text-[9px] font-bold px-3 py-1 whitespace-nowrap">
                    MOST POPULAR
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--qr)] text-white text-[9px] font-bold px-3 py-1 whitespace-nowrap">
                    CURRENT PLAN
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: plan.color }}>{plan.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-[var(--text)]">
                      {price === 0 ? 'Free' : `$${price}`}
                    </span>
                    {price > 0 && <span className="text-xs text-[var(--muted2)]">/mo</span>}
                  </div>
                  {billing === 'annual' && price > 0 && (
                    <p className="text-[10px] text-[var(--muted2)] mt-0.5">
                      ${plan.annual * 12}/yr · save ${(plan.monthly - plan.annual) * 12}
                    </p>
                  )}
                </div>

                <ul className="space-y-2 flex-1 mb-5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-[var(--muted2)]">
                      <span className="shrink-0 mt-0.5" style={{ color: plan.color }}>✓</span>{f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="rounded-xl border border-[var(--qr)]/30 text-center py-2 text-xs font-semibold text-[var(--qr)]">
                    Current Plan
                  </div>
                ) : plan.id === 'free' ? (
                  <div className="rounded-xl border border-[var(--border)] text-center py-2 text-xs text-[var(--muted2)]">
                    Always free
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loading === plan.id}
                    className={`rounded-xl py-2.5 text-sm font-bold transition-all disabled:opacity-50 ${
                      isDowngrade
                        ? 'border border-[var(--border)] text-[var(--muted2)] hover:border-[var(--qr)] hover:text-[var(--qr)]'
                        : 'bg-[var(--qr)] hover:bg-[var(--qr-dim)] text-white shadow-md shadow-[var(--qr)]/20'
                    }`}
                  >
                    {loading === plan.id
                      ? 'Redirecting…'
                      : isDowngrade
                      ? 'Downgrade'
                      : 'Upgrade →'}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* FAQ */}
        <div className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-4">Billing FAQ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { q: 'Can I cancel anytime?', a: 'Yes. Cancel from the customer portal and your plan stays active until the billing period ends.' },
              { q: 'What happens to my QR codes if I downgrade?', a: 'Existing QR codes keep working. You just cannot create new ones above the plan limit.' },
              { q: 'Do you charge per scan?', a: 'Never. Flat monthly pricing only. Scan as much as you want.' },
              { q: 'Can I switch between monthly and annual?', a: 'Yes. Change anytime in the customer portal. Annual saves 20%.' },
            ].map(({ q, a }) => (
              <div key={q}>
                <p className="text-xs font-semibold text-[var(--text)] mb-1">{q}</p>
                <p className="text-xs text-[var(--muted2)] leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
