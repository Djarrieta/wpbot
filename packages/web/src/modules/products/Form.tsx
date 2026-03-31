"use client";

import type { Product, WithId } from "@wpbot/shared";
import { GenericForm, type FormField } from "@/components/GenericForm";

const fields: FormField[] = [
  {
    name: "name",
    label: "Nombre",
    type: "text",
    placeholder: "Nombre del producto",
    required: true,
  },
  {
    name: "description",
    label: "Descripción",
    type: "textarea",
    placeholder: "Descripción del producto",
  },
  {
    name: "type",
    label: "Tipo",
    type: "select",
    options: [
      { value: "skin texturizado", label: "Skin Texturizado" },
      { value: "skin impreso", label: "Skin Impreso" },
      { value: "funda transparente", label: "Funda Transparente" },
      { value: "funda 3d", label: "Funda 3D" },
    ],
    required: true,
  },
  {
    name: "price",
    label: "Precio",
    type: "number",
    placeholder: "0",
    min: "0",
    step: "1",
    required: true,
  },
  {
    name: "image_url",
    label: "URL de imagen",
    type: "text",
    placeholder: "https://ejemplo.com/imagen.jpg",
    required: true,
  },
  {
    name: "requires_device",
    label: "Requiere dispositivo (marca/modelo)",
    type: "checkbox",
  },
];

interface ProductFormProps {
  initial?: WithId<Product>;
  onSubmit: (data: Omit<Product, "id">) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ProductForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: ProductFormProps) {
  return (
    <GenericForm<WithId<Product>>
      fields={fields}
      initial={initial}
      onSubmit={onSubmit}
      onCancel={onCancel}
      loading={loading}
    />
  );
}
