import type { Order, WithId } from "@wpbot/shared";
import { GenericForm, type FormField } from "../../components/GenericForm";

const fields: FormField[] = [
  {
    name: "user_id",
    label: "User ID",
    type: "number",
    placeholder: "User ID",
    min: "1",
    required: true,
  },
  {
    name: "item_id",
    label: "Item ID",
    type: "number",
    placeholder: "Item ID",
    min: "1",
    required: true,
  },
  {
    name: "quantity",
    label: "Quantity",
    type: "number",
    placeholder: "1",
    min: "1",
    required: true,
  },
  {
    name: "date",
    label: "Date",
    type: "date",
    required: true,
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
