"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../components/ToastProvider";

const STATUS_COLOR = { active:"var(--emerald)", pending:"var(--amber)", rejected:"var(--rose)", paused:"var(--muted)", exhausted:"var(--dim)" };
const STATUS_ICON  = { active:"🟢", pending:"⏳", rejected:"❌", paused:"⏸️", exhausted:"💸" };

function CampaignCard({ ad }) {
  const ctr        = ad.impressions ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : "0.00";
  const budgetPct  = ad.budgetKES   ? Math.min(100, Math.round((ad.spentKES / ad.budgetKES) * 100)) : 0;
  const remaining  = (ad.budgetKES || 0) - (ad.spentKES || 0);

  return (
    <div className="card" style={{ borderLeft:`3px solid ${STATUS_COLOR[ad.status] || "var(--muted)"}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"0.75rem", marginBottom:"0.85rem" }}>
        <div>
          <div style={{ fontWeight:700, fontSize:"1rem", marginBottom:2 }}>{ad.title}</div>
          <div style={{ color:"var(--muted)", fontSize:"0.82rem" }}>{ad.body}</div>
          <div style={{ marginTop:4, display:"flex", gap:"0.5rem", flexWrap:"wrap", alignItems:"center" }}>
            <span style={{ background: STATUS_COLOR[ad.status]+"22", color: STATUS_COLOR[ad.status], padding:"2px 8px", borderRadius:20, fontSize:"0.72rem", fontWeight:700 }}>
              {STATUS_ICON[ad.status]} {ad.status}
            </span>
            <span style={{ fontSize:"0.75rem", color:"var(--dim)" }}>
              📍 {ad.placement?.replace(/_/g," ")}
            </span>
            <span style={{ fontSize:"0.75rem", color:"var(--dim)" }}>
              💰 KES {ad.cpcKES || 5}/click
            </span>
          </div>
        </div>
        <a href={ad.ctaUrl} target="_blank" rel="noopener noreferrer"
          style={{ fontSize:"0.78rem", color:"var(--sky)", whiteSpace:"nowrap" }}>
          {ad.ctaText || "View →"} ↗
        </a>
      </div>

      {/* Stats grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"0.6rem", marginBottom:"0.85rem" }}>
        {[
          ["Impressions", ad.impressions?.toLocaleString() || 0,  "var(--sky)"],
          ["Clicks",      ad.clicks?.toLocaleString() || 0,       "var(--indigo)"],
          ["CTR",         `${ctr}%`,                              ctr >= 2 ? "var(--emerald)" : "var(--muted)"],
          ["Spent",       `KES ${(ad.spentKES||0).toLocaleString()}`, "var(--amber)"],
        ].map(([l,v,c]) => (
          <div key={l} style={{ background:"var(--bg)", borderRadius:8, padding:"0.6rem 0.75rem" }}>
            <div style={{ fontSize:"0.68rem", color:"var(--muted)", marginBottom:2, textTransform:"uppercase", letterSpacing:"0.06em" }}>{l}</div>
            <div style={{ fontSize:"1rem", fontWeight:700, color:c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Budget progress */}
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.75rem", color:"var(--muted)", marginBottom:4 }}>
          <span>Budget used: {budgetPct}%</span>
          <span>KES {remaining.toLocaleString()} remaining</span>
        </div>
        <div style={{ background:"var(--border)", borderRadius:4, height:6, overflow:"hidden" }}>
          <div style={{ width:`${budgetPct}%`, height:"100%", background: budgetPct >= 90 ? "var(--rose)" : budgetPct >= 70 ? "var(--amber)" : "var(--emerald)", transition:"width 0.6s ease", borderRadius:4 }} />
        </div>
      </div>

      {ad.status === "pending" && (
        <div style={{ marginTop:"0.75rem", background:"var(--amber)11", border:"1px solid var(--amber)33", borderRadius:8, padding:"0.5rem 0.75rem", fontSize:"0.8rem", color:"var(--amber)" }}>
          ⏳ Your campaign is pending admin review — usually within 24 hours.
        </div>
      )}
      {ad.status === "rejected" && (
        <div style={{ marginTop:"0.75rem", background:"var(--rose)11", border:"1px solid var(--rose)33", borderRadius:8, padding:"0.5rem 0.75rem", fontSize:"0.8rem", color:"var(--rose)" }}>
          ❌ Campaign rejected. Contact support@simtrace.site to appeal or resubmit.
        </div>
      )}
    </div>
  );
}

export default function MyCampaignsPage() {
  const { user, loading: authLoading } = useAuth();
  const router   = useRouter();
  const toast    = useToast();
  const [ads,    setAds]    = useState([]);
  const [loading,setLoading]= useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login"); return; }
    if (user) api.get("/api/ads/mine")
      .then(setAds)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const totalSpent      = ads.reduce((s,a) => s + (a.spentKES||0), 0);
  const totalClicks     = ads.reduce((s,a) => s + (a.clicks||0), 0);
  const totalImpressions= ads.reduce((s,a) => s + (a.impressions||0), 0);
  const avgCTR          = totalImpressions ? ((totalClicks/totalImpressions)*100).toFixed(2) : "0.00";

  if (loading || authLoading) return <p className="text-muted">Loading…</p>;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"0.75rem", marginBottom:"1.5rem" }}>
        <div>
          <h1 style={{ marginBottom:"0.15rem" }}>My Ad Campaigns</h1>
          <p className="text-muted">{ads.length} campaign{ads.length!==1?"s":""}</p>
        </div>
        <Link href="/advertise" className="btn-primary" style={{ textDecoration:"none", padding:"0.6rem 1.25rem" }}>
          + New Campaign
        </Link>
      </div>

      {/* Summary stats */}
      {ads.length > 0 && (
        <div className="grid-4" style={{ marginBottom:"1.5rem" }}>
          {[
            ["Total Spent",       `KES ${totalSpent.toLocaleString()}`,         "var(--amber)"],
            ["Total Impressions", totalImpressions.toLocaleString(),             "var(--sky)"],
            ["Total Clicks",      totalClicks.toLocaleString(),                  "var(--indigo)"],
            ["Avg CTR",           `${avgCTR}%`,                                 "var(--emerald)"],
          ].map(([l,v,c]) => (
            <div key={l} className="card" style={{ borderLeft:`3px solid ${c}` }}>
              <div style={{ fontSize:"0.72rem", color:"var(--muted)", marginBottom:4, textTransform:"uppercase" }}>{l}</div>
              <div style={{ fontSize:"1.5rem", fontWeight:800, color:c }}>{v}</div>
            </div>
          ))}
        </div>
      )}

      {ads.length === 0 ? (
        <div className="card" style={{ textAlign:"center", padding:"3rem" }}>
          <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem" }}>📢</div>
          <h3 style={{ marginBottom:"0.4rem" }}>No campaigns yet</h3>
          <p className="text-muted" style={{ marginBottom:"1.25rem" }}>
            Reach 50,000+ device owners and IT professionals across East Africa.
          </p>
          <Link href="/advertise" className="btn-primary" style={{ textDecoration:"none", padding:"0.7rem 1.5rem" }}>
            Create First Campaign
          </Link>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.85rem" }}>
          {ads.map(ad => <CampaignCard key={ad._id} ad={ad} />)}
        </div>
      )}
    </div>
  );
}
