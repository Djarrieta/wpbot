"use client";

import { useState } from "react";
import type { Item, WithId } from "@wpbot/shared";
import { GenericForm, type FormField } from "@/components/GenericForm";

const baseFields: FormField[] = [
  {
    name: "name",
    label: "Nombre",
    type: "text",
    placeholder: "Nombre del artículo",
    required: true,
  },
  {
    name: "description",
    label: "Descripción",
    type: "textarea",
    placeholder: "Descripción del artículo",
  },
  {
    name: "type",
    label: "Tipo",
    type: "select",
    options: [
      { value: "skin texturizado", label: "Skin Texturizado" },
      { value: "skin impreso", label: "Skin Impreso" },
      { value: "funda 3d", label: "Funda 3D" },
    ],
    required: true,
  },
];

const brandReferenceFields: FormField[] = [
  {
    name: "brand",
    label: "Marca",
    type: "text",
    placeholder: "Ej: Samsung, Apple, Xiaomi",
    required: true,
  },
  {
    name: "reference",
    label: "Referencia",
    type: "text",
    placeholder: "Ej: Galaxy S24 Ultra, iPhone 15 Pro",
    required: true,
  },
];

const tailFields: FormField[] = [
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
    name: "stock",
    label: "Stock",
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
];

function getFields(type: string): FormField[] {
  if (type === "funda 3d") {
    return [...baseFields, ...brandReferenceFields, ...tailFields];
  }
  return [...baseFields, ...tailFields];
}

interface ItemFormProps {
  initial?: WithId<Item>;
  onSubmit: (data: Omit<Item, "id">) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ItemForm({ initial, onSubmit, onCancel, loading }: ItemFormProps) {
  const [type, setType] = useState<string>(initial?.type ?? "skin texturizado");
  const fields = getFields(type);

  return (
    <GenericForm<WithId<Item>>
      fields={fields}
      initial={initial}
      onSubmit={(data) => {
        if (type !== "funda 3d") {
          data.brand = "";
          data.reference = "";
        }
        onSubmit(data);
      }}
      onCancel={onCancel}
      loading={loading}
      onFieldChange={(name, value) => {
        if (name === "type") setType(value as string);
      }}
    />
  );
}
