"use client";

import { submitAction } from "@/lib/submit-action";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { ownerUpdateListing, type EditState } from "@/app/account/actions";
import { DatesPicker } from "@/components/DatePickers";
import { Field, fieldProps } from "@/components/Field";
import { SellToggle } from "@/components/SellToggle";
import { SizePicker } from "@/components/SizePicker";

export type OwnerEditDefaults = {
  name: string;
  whatsapp: string;
  city: string;
  area: string;
  description: string;
  sizes: string[];
  rentPrice: number;
  forSale: boolean;
  salePrice: number | null;
  availableDates: string[];
};

export function OwnerEditForm({ id, defaults }: { id: string; defaults: OwnerEditDefaults }) {
  const [state, action, pending] = useActionState<EditState, FormData>(ownerUpdateListing, {});
  const errors = state.errors ?? {};
  return (
    <form action={action} onSubmit={submitAction(action)} noValidate className="space-y-6">
      <input type="hidden" name="id" value={id} />
      <Field name="name" label="Title" errors={errors} required>
        <input {...fieldProps("name", errors)} defaultValue={defaults.name} className="input" maxLength={80} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="rentPrice" label="Rent price (₹ per day)" errors={errors} required>
          <input
            {...fieldProps("rentPrice", errors)}
            defaultValue={defaults.rentPrice}
            className="input"
            type="number"
            inputMode="numeric"
            min={1}
          />
        </Field>
        <Field name="city" label="City" errors={errors} required>
          <input {...fieldProps("city", errors)} defaultValue={defaults.city} className="input" maxLength={60} />
        </Field>
        <Field name="area" label="Area" errors={errors} required>
          <input {...fieldProps("area", errors)} defaultValue={defaults.area} className="input" maxLength={80} />
        </Field>
        <Field name="whatsapp" label="WhatsApp number" errors={errors} required hint="Our team contacts you here to confirm bookings.">
          <input {...fieldProps("whatsapp", errors)} defaultValue={defaults.whatsapp} className="input" type="tel" maxLength={16} />
        </Field>
      </div>
      <SellToggle errors={errors} defaultOn={defaults.forSale} defaultPrice={defaults.salePrice} />
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">
          Size <span className="text-rose">*</span>
        </legend>
        <SizePicker name="sizes" error={errors.sizes} defaultValue={defaults.sizes} />
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">
          Available dates <span className="text-rose">*</span>
        </legend>
        <DatesPicker name="availableDates" error={errors.availableDates} defaultValue={defaults.availableDates} />
      </fieldset>
      <Field name="description" label="Description" errors={errors}>
        <textarea
          {...fieldProps("description", errors)}
          defaultValue={defaults.description}
          className="input min-h-24 resize-y"
          maxLength={1000}
        />
      </Field>

      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
          Saved.
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary btn-lg">
        {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : "Save changes"}
      </button>
    </form>
  );
}
