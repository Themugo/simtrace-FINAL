import { AuthProvider } from "../lib/auth";
import { ToastProvider } from "../components/ToastProvider";
import Nav from "../components/Nav.tsx";
import "./globals.css";

export const metadata = {
  title: "SimTrace™ — Global Device Intelligence Platform",
  description: "Mobile device tracking, IMEI blacklist verification, SIM swap detection, and AI-powered security intelligence for East Africa and beyond.",
  keywords: "IMEI check, device tracking, SIM swap detection, phone stolen, Kenya, Safaricom",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📡</text></svg>" />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>
            <Nav />
            <main>{children}</main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
