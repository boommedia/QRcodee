import { Resend } from 'resend'

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set')
  return new Resend(process.env.RESEND_API_KEY)
}

const FROM = 'QRcodee <hello@qrcodee.online>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://qrcodee.online'

export async function sendWelcomeEmail(to: string, name: string) {
  const resend = getResend()
  const firstName = name?.split(' ')[0] || 'there'

  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Welcome to QRcodee — your first QR code is waiting',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#060d12;font-family:Inter,system-ui,sans-serif;color:#e0f2f8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060d12;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Logo -->
        <tr><td style="padding-bottom:32px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#0891b2;border-radius:10px;width:32px;height:32px;text-align:center;vertical-align:middle;">
                <span style="color:#fff;font-weight:700;font-size:11px;line-height:32px;">QR</span>
              </td>
              <td style="padding-left:10px;font-weight:700;font-size:16px;color:#e0f2f8;">QRcodee</td>
            </tr>
          </table>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#0a1520;border:1px solid #152a3a;border-radius:16px;padding:40px;">

          <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#e0f2f8;line-height:1.2;">
            Hey ${firstName}, welcome aboard 👋
          </h1>
          <p style="margin:0 0 24px;font-size:15px;color:#4d8090;line-height:1.6;">
            Your QRcodee account is active. You're on the <strong style="color:#22d3ee;">Free plan</strong> — 3 dynamic QR codes, scan analytics, and custom design included forever. No credit card needed.
          </p>

          <!-- Steps -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;width:100%;">
            ${[
              ['1', 'Create your first QR code', 'Pick a type — URL, vCard, Wi-Fi, WhatsApp, and 7 more.'],
              ['2', 'Customize the design', 'Add your logo, brand colors, and dot style.'],
              ['3', 'Download and publish', 'PNG, SVG, or PDF — print-ready at any size.'],
            ].map(([n, title, desc]) => `
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #152a3a;vertical-align:top;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:28px;height:28px;background:rgba(8,145,178,0.15);border-radius:8px;text-align:center;vertical-align:middle;font-size:12px;font-weight:700;color:#22d3ee;">
                      ${n}
                    </td>
                    <td style="padding-left:12px;">
                      <p style="margin:0;font-size:13px;font-weight:600;color:#e0f2f8;">${title}</p>
                      <p style="margin:4px 0 0;font-size:12px;color:#4d8090;">${desc}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`).join('')}
          </table>

          <!-- CTA -->
          <a href="${APP_URL}/dashboard/qr/new"
            style="display:inline-block;background:#0891b2;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 28px;border-radius:12px;box-shadow:0 4px 20px rgba(8,145,178,0.35);">
            Create Your First QR Code →
          </a>

          <p style="margin:24px 0 0;font-size:12px;color:#2d6070;">
            Questions? Reply to this email or reach us at <a href="mailto:hello@qrcodee.online" style="color:#22d3ee;">hello@qrcodee.online</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#2d6070;">
            © 2026 Boom Media LLC · <a href="${APP_URL}" style="color:#2d6070;">qrcodee.online</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}

export async function sendBillingConfirmationEmail(to: string, name: string, plan: string) {
  const resend = getResend()
  const firstName = name?.split(' ')[0] || 'there'
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1)

  const planLimits: Record<string, string> = {
    starter: '100 QR codes · 30-day analytics · 1 custom domain',
    pro: 'Unlimited QR codes · Full analytics history · Bulk creation · API access',
    agency: 'Everything in Pro · White-label · Client reports · Unlimited domains',
  }

  return resend.emails.send({
    from: FROM,
    to,
    subject: `You're now on QRcodee ${planLabel} — here's what you unlocked`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#060d12;font-family:Inter,system-ui,sans-serif;color:#e0f2f8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060d12;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <tr><td style="padding-bottom:32px;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="background:#0891b2;border-radius:10px;width:32px;height:32px;text-align:center;vertical-align:middle;">
              <span style="color:#fff;font-weight:700;font-size:11px;">QR</span>
            </td>
            <td style="padding-left:10px;font-weight:700;font-size:16px;color:#e0f2f8;">QRcodee</td>
          </tr></table>
        </td></tr>

        <tr><td style="background:#0a1520;border:1px solid #152a3a;border-radius:16px;padding:40px;">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#e0f2f8;">
            You're on ${planLabel} 🎉
          </h1>
          <p style="margin:0 0 24px;font-size:15px;color:#4d8090;line-height:1.6;">
            Hey ${firstName}, your upgrade is active. Here's what you now have:
          </p>

          <div style="background:rgba(8,145,178,0.08);border:1px solid rgba(8,145,178,0.25);border-radius:12px;padding:20px;margin-bottom:28px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#22d3ee;">${planLabel} Plan</p>
            <p style="margin:0;font-size:13px;color:#94c4d0;">${planLimits[plan] || 'All premium features'}</p>
          </div>

          <a href="${APP_URL}/dashboard"
            style="display:inline-block;background:#0891b2;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 28px;border-radius:12px;">
            Go to Dashboard →
          </a>

          <p style="margin:24px 0 0;font-size:12px;color:#2d6070;">
            Manage your subscription at <a href="${APP_URL}/billing" style="color:#22d3ee;">qrcodee.online/billing</a>
          </p>
        </td></tr>

        <tr><td style="padding-top:24px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#2d6070;">© 2026 Boom Media LLC · <a href="${APP_URL}" style="color:#2d6070;">qrcodee.online</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}
