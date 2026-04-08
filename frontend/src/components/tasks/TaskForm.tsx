import { useState } from "react";
import type { MaintenanceTask } from "../../stores/maintenanceStore";
import type { Appliance } from "../../stores/applianceStore";
import { FormField } from "../ui/FormField";
import { SelectField } from "../ui/SelectField";

const INPUT_CLASS =
  "w-full rounded-lg border border-warm-200 bg-white px-3 py-2.5 text-sm text-warm-900 placeholder:text-warm-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 disabled:bg-warm-50 disabled:text-warm-400";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const FREQUENCY_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 Weeks" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "biannual", label: "Twice a Year" },
  { value: "annual", label: "Annual" },
  { value: "as_needed", label: "As Needed" },
];

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "upcoming", label: "Upcoming" },
  { value: "overdue", label: "Overdue" },
  { value: "completed", label: "Completed" },
  { value: "skipped", label: "Skipped" },
];

interface TaskFormValues {
  title: string;
  description: string;
  priority: string;
  frequency: string;
  due_date: string;
  appliance_id: string;
  estimated_duration_minutes: string;
  estimated_cost: string;
  status: string;
}

function defaultValues(initial?: Partial<MaintenanceTask>): TaskFormValues {
  return {
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    priority: initial?.priority ?? "medium",
    frequency: initial?.frequency ?? "annual",
    due_date: initial?.due_date ?? "",
    appliance_id: initial?.appliance_id ?? "",
    estimated_duration_minutes:
      initial?.estimated_duration_minutes?.toString() ?? "",
    estimated_cost: initial?.estimated_cost?.toString() ?? "",
    status: initial?.status ?? "pending",
  };
}

interface TaskFormProps {
  homeId: string;
  appliances: Appliance[];
  initialValues?: Partial<MaintenanceTask>;
  onSubmit: (values: Partial<MaintenanceTask>) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function TaskForm({
  appliances,
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = "Create Task",
}: TaskFormProps) {
  const isEditing = !!initialValues?.id;
  const [values, setValues] = useState<TaskFormValues>(
    defaultValues(initialValues),
  );
  const [errors, setErrors] = useState<Partial<Record<keyof TaskFormValues, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const applianceOptions = [
    { value: "", label: "None" },
    ...appliances.map((a) => ({ value: a.id, label: a.name })),
  ];

  const handleChange =
    (field: keyof TaskFormValues) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setValues((v) => ({ ...v, [field]: e.target.value }));

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!values.title.trim()) newErrors.title = "Title is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload: Partial<MaintenanceTask> = {
        title: values.title.trim(),
        description: values.description || undefined,
        priority: values.priority,
        frequency: values.frequency,
        due_date: values.due_date || undefined,
        appliance_id: values.appliance_id || undefined,
        estimated_duration_minutes: values.estimated_duration_minutes
          ? parseInt(values.estimated_duration_minutes)
          : undefined,
        estimated_cost: values.estimated_cost
          ? parseFloat(values.estimated_cost)
          : undefined,
      };
      if (isEditing) {
        payload.status = values.status;
      }
      await onSubmit(payload);
    } catch (e) {
      setSubmitError((e as Error).message);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Title" required error={errors.title}>
        <input
          type="text"
          value={values.title}
          onChange={handleChange("title")}
          placeholder="e.g. Replace HVAC filter"
          className={INPUT_CLASS}
        />
      </FormField>

      <FormField label="Description">
        <textarea
          value={values.description}
          onChange={handleChange("description")}
          placeholder="Optional details about this task…"
          rows={2}
          className={INPUT_CLASS}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Priority">
          <SelectField
            options={PRIORITY_OPTIONS}
            value={values.priority}
            onChange={handleChange("priority")}
          />
        </FormField>
        <FormField label="Frequency">
          <SelectField
            options={FREQUENCY_OPTIONS}
            value={values.frequency}
            onChange={handleChange("frequency")}
          />
        </FormField>
      </div>

      <FormField label="Due Date">
        <input
          type="date"
          value={values.due_date}
          onChange={handleChange("due_date")}
          className={INPUT_CLASS}
        />
      </FormField>

      <FormField label="Linked Appliance">
        <SelectField
          options={applianceOptions}
          value={values.appliance_id}
          onChange={handleChange("appliance_id")}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Est. Duration (min)">
          <input
            type="number"
            value={values.estimated_duration_minutes}
            onChange={handleChange("estimated_duration_minutes")}
            placeholder="30"
            min="0"
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField label="Est. Cost ($)">
          <input
            type="number"
            value={values.estimated_cost}
            onChange={handleChange("estimated_cost")}
            placeholder="50.00"
            min="0"
            step="0.01"
            className={INPUT_CLASS}
          />
        </FormField>
      </div>

      {isEditing && (
        <FormField label="Status">
          <SelectField
            options={STATUS_OPTIONS}
            value={values.status}
            onChange={handleChange("status")}
          />
        </FormField>
      )}

      {submitError && (
        <p className="text-sm text-red-500">{submitError}</p>
      )}

      <div className="sticky bottom-0 mt-4 flex gap-3 border-t border-warm-100 bg-white pt-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 rounded-lg border border-warm-200 px-4 py-2.5 text-sm font-medium text-warm-700 transition-colors hover:bg-warm-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
