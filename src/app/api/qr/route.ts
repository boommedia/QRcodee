import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { encodeQRPayload, QR_TYPES, type Phase1QRType } from '@/lib/qr/types'
import { PLAN_LIMITS, type PlanTier } from '@/types'

// POST /api/qr — create a new QR code
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { type, name, qr_data, design_config, folder_id } = body

  if (!type || !name || !qr_data) {
    return NextResponse.json({ error: 'type, name, and qr_data are required' }, { status: 400 })
  }

  if (!QR_TYPES[type as Phase1QRType]) {
    return NextResponse.json({ error: 'Invalid QR type' }, { status: 400 })
  }

  // Check plan limits
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', user.id)
    .single()

  const plan = (sub?.plan || 'free') as PlanTier
  const limit = PLAN_LIMITS[plan].qr_codes

  if (limit !== Infinity) {
    const { count } = await supabase
      .from('qr_codes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if ((count ?? 0) >= limit) {
      return NextResponse.json(
        { error: `Plan limit reached. Upgrade to create more QR codes.` },
        { status: 403 }
      )
    }
  }

  // Encode QR payload and determine if dynamic
  const typeConfig = QR_TYPES[type as Phase1QRType]
  const destination_url = typeConfig.isDynamic ? encodeQRPayload(type, qr_data) : null
  const is_dynamic = typeConfig.isDynamic

  const short_slug = nanoid(8)

  const { data: qr, error } = await supabase
    .from('qr_codes')
    .insert({
      user_id: user.id,
      folder_id: folder_id || null,
      type,
      name,
      destination_url,
      short_slug,
      is_dynamic,
      design_config: design_config || {},
      qr_data,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ qr }, { status: 201 })
}

// GET /api/qr — list QR codes for current user
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const folder_id = searchParams.get('folder_id')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '24'), 100)
  const offset = (page - 1) * limit

  let query = supabase
    .from('qr_codes')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (folder_id) query = query.eq('folder_id', folder_id)
  if (search) query = query.ilike('name', `%${search}%`)

  const { data: qr_codes, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ qr_codes, total: count, page, limit })
}
