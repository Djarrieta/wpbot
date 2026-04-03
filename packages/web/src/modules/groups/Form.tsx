"use client";

import type { Group, WithId } from "@wpbot/shared";
import { GenericForm, type FormField } from "@/components/GenericForm";

const fields: FormField[] = [
  {
    name: "name",
    label: "Nombre",
    type: "text",
    placeholder: "Ej: Apple, Samsung, Xiaomi",
    required: true,
  },
];

interface GroupFormProps {
  initial?: WithId<Group>;
  onSubmit: (data: Omit<Group, "id">) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function GroupForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: GroupFormProps) {
  return (
    <GenericForm<WithId<Group>>
      fields={fields}
      initial={initial}
      onSubmit={onSubmit}
      onCancel={onCancel}
      loading={loading}
    />
  );
}
