import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/account/AuthForms";
import { claimWithToken, getCurrentUser, safeNext } from "@/lib/account-auth";

export const metadata: Metadata = { title: "Create your account", robots: { index: false } };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ claim?: string; next?: string }> }) {
  const { claim, next } = await searchParams;
  const user = await getCurrentUser();
  if (user) {
    if (claim) await claimWithToken(claim, user.id).catch(() => 0);
    redirect(safeNext(next));
  }
  return (
    <div className="container-page max-w-md py-14">
      <h1 className="font-serif text-3xl font-semibold">Create your account</h1>
      <p className="mt-2 text-muted">
        {claim
          ? "Your listing will be linked to this account so you can manage it."
          : "Manage your listings, update prices and dates, and see rental requests."}
      </p>
      <div className="card mt-6 p-6">
        <SignupForm claim={claim} next={next} />
      </div>
    </div>
  );
}
