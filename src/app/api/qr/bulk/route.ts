import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { encodeQRPayload, QR_TYPES, type Phase1QRType } from '@/lib/qr/types'
import { PLAN_LIMITS, type PlanTier } from '@/types'

type BulkItem = {
  type: Phase1QRType
  name: string
  qr_data: Record<string, string>
  folder_id?: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', user.id)
    .single()

  const plan = (sub?.plan || 'free') as PlanTier
  const limits = PLAN_LIMITS[plan]

  if (limits.bulk_batch === 0) {
    return NextResponse.json({ error: 'Bulk creation requires Pro or Agency plan' }, { status: 403 })
  }

  const { items }: { items: BulkItem[] } = await request.json()

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'No items provided' }, { status: 400 })
  }

  const batchLimit = limits.bulk_batch === Infinity ? 10000 : limits.bulk_batch
  if (items.length > batchLimit) {
    return NextResponse.json({ error: `Batch limit is ${batchLimit} for your plan` }, { status: 400 })
  }

  // Check current QR count vs plan limit
  if (limits.qr_codes !== Infinity) {
    const { count } = await supabase
      .from('qr_codes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    const remaining = limits.qr_codes - (count ?? 0)
    if (items.length > remaining) {
      return NextResponse.json(
        { error: `You can only create ${remaining} more QR codes on your plan` },
        { status: 403 }
      )
    }
  }

  const results: { success: boolean; name: string; id?: string; error?: string }[] = []

  for (const item of items) {
    if (!item.type || !item.name || !item.qr_data) {
      results.push({ success: false, name: item.name || '(unnamed)', error: 'Missing required fields' })
      continue
    }

    const typeConfig = QR_TYPES[item.type]
    if (!typeConfig) {
      results.push({ success: false, name: item.name, error: 'Invalid QR type' })
      continue
    }

    try {
      const destination_url = typeConfig.isDynamic ? encodeQRPayload(item.type, item.qr_data) : null
      const short_slug = nanoid(8)

      const { data, error } = await supabase
        .from('qr_codes')
        .insert({
          user_id: user.id,
          folder_id: item.folder_id || null,
          type: item.type,
          name: item.name,
          destination_url,
          short_slug,
          is_dynamic: typeConfig.isDynamic,
          design_config: {},
          qr_data: item.qr_data,
        })
        .select('id')
        .single()

      if (error) throw new Error(error.message)
      results.push({ success: true, name: item.name, id: data.id })
    } catch (e) {
      results.push({ success: false, name: item.name, error: e instanceof Error ? e.message : 'Unknown error' })
    }
  }

  const succeeded = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  return NextResponse.json({ results, succeeded, failed })
}
