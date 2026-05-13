import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { PLAN_LIMITS, type PlanTier } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sub } = await supabase.from('subscriptions').select('plan').eq('user_id', user.id).single()
  const plan = (sub?.plan || 'free') as PlanTier
  if (!PLAN_LIMITS[plan].client_reports) {
    return NextResponse.json({ error: 'Client reports require Agency plan' }, { status: 403 })
  }

  const { name, qr_ids, branding, expires_days } = await request.json()
  if (!name?.trim() || !Array.isArray(qr_ids) || qr_ids.length === 0) {
    return NextResponse.json({ error: 'name and qr_ids required' }, { status: 400 })
  }

  const expires_at = expires_days
    ? new Date(Date.now() + expires_days * 24 * 60 * 60 * 1000).toISOString()
    : null

  const { data, error } = await supabase
    .from('client_reports')
    .insert({
      user_id: user.id,
      name: name.trim(),
      token: nanoid(24),
      qr_ids,
      branding: branding || {},
      expires_at,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ report: data }, { status: 201 })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('client_reports')
    .select('id, name, token, qr_ids, branding, expires_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ reports: data || [] })
}
