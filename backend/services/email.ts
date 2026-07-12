// services/email.ts — shared transactional email sending (SendGrid REST API).
// Falls back to a console log in dev / when SENDGRID_API_KEY isn't configured,
// so nothing crashes locally or in an unconfigured environment — but note that
// silent fallback is also exactly why password-reset/verification emails can
// appear to "not work" in production: if SENDGRID_API_KEY isn't set on the
// deployed backend, every email silently no-ops instead of sending.

const FROM_EMAIL = process.env.FROM_EMAIL || "no-reply@simtrace.site";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@simtrace.local";
const BRAND_WRAP = (title: string, bodyHtml: string) => `
  <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #0f1117; color: #f1f5f9; border-radius: 12px;">
    <div style="margin-bottom: 24px;">
      <span style="font-size: 24px; font-weight: 900; letter-spacing: 0.05em;">SIM<span style="color: #0ea5e9;">TRACE</span>&trade;</span>
    </div>
    <h2 style="margin: 0 0 12px; font-size: 20px;">${title}</h2>
    ${bodyHtml}
    <p style="color: #475569; font-size: 13px; margin: 24px 0 0; line-height: 1.6;">
      If you didn't expect this email, you can safely ignore it.<br>
      Questions? Contact <a href="mailto:${SUPPORT_EMAIL}" style="color: #0ea5e9;">${SUPPORT_EMAIL}</a>
    </p>
  </div>
`;

/** Low-level send. Always resolves (never throws) so a bad/missing key never
 *  crashes the caller's request — callers should still log the outcome. */
export async function sendEmail(to: string, subject: string, html: string): Promise<{ sent: boolean; reason?: string }> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log(`[Email] SENDGRID_API_KEY not set — would have sent "${subject}" to ${to}`);
    return { sent: false, reason: "no_api_key" };
  }
  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: FROM_EMAIL, name: "SimTrace" },
        subject,
        content: [{ type: "text/html", value: html }],
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[Email] SendGrid ${res.status} sending "${subject}" to ${to}: ${body.slice(0, 300)}`);
      return { sent: false, reason: `sendgrid_${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    console.error(`[Email] Failed sending "${subject}" to ${to}:`, err instanceof Error ? err.message : String(err));
    return { sent: false, reason: "network_error" };
  }
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  const body = `
    <p style="color: #94a3b8; margin: 0 0 24px; line-height: 1.6;">
      Hi ${name}, we received a request to reset your SimTrace password. Click the button below to set a new password.
      This link expires in <strong style="color: #f1f5f9;">1 hour</strong>.
    </p>
    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9, #6366f1); color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 9px; font-weight: 700; font-size: 15px;">
      Reset Password
    </a>
    <p style="color: #475569; font-size: 13px; margin: 20px 0 0; line-height: 1.6;">
      If you didn't request this, ignore this email — your password won't change.
    </p>
  `;
  return sendEmail(to, "Reset your SimTrace password", BRAND_WRAP("Reset your password", body));
}

export async function sendVerificationEmail(to: string, name: string, verifyUrl: string) {
  const body = `
    <p style="color: #94a3b8; margin: 0 0 24px; line-height: 1.6;">
      Hi ${name}, welcome to SimTrace! Please confirm this is your email address so we can send you
      theft alerts and account notifications. This link expires in <strong style="color: #f1f5f9;">24 hours</strong>.
    </p>
    <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #0ea5e9); color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 9px; font-weight: 700; font-size: 15px;">
      Verify Email Address
    </a>
    <p style="color: #475569; font-size: 13px; margin: 20px 0 0; line-height: 1.6;">
      You can still use your account before verifying — this just confirms we can reach you.
    </p>
  `;
  return sendEmail(to, "Verify your SimTrace email", BRAND_WRAP("Verify your email", body));
}
