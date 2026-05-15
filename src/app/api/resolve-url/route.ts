import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { url } = await request.json()

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return NextResponse.json({ error: 'Only HTTP/HTTPS URLs allowed' }, { status: 400 })
  }

  // Block private/internal IPs (basic SSRF protection)
  const h = parsed.hostname
  if (
    h === 'localhost' || h === '::1' ||
    /^127\./.test(h) || /^10\./.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
    /^192\.168\./.test(h)
  ) {
    return NextResponse.json({ error: 'Blocked' }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(6000),
      headers: { 'User-Agent': 'QRcodee-Resolver/1.0' },
    })
    return NextResponse.json({ resolved: response.url })
  } catch {
    // If HEAD fails (some servers block it), try GET with no body read
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(6000),
        headers: { 'User-Agent': 'QRcodee-Resolver/1.0' },
      })
      return NextResponse.json({ resolved: response.url })
    } catch {
      // Return original URL if we can't resolve
      return NextResponse.json({ resolved: url })
    }
  }
}
