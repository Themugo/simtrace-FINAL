// notify.ts — SimTrace notification service
// Supports: SMS via Africa's Talking, email via SendGrid

import pino, { Logger } from "pino";
import { User, Device, NotificationPreferences } from "../db/index.js";

const log: Logger = pino({ level: "info" }).child({ service: "notify" });

// ─────────────────────────────────────────────────────────────
// MAIN ALERT FUNCTION
// ─────────────────────────────────────────────────────────────
export async function sendAlert({ type, imei, userId, message }: {
  type: string;
  imei: string;
  userId?: string;
  message: string;
}): Promise<void> {
  try {
    log.info({ type, imei }, message);

    // Resolve device owner if not provided
    let ownerId = userId;

    if (!ownerId) {
      const device = await Device.findOne({ imei }).select("owner");
      ownerId = device?.owner ? device.owner.toString() : undefined;
    }

    if (!ownerId) return;

    const user = await User.findById(ownerId).select("email phone");
    if (!user) return;

    // Get user notification preferences
    const prefs = await NotificationPreferences.findOne({ user: ownerId });
    
    // Check if this alert type is enabled
    const alertTypeKey = type.replace(/_/g, '_') as keyof typeof prefs?.alertTypes;
    const alertEnabled = prefs?.alertTypes?.[alertTypeKey] !== false;

    if (!alertEnabled) {
      log.info({ userId: ownerId, type }, "Alert type disabled by user preferences");
      return;
    }

    // Check quiet hours
    if (prefs?.quietHours?.enabled) {
      const now = new Date();
      const userTime = convertToTimezone(now, prefs.quietHours.timezone);
      const [startHour, startMin] = prefs.quietHours.start.split(':').map(Number);
      const [endHour, endMin] = prefs.quietHours.end.split(':').map(Number);
      
      const currentTime = userTime.getHours() * 60 + userTime.getMinutes();
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      // Check if current time is within quiet hours
      let inQuietHours = false;
      if (startTime < endTime) {
        inQuietHours = currentTime >= startTime && currentTime < endTime;
      } else {
        // Handle overnight quiet hours (e.g., 22:00 to 08:00)
        inQuietHours = currentTime >= startTime || currentTime < endTime;
      }

      if (inQuietHours) {
        log.info({ userId: ownerId, type }, "Alert suppressed due to quiet hours");
        return;
      }
    }

    // Send notifications based on channel preferences
    const promises: Promise<void>[] = [];

    if (prefs?.channels?.sms !== false) {
      promises.push(sendSMS(user.phone, `[SimTrace] ${message}`));
    }

    if (prefs?.channels?.email !== false) {
      promises.push(sendEmail(user.email, `SimTrace Alert: ${type}`, message));
    }

    await Promise.allSettled(promises);
  } catch (err) {
    log.error({ err }, "sendAlert failed");
  }
}

// ─────────────────────────────────────────────────────────────
// TIMEZONE CONVERSION HELPER
// ─────────────────────────────────────────────────────────────
function convertToTimezone(date: Date, timezone: string): Date {
  const offset = getTimezoneOffset(timezone);
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (offset * 60000));
}

function getTimezoneOffset(timezone: string): number {
  const offsets: Record<string, number> = {
    'Africa/Nairobi': 3,
    'Africa/Lagos': 1,
    'Africa/Cairo': 2,
    'Europe/London': 0,
    'Europe/Paris': 1,
    'America/New_York': -5,
    'America/Los_Angeles': -8,
    'Asia/Dubai': 4,
    'Asia/Tokyo': 9,
  };
  return offsets[timezone] || 0;
}

