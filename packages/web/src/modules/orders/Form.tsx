"use client";

import type { Order, WithId } from "@wpbot/shared";
import { GenericForm, type FormField } from "@/components/GenericForm";

const fields: FormField[] = [
  {
    name: "user_id",
    label: "ID Usuario",
    type: "number",
    placeholder: "ID del usuario",
    min: "1",
    required: true,
  },
  {
    name: "date",
    label: "Fecha",
    type: "date",
    required: true,
  },
  {
    name: "status",
    label: "Estado",
    type: "text",
    placeholder: "pendiente",
  },
  {
    name: "shipping_city",
    label: "Ciudad de Envío",
    type: "text",
    placeholder: "Ej: Bogota",
  },
  {
    name: "shipping_address",
    label: "Dirección de Envío",
    type: "text",
    placeholder: "Dirección completa",
  },
  {
    name: "payment_method",
    label: "Método de Pago",
    type: "text",
    placeholder: "Ej: contraentrega, wompi, nequi",
  },
];

interface OrderFormProps {
  initial?: WithId<Order>;
  onSubmit: (data: Omit<Order, "id">) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function OrderForm(props: OrderFormProps) {
  return <GenericForm<WithId<Order>> fields={fields} {...props} />;
}
