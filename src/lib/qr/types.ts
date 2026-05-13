// Phase 1 QR type definitions — form schemas and payload encoders

export type Phase1QRType =
  | 'url'
  | 'text'
  | 'phone'
  | 'sms'
  | 'email'
  | 'whatsapp'
  | 'wifi'
  | 'vcard'
  | 'social'
  | 'app_store'
  | 'event'

export interface QRTypeConfig {
  id: Phase1QRType
  label: string
  description: string
  icon: string
  isDynamic: boolean
  encode: (data: Record<string, string>) => string
  fields: QRFieldConfig[]
}

export interface QRFieldConfig {
  name: string
  label: string
  type: 'text' | 'url' | 'tel' | 'email' | 'textarea' | 'select' | 'datetime-local'
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
  maxLength?: number
}

// ── Payload encoders ─────────────────────────────────────────

function encodeURL(d: Record<string, string>) {
  const url = d.url?.trim() || ''
  return url.startsWith('http') ? url : `https://${url}`
}

function encodeText(d: Record<string, string>) {
  return d.text || ''
}

function encodePhone(d: Record<string, string>) {
  return `tel:${d.phone}`
}

function encodeSMS(d: Record<string, string>) {
  const base = `smsto:${d.phone}`
  return d.message ? `${base}:${d.message}` : base
}

function encodeEmail(d: Record<string, string>) {
  let uri = `mailto:${d.email}`
  const params: string[] = []
  if (d.subject) params.push(`subject=${encodeURIComponent(d.subject)}`)
  if (d.body) params.push(`body=${encodeURIComponent(d.body)}`)
  if (params.length) uri += `?${params.join('&')}`
  return uri
}

function encodeWhatsApp(d: Record<string, string>) {
  const phone = d.phone.replace(/\D/g, '')
  const msg = d.message ? `?text=${encodeURIComponent(d.message)}` : ''
  return `https://wa.me/${phone}${msg}`
}

function encodeWifi(d: Record<string, string>) {
  const security = d.security || 'WPA'
  const hidden = d.hidden === 'true' ? 'H:true;' : ''
  return `WIFI:T:${security};S:${d.ssid};P:${d.password};${hidden};`
}

function encodeVCard(d: Record<string, string>) {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${d.firstName} ${d.lastName}`,
    `N:${d.lastName};${d.firstName};;;`,
  ]
  if (d.org) lines.push(`ORG:${d.org}`)
  if (d.title) lines.push(`TITLE:${d.title}`)
  if (d.phone) lines.push(`TEL;TYPE=CELL:${d.phone}`)
  if (d.workPhone) lines.push(`TEL;TYPE=WORK:${d.workPhone}`)
  if (d.email) lines.push(`EMAIL:${d.email}`)
  if (d.website) lines.push(`URL:${d.website}`)
  if (d.address) lines.push(`ADR;TYPE=WORK:;;${d.address};;;;`)
  lines.push('END:VCARD')
  return lines.join('\n')
}

function encodeSocial(d: Record<string, string>) {
  // Social is always a URL — platform determines the base URL
  const handles: Record<string, string> = {
    instagram: 'https://instagram.com/',
    facebook: 'https://facebook.com/',
    tiktok: 'https://tiktok.com/@',
    linkedin: 'https://linkedin.com/in/',
    twitter: 'https://twitter.com/',
    youtube: 'https://youtube.com/@',
  }
  const base = handles[d.platform] || ''
  const handle = d.handle?.replace(/^@/, '')
  return `${base}${handle}`
}

function encodeAppStore(d: Record<string, string>) {
  // Smart link: detect iOS vs Android at redirect time (handled by dynamic route)
  // For static QR, encode as a landing page URL or direct store link
  if (d.iosUrl && d.androidUrl) {
    // Store both — dynamic route will handle device detection
    return JSON.stringify({ type: 'app_store', ios: d.iosUrl, android: d.androidUrl })
  }
  return d.iosUrl || d.androidUrl || ''
}

function encodeEvent(d: Record<string, string>) {
  const fmt = (dt: string) => dt.replace(/[-:]/g, '').replace('T', 'T') + '00Z'
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(d.startDate)}`,
    `DTEND:${fmt(d.endDate)}`,
    `SUMMARY:${d.title}`,
  ]
  if (d.description) lines.push(`DESCRIPTION:${d.description}`)
  if (d.location) lines.push(`LOCATION:${d.location}`)
  lines.push('END:VEVENT', 'END:VCALENDAR')
  return lines.join('\n')
}

// ── Type registry ────────────────────────────────────────────