// ─────────────────────────────────────────────────────────────
// AFRICA'S TALKING SMS
// ─────────────────────────────────────────────────────────────
async function sendSMS(phone: string | undefined, text: string): Promise<void> {
  try {
    if (!process.env.AT_API_KEY || !phone) return;

    const body = new URLSearchParams({
      username: process.env.AT_USERNAME || "sandbox",
      to: phone,
      message: text,
      from: process.env.AT_SENDER_ID || "SimTrace",
    });

    const res = await fetch("https://api.africastalking.com/version1/messaging", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        apiKey: process.env.AT_API_KEY,
      },
      body,
    });

    const json = await res.json();

    if (!res.ok) {
      log.error({ status: res.status, response: json }, "[SMS] Failed");
    } else {
      log.info({ phone }, "[SMS] Sent");
    }
  } catch (err) {
    log.error({ err }, "sendSMS error");
  }
}

// ─────────────────────────────────────────────────────────────
// SENDGRID EMAIL
// ─────────────────────────────────────────────────────────────
async function sendEmail(to: string | undefined, subject: string, body: string): Promise<void> {
  try {
    if (!process.env.SENDGRID_API_KEY || !to) return;

    const html = buildAlertEmail(subject, body);

    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: {
          email: process.env.FROM_EMAIL || "alerts@simtrace.site",
          name: "SimTrace Alerts",
        },
        subject,
        content: [
          { type: "text/plain", value: body },
          { type: "text/html", value: html },
        ],
      }),
    });

    if (!res.ok) {
      log.error({ to, status: res.status }, "[Email] Failed");
    } else {
      log.info({ to }, "[Email] Sent");
    }
  } catch (err) {
    log.error({ err }, "sendEmail error");
  }
}

// ─────────────────────────────────────────────────────────────
// SAFE HTML ESCAPE (prevents regex + injection issues)
// ─────────────────────────────────────────────────────────────
function escapeHtml(str: string = ""): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ─────────────────────────────────────────────────────────────
// EMAIL TEMPLATE
// ─────────────────────────────────────────────────────────────
function buildAlertEmail(subject: string, body: string): string {
  const iconMap: Record<string, string> = {
    theft_report: "🚨",
    sim_swap: "🔄",
    location_jump: "⚡",
    fraud_pattern: "🕵️",
    blacklist_ping: "📡",
  };

  const key = Object.keys(iconMap).find((k) =>
    subject.toLowerCase().includes(k.replace("_", " "))
  );

  const icon = iconMap[key || ""] || "🔔";

  const safeBody = escapeHtml(body || "").replace(/\n/g, "<br>");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>

<body style="margin:0;padding:0;background:#0a0f1e;font-family:Inter,system-ui,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1e;padding:32px 16px;">
    <tr>
      <td align="center">

        <table width="560" cellpadding="0" cellspacing="0"
          style="background:#161b27;border-radius:16px;border:1px solid #1e293b;overflow:hidden;max-width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#0ea5e9,#6366f1);padding:24px 32px;">
              <table width="100%">
                <tr>
                  <td>
                    <div style="font-size:22px;font-weight:900;color:#fff;">
                      SIM<span style="color:#bfdbfe;">TRACE</span>™
                    </div>
                    <div style="font-size:11px;color:#bfdbfe;">
                      CONNECT · PROTECT · RECOVER
                    </div>
                  </td>
                  <td align="right" style="font-size:36px;">${icon}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px;font-size:20px;color:#f1f5f9;">
                ${escapeHtml(subject)}
              </h2>

              <div style="background:#0f1117;border-left:3px solid #0ea5e9;border-radius:4px 12px 12px 4px;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0;font-size:15px;line-height:1.7;color:#cbd5e1;">
                  ${safeBody}
                </p>
              </div>

              <a href="${process.env.FRONTEND_URL || "https://simtrace.site"}/dashboard"
                 style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#6366f1);color:#fff;text-decoration:none;padding:12px 28px;border-radius:9px;font-weight:700;">
                View Dashboard →
              </a>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #1e293b;">
              <p style="margin:0;font-size:12px;color:#475569;">
                SimTrace alerts system • Manage notifications in your profile
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}
