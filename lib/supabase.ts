import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const options = { auth: { persistSession: false, autoRefreshToken: false } } as const;

/** Classifies a Supabase API key (new sb_* format or legacy JWT) so mix-ups fail loudly. */
function keyKind(key: string): "public" | "secret" | "unknown" {
  if (key.startsWith("sb_secret_")) return "secret";
  if (key.startsWith("sb_publishable_")) return "public";
  try {
    const role = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString()).role;
    if (role === "service_role") return "secret";
    if (role === "anon") return "public";
  } catch {
    // not a JWT
  }
  return "unknown";
}

let publicClient: SupabaseClient | undefined;
let adminClient: SupabaseClient | undefined;

export class SupabaseNotConfiguredError extends Error {
  constructor(missing: string) {
    super(`Supabase is not configured: ${missing} is missing. Copy .env.example to .env.local and fill it in.`);
    this.name = "SupabaseNotConfiguredError";
  }
}

/**
 * Anon-key client for public reads. Restricted by Row Level Security
 * (approved listings only) and the `public_listings` view (no phone numbers).
 */
export function getPublicClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new SupabaseNotConfiguredError("NEXT_PUBLIC_SUPABASE_URL");
  if (!key) throw new SupabaseNotConfiguredError("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (keyKind(key) === "secret") {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY contains a SECRET key, which would be exposed in browser code. " +
        "Put the publishable/anon key here and the secret/service_role key in SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return (publicClient ??= createClient(url, key, options));
}

/**
 * Service-role client. Bypasses RLS. SERVER ONLY (guarded by `server-only`):
 * used for writes, owner phone numbers and the admin panel.
 */
export function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new SupabaseNotConfiguredError("NEXT_PUBLIC_SUPABASE_URL");
  if (!key) throw new SupabaseNotConfiguredError("SUPABASE_SERVICE_ROLE_KEY");
  if (keyKind(key) === "public") {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY contains the PUBLIC (publishable/anon) key, so server writes would be denied. " +
        "Use the secret / service_role key here (and the publishable key in NEXT_PUBLIC_SUPABASE_ANON_KEY).",
    );
  }
  return (adminClient ??= createClient(url, key, options));
}

export const STORAGE_BUCKET = "clothing-images";
