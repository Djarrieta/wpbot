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
    name: "price",
    label: "Precio",
    type: "number",
    placeholder: "0.00",
    min: "0",
    step: "0.01",
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
