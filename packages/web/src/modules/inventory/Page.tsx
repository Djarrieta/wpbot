"use client";

import type { Inventory, WithId } from "@wpbot/shared";
import { CrudPage } from "@/components/CrudPage";
import { InventoryForm } from "./Form";
import { api } from "./api";

export function InventoryPage() {
  return (
    <CrudPage<WithId<Inventory>>
      entityName="Inventario"
      entityNamePlural="Inventario"
      api={api}
      columns={[
        { key: "id", header: "ID" },
        { key: "item_id", header: "ID Artículo" },
        { key: "quantity", header: "Cantidad" },
        { key: "location", header: "Ubicación" },
      ]}
      FormComponent={InventoryForm}
    />
  );
}
