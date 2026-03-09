import type { Inventory, WithId } from "@wpbot/shared";
import { CrudPage } from "../../components/CrudPage";
import { InventoryForm } from "./Form";
import { api } from "./api";

export function InventoryPage() {
  return (
    <CrudPage<WithId<Inventory>>
      entityName="Inventory"
      entityNamePlural="Inventory"
      api={api}
      columns={[
        { key: "id", header: "ID" },
        { key: "item_id", header: "Item ID" },
        { key: "quantity", header: "Quantity" },
        { key: "location", header: "Location" },
      ]}
      FormComponent={InventoryForm}
    />
  );
}
