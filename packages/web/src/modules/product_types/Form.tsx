"use client";

import type { ProductType, WithId } from "@wpbot/shared";
import { GenericForm, type FormField } from "@/components/GenericForm";

const fields: FormField[] = [
  {
    name: "name",
    label: "Nombre",
    type: "text",
    placeholder: "Ej: Skin Texturizado, Funda 3D",
    required: true,
  },
];

interface ProductTypeFormProps {
  initial?: WithId<ProductType>;
  onSubmit: (data: Omit<ProductType, "id">) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ProductTypeForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: ProductTypeFormProps) {
  return (
    <GenericForm<WithId<ProductType>>
      fields={fields}
      initial={initial}
      onSubmit={onSubmit}
      onCancel={onCancel}
      loading={loading}
    />
  );
}
