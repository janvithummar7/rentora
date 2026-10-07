import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/account/AuthForms";
import { claimWithToken, getCurrentUser, safeNext } from "@/lib/account-auth";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ claim?: string; next?: string }> }) {
  const { claim, next } = await searchParams;
  const user = await getCurrentUser();
  if (user) {
    if (claim) await claimWithToken(claim, user.id).catch(() => 0);
    redirect(safeNext(next));
  }
  return (
    <div className="container-page max-w-md py-14">
      <h1 className="font-serif text-3xl font-semibold">Sign in</h1>
      <p className="mt-2 text-muted">Manage your listings and see rental requests.</p>
      <div className="card mt-6 p-6">
        <LoginForm claim={claim} next={next} />
      </div>
    </div>
  );
}
