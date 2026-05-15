// ── Plan tiers ──────────────────────────────────────────────
export type PlanTier = 'free' | 'starter' | 'pro' | 'agency'

// ── QR code types ───────────────────────────────────────────
export type QRType =
  | 'url'
  | 'vcard'
  | 'wifi'
  | 'email'
  | 'sms'
  | 'phone'
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'linkedin'
  | 'pdf'
  | 'text'
  | 'app_store'
  | 'multi_url'
  | 'menu'
  | 'event'
  | 'coupon'
  | 'video'
  | 'image_gallery'
  | 'business_page'

// ── QR design config ─────────────────────────────────────────
export interface QRDesignConfig {
  foreground_color: string
  background_color: string
  dot_style: 'square' | 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'extra-rounded'
  corner_dot_style: 'square' | 'dot'
  corner_square_style: 'square' | 'dot' | 'extra-rounded'
  corner_color?: string
  dot_gradient_enabled?: boolean
  dot_gradient_end_color?: string
  dot_gradient_type?: 'linear' | 'radial'
  qr_size?: number
  qr_margin?: number
  logo_url?: string
  logo_size?: number
  logo_hide_background?: boolean
  frame_style?: string
  frame_text?: string
  frame_color?: string
  error_correction: 'L' | 'M' | 'Q' | 'H'
}

// ── QR code record ───────────────────────────────────────────
export interface QRCode {
  id: string
  user_id: string
  type: QRType
  name: string
  destination_url: string | null
  short_slug: string
  is_dynamic: boolean
  is_paused: boolean
  folder_id: string | null
  design_config: QRDesignConfig
  qr_data: Record<string, string>
  scan_count: number
  created_at: string
  updated_at: string
}

// ── Scan event ───────────────────────────────────────────────
export interface ScanEvent {
  id: string
  qr_id: string
  scanned_at: string
  country?: string
  city?: string
  region?: string
  device?: string
  os?: string
  browser?: string
  user_agent?: string
}

// ── Folder ───────────────────────────────────────────────────
export interface Folder {
  id: string
  user_id: string
  name: string
  color: string
  qr_count?: number
  created_at: string
}

// ── Subscription ─────────────────────────────────────────────
export interface UserSubscription {
  plan: PlanTier
  stripe_customer_id?: string
  stripe_subscription_id?: string
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'inactive'
  current_period_end?: string
  trial_end?: string
}

// ── Plan limits ──────────────────────────────────────────────
export const PLAN_LIMITS: Record<
  PlanTier,
  {
    qr_codes: number
    analytics_days: number
    bulk_batch: number
    team_seats: number
    api_access: boolean
    white_label: boolean
    custom_domains: number
    pdf_export: boolean
    ai_suggestions: boolean
    csv_export: boolean
    client_reports: boolean
  }
> = {
  free: {
    qr_codes: 3,
    analytics_days: 7,
    bulk_batch: 0,
    team_seats: 1,
    api_access: false,
    white_label: false,
    custom_domains: 0,
    pdf_export: false,
    ai_suggestions: false,
    csv_export: false,
    client_reports: false,
  },
  starter: {
    qr_codes: 100,
    analytics_days: 30,
    bulk_batch: 0,
    team_seats: 1,
    api_access: false,
    white_label: false,
    custom_domains: 1,
    pdf_export: false,
    ai_suggestions: false,
    csv_export: false,
    client_reports: false,
  },
  pro: {
    qr_codes: Infinity,
    analytics_days: Infinity,
    bulk_batch: 500,
    team_seats: 3,
    api_access: true,
    white_label: false,
    custom_domains: 5,
    pdf_export: true,
    ai_suggestions: true,
    csv_export: true,
    client_reports: false,
  },
  agency: {
    qr_codes: Infinity,
    analytics_days: Infinity,
    bulk_batch: Infinity,
    team_seats: 10,
    api_access: true,
    white_label: true,
    custom_domains: Infinity,
    pdf_export: true,
    ai_suggestions: true,
    csv_export: true,
    client_reports: true,
  },
}

// ── API key ──────────────────────────────────────────────────
export interface ApiKey {
  id: string
  user_id: string
  name: string
  key_prefix: string
  last_used?: string
  created_at: string
}
