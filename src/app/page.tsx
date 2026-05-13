import Link from 'next/link'

const FEATURES = [
  { icon: '⚡', title: 'Dynamic QR Codes', desc: 'Change the destination URL anytime without reprinting. Update menus, links, and campaigns on the fly.' },
  { icon: '📊', title: 'Scan Analytics', desc: "Track every scan — country, device, browser, OS. Know exactly who's scanning and when." },
  { icon: '🎨', title: 'Custom Design', desc: 'Full dot style, color, and corner control. Add your logo. Match your brand perfectly.' },
  { icon: '📁', title: 'Folder Organization', desc: 'Organize QR codes by client, campaign, or location. Keep your workspace clean.' },
  { icon: '📲', title: 'App Store Smart Link', desc: 'One QR code that sends iOS users to the App Store and Android users to Google Play.' },
  { icon: '🔗', title: '11 QR Types', desc: 'URL, vCard, Wi-Fi, WhatsApp, Email, SMS, Social, Event, App Store, and more.' },
]

const TYPES = [
  { icon: '🌐', label: 'Website URL' },
  { icon: '👤', label: 'vCard' },
  { icon: '📶', label: 'Wi-Fi' },
  { icon: '💚', label: 'WhatsApp' },
  { icon: '📧', label: 'Email' },
  { icon: '💬', label: 'SMS' },
  { icon: '📱', label: 'Social Media' },
  { icon: '📲', label: 'App Store' },
  { icon: '📅', label: 'Event / iCal' },
  { icon: '📞', label: 'Phone' },
  { icon: '📝', label: 'Plain Text' },
]

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    per: 'forever',
    desc: 'Try it out',
    color: 'var(--muted2)',
    features: ['3 QR codes', '7-day analytics', 'All QR types', 'Custom design', 'SVG & PNG download'],
    cta: 'Start Free',
    href: '/signup',
    highlight: false,
  },
  {
    name: 'Starter',
    price: '$19',
    per: '/month',
    desc: 'Small businesses',
    color: 'var(--starter)',
    features: ['100 QR codes', '30-day analytics', '1 custom domain', 'All QR types', 'Priority support'],
    cta: 'Get Started',
    href: '/signup',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$49',
    per: '/month',
    desc: 'Marketing teams',
    color: 'var(--pro)',
    features: ['Unlimited QR codes', 'Full analytics history', 'Bulk creation (500)', 'AI design suggestions', 'CSV export', '5 custom domains'],
    cta: 'Go Pro',
    href: '/signup',
    highlight: true,
  },
  {
    name: 'Agency',
    price: '$149',
    per: '/month',
    desc: 'Agencies & resellers',
    color: 'var(--agency)',
    features: ['Everything in Pro', 'White-label branding', 'Client report links', 'Unlimited domains', 'Bulk (unlimited)', 'API access'],
    cta: 'Start Agency',
    href: '/signup',
    highlight: false,
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="h-0.5 w-full bg-gradient-to-r from-[var(--qr)] via-[var(--qr-hover)] to-[var(--warn)]" />

      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--qr)] flex items-center justify-center">
            <span className="text-white text-xs font-bold">QR</span>
          </div>
          <span className="font-bold text-[var(--text)]">QRcodee</span>
          <span className="text-[10px] font-semibold bg-[var(--qr)]/10 text-[var(--qr)] border border-[var(--qr)]/20 rounded px-1.5 py-0.5 ml-1">
            BETA
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-[var(--muted2)]">
          <a href="#features" className="hover:text-[var(--text)] transition-colors">Features</a>
          <a href="#pricing" className="hover:text-[var(--text)] transition-colors">Pricing</a>
          <Link href="/login" className="hover:text-[var(--text)] transition-colors">Sign In</Link>
        </div>
        <Link
          href="/signup"
          className="rounded-xl bg-[var(--qr)] hover:bg-[var(--qr-dim)] text-white text-sm font-semibold px-4 py-2 transition-all shadow-lg shadow-[var(--qr)]/20"
        >
          Start Free
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--qr)]/30 bg-[var(--qr)]/5 px-4 py-1.5 text-xs text-[var(--qr)] font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--qr)] animate-pulse" />
          Now live — switch from QRCodeChimp in minutes
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
          One Dashboard.<br />
          <span style={{ background: 'linear-gradient(135deg, var(--qr), var(--qr-hover))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Every QR Code.
          </span>
          <br />Done.
        </h1>

        <p className="text-lg text-[var(--muted2)] max-w-2xl mx-auto mb-10 leading-relaxed">
          Dynamic QR codes with real-time scan analytics, custom design, and zero per-code fees.
          Built for businesses that need more than a free QR generator.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            href="/signup"
            className="rounded-xl bg-[var(--qr)] hover:bg-[var(--qr-dim)] text-white text-base font-bold px-8 py-4 transition-all shadow-xl shadow-[var(--qr)]/25 hover:shadow-[var(--qr)]/40"
          >
            Create Free Account →
          </Link>
          <a
            href="#features"
            className="rounded-xl border border-[var(--border)] text-[var(--muted2)] hover:text-[var(--text)] hover:border-[var(--qr)]/40 text-base font-medium px-8 py-4 transition-all"
          >
            See Features
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-[var(--muted2)]">
          <span>✓ Free forever plan</span>
          <span>✓ No credit card required</span>
          <span>✓ Cancel anytime</span>
          <span>✓ $0 QR generation cost</span>
        </div>
      </section>

      {/* Type pills */}
      <section className="border-y border-[var(--border)] py-5 overflow-hidden">
        <div className="flex gap-3 px-6 overflow-x-auto pb-1 max-w-6xl mx-auto scrollbar-none">
          {TYPES.map(t => (
            <div key={t.label} className="flex items-center gap-2 shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--muted2)]">
              <span>{t.icon}</span><span>{t.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[var(--text)] mb-3">Everything you need. Nothing you don&apos;t.</h2>
          <p className="text-[var(--muted2)] max-w-xl mx-auto">
            We built QRcodee because QR tools were either too basic or too expensive. This is the one that fits.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 hover:border-[var(--qr)]/40 transition-all">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-[var(--text)] mb-2">{f.title}</h3>
              <p className="text-sm text-[var(--muted2)] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Migration CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="rounded-2xl border p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-6"
          style={{ borderColor: 'rgba(8,145,178,0.3)', background: 'rgba(8,145,178,0.05)' }}>
          <div className="text-4xl">🔄</div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-[var(--text)] mb-2">Migrating from QRCodeChimp?</h3>
            <p className="text-sm text-[var(--muted2)] leading-relaxed">
              Import your QR code data via CSV in minutes. On the Ultima plan with a custom domain?
              Just point your DNS CNAME to us — every printed QR code keeps working.{' '}
              <strong className="text-[var(--text)]">Zero reprinting required.</strong>
            </p>
          </div>
          <Link href="/signup" className="shrink-0 rounded-xl bg-[var(--qr)] hover:bg-[var(--qr-dim)] text-white text-sm font-bold px-6 py-3 transition-all">
            Migrate Free →
          </Link>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[var(--text)] mb-3">Simple, honest pricing</h2>
          <p className="text-[var(--muted2)]">No per-scan fees. No per-code fees. Just flat monthly pricing.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {PLANS.map(plan => (
            <div key={plan.name}
              className={`rounded-2xl border p-6 flex flex-col relative transition-all ${plan.highlight ? 'border-[var(--qr)] shadow-xl shadow-[var(--qr)]/15' : 'border-[var(--border)] bg-[var(--surface)]'}`}
              style={plan.highlight ? { background: 'rgba(8,145,178,0.05)' } : undefined}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--qr)] text-white text-[10px] font-bold px-3 py-1 whitespace-nowrap">
                  MOST POPULAR
                </div>
              )}
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: plan.color }}>{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-extrabold text-[var(--text)]">{plan.price}</span>
                  <span className="text-xs text-[var(--muted2)]">{plan.per}</span>
                </div>
                <p className="text-xs text-[var(--muted2)]">{plan.desc}</p>
              </div>
              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[var(--muted2)]">
                    <span className="mt-0.5 shrink-0" style={{ color: plan.color }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href={plan.href}
                className={`block w-full text-center rounded-xl text-sm font-bold py-2.5 transition-all ${plan.highlight ? 'bg-[var(--qr)] hover:bg-[var(--qr-dim)] text-white shadow-lg shadow-[var(--qr)]/20' : 'border border-[var(--border)] hover:border-[var(--qr)] text-[var(--text)] hover:text-[var(--qr)]'}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-[var(--border)] py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-[var(--text)] mb-4">Ready to own your QR codes?</h2>
          <p className="text-[var(--muted2)] mb-8">Free forever. No credit card. Your first 3 QR codes are on us.</p>
          <Link href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--qr)] hover:bg-[var(--qr-dim)] text-white text-lg font-bold px-10 py-4 transition-all shadow-xl shadow-[var(--qr)]/25">
            Create Your Free Account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[var(--qr)] flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">QR</span>
            </div>
            <span className="text-sm font-semibold text-[var(--text)]">QRcodee.online</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-[var(--muted2)]">
            <Link href="/login" className="hover:text-[var(--text)]">Sign In</Link>
            <Link href="/signup" className="hover:text-[var(--text)]">Sign Up</Link>
            <a href="mailto:hello@qrcodee.online" className="hover:text-[var(--text)]">Contact</a>
          </div>
          <p className="text-xs text-[var(--muted2)]">© 2026 Boom Media. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
