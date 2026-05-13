import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email'

// Called by Supabase Database Webhook on auth.users INSERT
// Supabase → Database Webhooks → Table: users, Schema: auth, Event: INSERT
// URL: https://qrcodee.online/api/email/welcome
// Headers: { Authorization: Bearer SUPABASE_WEBHOOK_SECRET }
export async function POST(request: NextRequest) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const record = body.record

  if (!record?.email) {
    return NextResponse.json({ error: 'No email in record' }, { status: 400 })
  }

  const name = record.raw_user_meta_data?.full_name || ''

  try {
    await sendWelcomeEmail(record.email, name)
    return NextResponse.json({ sent: true })
  } catch (err) {
    console.error('Welcome email failed:', err)
    return NextResponse.json({ error: 'Email send failed' }, { status: 500 })
  }
}
