"use client";
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { io } from "socket.io-client";

const ToastCtx = createContext(null);

let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((message, type = "info", duration = 5000) => {
    const id = ++toastIdCounter;
    setToasts(t => [...t, { id, message, type, duration }]);
    if (duration > 0) setTimeout(() => remove(id), duration);
    return id;
  }, []);

  const remove = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  // Real-time socket alerts → toasts
  useEffect(() => {
    const token = localStorage.getItem("simtrace_token");
    if (!token) return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
      auth: { token },
    });

    socket.on("alert", (alert) => {
      const labels = {
        blacklist_ping:  "🚨 Blacklisted device detected",
        sim_swap:        "🔄 SIM swap detected",
        location_jump:   "⚡ Impossible location jump",
        fraud_pattern:   "🕵️ Fraud pattern detected",
        theft_report:    "📋 Theft report filed",
      };
      const msg = labels[alert.type] || "🔔 New security alert";
      add(`${msg} — IMEI ${alert.imei}`, "danger", 8000);
    });

    socket.on("location_update", (data) => {
      if (data.status === "stolen" || data.status === "blacklisted") {
        add(`📡 Stolen device active — IMEI ${data.imei}`, "warning", 6000);
      }
    });

    return () => socket.disconnect();
  }, [add]);

  const COLORS = {
    info:    { bg: "var(--bg2)",     border: "var(--sky)",     text: "var(--text)" },
    success: { bg: "rgba(52,211,153,0.1)",        border: "var(--emerald)", text: "var(--emerald)"     },
    warning: { bg: "var(--bg)",        border: "var(--amber)",   text: "var(--amber)"  },
    danger:  { bg: "var(--bg)",        border: "var(--rose)",    text: "var(--rose)"     },
  };

  return (
    <ToastCtx.Provider value={{ add, remove }}>
      {children}

      {/* Toast container */}
      <div style={{
        position: "fixed", bottom: "1.25rem", right: "1.25rem", zIndex: 1000,
        display: "flex", flexDirection: "column", gap: "0.5rem", pointerEvents: "none",
        maxWidth: 380, width: "calc(100vw - 2.5rem)",
      }}>
        {toasts.map(t => {
          const c = COLORS[t.type] || COLORS.info;
          return (
            <div key={t.id} style={{
              background: c.bg, border: `1px solid ${c.border}`,
              borderLeft: `3px solid ${c.border}`,
              borderRadius: 10, padding: "0.75rem 1rem",
              display: "flex", alignItems: "flex-start", gap: "0.6rem",
              boxShadow: "0 8px 24px #00000050",
              animation: "slideIn 0.25s ease",
              pointerEvents: "all",
            }}>
              <div style={{ flex: 1, fontSize: "0.88rem", color: c.text, lineHeight: 1.5 }}>{t.message}</div>
              <button onClick={() => remove(t.id)} style={{
                background: "transparent", border: "none", color: c.text,
                cursor: "pointer", fontSize: "1rem", lineHeight: 1, opacity: 0.6, flexShrink: 0, padding: 0,
              }}>✕</button>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
