import type { Shipping, WithId } from "@wpbot/shared";
import { CrudPage } from "../../components/CrudPage";
import { ShippingForm } from "./Form";
import { api } from "./api";

export function ShippingPage() {
  return (
    <CrudPage<WithId<Shipping>>
      entityName="Envío"
      entityNamePlural="Envíos"
      api={api}
      columns={[
        { key: "id", header: "ID" },
        { key: "city", header: "Ciudad" },
        { key: "department", header: "Departamento" },
        {
          key: "shipping_cost_cop",
          header: "Costo (COP)",
          render: (v) => `$${Number(v).toLocaleString('es-CO')}`,
        },
        { key: "delivery_estimated_days", header: "Días Est." },
      ]}
      FormComponent={ShippingForm}
    />
  );
}
