import type { Order, WithId } from "@wpbot/shared";
import { CrudPage } from "../../components/CrudPage";
import { OrderForm } from "./Form";
import { api } from "./api";

export function OrdersPage() {
  return (
    <CrudPage<WithId<Order>>
      entityName="Order"
      entityNamePlural="Orders"
      api={api}
      columns={[
        { key: "id", header: "ID" },
        { key: "user_id", header: "User ID" },
        { key: "item_id", header: "Item ID" },
        { key: "quantity", header: "Quantity" },
        { key: "date", header: "Date" },
      ]}
      FormComponent={OrderForm}
    />
  );
}
