import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { encodeQRPayload, QR_TYPES, type Phase1QRType } from '@/lib/qr/types'

type Params = { params: Promise<{ id: string }> }

// GET /api/qr/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ qr: data })
}

// PATCH /api/qr/[id] — update name, destination_url, qr_data, design_config, folder, pause
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, qr_data, design_config, folder_id, is_paused } = body

  // Fetch existing record to verify ownership + get type
  const { data: existing, error: fetchErr } = await supabase
    .from('qr_codes')
    .select('type, is_dynamic, user_id')
    .eq('id', id)
    .single()

  if (fetchErr || !existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const updates: Record<string, unknown> = {}
  if (name !== undefined) updates.name = name
  if (is_paused !== undefined) updates.is_paused = is_paused
  if (folder_id !== undefined) updates.folder_id = folder_id
  if (design_config !== undefined) updates.design_config = design_config

  if (qr_data !== undefined) {
    updates.qr_data = qr_data
    // Re-encode destination_url for dynamic types
    if (existing.is_dynamic && QR_TYPES[existing.type as Phase1QRType]) {
      updates.destination_url = encodeQRPayload(existing.type as Phase1QRType, qr_data)
    }
  }

  const { data, error } = await supabase
    .from('qr_codes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ qr: data })
}

// DELETE /api/qr/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('qr_codes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
