"use client";

import type { Inventory, WithId } from "@wpbot/shared";
import { GenericForm, type FormField } from "@/components/GenericForm";

const fields: FormField[] = [
  {
    name: "item_id",
    label: "ID Artículo",
    type: "number",
    placeholder: "ID del artículo",
    min: "1",
    required: true,
  },
  {
    name: "quantity",
    label: "Cantidad",
    type: "number",
    placeholder: "0",
    min: "0",
    required: true,
  },
  {
    name: "location",
    label: "Ubicación",
    type: "text",
    placeholder: "Ubicación en almacén",
  },
];

interface InventoryFormProps {
  initial?: WithId<Inventory>;
  onSubmit: (data: Omit<Inventory, "id">) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function InventoryForm(props: InventoryFormProps) {
  return <GenericForm<WithId<Inventory>> fields={fields} {...props} />;
}
