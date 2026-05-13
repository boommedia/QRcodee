import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

function detectDevice(ua: string): { device: string; os: string; browser: string } {
  const lc = ua.toLowerCase()
  const device = /mobile|android|iphone|ipad|ipod/.test(lc) ? 'mobile' : 'desktop'
  const os = /iphone|ipad|ipod/.test(lc)
    ? 'iOS'
    : /android/.test(lc)
    ? 'Android'
    : /windows/.test(lc)
    ? 'Windows'
    : /mac/.test(lc)
    ? 'macOS'
    : 'Other'
  const browser = /chrome/.test(lc) && !/edge/.test(lc)
    ? 'Chrome'
    : /safari/.test(lc) && !/chrome/.test(lc)
    ? 'Safari'
    : /firefox/.test(lc)
    ? 'Firefox'
    : /edge/.test(lc)
    ? 'Edge'
    : 'Other'
  return { device, os, browser }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createServiceClient()

  const { data: qr, error } = await supabase
    .from('qr_codes')
    .select('id, destination_url, is_paused, is_dynamic, type, qr_data')
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

  // Log scan event — fire and forget, never block the redirect
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || ''
  const forwardedFor = headersList.get('x-forwarded-for') || ''
  const ip = forwardedFor.split(',')[0].trim()
  const cfCountry = headersList.get('cf-ipcountry') || ''
  const cfCity = headersList.get('cf-ipcity') || ''
  const { device, os, browser } = detectDevice(userAgent)

  void supabase
    .from('scans')
    .insert({
      qr_id: qr.id,
      user_agent: userAgent,
      ip_hash: ip,
      country: cfCountry || null,
      city: cfCity || null,
      device,
      os,
      browser,
    })

  // App Store smart redirect — send iOS to App Store, Android to Play Store
  if (qr.type === 'app_store' && qr.qr_data) {
    const data = qr.qr_data as Record<string, string>
    if (data.iosUrl && data.androidUrl) {
      const target = os === 'iOS' ? data.iosUrl : data.androidUrl
      return NextResponse.redirect(target, { status: 302 })
    }
    const fallback = data.iosUrl || data.androidUrl
    if (fallback) return NextResponse.redirect(fallback, { status: 302 })
  }

  if (!qr.destination_url) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.redirect(qr.destination_url, { status: 302 })
}
