"use client";
import { useState } from "react";
import Link from "next/link";
import ProductTour from "./ProductTour";

export default function CustomerSuccessWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"help" | "chat" | "accessibility">("help");
  const [searchQuery, setSearchQuery] = useState("");
  const [tourOpen, setTourOpen] = useState(false);

  // Chat Assistant State
  const [chatMessages, setChatMessages] = useState<{ sender: "user" | "ai"; text: string }[]>([
    { sender: "ai", text: "Hello! How can I assist you with SimTrace device registration, IMEI checks, or police reports today?" }
  ]);
  const [chatInput, setChatInput] = useState("");

  // Accessibility State
  const [highContrast, setHighContrast] = useState(false);
  const [fontSizeScale, setFontSizeScale] = useState<"normal" | "large" | "xlarge">("normal");

  // Sample FAQ / KB articles
  const kbArticles = [
    { title: "How do I find my 15-digit IMEI number?", category: "Getting Started", href: "/imei", body: "Dial *#06# on your mobile phone's dialpad. The 15-digit number will instantly display." },
    { title: "What should I do immediately if my phone is stolen?", category: "Anti-Theft", href: "/remote-lock", body: "1) Log into SimTrace. 2) Click Remote Lockdown. 3) Submit theft report for CEIR blacklisting." },
    { title: "How does the silent front-camera evidence capture work?", category: "Evidence", href: "/evidence", body: "If an intruder enters 3 wrong PIN codes, SimTrace silently captures front camera photos and GPS coordinates." },
    { title: "How do telecom operators process IMEI blacklists?", category: "Carrier", href: "/telecom/dashboard", body: "Blacklist commands are transmitted over SS7/Diameter network links to Safaricom, Airtel, and Telkom in real-time." },
  ];

  function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");

    setTimeout(() => {
      let responseText = "I'm here to help! You can check device status under the IMEI Check tab or launch the interactive product tour for a full overview.";
      if (userMsg.toLowerCase().includes("imei")) {
        responseText = "To check an IMEI, visit /imei or dial *#06# on your device. SimTrace queries GSMA and national CEIR registries in under 20ms.";
      } else if (userMsg.toLowerCase().includes("stolen") || userMsg.toLowerCase().includes("lock")) {
        responseText = "You can initiate a remote lock and trigger silent GPS evidence capture under the 'My Devices' or 'Remote Lock' tabs.";
      } else if (userMsg.toLowerCase().includes("api") || userMsg.toLowerCase().includes("developer")) {
        responseText = "Explore our Developer Platform at /developer to access REST API keys, GraphQL queries, webhooks, and SDKs.";
      }
      setChatMessages(prev => [...prev, { sender: "ai", text: responseText }]);
    }, 600);
  }

  function toggleHighContrast() {
    setHighContrast(!highContrast);
    if (!highContrast) {
      document.documentElement.style.setProperty("--bg", "#000000");
      document.documentElement.style.setProperty("--surface", "#111111");
      document.documentElement.style.setProperty("--text", "#ffffff");
      document.documentElement.style.setProperty("--border", "#333333");
    } else {
      document.documentElement.style.removeProperty("--bg");
      document.documentElement.style.removeProperty("--surface");
      document.documentElement.style.removeProperty("--text");
      document.documentElement.style.removeProperty("--border");
    }
  }

  return (
    <>
      <ProductTour isOpen={tourOpen} onClose={() => setTourOpen(false)} />

      {/* Floating Action Button */}
      <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 9999 }}>
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "linear-gradient(135deg, var(--sky), var(--indigo))",
              color: "#ffffff",
              border: "none",
              padding: "0.75rem 1.25rem",
              borderRadius: 30,
              fontWeight: 700,
              fontSize: "0.88rem",
              cursor: "pointer",
              boxShadow: "0 10px 25px -5px rgba(14, 165, 233, 0.5)",
              transition: "all 0.2s ease",
            }}
          >
            <span>💬 Contextual Help & Support</span>
          </button>
        ) : (
          <div
            className="card"
            style={{
              width: 360,
              height: 500,
              background: "var(--bg)",
              border: "1px solid var(--sky)44",
              boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.4)",
              borderRadius: 16,
              display: "flex",
              flexDirection: "column",
              padding: 0,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{ background: "linear-gradient(135deg, var(--sky), var(--indigo))", color: "#fff", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>SimTrace Success Center</div>
                <div style={{ fontSize: "0.72rem", opacity: 0.9 }}>Enterprise Guidance & Accessibility</div>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", fontSize: "1.2rem" }}>
                ✕
              </button>
            </div>

            {/* Sub-tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
              {[
                { id: "help", label: "📚 KB Search" },
                { id: "chat", label: "🤖 AI Assistant" },
                { id: "accessibility", label: "♿ Access" },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    fontSize: "0.78rem",
                    fontWeight: activeTab === t.id ? 700 : 500,
                    color: activeTab === t.id ? "var(--sky)" : "var(--muted)",
                    borderBottom: activeTab === t.id ? "2px solid var(--sky)" : "none",
                    background: "transparent",
                    borderTop: "none",
                    borderLeft: "none",
                    borderRight: "none",
                    cursor: "pointer",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* TAB 1: KB SEARCH */}
            {activeTab === "help" && (
              <div style={{ flex: 1, padding: "1rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <input
                  type="text"
                  placeholder="Search articles & FAQs…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.82rem", borderRadius: 8 }}
                />

                <button
                  onClick={() => { setIsOpen(false); setTourOpen(true); }}
                  className="btn-primary"
                  style={{ width: "100%", padding: "6px 12px", fontSize: "0.82rem" }}
                >
                  🚀 Launch Guided Product Tour
                </button>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {kbArticles
                    .filter(a => !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.body.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((art, idx) => (
                      <div key={idx} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "0.65rem 0.85rem", borderRadius: 8 }}>
                        <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--sky)" }}>{art.category}</div>
                        <div style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: 2 }}>{art.title}</div>
                        <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: "0 0 4px 0", lineHeight: 1.3 }}>{art.body}</p>
                        <Link href={art.href} onClick={() => setIsOpen(false)} style={{ fontSize: "0.72rem", color: "var(--emerald)", fontWeight: 700, textDecoration: "none" }}>
                          Open Module →
                        </Link>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* TAB 2: AI CHAT ASSISTANT */}
            {activeTab === "chat" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0.85rem", gap: "0.5rem" }}>
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                        maxWidth: "82%",
                        background: msg.sender === "user" ? "var(--sky)" : "var(--surface)",
                        color: msg.sender === "user" ? "#fff" : "var(--text)",
                        padding: "0.5rem 0.75rem",
                        borderRadius: 12,
                        fontSize: "0.8rem",
                        lineHeight: 1.4,
                        border: msg.sender === "ai" ? "1px solid var(--border)" : "none",
                      }}
                    >
                      {msg.text}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendChat} style={{ display: "flex", gap: "0.4rem" }}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Ask support assistant…"
                    style={{ flex: 1, padding: "0.4rem 0.65rem", fontSize: "0.8rem", borderRadius: 6 }}
                  />
                  <button className="btn-primary" style={{ padding: "4px 10px", fontSize: "0.8rem" }}>
                    Send
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: ACCESSIBILITY PREFERENCES */}
            {activeTab === "accessibility" && (
              <div style={{ flex: 1, padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 2 }}>Accessibility & Viewport Options</div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface)", padding: "0.75rem", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>High Contrast Canvas</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Enhance text legibility ratio to WCAG AAA</div>
                  </div>
                  <button
                    onClick={toggleHighContrast}
                    className="btn-ghost"
                    style={{ padding: "4px 10px", fontSize: "0.78rem", border: "1px solid var(--sky)", color: "var(--sky)" }}
                  >
                    {highContrast ? "✓ Enabled" : "Enable"}
                  </button>
                </div>

                <div style={{ background: "var(--surface)", padding: "0.75rem", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: 4 }}>Text Size Scaler</div>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    {(["normal", "large", "xlarge"] as const).map(size => (
                      <button
                        key={size}
                        onClick={() => {
                          setFontSizeScale(size);
                          document.documentElement.style.fontSize = size === "normal" ? "100%" : size === "large" ? "110%" : "120%";
                        }}
                        style={{
                          flex: 1,
                          padding: "4px",
                          fontSize: "0.75rem",
                          borderRadius: 4,
                          border: `1px solid ${fontSizeScale === size ? "var(--sky)" : "var(--border)"}`,
                          background: fontSizeScale === size ? "var(--sky)22" : "transparent",
                          color: fontSizeScale === size ? "var(--sky)" : "var(--text2)",
                          cursor: "pointer",
                          textTransform: "capitalize",
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
