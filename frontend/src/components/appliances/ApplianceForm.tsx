import { useEffect, useState } from "react";
import type { Appliance } from "../../stores/applianceStore";
import { FormField } from "../ui/FormField";
import { SelectField } from "../ui/SelectField";

const INPUT_CLASS =
  "w-full rounded-lg border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-900 placeholder:text-warm-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 disabled:bg-warm-50 disabled:text-warm-400";

const CATEGORY_OPTIONS = [
  { value: "hvac", label: "HVAC" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "kitchen", label: "Kitchen" },
  { value: "laundry", label: "Laundry" },
  { value: "outdoor", label: "Outdoor" },
  { value: "structural", label: "Structural" },
  { value: "safety", label: "Safety" },
  { value: "other", label: "Other" },
];

interface ApplianceFormValues {
  name: string;
  category: string;
  brand: string;
  model_number: string;
  serial_number: string;
  location_in_home: string;
  purchase_date: string;
  install_date: string;
  warranty_expiry: string;
  notes: string;
}

function defaultValues(initial?: Partial<Appliance>): ApplianceFormValues {
  return {
    name: initial?.name ?? "",
    category: initial?.category ?? "other",
    brand: initial?.brand ?? "",
    model_number: initial?.model_number ?? "",
    serial_number: initial?.serial_number ?? "",
    location_in_home: initial?.location_in_home ?? "",
    purchase_date: initial?.purchase_date ?? "",
    install_date: initial?.install_date ?? "",
    warranty_expiry: initial?.warranty_expiry ?? "",
    notes: initial?.notes ?? "",
  };
}

interface ApplianceFormProps {
  formId: string;
  homeId: string;
  initialValues?: Partial<Appliance>;
  onSubmit: (values: Partial<Appliance>) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  onSubmittingChange?: (v: boolean) => void;
}

export function ApplianceForm({
  formId,
  initialValues,
  onSubmit,
  onCancel: _onCancel,
  submitLabel: _submitLabel = "Add Appliance",
  onSubmittingChange,
}: ApplianceFormProps) {
  const [values, setValues] = useState<ApplianceFormValues>(
    defaultValues(initialValues),
  );
  const [errors, setErrors] = useState<Partial<Record<keyof ApplianceFormValues, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => { onSubmittingChange?.(isSubmitting); }, [isSubmitting, onSubmittingChange]);

  const handleChange =
    (field: keyof ApplianceFormValues) =>
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
        category: values.category,
        brand: values.brand || undefined,
        model_number: values.model_number || undefined,
        serial_number: values.serial_number || undefined,
        location_in_home: values.location_in_home || undefined,
        purchase_date: values.purchase_date || undefined,
        install_date: values.install_date || undefined,
        warranty_expiry: values.warranty_expiry || undefined,
        notes: values.notes || undefined,
      });
    } catch (e) {
      setSubmitError((e as Error).message);
      setIsSubmitting(false);
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Appliance Name" required error={errors.name}>
        <input
          type="text"
          value={values.name}
          onChange={handleChange("name")}
          placeholder="e.g. Tankless Water Heater"
          className={INPUT_CLASS}
        />
      </FormField>

      <FormField label="Category">
        <SelectField
          options={CATEGORY_OPTIONS}
          value={values.category}
          onChange={handleChange("category")}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FormField label="Brand">
          <input
            type="text"
            value={values.brand}
            onChange={handleChange("brand")}
            placeholder="e.g. Rheem"
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField label="Model Number">
          <input
            type="text"
            value={values.model_number}
            onChange={handleChange("model_number")}
            placeholder="RTG-20XVN"
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField label="Serial Number">
          <input
            type="text"
            value={values.serial_number}
            onChange={handleChange("serial_number")}
            placeholder="SN12345"
            className={INPUT_CLASS}
          />
        </FormField>
      </div>

      <FormField label="Location in Home">
        <input
          type="text"
          value={values.location_in_home}
          onChange={handleChange("location_in_home")}
          placeholder="e.g. Basement utility room"
          className={INPUT_CLASS}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FormField label="Purchase Date">
          <input
            type="date"
            value={values.purchase_date}
            onChange={handleChange("purchase_date")}
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField label="Install Date">
          <input
            type="date"
            value={values.install_date}
            onChange={handleChange("install_date")}
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField label="Warranty Expiry">
          <input
            type="date"
            value={values.warranty_expiry}
            onChange={handleChange("warranty_expiry")}
            className={INPUT_CLASS}
          />
        </FormField>
      </div>

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
