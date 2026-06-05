// routes/oauth.ts — "Continue with Google" social login.
// Activates automatically once GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET /
// GOOGLE_REDIRECT_URI are set. Until then the endpoints return 501 so the
// frontend can hide/disable the button gracefully.
import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { User, Subscription } from "../db/index.js";
import { signToken } from "../middleware/auth.js";

const router = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || `${process.env.BACKEND_URL || ""}/api/auth/oauth/google/callback`;
const SUCCESS_REDIRECT = process.env.OAUTH_SUCCESS_REDIRECT || `${process.env.FRONTEND_URL || ""}/dashboard`;

const googleConfigured = () => !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);

// Stateless, signed CSRF state (HMAC over a nonce + timestamp).
function makeState(): string {
  const payload = `${crypto.randomBytes(12).toString("hex")}.${Date.now()}`;
  const sig = crypto.createHmac("sha256", process.env.JWT_SECRET || "dev").update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}
function validState(state?: string): boolean {
  try {
    if (!state) return false;
    const decoded = Buffer.from(state, "base64url").toString();
    const [nonce, ts, sig] = decoded.split(".");
    const expected = crypto.createHmac("sha256", process.env.JWT_SECRET || "dev").update(`${nonce}.${ts}`).digest("hex");
    if (sig !== expected) return false;
    return Date.now() - Number(ts) < 10 * 60 * 1000; // 10 min
  } catch {
    return false;
  }
}

// ── GET /api/auth/oauth/google ────────────────────────────────────────────────
router.get("/google", (_req: Request, res: Response) => {
  if (!googleConfigured()) {
    return res.status(501).json({ error: "Google login is not configured." });
  }
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID!,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    state: makeState(),
    access_type: "online",
    prompt: "select_account",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// ── GET /api/auth/oauth/google/callback ───────────────────────────────────────
router.get("/google/callback", async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!googleConfigured()) return res.status(501).json({ error: "Google login is not configured." });
    const { code, state } = req.query as { code?: string; state?: string };
    if (!code || !validState(state)) return res.status(400).json({ error: "Invalid OAuth state or code." });

    // Exchange code for tokens.
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    const tokens: any = await tokenRes.json();
    if (!tokens.access_token) return res.status(401).json({ error: "Google token exchange failed." });

    // Fetch the verified profile.
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile: any = await profileRes.json();
    if (!profile.email) return res.status(401).json({ error: "Could not read Google profile." });

    // Find-or-create / link the account.
    let user = await User.findOne({ email: profile.email.toLowerCase() });
    if (!user) {
      user = await User.create({
        name: profile.name || profile.email.split("@")[0],
        email: profile.email.toLowerCase(),
        role: "user",
        authProvider: "google",
        providerId: profile.sub,
        emailVerified: !!profile.email_verified,
      });
      await Subscription.create({ user: user._id, plan: "free", status: "active" });
    } else if (!user.providerId) {
      user.authProvider = "google";
      user.providerId = profile.sub;
      if (profile.email_verified) user.emailVerified = true;
      await user.save();
    }

    const token = signToken(user);
    const sep = SUCCESS_REDIRECT.includes("?") ? "&" : "?";
    res.redirect(`${SUCCESS_REDIRECT}${sep}token=${encodeURIComponent(token)}`);
  } catch (err) {
    next(err);
  }
});

// Lets the frontend know whether to show the Google button.
router.get("/providers", (_req: Request, res: Response) => {
  res.json({ google: googleConfigured() });
});

export default router;
