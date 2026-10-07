import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeIndianRupee, Gem, MessageCircle, Sparkles, Zap } from "lucide-react";
import { ClothingCard } from "@/components/ClothingCard";
import { HowItWorksSteps } from "@/components/HowItWorksSteps";
import { POPULAR_CATEGORY_SLUGS, categoryName } from "@/lib/categories";
import { getFeaturedListings, type PublicListing } from "@/lib/data";
import { SITE_DESCRIPTION, SITE_TAGLINE } from "@/lib/site";

export const revalidate = 60;

export const metadata = {
  title: { absolute: SITE_TAGLINE },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

const WHY = [
  { icon: BadgeIndianRupee, title: "Affordable rentals", text: "Wear a stunning outfit for a fraction of the price of buying." },
  { icon: Gem, title: "Wide variety", text: "Choli, saree, lehenga, kurti, gown and more in one place." },
  { icon: Sparkles, title: "We handle everything", text: "One team confirms availability, price, pickup and return for you." },
  { icon: MessageCircle, title: "Easy WhatsApp communication", text: "Your request opens straight in WhatsApp." },
  { icon: Zap, title: "Simple rental process", text: "No sign-ups, no payments on the site. Just request and chat." },
];

export default async function HomePage() {
  let featured: PublicListing[] = [];
  let failed = false;
  try {
    featured = await getFeaturedListings(8);
  } catch (err) {
    console.error("featured listings failed", err);
    failed = true;
  }

  return (
    <>
      {/* Hero */}
      <section className="overflow-hidden bg-gradient-to-b from-rose-soft/70 to-cream">
        <div className="container-page grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="eyebrow">Indian ethnic wear rentals</p>
            <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Rent Your Perfect Look
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted">
              Choli, Kurti, Saree, Dress &amp; More — Rent Beautiful Outfits Without Buying Them.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/clothes" className="btn-primary btn-lg">
                GET CLOTHES FOR RENT
              </Link>
              <Link href="/post-your-clothes" className="btn-outline btn-lg">
                PUT YOUR CLOTHES FOR RENT
              </Link>
            </div>
            <p className="mt-5 text-sm text-muted">Free to browse · No online payment · Confirm on WhatsApp</p>
          </div>
          <div className="relative mx-auto aspect-[5/6] w-full max-w-sm overflow-hidden rounded-t-[999px] rounded-b-3xl border border-gold/40 shadow-xl shadow-ink/10 lg:max-w-md">
            <Image
              src="/placeholders/hero.svg"
              alt="Illustration of beautiful traditional outfits available for rent"
              fill
              priority
              sizes="(min-width:1024px) 28rem, 90vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Two main cards */}
      <section className="container-page -mt-2 py-10">
        <div className="mb-8 text-center">
          <h2 className="font-serif text-3xl font-semibold sm:text-4xl">Get Your Perfect Outfit for Less</h2>
          <p className="mt-2 text-muted">Rent Choli, Saree, Kurti, Lehenga, Dresses &amp; More.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="card flex flex-col items-start p-7 sm:p-9">
            <p className="eyebrow">Renters</p>
            <h3 className="mt-2 font-serif text-2xl font-semibold sm:text-3xl">GET CHOLI FOR RENT</h3>
            <p className="mt-3 text-muted">Find beautiful outfits available for rent near you.</p>
            <Link href="/clothes" className="btn-primary mt-6">
              Find Clothes <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="flex flex-col items-start rounded-3xl bg-ink p-7 text-cream sm:p-9">
            <p className="eyebrow">Owners</p>
            <h3 className="mt-2 font-serif text-2xl font-semibold sm:text-3xl">PUT CHOLI FOR RENT</h3>
            <p className="mt-3 text-cream/75">Have clothes you don&apos;t wear anymore? Rent them out and earn.</p>
            <Link href="/post-your-clothes" className="btn mt-6 bg-gold text-ink hover:bg-[#c9a96b]">
              Post Your Clothes <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Popular categories */}
      <section className="container-page py-10">
        <h2 className="font-serif text-3xl font-semibold">Popular Categories</h2>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {POPULAR_CATEGORY_SLUGS.map((slug) => (
            <li key={slug}>
              <Link
                href={`/clothes/${slug}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-3xl bg-sand"
              >
                <Image
                  src={`/placeholders/${slug}.svg`}
                  alt=""
                  fill
                  sizes="(min-width:1024px) 16vw, (min-width:640px) 33vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-3 pt-10 text-center font-serif text-lg font-semibold text-white">
                  {categoryName(slug)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Featured */}
      <section className="container-page py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Fresh this week</p>
            <h2 className="mt-1 font-serif text-3xl font-semibold">Available for Rent</h2>
          </div>
          <Link href="/clothes" className="hidden items-center gap-1 text-sm font-semibold text-rose hover:underline sm:inline-flex">
            View all <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {failed ? (
          <div role="alert" className="card mt-6 p-10 text-center">
            <p className="font-serif text-xl font-semibold">We couldn&apos;t load the clothes right now.</p>
            <p className="mt-2 text-sm text-muted">Please refresh the page or try again in a moment.</p>
          </div>
        ) : featured.length === 0 ? (
          <div className="card mt-6 p-10 text-center">
            <p className="font-serif text-xl font-semibold">No clothes listed yet.</p>
            <p className="mt-2 text-sm text-muted">Be the first to put your clothes up for rent.</p>
            <Link href="/post-your-clothes" className="btn-primary mt-5">
              Post Your Clothes
            </Link>
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((l) => (
              <li key={l.id} className="contents">
                <ClothingCard listing={l} />
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6 text-center sm:hidden">
          <Link href="/clothes" className="btn-outline">
            View all clothes
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="container-page py-10">
        <h2 className="font-serif text-3xl font-semibold">How It Works</h2>
        <div className="mt-6">
          <HowItWorksSteps />
        </div>
      </section>

      {/* Why use us */}
      <section className="container-page py-10">
        <h2 className="font-serif text-3xl font-semibold">Why Use Us</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WHY.map(({ icon: Icon, title, text }) => (
            <li key={title} className="card flex gap-4 p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-soft text-[#7a5f2c]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="mt-0.5 text-sm text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Final CTA */}
      <section className="container-page py-10">
        <div className="rounded-3xl bg-rose-soft px-6 py-12 text-center sm:px-12">
          <h2 className="font-serif text-3xl font-semibold sm:text-4xl">Have a beautiful outfit sitting unused?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Have something beautiful sitting in your wardrobe? Put it up for rent and let someone else enjoy it.
          </p>
          <Link href="/post-your-clothes" className="btn-dark btn-lg mt-7">
            PUT IT FOR RENT
          </Link>
        </div>
      </section>
    </>
  );
}
