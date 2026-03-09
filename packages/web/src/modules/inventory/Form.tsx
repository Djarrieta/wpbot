import type { Inventory, WithId } from "@wpbot/shared";
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
    placeholder: "0",
    min: "0",
    required: true,
  },
  {
    name: "location",
    label: "Location",
    type: "text",
    placeholder: "Warehouse location",
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
