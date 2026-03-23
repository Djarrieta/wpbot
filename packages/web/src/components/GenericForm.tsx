import { useState, type FormEvent } from "react";
import { Button } from "./Button";

export interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "number" | "textarea" | "date" | "checkbox";
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
  const [values, setValues] = useState<Record<string, string | boolean>>(() => {
    const init: Record<string, string | boolean> = {};
    for (const field of fields) {
      if (field.type === "checkbox") {
        init[field.name] = initial ? Boolean(initial[field.name]) : false;
      } else {
        init[field.name] = initial ? String(initial[field.name] ?? "") : "";
      }
    }
    return init;
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const data: Record<string, unknown> = {};
    for (const field of fields) {
      const raw = values[field.name] ?? "";
      if (field.type === "checkbox") {
        data[field.name] = Boolean(raw);
      } else if (field.type === "number") {
        data[field.name] = Number(raw);
      } else {
        data[field.name] = String(raw).trim();
      }
    }
    onSubmit(data as Omit<T, "id">);
  }

  const isValid = fields.every((f) => {
    if (!f.required) return true;
    if (f.type === "checkbox") return true;
    const v = values[f.name] ?? "";
    if (String(v).trim() === "") return false;
    if (f.type === "number") return !isNaN(Number(v)) && Number(v) >= 0;
    return true;
  });

  function setValue(name: string, value: string | boolean) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {fields.map((field, i) => (
        <label
          key={field.name}
          className={`flex ${field.type === "checkbox" ? "flex-row items-center gap-2" : "flex-col gap-1"} text-left`}
        >
          {field.type === "checkbox" ? (
            <>
              <input
                type="checkbox"
                checked={Boolean(values[field.name])}
                onChange={(e) => setValue(field.name, e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {field.label}
              </span>
            </>
          ) : (
            <>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {field.label}
              </span>
              {field.type === "textarea" ? (
                <textarea
                  value={String(values[field.name] ?? "")}
                  onChange={(e) => setValue(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  rows={field.rows ?? 3}
                  className={`${inputClass} resize-y`}
                  autoFocus={i === 0}
                />
              ) : (
                <input
                  type={field.type}
                  value={String(values[field.name] ?? "")}
                  onChange={(e) => setValue(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  min={field.min}
                  step={field.step}
                  className={inputClass}
                  autoFocus={i === 0}
                />
              )}
            </>
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
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={!isValid || loading}>
          {loading ? "Guardando..." : initial ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}
