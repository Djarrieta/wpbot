"use client";

import type { OrderItem, WithId } from "@wpbot/shared";
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
    placeholder: "1",
    min: "1",
    required: true,
  },
  {
    name: "unit_price",
    label: "Precio Unitario",
    type: "number",
    placeholder: "0.00",
    min: "0",
    step: "0.01",
    required: true,
  },
  {
    name: "device_reference",
    label: "Referencia del dispositivo",
    type: "text",
    placeholder: "Ej: Samsung Galaxy S24 Ultra",
  },
];

interface OrderItemFormProps {
  initial?: WithId<OrderItem>;
  onSubmit: (data: Omit<OrderItem, "id">) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function OrderItemForm(props: OrderItemFormProps) {
  return <GenericForm<WithId<OrderItem>> fields={fields} {...props} />;
}
