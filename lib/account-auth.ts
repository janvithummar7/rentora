import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/supabase";

export type AccountUser = { id: string; email: string };

/** Supabase Auth client bound to the visitor's cookies (anon key). Used for sign in/up/out. */
export async function getAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase is not configured.");
  const store = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component: the middleware refreshes the session instead.
        }
      },
    },
  });
}

/** The signed-in owner, verified with Supabase (not just decoded from the cookie). */
export async function getCurrentUser(): Promise<AccountUser | null> {
  try {
    const { data } = await (await getAuthClient()).auth.getUser();
    return data.user?.email ? { id: data.user.id, email: data.user.email } : null;
  } catch {
    return null;
  }
}

export async function requireUser(next = "/account"): Promise<AccountUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/account/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Only allow same-site relative redirects. */
export function safeNext(value: string | null | undefined, fallback = "/account"): string {
  return value && /^\/(?!\/)[\w\-./?=&%]*$/.test(value) ? value : fallback;
}

/* ------------------------------ claim tokens ------------------------------ */

const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

export function newClaimToken() {
  const token = randomBytes(24).toString("base64url");
  return { token, hash: hashToken(token), expiresAt: new Date(Date.now() + 14 * 24 * 3600_000).toISOString() };
}

/** Attaches the owner row(s) behind a claim token to an account. Returns how many were linked. */
export async function claimWithToken(token: string | null | undefined, authUserId: string): Promise<number> {
  if (!token || token.length < 16 || token.length > 100) return 0;
  const { data, error } = await getAdminClient()
    .from("users")
    .update({ auth_user_id: authUserId, claim_token_hash: null, claim_expires_at: null })
    .eq("claim_token_hash", hashToken(token))
    .gt("claim_expires_at", new Date().toISOString())
    .is("auth_user_id", null)
    .select("id");
  if (error) throw error;
  return data?.length ?? 0;
}
