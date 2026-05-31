import Link from "next/link";
import SimTraceLogo from "../components/SimTraceLogo";

export default function NotFound() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1.25rem", textAlign: "center", padding: "2rem" }}>
      <SimTraceLogo size={52} showText={false} />
      <div>
        <div style={{ fontSize: "4rem", fontWeight: 900, color: "var(--border)", lineHeight: 1 }}>404</div>
        <h1 style={{ fontSize: "1.4rem", margin: "0.5rem 0 0.4rem" }}>Page not found</h1>
        <p style={{ color: "var(--muted)", maxWidth: 360, margin: "0 auto" }}>
          This page doesn't exist or has been moved. Try checking the URL or heading back home.
        </p>
      </div>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <Link href="/" style={{ background: "linear-gradient(135deg,var(--sky),var(--indigo))", color: "#fff", padding: "0.6rem 1.5rem", borderRadius: 8, fontWeight: 700, textDecoration: "none" }}>
          Home
        </Link>
        <Link href="/imei" style={{ border: "1px solid #1e2d45", color: "var(--text2)", padding: "0.6rem 1.5rem", borderRadius: 8, fontWeight: 600, textDecoration: "none" }}>
          IMEI Check
        </Link>
      </div>
    </div>
  );
}
