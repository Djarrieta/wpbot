import { useState, type FormEvent } from "react";
import { Button } from "./Button";

export interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "number" | "textarea" | "date";
  placeholder?: string;
  required?: boolean;
  min?: string;
  step?: string;
  rows?: number;
}

interface GenericFormProps<T> {
  fields: FormField[];
  initial?: T;
  onSubmit: (data: Omit<T, "id">) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function GenericForm<T extends Record<string, unknown>>({
  fields,
  initial,
  onSubmit,
  onCancel,
  loading,
}: GenericFormProps<T>) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const field of fields) {
      init[field.name] = initial ? String(initial[field.name] ?? "") : "";
    }
    return init;
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const data: Record<string, unknown> = {};
    for (const field of fields) {
      const raw = values[field.name] ?? "";
      data[field.name] = field.type === "number" ? Number(raw) : raw.trim();
    }
    onSubmit(data as Omit<T, "id">);
  }

  const isValid = fields.every((f) => {
    if (!f.required) return true;
    const v = values[f.name] ?? "";
    if (v.trim() === "") return false;
    if (f.type === "number") return !isNaN(Number(v)) && Number(v) >= 0;
    return true;
  });

  function setValue(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {fields.map((field, i) => (
        <label key={field.name} className="flex flex-col gap-1 text-left">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {field.label}
          </span>
          {field.type === "textarea" ? (
            <textarea
              value={values[field.name] ?? ""}
              onChange={(e) => setValue(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={field.rows ?? 3}
              className={`${inputClass} resize-y`}
              autoFocus={i === 0}
            />
          ) : (
            <input
              type={field.type}
              value={values[field.name] ?? ""}
              onChange={(e) => setValue(field.name, e.target.value)}
              placeholder={field.placeholder}
              min={field.min}
              step={field.step}
              className={inputClass}
              autoFocus={i === 0}
            />
          )}
        </label>
      ))}

      <div className="flex justify-end gap-3 mt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={!isValid || loading}>
          {loading ? "Saving..." : initial ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
