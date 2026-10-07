import { DatesPicker } from "@/components/DatePickers";
import { Field, fieldProps, type Errors } from "@/components/Field";
import { PricingFields } from "@/components/admin/PricingFields";
import { SellToggle } from "@/components/SellToggle";
import { SizePicker } from "@/components/SizePicker";
import { CATEGORIES, CONDITIONS } from "@/lib/categories";

export type ListingDefaults = Partial<Record<string, string | number | boolean | string[] | null>>;

/** Full editor fields. Used by the admin panel; the public form only asks for the essentials. */
export function ListingFields({ errors, defaults = {} }: { errors: Errors; defaults?: ListingDefaults }) {
  const d = (k: string) => (defaults[k] ?? "") as string | number;
  return (
    <>
      <fieldset className="space-y-4">
        <legend className="mb-1 font-serif text-xl font-semibold">Owner</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="ownerName" label="Name" errors={errors} required>
            <input {...fieldProps("ownerName", errors)} defaultValue={d("ownerName")} className="input" maxLength={60} />
          </Field>
          <Field name="mobile" label="Mobile Number" errors={errors} required>
            <input {...fieldProps("mobile", errors)} defaultValue={d("mobile")} className="input" type="tel" maxLength={16} />
          </Field>
          <Field name="whatsapp" label="WhatsApp Number" errors={errors} hint="Requests go here. Blank = same as mobile.">
            <input {...fieldProps("whatsapp", errors)} defaultValue={d("whatsapp")} className="input" type="tel" maxLength={16} />
          </Field>
          <Field name="email" label="Email" errors={errors}>
            <input {...fieldProps("email", errors)} defaultValue={d("email")} className="input" type="email" maxLength={120} />
          </Field>
          <Field name="city" label="City" errors={errors}>
            <input {...fieldProps("city", errors)} defaultValue={d("city")} className="input" maxLength={60} />
          </Field>
          <Field name="area" label="Area" errors={errors}>
            <input {...fieldProps("area", errors)} defaultValue={d("area")} className="input" maxLength={80} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 font-serif text-xl font-semibold">Clothing</legend>
        <Field name="name" label="Title" errors={errors} required>
          <input {...fieldProps("name", errors)} defaultValue={d("name")} className="input" maxLength={80} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="category" label="Type" errors={errors} required>
            <select {...fieldProps("category", errors)} defaultValue={d("category")} className="input">
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field name="color" label="Color" errors={errors}>
            <input {...fieldProps("color", errors)} defaultValue={d("color")} className="input" maxLength={40} />
          </Field>
          <Field name="brand" label="Brand" errors={errors}>
            <input {...fieldProps("brand", errors)} defaultValue={d("brand")} className="input" maxLength={60} />
          </Field>
          <Field name="condition" label="Condition" errors={errors}>
            <select {...fieldProps("condition", errors)} defaultValue={d("condition")} className="input">
              <option value="">Not specified</option>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <PricingFields errors={errors} defaultRent={d("rentPrice")} defaultMargin={d("marginPercent") === "" ? 25 : d("marginPercent")} />
          <Field name="securityDeposit" label="Security deposit (₹)" errors={errors} hint="0 if none.">
            <input {...fieldProps("securityDeposit", errors)} defaultValue={(defaults.securityDeposit ?? 0) as number} className="input" type="number" min={0} step={1} />
          </Field>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Sizes <span className="text-rose">*</span>
          </p>
          <SizePicker name="sizes" error={errors.sizes} defaultValue={(defaults.sizes as string[]) ?? []} />
        </div>
        <SellToggle label="Owner's selling price (₹)" errors={errors} defaultOn={Boolean(defaults.forSale)} defaultPrice={defaults.salePrice as number | null} />
        <Field name="description" label="Description" errors={errors}>
          <textarea {...fieldProps("description", errors)} defaultValue={d("description")} className="input min-h-24 resize-y" maxLength={1000} />
        </Field>
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Available dates <span className="text-rose">*</span>
          </p>
          <DatesPicker name="availableDates" error={errors.availableDates} defaultValue={(defaults.availableDates as string[]) ?? []} />
        </div>
      </fieldset>
    </>
  );
}
