import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { PLAN_LIMITS, type PlanTier } from '@/types'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const qrId = searchParams.get('qr_id')
  const range = searchParams.get('range') || '30'

  // Enforce analytics_days plan limit
  const { data: sub } = await supabase
    .from('subscriptions').select('plan').eq('user_id', user.id).single()
  const plan = (sub?.plan || 'free') as PlanTier
  const maxDays = PLAN_LIMITS[plan].analytics_days
  const days = maxDays === Infinity ? parseInt(range) : Math.min(parseInt(range), maxDays)

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  // Get user's QR code IDs
  let qrQuery = supabase.from('qr_codes').select('id, name, type, short_slug').eq('user_id', user.id)
  if (qrId) qrQuery = qrQuery.eq('id', qrId)
  const { data: qrCodes } = await qrQuery

  if (!qrCodes?.length) {
    return NextResponse.json({ scans: [], totals: {}, qrCodes: [] })
  }

  const qrIds = qrCodes.map(q => q.id)

  // Fetch all scans in range
  const { data: scans } = await supabase
    .from('scans')
    .select('id, scanned_at, country, device, os, browser, qr_id')
    .in('qr_id', qrIds)
    .gte('scanned_at', since)
    .order('scanned_at', { ascending: true })

  if (!scans?.length) {
    return NextResponse.json({ scans: [], totals: {}, qrCodes, plan, days })
  }

  // ── Aggregate by day ─────────────────────────────────────
  const byDay: Record<string, number> = {}
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000)
    byDay[d.toISOString().slice(0, 10)] = 0
  }
  scans.forEach(s => {
    const day = s.scanned_at.slice(0, 10)
    if (byDay[day] !== undefined) byDay[day]++
  })

  // ── Aggregate breakdowns ─────────────────────────────────
  function tally(field: keyof typeof scans[0]) {
    const counts: Record<string, number> = {}
    scans!.forEach(s => {
      const val = (s[field] as string) || 'Unknown'
      counts[val] = (counts[val] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([label, count]) => ({ label, count }))
  }

  // ── Per-QR scan counts ───────────────────────────────────
  const perQR: Record<string, number> = {}
  scans.forEach(s => { perQR[s.qr_id] = (perQR[s.qr_id] || 0) + 1 })
  const topQR = qrCodes
    .map(q => ({ ...q, scans: perQR[q.id] || 0 }))
    .sort((a, b) => b.scans - a.scans)

  return NextResponse.json({
    total: scans.length,
    days,
    plan,
    maxDays,
    byDay: Object.entries(byDay).map(([date, count]) => ({ date, count })),
    byCountry: tally('country'),
    byDevice: tally('device'),
    byOS: tally('os'),
    byBrowser: tally('browser'),
    topQR,
    qrCodes,
  })
}
