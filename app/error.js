"use client";
import { useEffect } from "react";
import SimTraceLogo from "../components/SimTraceLogo";

export default function ErrorPage({ error, reset }) {
  useEffect(() => {
    console.error("[SimTrace]", error);
  }, [error]);

  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1.25rem", textAlign: "center", padding: "2rem" }}>
      <SimTraceLogo size={52} showText={false} />
      <div>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.4rem" }}>Something went wrong</h1>
        <p style={{ color: "var(--muted)", maxWidth: 420, margin: "0 auto", lineHeight: 1.6 }}>
          {error?.message?.includes("fetch")
            ? "Unable to reach the SimTrace API. Check your connection and try again."
            : "An unexpected error occurred. Our team has been notified."}
        </p>
      </div>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button onClick={reset}
          style={{ background: "linear-gradient(135deg,var(--sky),var(--indigo))", color: "#fff", border: "none", borderRadius: 8, padding: "0.6rem 1.5rem", fontWeight: 700, cursor: "pointer" }}>
          Try again
        </button>
        <a href="/" style={{ background: "transparent", border: "1px solid #1e2d45", color: "var(--text2)", borderRadius: 8, padding: "0.6rem 1.5rem", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
          Go home
        </a>
      </div>
    </div>
  );
}
