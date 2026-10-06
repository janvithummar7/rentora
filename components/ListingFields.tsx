import { Field, fieldProps, type Errors } from "@/components/Field";
import { CATEGORIES, CONDITIONS, SIZES } from "@/lib/categories";
import { todayISO } from "@/lib/utils";

export type ListingDefaults = Partial<Record<string, string | number | null>>;

/** Owner + clothing fields, shared by the public listing form and the admin editor. */
export function ListingFields({
  errors,
  defaults = {},
  minDate = todayISO(),
}: {
  errors: Errors;
  defaults?: ListingDefaults;
  minDate?: string;
}) {
  const d = (k: string) => (defaults[k] ?? "") as string | number;
  return (
    <>
      <fieldset className="space-y-4">
        <legend className="mb-1 font-serif text-xl font-semibold">Owner Details</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="ownerName" label="Name" errors={errors} required>
            <input {...fieldProps("ownerName", errors)} defaultValue={d("ownerName")} className="input" autoComplete="name" maxLength={60} />
          </Field>
          <Field name="mobile" label="Mobile Number" errors={errors} required hint="10-digit number. +91 is fine.">
            <input {...fieldProps("mobile", errors)} defaultValue={d("mobile")} className="input" type="tel" inputMode="tel" autoComplete="tel" maxLength={16} />
          </Field>
          <Field name="whatsapp" label="WhatsApp Number" errors={errors} hint="Renters will chat with you here. Leave blank if it's the same as your mobile.">
            <input {...fieldProps("whatsapp", errors)} defaultValue={d("whatsapp")} className="input" type="tel" inputMode="tel" maxLength={16} />
          </Field>
          <Field name="email" label="Email" errors={errors}>
            <input {...fieldProps("email", errors)} defaultValue={d("email")} className="input" type="email" autoComplete="email" maxLength={120} />
          </Field>
          <Field name="city" label="City" errors={errors} required>
            <input {...fieldProps("city", errors)} defaultValue={d("city")} className="input" autoComplete="address-level2" maxLength={60} placeholder="e.g. Ahmedabad" />
          </Field>
          <Field name="area" label="Area" errors={errors} required>
            <input {...fieldProps("area", errors)} defaultValue={d("area")} className="input" maxLength={80} placeholder="e.g. Satellite" />
          </Field>
        </div>
        <p className="text-xs text-muted">
          Your mobile and WhatsApp numbers are never shown publicly. Renters reach you through WhatsApp links only.
        </p>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 font-serif text-xl font-semibold">Clothing Details</legend>
        <Field name="name" label="Clothing Name" errors={errors} required>
          <input {...fieldProps("name", errors)} defaultValue={d("name")} className="input" maxLength={80} placeholder="e.g. Designer Red Choli" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="category" label="Category" errors={errors} required>
            <select {...fieldProps("category", errors)} defaultValue={d("category")} className="input">
              <option value="" disabled>
                Choose a category
              </option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field name="size" label="Size" errors={errors} required>
            <select {...fieldProps("size", errors)} defaultValue={d("size")} className="input">
              <option value="" disabled>
                Choose a size
              </option>
              {SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field name="color" label="Color" errors={errors} required>
            <input {...fieldProps("color", errors)} defaultValue={d("color")} className="input" maxLength={40} />
          </Field>
          <Field name="brand" label="Brand" errors={errors}>
            <input {...fieldProps("brand", errors)} defaultValue={d("brand")} className="input" maxLength={60} />
          </Field>
          <Field name="condition" label="Condition" errors={errors} required>
            <select {...fieldProps("condition", errors)} defaultValue={d("condition")} className="input">
              <option value="" disabled>
                Choose condition
              </option>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field name="description" label="Description" errors={errors} required hint="Fabric, work, fit, what's included (dupatta, blouse…).">
          <textarea {...fieldProps("description", errors)} defaultValue={d("description")} className="input min-h-28 resize-y" maxLength={1000} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="rentPrice" label="Rent Price (₹ per day)" errors={errors} required>
            <input {...fieldProps("rentPrice", errors)} defaultValue={d("rentPrice")} className="input" type="number" inputMode="numeric" min={1} step={1} />
          </Field>
          <Field name="securityDeposit" label="Security Deposit (₹)" errors={errors} hint="Enter 0 if there is no deposit.">
            <input {...fieldProps("securityDeposit", errors)} defaultValue={defaults.securityDeposit ?? 0} className="input" type="number" inputMode="numeric" min={0} step={1} />
          </Field>
          <Field name="availableFrom" label="Available From" errors={errors}>
            <input {...fieldProps("availableFrom", errors)} defaultValue={d("availableFrom")} className="input" type="date" min={minDate} />
          </Field>
          <Field name="availableTo" label="Available To" errors={errors}>
            <input {...fieldProps("availableTo", errors)} defaultValue={d("availableTo")} className="input" type="date" min={minDate} />
          </Field>
        </div>
      </fieldset>
    </>
  );
}
