import type { Shipping, WithId } from "@wpbot/shared";
import { GenericForm, type FormField } from "../../components/GenericForm";

const fields: FormField[] = [
  {
    name: "city",
    label: "City",
    type: "text",
    placeholder: "e.g., Bogota",
    required: true,
  },
  {
    name: "department",
    label: "Department",
    type: "text",
    placeholder: "e.g., Cundinamarca",
    required: true,
  },
  {
    name: "shipping_cost_cop",
    label: "Shipping Cost (COP)",
    type: "number",
    placeholder: "15000",
    min: "0",
    step: "1",
    required: true,
  },
  {
    name: "delivery_estimated_days",
    label: "Estimated Delivery (Days)",
    type: "number",
    placeholder: "2",
    min: "1",
    step: "1",
    required: true,
  },
];

interface ShippingFormProps {
  initial?: WithId<Shipping>;
  onSubmit: (data: Omit<Shipping, "id">) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ShippingForm(props: ShippingFormProps) {
  return <GenericForm<WithId<Shipping>> fields={fields} {...props} />;
}
