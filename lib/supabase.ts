import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const options = { auth: { persistSession: false, autoRefreshToken: false } } as const;

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
  return (adminClient ??= createClient(url, key, options));
}

export const STORAGE_BUCKET = "clothing-images";
