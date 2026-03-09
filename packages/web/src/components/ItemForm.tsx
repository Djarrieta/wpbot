import type { Item } from "../types";
import { GenericForm, type FormField } from "./GenericForm";

const fields: FormField[] = [
  {
    name: "name",
    label: "Name",
    type: "text",
    placeholder: "Item name",
    required: true,
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    placeholder: "Item description",
  },
  {
    name: "price",
    label: "Price",
    type: "number",
    placeholder: "0.00",
    min: "0",
    step: "0.01",
    required: true,
  },
];

interface ItemFormProps {
  initial?: Item;
  onSubmit: (data: Omit<Item, "id">) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ItemForm(props: ItemFormProps) {
  return <GenericForm<Item> fields={fields} {...props} />;
}
