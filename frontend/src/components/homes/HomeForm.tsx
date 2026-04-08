import { useEffect, useState } from "react";
import type { Home } from "../../stores/homeStore";
import { FormField } from "../ui/FormField";
import { SelectField } from "../ui/SelectField";

const INPUT_CLASS =
  "w-full rounded-lg border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-900 placeholder:text-warm-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 disabled:bg-warm-50 disabled:text-warm-400";

const HOME_TYPE_OPTIONS = [
  { value: "single_family", label: "Single Family" },
  { value: "townhouse", label: "Townhouse" },
  { value: "condo", label: "Condo" },
  { value: "multi_family", label: "Multi Family" },
  { value: "mobile", label: "Mobile" },
];

interface HomeFormValues {
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  home_type: string;
  year_built: string;
  square_footage: string;
  builder: string;
  num_bedrooms: string;
  num_bathrooms: string;
  notes: string;
}

function defaultValues(initial?: Partial<Home>): HomeFormValues {
  return {
    name: initial?.name ?? "",
    address: initial?.address ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
    zip_code: initial?.zip_code ?? "",
    home_type: initial?.home_type ?? "single_family",
    year_built: initial?.year_built?.toString() ?? "",
    square_footage: initial?.square_footage?.toString() ?? "",
    builder: initial?.builder ?? "",
    num_bedrooms: initial?.num_bedrooms?.toString() ?? "",
    num_bathrooms: initial?.num_bathrooms?.toString() ?? "",
    notes: initial?.notes ?? "",
  };
}

interface HomeFormProps {
  formId: string;
  initialValues?: Partial<Home>;
  onSubmit: (values: Partial<Home>) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  onSubmittingChange?: (v: boolean) => void;
}

export function HomeForm({
  formId,
  initialValues,
  onSubmit,
  onCancel: _onCancel,
  submitLabel: _submitLabel = "Create Home",
  onSubmittingChange,
}: HomeFormProps) {
  const [values, setValues] = useState<HomeFormValues>(
    defaultValues(initialValues),
  );
  const [errors, setErrors] = useState<Partial<Record<keyof HomeFormValues, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => { onSubmittingChange?.(isSubmitting); }, [isSubmitting, onSubmittingChange]);

  const handleChange =
    (field: keyof HomeFormValues) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setValues((v) => ({ ...v, [field]: e.target.value }));

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!values.name.trim()) newErrors.name = "Name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !validate()) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        name: values.name.trim(),
        address: values.address || undefined,
        city: values.city || undefined,
        state: values.state || undefined,
        zip_code: values.zip_code || undefined,
        home_type: values.home_type,
        year_built: values.year_built ? parseInt(values.year_built) : undefined,
        square_footage: values.square_footage
          ? parseInt(values.square_footage)
          : undefined,
        builder: values.builder || undefined,
        num_bedrooms: values.num_bedrooms
          ? parseInt(values.num_bedrooms)
          : undefined,
        num_bathrooms: values.num_bathrooms
          ? parseFloat(values.num_bathrooms)
          : undefined,
        notes: values.notes || undefined,
      });
    } catch (e) {
      setSubmitError((e as Error).message);
      setIsSubmitting(false);
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Home Name" required error={errors.name}>
        <input
          type="text"
          value={values.name}
          onChange={handleChange("name")}
          placeholder="e.g. Main House"
          className={INPUT_CLASS}
        />
      </FormField>

      <FormField label="Address">
        <input
          type="text"
          value={values.address}
          onChange={handleChange("address")}
          placeholder="123 Main St"
          className={INPUT_CLASS}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FormField label="City">
          <input
            type="text"
            value={values.city}
            onChange={handleChange("city")}
            placeholder="Springfield"
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField label="State">
          <input
            type="text"
            value={values.state}
            onChange={handleChange("state")}
            placeholder="IL"
            maxLength={2}
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField label="Zip Code">
          <input
            type="text"
            value={values.zip_code}
            onChange={handleChange("zip_code")}
            placeholder="62701"
            className={INPUT_CLASS}
          />
        </FormField>
      </div>

      <FormField label="Home Type">
        <SelectField
          options={HOME_TYPE_OPTIONS}
          value={values.home_type}
          onChange={handleChange("home_type")}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Year Built">
          <input
            type="number"
            value={values.year_built}
            onChange={handleChange("year_built")}
            placeholder="1995"
            min="1800"
            max={new Date().getFullYear()}
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField label="Square Footage">
          <input
            type="number"
            value={values.square_footage}
            onChange={handleChange("square_footage")}
            placeholder="1800"
            min="0"
            className={INPUT_CLASS}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Bedrooms">
          <input
            type="number"
            value={values.num_bedrooms}
            onChange={handleChange("num_bedrooms")}
            placeholder="3"
            min="0"
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField label="Bathrooms">
          <input
            type="number"
            value={values.num_bathrooms}
            onChange={handleChange("num_bathrooms")}
            placeholder="2"
            min="0"
            step="0.5"
            className={INPUT_CLASS}
          />
        </FormField>
      </div>

      <FormField label="Builder">
        <input
          type="text"
          value={values.builder}
          onChange={handleChange("builder")}
          placeholder="e.g. Pulte Homes"
          className={INPUT_CLASS}
        />
      </FormField>

      <FormField label="Notes">
        <textarea
          value={values.notes}
          onChange={handleChange("notes")}
          placeholder="Any additional details…"
          rows={3}
          className={INPUT_CLASS}
        />
      </FormField>

      {submitError && (
        <p className="text-sm text-red-500">{submitError}</p>
      )}
    </form>
  );
}
