'use client'

import { useState } from 'react'
import Link from 'next/link'

const FEATURES = [
  { icon: '⚡', title: 'Dynamic QR Codes', desc: 'Change the destination URL anytime without reprinting. Update menus, links, and campaigns on the fly.' },
  { icon: '📊', title: 'Scan Analytics', desc: "Track every scan — country, device, browser, OS. Know exactly who's scanning and when." },
  { icon: '🎨', title: 'Custom Design', desc: 'Full dot style, color, and corner control. Add your logo. Match your brand perfectly.' },
  { icon: '📁', title: 'Folder Organization', desc: 'Organize QR codes by client, campaign, or location. Keep your workspace clean.' },
  { icon: '📲', title: 'App Store Smart Link', desc: 'One QR code that sends iOS users to the App Store and Android users to Google Play.' },
  { icon: '🔒', title: 'No Expiry, No Limits', desc: 'Your QR codes never expire. No per-scan fees. No per-code fees. Ever.' },
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

const USE_CASES = [
  {
    icon: '🍽️',
    title: 'Restaurants & Cafés',
    desc: 'Replace paper menus with dynamic QR codes. Update your menu instantly — no reprinting, no waste.',
    tags: ['Digital Menu', 'Wi-Fi Login', 'Social Media'],
  },
  {
    icon: '🏪',
    title: 'Retail & Products',
    desc: 'Link product QRs to landing pages, how-to videos, or loyalty programs. Update the destination anytime.',
    tags: ['Product Info', 'Promotions', 'App Downloads'],
  },
  {
    icon: '🎪',
    title: 'Events & Conferences',
    desc: 'Add to calendars, collect RSVPs, share schedules, and track attendance with one scan.',
    tags: ['Event iCal', 'Registration', 'Scan Tracking'],
  },
  {
    icon: '🏢',
    title: 'Agencies & Freelancers',
    desc: 'Manage QR codes for all your clients in one dashboard. Send branded reports. Bill per client.',
    tags: ['Client Reports', 'White Label', 'Bulk Creation'],
  },
  {
    icon: '💼',
    title: 'Business Cards',
    desc: 'vCard QR codes that save your contact to phones instantly. Update your info without reprinting.',
    tags: ['vCard', 'Contact Save', 'Dynamic'],
  },
  {
    icon: '📣',
    title: 'Marketing Campaigns',
    desc: 'Track offline-to-online conversions. Know which billboard, flyer, or mailer drove the most scans.',
    tags: ['Analytics', 'A/B Testing', 'CSV Export'],
  },
]

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    per: 'forever',
    desc: 'Try it out',
    color: 'var(--muted2)',
    features: ['3 QR codes', '7-day analytics', 'All 11 QR types', 'Custom design', 'SVG & PNG download'],
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
    features: ['Unlimited QR codes', 'Full analytics history', 'Bulk creation (500)', 'CSV export', '5 custom domains', 'API access'],
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
    features: ['Everything in Pro', 'White-label branding', 'Client report links', 'Unlimited domains', 'Unlimited bulk', 'Team seats (10)'],
    cta: 'Start Agency',
    href: '/signup',
    highlight: false,
  },
]

