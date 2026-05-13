import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createServiceClient()

  const { data: qr, error } = await supabase
    .from('qr_codes')
    .select('id, destination_url, is_paused, is_dynamic')
    .eq('short_slug', slug)
    .single()

  if (error || !qr) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (qr.is_paused) {
    return NextResponse.redirect(
      new URL(`/qr-inactive?code=${slug}`, request.url)
    )
  }

  if (!qr.destination_url) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Log scan event — fire and forget, never block the redirect
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || ''
  const forwardedFor = headersList.get('x-forwarded-for') || ''
  const ip = forwardedFor.split(',')[0].trim()
  const cfCountry = headersList.get('cf-ipcountry') || ''
  const cfCity = headersList.get('cf-ipcity') || ''

  supabase
    .from('scans')
    .insert({
      qr_id: qr.id,
      user_agent: userAgent,
      ip_hash: ip,
      country: cfCountry || null,
      city: cfCity || null,
    })
    .then(() => {})
    .catch(() => {})

  return NextResponse.redirect(qr.destination_url, { status: 302 })
}
