import Link from 'next/link'

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--qr-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '48px', textAlign: 'center' }}>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: 'var(--qr-teal)',
            marginBottom: '16px',
            padding: '6px 16px',
            border: '1px solid var(--qr-teal-border)',
            borderRadius: '100px',
            display: 'inline-block',
            background: 'var(--qr-teal-glow)',
          }}
        >
          ⚡ Early Access — Founding Pricing Locked In Forever
        </div>
        <h1
          style={{
            fontSize: 'clamp(40px, 6vw, 72px)',
            fontWeight: 900,
            letterSpacing: '-2px',
            lineHeight: 1.05,
            color: 'var(--qr-text)',
            marginBottom: '8px',
          }}
        >
          One Dashboard.
        </h1>
        <h1
          style={{
            fontSize: 'clamp(40px, 6vw, 72px)',
            fontWeight: 900,
            letterSpacing: '-2px',
            lineHeight: 1.05,
            marginBottom: '24px',
          }}
        >
          <span style={{ color: 'var(--qr-teal)' }}>Every QR Code.</span>{' '}
          <span style={{ color: 'var(--qr-amber)' }}>Done.</span>
        </h1>
        <p
          style={{
            fontSize: '18px',
            color: 'var(--qr-muted-2)',
            maxWidth: '560px',
            lineHeight: 1.6,
            marginBottom: '36px',
          }}
        >
          Create dynamic QR codes that you can update without reprinting.
          Track every scan with full analytics. Custom design, bulk generation,
          and white-label for agencies. As low as{' '}
          <strong style={{ color: 'var(--qr-text)' }}>$0.19 per code</strong>.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/signup"
            style={{
              padding: '14px 32px',
              background: 'var(--qr-teal)',
              color: '#fff',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '15px',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Start Free — No Card Required →
          </Link>
          <Link
            href="#pricing"
            style={{
              padding: '14px 28px',
              background: 'transparent',
              color: 'var(--qr-muted-2)',
              border: '1px solid var(--qr-border)',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '15px',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            See the math →
          </Link>
        </div>
      </div>

      {/* Tech badges */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '48px' }}>
        {[
          { label: 'qr-code-styling', sub: 'Generates with' },
          { label: 'Supabase', sub: 'Powered by' },
          { label: 'Vercel Edge', sub: 'Redirects via' },
          { label: 'Stripe', sub: 'Billing via' },
        ].map((b) => (
          <div
            key={b.label}
            style={{
              padding: '10px 18px',
              background: 'var(--qr-surface)',
              border: '1px solid var(--qr-border)',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--qr-text)' }}>{b.label}</div>
            <div style={{ fontSize: '11px', color: 'var(--qr-muted-2)', marginTop: '2px' }}>{b.sub}</div>
          </div>
        ))}
      </div>

      {/* Placeholder notice */}
      <div
        style={{
          padding: '16px 24px',
          background: 'var(--qr-surface)',
          border: '1px solid var(--qr-teal-border)',
          borderRadius: '10px',
          fontSize: '12px',
          color: 'var(--qr-muted-2)',
          textAlign: 'center',
          maxWidth: '400px',
        }}
      >
        🚧 <strong style={{ color: 'var(--qr-teal)' }}>Beta build in progress.</strong> Full landing page coming in Week 8.
        <br />
        <Link href="/login" style={{ color: 'var(--qr-teal)', marginTop: '6px', display: 'inline-block' }}>
          Sign in if you have access →
        </Link>
      </div>
    </main>
  )
}
