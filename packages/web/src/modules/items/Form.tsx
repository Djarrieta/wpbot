"use client";

import type { Item, WithId } from "@wpbot/shared";
import { GenericForm, type FormField } from "@/components/GenericForm";

const fields: FormField[] = [
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

interface ItemFormProps {
  initial?: WithId<Item>;
  onSubmit: (data: Omit<Item, "id">) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ItemForm(props: ItemFormProps) {
  return <GenericForm<WithId<Item>> fields={fields} {...props} />;
}