export const QR_TYPES: Record<Phase1QRType, QRTypeConfig> = {
  url: {
    id: 'url',
    label: 'Website URL',
    description: 'Link to any webpage',
    icon: 'Globe',
    isDynamic: true,
    encode: encodeURL,
    fields: [
      { name: 'url', label: 'URL', type: 'url', placeholder: 'https://example.com', required: true },
    ],
  },
  text: {
    id: 'text',
    label: 'Plain Text',
    description: 'Display a text message',
    icon: 'FileText',
    isDynamic: false,
    encode: encodeText,
    fields: [
      { name: 'text', label: 'Text', type: 'textarea', placeholder: 'Enter your message...', required: true, maxLength: 500 },
    ],
  },
  phone: {
    id: 'phone',
    label: 'Phone Number',
    description: 'Dial a number directly',
    icon: 'Phone',
    isDynamic: false,
    encode: encodePhone,
    fields: [
      { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+1 555 000 0000', required: true },
    ],
  },
  sms: {
    id: 'sms',
    label: 'SMS',
    description: 'Open a pre-filled text message',
    icon: 'MessageSquare',
    isDynamic: false,
    encode: encodeSMS,
    fields: [
      { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+1 555 000 0000', required: true },
      { name: 'message', label: 'Pre-filled Message', type: 'textarea', placeholder: 'Optional message...', maxLength: 160 },
    ],
  },
  email: {
    id: 'email',
    label: 'Email',
    description: 'Open a pre-filled email',
    icon: 'Mail',
    isDynamic: false,
    encode: encodeEmail,
    fields: [
      { name: 'email', label: 'Email Address', type: 'email', placeholder: 'name@example.com', required: true },
      { name: 'subject', label: 'Subject', type: 'text', placeholder: 'Optional subject' },
      { name: 'body', label: 'Message Body', type: 'textarea', placeholder: 'Optional message...' },
    ],
  },
  whatsapp: {
    id: 'whatsapp',
    label: 'WhatsApp',
    description: 'Open WhatsApp chat with a message',
    icon: 'MessageCircle',
    isDynamic: false,
    encode: encodeWhatsApp,
    fields: [
      { name: 'phone', label: 'WhatsApp Number', type: 'tel', placeholder: '+1 555 000 0000 (with country code)', required: true },
      { name: 'message', label: 'Pre-filled Message', type: 'textarea', placeholder: 'Hi! I scanned your QR code...' },
    ],
  },
  wifi: {
    id: 'wifi',
    label: 'Wi-Fi',
    description: 'Connect to a network automatically',
    icon: 'Wifi',
    isDynamic: false,
    encode: encodeWifi,
    fields: [
      { name: 'ssid', label: 'Network Name (SSID)', type: 'text', placeholder: 'MyWifi', required: true },
      { name: 'password', label: 'Password', type: 'text', placeholder: 'Leave blank for open networks' },
      {
        name: 'security',
        label: 'Security Type',
        type: 'select',
        options: [
          { value: 'WPA', label: 'WPA/WPA2' },
          { value: 'WEP', label: 'WEP' },
          { value: 'nopass', label: 'None (Open)' },
        ],
        required: true,
      },
      {
        name: 'hidden',
        label: 'Hidden Network?',
        type: 'select',
        options: [
          { value: 'false', label: 'No' },
          { value: 'true', label: 'Yes' },
        ],
      },
    ],
  },
  vcard: {
    id: 'vcard',
    label: 'vCard / Contact',
    description: 'Digital business card',
    icon: 'Contact',
    isDynamic: true,
    encode: encodeVCard,
    fields: [
      { name: 'firstName', label: 'First Name', type: 'text', placeholder: 'Jane', required: true },
      { name: 'lastName', label: 'Last Name', type: 'text', placeholder: 'Smith', required: true },
      { name: 'org', label: 'Company', type: 'text', placeholder: 'Acme Corp' },
      { name: 'title', label: 'Job Title', type: 'text', placeholder: 'Marketing Director' },
      { name: 'phone', label: 'Mobile Phone', type: 'tel', placeholder: '+1 555 000 0000' },
      { name: 'workPhone', label: 'Work Phone', type: 'tel', placeholder: '+1 555 000 0001' },
      { name: 'email', label: 'Email', type: 'email', placeholder: 'jane@example.com' },
      { name: 'website', label: 'Website', type: 'url', placeholder: 'https://example.com' },
      { name: 'address', label: 'Address', type: 'text', placeholder: '123 Main St, City, State' },
    ],
  },
  social: {
    id: 'social',
    label: 'Social Media',
    description: 'Link to an Instagram, TikTok, LinkedIn profile',
    icon: 'Share2',
    isDynamic: false,
    encode: encodeSocial,
    fields: [
      {
        name: 'platform',
        label: 'Platform',
        type: 'select',
        required: true,
        options: [
          { value: 'instagram', label: 'Instagram' },
          { value: 'facebook', label: 'Facebook' },
          { value: 'tiktok', label: 'TikTok' },
          { value: 'linkedin', label: 'LinkedIn' },
          { value: 'twitter', label: 'X / Twitter' },
          { value: 'youtube', label: 'YouTube' },
        ],
      },
      { name: 'handle', label: 'Username / Handle', type: 'text', placeholder: '@yourhandle', required: true },
    ],
  },
  app_store: {
    id: 'app_store',
    label: 'App Store',
    description: 'Link to iOS and/or Android app',
    icon: 'Smartphone',
    isDynamic: true,
    encode: encodeAppStore,
    fields: [
      { name: 'iosUrl', label: 'App Store URL (iOS)', type: 'url', placeholder: 'https://apps.apple.com/app/...' },
      { name: 'androidUrl', label: 'Google Play URL (Android)', type: 'url', placeholder: 'https://play.google.com/store/apps/...' },
    ],
  },
  event: {
    id: 'event',
    label: 'Event',
    description: 'Add event to calendar',
    icon: 'Calendar',
    isDynamic: false,
    encode: encodeEvent,
    fields: [
      { name: 'title', label: 'Event Title', type: 'text', placeholder: 'Company BBQ', required: true },
      { name: 'startDate', label: 'Start Date & Time', type: 'datetime-local', required: true },
      { name: 'endDate', label: 'End Date & Time', type: 'datetime-local', required: true },
      { name: 'location', label: 'Location', type: 'text', placeholder: '123 Main St or Zoom link' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Event details...' },
    ],
  },
}

export const PHASE1_TYPES = Object.values(QR_TYPES)

export function encodeQRPayload(type: Phase1QRType, data: Record<string, string>): string {
  return QR_TYPES[type].encode(data)
}
