// services/cloudinary.ts — image/asset upload, env-gated.
// Set CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
// (or a single CLOUDINARY_URL=cloudinary://key:secret@cloud) to enable.
import crypto from "crypto";

function creds() {
  if (process.env.CLOUDINARY_URL) {
    const m = process.env.CLOUDINARY_URL.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
    if (m) return { apiKey: m[1], apiSecret: m[2], cloud: m[3] };
  }
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (cloud && apiKey && apiSecret) return { cloud, apiKey, apiSecret };
  return null;
}

export function cloudinaryConfigured(): boolean {
  return !!creds();
}

// `file` may be a remote URL, a data: URI, or base64 image data.
export async function uploadImage(
  file: string,
  folder = "simtrace"
): Promise<{ url: string; publicId: string } | null> {
  const c = creds();
  if (!c) return null;

  const timestamp = Math.floor(Date.now() / 1000);
  // Cloudinary signature: sha1 of sorted params joined by & + api_secret.
  const toSign = `folder=${folder}&timestamp=${timestamp}${c.apiSecret}`;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");

  const form = new URLSearchParams({
    file,
    folder,
    timestamp: String(timestamp),
    api_key: c.apiKey,
    signature,
  });

  const res = await fetch(`https://api.cloudinary.com/v1_1/${c.cloud}/image/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  if (!res.ok) return null;
  const json: any = await res.json();
  return { url: json.secure_url, publicId: json.public_id };
}
