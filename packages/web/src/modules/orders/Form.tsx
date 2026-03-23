import type { Order, WithId } from "@wpbot/shared";
import { GenericForm, type FormField } from "../../components/GenericForm";

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
