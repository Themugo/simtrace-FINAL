"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../components/ToastProvider";

const PLAN_COLOR: Record<string, string> = { free:"var(--muted)", pro:"var(--sky)", business:"var(--violet)", enterprise:"var(--amber)" };

const TABS = [
  { id:"account",      icon:"👤", label:"Account"      },
  { id:"subscription", icon:"💳", label:"Subscription" },
  { id:"invoices",     icon:"📄", label:"Invoices"     },
  { id:"notifications",icon:"🔔", label:"Notifications"},
  { id:"security",     icon:"🔒", label:"Security"     },
];

interface Subscription {
  plan: string;
  status: string;
  currentPeriodEnd?: string;
  slotsUsed?: number;
  totalAllowed?: number;
  extraDevices?: number;
  slotsRemaining?: number;
}

interface Invoice {
  _id?: string;
  description?: string;
  type?: string;
  method?: string;
  paidAt?: string;
  mpesaReceipt?: string;
  amountKES?: number;
  amountUSD?: number;
  status: string;
}

interface NotificationPreferences {
  channels: {
    sms: boolean;
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  alertTypes: {
    theft_report: boolean;
    sim_swap: boolean;
    location_jump: boolean;
    fraud_pattern: boolean;
    blacklist_ping: boolean;
    recovery_update: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
}

export default function ProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const toast  = useToast();

  const [tab,      setTab]     = useState("account");
  const [sub,      setSub]     = useState<Subscription | null>(null);
  const [invoices, setInvoices]= useState<Invoice[]>([]);
  const [phone,    setPhone]   = useState("");
  const [name,     setName]    = useState("");
  const [saving,   setSaving]  = useState(false);
  const [pwForm,   setPwForm]  = useState({ current:"", next:"", confirm:"" });
  const [pwSaving, setPwSaving]= useState(false);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences | null>(null);
  const [notifSaving, setNotifSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login"); return; }
    if (user) {
      setPhone(user.phone || "");
      setName(user.name  || "");
      api.get("/api/billing/subscription").then(setSub).catch(() => {});
      api.get("/api/billing/invoices").then(setInvoices).catch(() => {});
      api.get("/api/notification-preferences").then(setNotifPrefs).catch(() => {});
    }
  }, [user, authLoading]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch("/api/auth/update-profile", { phone, name });
      toast?.add("Profile updated successfully", "success");
    } catch (err: any) { toast?.add(err.message, "danger"); }
    finally { setSaving(false); }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { toast?.add("Passwords don't match", "danger"); return; }
    if (pwForm.next.length < 8)        { toast?.add("Password must be at least 8 characters", "danger"); return; }
    setPwSaving(true);
    try {
      await api.post("/api/auth/change-password", { currentPassword: pwForm.current, newPassword: pwForm.next });
      toast?.add("Password updated successfully", "success");
      setPwForm({ current:"", next:"", confirm:"" });
    } catch (err: any) { toast?.add(err.message, "danger"); }
    finally { setPwSaving(false); }
  }

  async function saveNotificationPreferences() {
    if (!notifPrefs) return;
    setNotifSaving(true);
    try {
      await api.put("/api/notification-preferences", notifPrefs);
      toast?.add("Notification preferences saved", "success");
    } catch (err: any) { toast?.add(err.message, "danger"); }
    finally { setNotifSaving(false); }
  }

  if (authLoading || !user) return (
    <div style={{ padding:"3rem", textAlign:"center", color:"var(--muted)" }}>Loading…</div>
  );

  const plan = sub?.plan || "free";

  return (
    <div style={{ maxWidth:700 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1.75rem" }}>
        <div style={{ width:56, height:56, borderRadius:"50%", background:"linear-gradient(135deg,var(--sky-dim),var(--indigo-dim))", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:"1.3rem", color:"#fff", flexShrink:0 }}>
          {user.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <h1 style={{ marginBottom:3 }}>{user.name}</h1>
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
            <span style={{ color:"var(--muted)", fontSize:"0.88rem" }}>{user.email}</span>
            <span className={`badge badge-${plan === "pro" ? "info" : plan === "business" ? "indigo" : plan === "enterprise" ? "warn" : "muted"}`} style={{ textTransform:"capitalize" }}>
              {plan}
            </span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display:"flex", gap:0, borderBottom:"1px solid var(--border)", marginBottom:"1.5rem" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background:"transparent", border:"none",
            color: tab===t.id ? "var(--sky)" : "var(--muted)",
            fontWeight: tab===t.id ? 700 : 400,
            fontSize:"0.88rem", cursor:"pointer",
            padding:"0.55rem 1rem",
            borderBottom:`2px solid ${tab===t.id ? "var(--sky)" : "transparent"}`,
            transition:"all 0.15s", display:"flex", alignItems:"center", gap:"0.35rem",
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Account tab ── */}
      {tab === "account" && (
        <div className="card">
          <h3 style={{ marginBottom:"1.25rem" }}>Profile Details</h3>
          <form onSubmit={saveProfile} style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
            <div>
              <label className="label">Display name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <label className="label">Email address</label>
              <input value={user.email} disabled style={{ opacity:0.5, cursor:"not-allowed" }} />
            </div>
            <div>
              <label className="label">Mobile number <span style={{ color:"var(--dim)", fontWeight:400 }}>— for SMS theft alerts</span></label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 712 345 678" />
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Subscription tab ── */}
      {tab === "subscription" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          {sub ? (
            <div className="card" style={{ borderLeft:`3px solid ${PLAN_COLOR[plan]}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"0.75rem", marginBottom:"1.25rem" }}>
                <div>
                  <div style={{ fontWeight:800, fontSize:"1.2rem", textTransform:"capitalize", marginBottom:3 }}>{plan} Plan</div>
                  <div style={{ color:"var(--muted)", fontSize:"0.85rem" }}>
                    {plan === "free" ? "Free forever" : sub.currentPeriodEnd ? `Renews ${new Date(sub.currentPeriodEnd).toLocaleDateString("en-KE", { day:"numeric", month:"long", year:"numeric" })}` : "Active"}
                  </div>
                </div>
                <span className={`badge ${sub.status === "active" ? "badge-ok" : "badge-warn"}`}>
                  {sub.status}
                </span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"0.75rem" }}>
                {([
                  ["Devices used",    `${sub.slotsUsed ?? "—"} / ${sub.totalAllowed ?? "—"}`,  "var(--sky)"],
                  ["Extra slots",     sub.extraDevices || 0,                                     "var(--emerald)"],
                  ["Remaining",       sub.slotsRemaining ?? "—",                                 "var(--violet)"],
                ] as const).map(([k,v,c]) => (
                  <div key={k} style={{ background:"var(--bg)", borderRadius:8, padding:"0.75rem" }}>
                    <div style={{ fontSize:"0.68rem", color:"var(--muted)", marginBottom:3, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600 }}>{k}</div>
                    <div style={{ fontSize:"1.3rem", fontWeight:800, color:c }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign:"center", padding:"2rem" }}>
              <p className="text-muted">Loading subscription…</p>
            </div>
          )}
          {plan !== "enterprise" && (
            <a href="/pricing" className="btn-primary" style={{ display:"block", textAlign:"center", textDecoration:"none", padding:"0.8rem" }}>
              {plan === "free" ? "Upgrade Plan →" : "Manage Plan →"}
            </a>
          )}
        </div>
      )}

      {/* ── Invoices tab ── */}
      {tab === "invoices" && (
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          <div style={{ padding:"0.85rem 1.1rem", borderBottom:"1px solid var(--border)", fontWeight:700, fontSize:"0.9rem" }}>
            Payment History
          </div>
          {invoices.length === 0 ? (
            <div style={{ padding:"2.5rem", textAlign:"center", color:"var(--muted)" }}>
              <div style={{ fontSize:"2rem", marginBottom:"0.5rem" }}>📄</div>
              No payments yet
            </div>
          ) : invoices.map((inv, i) => (
            <div key={inv._id || i} style={{ display:"flex", alignItems:"center", gap:"0.85rem", padding:"0.8rem 1.1rem", borderBottom:"1px solid var(--border)" }}>
              <div style={{ width:36, height:36, borderRadius:9, background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem", flexShrink:0 }}>
                💳
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:500, fontSize:"0.9rem" }}>{inv.description || inv.type}</div>
                <div style={{ fontSize:"0.75rem", color:"var(--muted)" }}>
                  {inv.method?.toUpperCase()} · {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString("en-KE") : "Pending"}
                  {inv.mpesaReceipt && ` · ${inv.mpesaReceipt}`}
                </div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                {inv.amountKES && inv.amountKES > 0 && <div style={{ fontWeight:700, color:"var(--emerald)" }}>KES {inv.amountKES.toLocaleString()}</div>}
                {inv.amountUSD && inv.amountUSD > 0 && <div style={{ fontSize:"0.78rem", color:"var(--sky)" }}>USD {inv.amountUSD}</div>}
              </div>
              <span className={`badge ${inv.status === "completed" ? "badge-ok" : "badge-warn"}`} style={{ flexShrink:0 }}>
                {inv.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Security tab ── */}
      {tab === "security" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          <div className="card">
            <h3 style={{ marginBottom:"1.25rem" }}>Change Password</h3>
            <form onSubmit={changePassword} style={{ display:"flex", flexDirection:"column", gap:"0.9rem" }}>
              <div>
                <label className="label">Current password</label>
                <input type="password" required placeholder="••••••••"
                  value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current:e.target.value }))} />
              </div>
              <div>
                <label className="label">New password</label>
                <input type="password" required placeholder="Min 8 characters"
                  value={pwForm.next} onChange={e => setPwForm(p => ({ ...p, next:e.target.value }))} />
              </div>
              <div>
                <label className="label">Confirm new password</label>
                <input type="password" required placeholder="Repeat new password"
                  value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm:e.target.value }))} />
              </div>
              <div style={{ display:"flex", justifyContent:"flex-end" }}>
                <button type="submit" className="btn-primary" disabled={pwSaving}>
                  {pwSaving ? "Updating…" : "Update Password"}
                </button>
              </div>
            </form>
          </div>

          <div className="card" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"0.75rem" }}>
            <div>
              <div style={{ fontWeight:600, marginBottom:2 }}>Sign out of all sessions</div>
              <p style={{ color:"var(--muted)", fontSize:"0.85rem", margin:0 }}>
                Invalidates your current token and logs out all devices.
              </p>
            </div>
            <button onClick={() => { logout(); router.push("/"); }}
              style={{ background:"transparent", border:"1px solid var(--rose)", color:"var(--rose)", borderRadius:"var(--r)", padding:"7px 18px", cursor:"pointer", fontSize:"0.88rem", fontWeight:600 }}>
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ── Notifications tab ── */}
      {tab === "notifications" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          <div className="card">
            <h3 style={{ marginBottom:"1.25rem" }}>Notification Channels</h3>
            <p style={{ color:"var(--muted)", fontSize:"0.85rem", marginBottom:"1rem" }}>
              Choose how you want to receive alerts about your devices.
            </p>
            {notifPrefs && (
              <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
                {[
                  { key:"sms", label:"SMS", icon:"📱", desc:"Text message alerts" },
                  { key:"email", label:"Email", icon:"📧", desc:"Email notifications" },
                  { key:"push", label:"Push", icon:"🔔", desc:"In-app push notifications" },
                  { key:"inApp", label:"In-App", icon:"💬", desc:"Dashboard notifications" },
                ].map(({ key, label, icon, desc }) => (
                  <div key={key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.75rem", background:"var(--bg)", borderRadius:8 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
                      <span style={{ fontSize:"1.2rem" }}>{icon}</span>
                      <div>
                        <div style={{ fontWeight:600, fontSize:"0.9rem" }}>{label}</div>
                        <div style={{ fontSize:"0.75rem", color:"var(--muted)" }}>{desc}</div>
                      </div>
                    </div>
                    <label style={{ display:"flex", alignItems:"center", gap:"0.5rem", cursor:"pointer" }}>
                      <input
                        type="checkbox"
                        checked={notifPrefs.channels[key as keyof typeof notifPrefs.channels]}
                        onChange={(e) => setNotifPrefs({
                          ...notifPrefs,
                          channels: { ...notifPrefs.channels, [key]: e.target.checked }
                        })}
                        style={{ width:18, height:18, cursor:"pointer" }}
                      />
                      <span style={{ fontSize:"0.85rem", color: notifPrefs.channels[key as keyof typeof notifPrefs.channels] ? "var(--emerald)" : "var(--muted)" }}>
                        {notifPrefs.channels[key as keyof typeof notifPrefs.channels] ? "Enabled" : "Disabled"}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom:"1.25rem" }}>Alert Types</h3>
            <p style={{ color:"var(--muted)", fontSize:"0.85rem", marginBottom:"1rem" }}>
              Choose which types of alerts you want to receive.
            </p>
            {notifPrefs && (
              <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
                {[
                  { key:"theft_report", label:"Theft Reports", icon:"🚨", desc:"When a device is reported stolen" },
                  { key:"sim_swap", label:"SIM Swaps", icon:"🔄", desc:"When SIM card is changed" },
                  { key:"location_jump", label:"Location Jumps", icon:"⚡", desc:"Unusual location changes" },
                  { key:"fraud_pattern", label:"Fraud Patterns", icon:"🕵️", desc:"Suspicious activity detected" },
                  { key:"blacklist_ping", label:"Blacklist Alerts", icon:"📡", desc:"Device appears on blacklist" },
                  { key:"recovery_update", label:"Recovery Updates", icon:"✅", desc:"Device recovery progress" },
                ].map(({ key, label, icon, desc }) => (
                  <div key={key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.75rem", background:"var(--bg)", borderRadius:8 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
                      <span style={{ fontSize:"1.2rem" }}>{icon}</span>
                      <div>
                        <div style={{ fontWeight:600, fontSize:"0.9rem" }}>{label}</div>
                        <div style={{ fontSize:"0.75rem", color:"var(--muted)" }}>{desc}</div>
                      </div>
                    </div>
                    <label style={{ display:"flex", alignItems:"center", gap:"0.5rem", cursor:"pointer" }}>
                      <input
                        type="checkbox"
                        checked={notifPrefs.alertTypes[key as keyof typeof notifPrefs.alertTypes]}
                        onChange={(e) => setNotifPrefs({
                          ...notifPrefs,
                          alertTypes: { ...notifPrefs.alertTypes, [key]: e.target.checked }
                        })}
                        style={{ width:18, height:18, cursor:"pointer" }}
                      />
                      <span style={{ fontSize:"0.85rem", color: notifPrefs.alertTypes[key as keyof typeof notifPrefs.alertTypes] ? "var(--emerald)" : "var(--muted)" }}>
                        {notifPrefs.alertTypes[key as keyof typeof notifPrefs.alertTypes] ? "Enabled" : "Disabled"}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom:"1.25rem" }}>Quiet Hours</h3>
            <p style={{ color:"var(--muted)", fontSize:"0.85rem", marginBottom:"1rem" }}>
              Suppress non-critical alerts during specific hours.
            </p>
            {notifPrefs && (
              <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
                <label style={{ display:"flex", alignItems:"center", gap:"0.75rem", cursor:"pointer" }}>
                  <input
                    type="checkbox"
                    checked={notifPrefs.quietHours.enabled}
                    onChange={(e) => setNotifPrefs({
                      ...notifPrefs,
                      quietHours: { ...notifPrefs.quietHours, enabled: e.target.checked }
                    })}
                    style={{ width:18, height:18, cursor:"pointer" }}
                  />
                  <span style={{ fontSize:"0.9rem", fontWeight:600 }}>Enable quiet hours</span>
                </label>
                {notifPrefs.quietHours.enabled && (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
                    <div>
                      <label className="label">Start time</label>
                      <input
                        type="time"
                        value={notifPrefs.quietHours.start}
                        onChange={(e) => setNotifPrefs({
                          ...notifPrefs,
                          quietHours: { ...notifPrefs.quietHours, start: e.target.value }
                        })}
                        style={{ width:"100%" }}
                      />
                    </div>
                    <div>
                      <label className="label">End time</label>
                      <input
                        type="time"
                        value={notifPrefs.quietHours.end}
                        onChange={(e) => setNotifPrefs({
                          ...notifPrefs,
                          quietHours: { ...notifPrefs.quietHours, end: e.target.value }
                        })}
                        style={{ width:"100%" }}
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="label">Timezone</label>
                  <select
                    value={notifPrefs.quietHours.timezone}
                    onChange={(e) => setNotifPrefs({
                      ...notifPrefs,
                      quietHours: { ...notifPrefs.quietHours, timezone: e.target.value }
                    })}
                    style={{ width:"100%" }}
                  >
                    <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                    <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                    <option value="Africa/Cairo">Africa/Cairo (EET)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Europe/Paris">Europe/Paris (CET)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <button onClick={saveNotificationPreferences} className="btn-primary" disabled={notifSaving} style={{ width:"100%" }}>
            {notifSaving ? "Saving…" : "Save Notification Preferences"}
          </button>
        </div>
      )}
    </div>
  );
}
