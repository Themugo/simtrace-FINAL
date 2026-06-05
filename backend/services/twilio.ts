// services/twilio.ts — Twilio voice (call) + SMS, env-gated.
// Set TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER to enable.
const SID = process.env.TWILIO_ACCOUNT_SID;
const TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM = process.env.TWILIO_FROM_NUMBER;

export function twilioConfigured(): boolean {
  return !!(SID && TOKEN && FROM);
}

function authHeader(): string {
  return "Basic " + Buffer.from(`${SID}:${TOKEN}`).toString("base64");
}

// Places a voice call that reads the code aloud (TwiML <Say>).
export async function placeVerificationCall(to: string, code: string): Promise<boolean> {
  if (!twilioConfigured()) return false;
  const spoken = code.split("").join(", ");
  const twiml = `<Response><Say voice="alice">Your Sim Trace verification code is ${spoken}. Again, ${spoken}.</Say></Response>`;
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}/Calls.json`, {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: to, From: FROM!, Twiml: twiml }),
  });
  return res.ok;
}

export async function sendTwilioSms(to: string, text: string): Promise<boolean> {
  if (!twilioConfigured()) return false;
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`, {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: to, From: FROM!, Body: text }),
  });
  return res.ok;
}
