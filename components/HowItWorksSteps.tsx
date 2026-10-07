const RENTER_STEPS = [
  ["Find your outfit", "Browse cholis, sarees, kurtis, lehengas and more near you."],
  ["Send rental request", "Pick your dates and share your name and mobile number."],
  ["Confirm with us on WhatsApp", "WhatsApp opens with your request already written. We confirm availability and the final price."],
  ["Finalize rental", "We arrange pickup and payment with you. Enjoy your outfit!"],
];

const OWNER_STEPS = [
  ["Upload your clothes", "Add a few photos, the size and your rent price."],
  ["Get approved", "Our team reviews your listing before it goes live."],
  ["Receive rental requests", "We handle the renters and contact you to confirm each booking."],
  ["Earn from your clothes", "Turn outfits you rarely wear into extra income."],
];

function Steps({ title, steps, tone }: { title: string; steps: string[][]; tone: "rose" | "gold" }) {
  return (
    <div className="card p-6 sm:p-8">
      <h3 className="font-serif text-2xl font-semibold">{title}</h3>
      <ol className="mt-5 space-y-5">
        {steps.map(([heading, text], i) => (
          <li key={heading} className="flex gap-4">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                tone === "rose" ? "bg-rose-soft text-rose-dark" : "bg-gold-soft text-[#7a5f2c]"
              }`}
            >
              {i + 1}
            </span>
            <div>
              <p className="font-semibold">{heading}</p>
              <p className="mt-0.5 text-sm text-muted">{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function HowItWorksSteps() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Steps title="For Renters" steps={RENTER_STEPS} tone="rose" />
      <Steps title="For Owners" steps={OWNER_STEPS} tone="gold" />
    </div>
  );
}