const FAQS = [
  {
    q: 'What is a dynamic QR code?',
    a: "A dynamic QR code stores a short redirect URL that we control. When someone scans it, we redirect them to your actual destination. This means you can change where the QR code points at any time — without changing the printed code.",
  },
  {
    q: 'Do my QR codes ever expire?',
    a: 'No. Your QR codes work as long as your account is active. On the free plan, codes remain active indefinitely. We never silently deactivate codes.',
  },
  {
    q: 'Can I use my own domain for QR short links?',
    a: 'Yes — Starter includes 1 custom domain, Pro includes 5, and Agency includes unlimited. You set a CNAME record pointing to us and your short URLs will use your brand domain.',
  },
  {
    q: 'How do I migrate from QRCodeChimp or QR Tiger?',
    a: 'Export your QR code data as a CSV from your current provider, then use our Migration Wizard (Dashboard → Migrate In). It auto-detects column formats from all major platforms. If you have a custom domain on QRCodeChimp Ultima, just update your CNAME — every printed QR keeps working.',
  },
  {
    q: 'What analytics do you track?',
    a: 'Every scan logs the timestamp, country, city, device type (mobile/desktop/tablet), operating system, and browser. Free plans see 7 days; Starter 30 days; Pro and Agency get full history. We never sell scan data.',
  },
  {
    q: 'Can I download QR codes in high resolution for print?',
    a: 'Yes. You can download PNG at 256, 512, 1024, or 2048px, or as a vector SVG (infinitely scalable). PDF export is available on Pro and Agency plans.',
  },
  {
    q: 'Is there an API?',
    a: 'Yes — Pro and Agency plans include REST API access for creating, updating, and retrieving QR codes programmatically. API key management is in your dashboard settings.',
  },
  {
    q: 'What happens if I downgrade or cancel?',
    a: "Your QR codes keep working. If you downgrade below your current QR count, existing codes continue to work — you just can't create new ones until you're back under the limit. We never delete your data.",
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[var(--border)] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-sm font-semibold text-[var(--text)]">{q}</span>
        <svg
          className={`w-4 h-4 shrink-0 text-[var(--muted2)] transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <p className="text-sm text-[var(--muted2)] leading-relaxed pb-5">{a}</p>
      )}
    </div>
  )
}

export default function HomePage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="h-0.5 w-full bg-gradient-to-r from-[var(--qr)] via-[var(--qr-hover)] to-[var(--warn)]" />

      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between relative">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--qr)] flex items-center justify-center">
            <span className="text-white text-xs font-bold">QR</span>
          </div>
          <span className="font-bold text-[var(--text)]">QRcodee</span>
          <span className="text-[10px] font-semibold bg-[var(--qr)]/10 text-[var(--qr)] border border-[var(--qr)]/20 rounded px-1.5 py-0.5 ml-1">BETA</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6 text-sm text-[var(--muted2)]">
          <a href="#features" className="hover:text-[var(--text)] transition-colors">Features</a>
          <a href="#use-cases" className="hover:text-[var(--text)] transition-colors">Use Cases</a>
          <a href="#pricing" className="hover:text-[var(--text)] transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-[var(--text)] transition-colors">FAQ</a>
          <Link href="/login" className="hover:text-[var(--text)] transition-colors">Sign In</Link>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm text-[var(--muted2)] hover:text-[var(--text)] transition-colors font-medium">Log in</Link>
          <Link href="/signup" className="rounded-xl bg-[var(--qr)] hover:bg-[var(--qr-dim)] text-white text-sm font-semibold px-4 py-2 transition-all shadow-lg shadow-[var(--qr)]/20">
            Start Free
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-lg text-[var(--muted2)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
        >
          {mobileNavOpen ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {/* Mobile dropdown */}
        {mobileNavOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 mx-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl z-50 overflow-hidden">
            {[
              { href: '#features', label: 'Features' },
              { href: '#use-cases', label: 'Use Cases' },
              { href: '#pricing', label: 'Pricing' },
              { href: '#faq', label: 'FAQ' },
            ].map(item => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className="block px-5 py-3.5 text-sm text-[var(--muted2)] hover:text-[var(--text)] hover:bg-[var(--surface2)] border-b border-[var(--border)] last:border-0 transition-colors"
              >
                {item.label}
              </a>
            ))}
            <div className="p-4 flex gap-2 border-t border-[var(--border)]">
              <Link href="/login" onClick={() => setMobileNavOpen(false)} className="flex-1 text-center rounded-xl border border-[var(--border)] py-2.5 text-sm font-semibold text-[var(--muted2)] hover:text-[var(--text)] transition-colors">
                Log In
              </Link>
              <Link href="/signup" onClick={() => setMobileNavOpen(false)} className="flex-1 text-center rounded-xl bg-[var(--qr)] py-2.5 text-sm font-bold text-white">
                Start Free
              </Link>
            </div>
          </div>
        )}
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
          <Link href="/signup" className="rounded-xl bg-[var(--qr)] hover:bg-[var(--qr-dim)] text-white text-base font-bold px-8 py-4 transition-all shadow-xl shadow-[var(--qr)]/25 hover:shadow-[var(--qr)]/40 w-full sm:w-auto">
            Create Free Account →
          </Link>
          <a href="#features" className="rounded-xl border border-[var(--border)] text-[var(--muted2)] hover:text-[var(--text)] hover:border-[var(--qr)]/40 text-base font-medium px-8 py-4 transition-all w-full sm:w-auto text-center">
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
        <div className="flex gap-3 px-6 overflow-x-auto pb-1 max-w-6xl mx-auto">
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

      {/* Use Cases */}
      <section id="use-cases" className="border-t border-[var(--border)] bg-[var(--surface)] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--text)] mb-3">Built for every business</h2>
            <p className="text-[var(--muted2)] max-w-xl mx-auto">
              From a single restaurant to an agency managing 500 clients — QRcodee scales with you.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {USE_CASES.map(uc => (
              <div key={uc.title} className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 hover:border-[var(--qr)]/40 transition-all">
                <div className="text-3xl mb-4">{uc.icon}</div>
                <h3 className="font-semibold text-[var(--text)] mb-2">{uc.title}</h3>
                <p className="text-sm text-[var(--muted2)] leading-relaxed mb-4">{uc.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {uc.tags.map(tag => (
                    <span key={tag} className="text-[10px] font-semibold px-2 py-1 rounded-lg" style={{ background: 'var(--qr)15', color: 'var(--qr)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Migration CTA */}
      <section className="max-w-6xl mx-auto px-6 py-16">
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
          <Link href="/signup" className="shrink-0 rounded-xl bg-[var(--qr)] hover:bg-[var(--qr-dim)] text-white text-sm font-bold px-6 py-3 transition-all whitespace-nowrap">
            Migrate Free →
          </Link>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-[var(--border)] bg-[var(--surface)] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--text)] mb-3">Simple, honest pricing</h2>
            <p className="text-[var(--muted2)]">No per-scan fees. No per-code fees. Just flat monthly pricing.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {PLANS.map(plan => (
              <div key={plan.name}
                className={`rounded-2xl border p-6 flex flex-col relative transition-all ${plan.highlight ? 'border-[var(--qr)] shadow-xl shadow-[var(--qr)]/15' : 'border-[var(--border)] bg-[var(--bg)]'}`}
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
                      <span className="mt-0.5 shrink-0 font-bold" style={{ color: plan.color }}>✓</span>{f}
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
          <p className="text-center text-xs text-[var(--muted2)] mt-6">All plans include a 14-day money-back guarantee. Annual billing available — save 20%.</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[var(--text)] mb-3">Frequently asked questions</h2>
          <p className="text-[var(--muted2)]">Everything you need to know before getting started.</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 divide-y-0">
          {FAQS.map(faq => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
        <p className="text-center text-sm text-[var(--muted2)] mt-8">
          Still have questions?{' '}
          <a href="mailto:hello@qrcodee.online" className="text-[var(--qr)] hover:text-[var(--qr-hover)] transition-colors">
            Email us →
          </a>
        </p>
      </section>

      {/* Final CTA */}
      <section className="border-t border-[var(--border)] py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-[var(--text)] mb-4">Ready to own your QR codes?</h2>
          <p className="text-[var(--muted2)] mb-8">Free forever. No credit card. Your first 3 QR codes are on us.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-[var(--qr)] hover:bg-[var(--qr-dim)] text-white text-lg font-bold px-10 py-4 transition-all shadow-xl shadow-[var(--qr)]/25">
            Create Your Free Account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-[var(--qr)] flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">QR</span>
                </div>
                <span className="font-bold text-[var(--text)]">QRcodee.online</span>
              </div>
              <p className="text-xs text-[var(--muted2)] leading-relaxed mb-3">
                Dynamic QR codes with analytics, custom design, and flat-rate pricing. Part of the Boom Media SaaS suite.
              </p>
              <a href="mailto:hello@qrcodee.online" className="text-xs text-[var(--qr)] hover:text-[var(--qr-hover)]">
                hello@qrcodee.online
              </a>
            </div>

            {/* Product */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted2)] mb-3">Product</p>
              <ul className="space-y-2">
                {[
                  { href: '#features', label: 'Features' },
                  { href: '#pricing', label: 'Pricing' },
                  { href: '#use-cases', label: 'Use Cases' },
                  { href: '#faq', label: 'FAQ' },
                  { href: '/signup', label: 'Get Started' },
                ].map(l => (
                  <li key={l.href}><a href={l.href} className="text-xs text-[var(--muted2)] hover:text-[var(--text)] transition-colors">{l.label}</a></li>
                ))}
              </ul>
            </div>

            {/* Use Cases */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted2)] mb-3">Use Cases</p>
              <ul className="space-y-2">
                {['Restaurants', 'Retail', 'Events', 'Agencies', 'Business Cards', 'Marketing'].map(l => (
                  <li key={l}><a href="#use-cases" className="text-xs text-[var(--muted2)] hover:text-[var(--text)] transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted2)] mb-3">Account</p>
              <ul className="space-y-2">
                {[
                  { href: '/login', label: 'Sign In' },
                  { href: '/signup', label: 'Create Account' },
                  { href: '/dashboard', label: 'Dashboard' },
                  { href: '/billing', label: 'Billing' },
                  { href: 'mailto:hello@qrcodee.online', label: 'Support' },
                ].map(l => (
                  <li key={l.href}><a href={l.href} className="text-xs text-[var(--muted2)] hover:text-[var(--text)] transition-colors">{l.label}</a></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-[var(--muted2)]">© 2026 Boom Media LLC. All rights reserved.</p>
            <div className="flex gap-5 text-xs text-[var(--muted2)]">
              <a href="mailto:hello@qrcodee.online" className="hover:text-[var(--text)] transition-colors">Privacy Policy</a>
              <a href="mailto:hello@qrcodee.online" className="hover:text-[var(--text)] transition-colors">Terms of Service</a>
              <a href="mailto:hello@qrcodee.online" className="hover:text-[var(--text)] transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
