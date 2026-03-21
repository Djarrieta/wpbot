import type { Shipping, WithId } from "@wpbot/shared";
import { CrudPage } from "../../components/CrudPage";
import { ShippingForm } from "./Form";
import { api } from "./api";

export function ShippingPage() {
  return (
    <CrudPage<WithId<Shipping>>
      entityName="Shipping"
      entityNamePlural="Shipping"
      api={api}
      columns={[
        { key: "id", header: "ID" },
        { key: "city", header: "City" },
        { key: "department", header: "Department" },
        {
          key: "shipping_cost_cop",
          header: "Cost (COP)",
          render: (v) => `$${Number(v).toLocaleString('es-CO')}`,
        },
        { key: "delivery_estimated_days", header: "Est. Days" },
      ]}
      FormComponent={ShippingForm}
    />
  );
}
