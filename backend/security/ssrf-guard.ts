// ── SSRF protection for outbound requests to user-supplied URLs ────────────────
// Partners and white-label tenants supply their own webhookUrl, and we POST to it
// (webhook-test, delivery). Without validation, a malicious or compromised
// partner account could point that URL at:
//   - cloud metadata endpoints (169.254.169.254 — AWS/GCP/Azure credential theft)
//   - internal/private network services (10.x, 172.16-31.x, 192.168.x, 127.x)
//   - link-local / multicast / unspecified ranges
// and use our server as a confused-deputy proxy to reach things the public
// internet can't, with our server's network position and credentials.
//
// We validate the URL scheme AND resolve DNS ourselves to check the actual IP
// the hostname points to — checking the hostname string alone is not enough,
// since "evil.com" can resolve to 169.254.169.254.

import dns from "dns";
import net from "net";

export class UnsafeWebhookUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeWebhookUrlError";
  }
}

function isDisallowedIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true; // malformed → reject
  const [a, b] = parts;
  if (a === 127) return true;                          // loopback
  if (a === 10) return true;                            // private
  if (a === 172 && b >= 16 && b <= 31) return true;      // private
  if (a === 192 && b === 168) return true;               // private
  if (a === 169 && b === 254) return true;               // link-local incl. cloud metadata
  if (a === 0) return true;                              // "this network"
  if (a >= 224) return true;                             // multicast/reserved
  return false;
}

function isDisallowedIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1") return true;                      // loopback
  if (lower === "::") return true;                        // unspecified
  if (lower.startsWith("fe80:") || lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true; // link-local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local (private)
  if (lower.startsWith("::ffff:")) {
    // IPv4-mapped IPv6 — check the embedded IPv4 address
    const mapped = lower.split(":").pop() ?? "";
    if (net.isIPv4(mapped)) return isDisallowedIPv4(mapped);
  }
  return false;
}

/**
 * Throws UnsafeWebhookUrlError if the URL is not safe to make a server-side
 * request to. Call this immediately before every fetch() to a user-supplied URL.
 */
export async function assertSafeWebhookUrl(rawUrl: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new UnsafeWebhookUrlError("Invalid URL");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new UnsafeWebhookUrlError("Only http/https URLs are allowed");
  }

  const hostname = parsed.hostname;
  if (hostname === "localhost" || hostname === "metadata.google.internal") {
    throw new UnsafeWebhookUrlError("Refusing to call internal/local hostname");
  }

  // If the hostname is already a literal IP, check it directly; otherwise resolve.
  let addresses: string[];
  if (net.isIP(hostname)) {
    addresses = [hostname];
  } else {
    try {
      const results = await dns.promises.lookup(hostname, { all: true, verbatim: true });
      addresses = results.map((r) => r.address);
    } catch {
      throw new UnsafeWebhookUrlError("Could not resolve webhook hostname");
    }
  }

  if (addresses.length === 0) throw new UnsafeWebhookUrlError("Could not resolve webhook hostname");

  for (const addr of addresses) {
    const disallowed = net.isIPv6(addr) ? isDisallowedIPv6(addr) : isDisallowedIPv4(addr);
    if (disallowed) {
      throw new UnsafeWebhookUrlError("Webhook URL resolves to a private/internal address");
    }
  }
}
