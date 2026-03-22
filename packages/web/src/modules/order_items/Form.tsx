import type { OrderItem, WithId } from "@wpbot/shared";
import { GenericForm, type FormField } from "../../components/GenericForm";

const fields: FormField[] = [
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
    name: "unit_price",
    label: "Unit Price",
    type: "number",
    placeholder: "0.00",
    min: "0",
    step: "0.01",
    required: true,
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
