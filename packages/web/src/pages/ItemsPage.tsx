import type { Item } from "../types";
import { itemsApi } from "../api/items";
import { CrudPage } from "../components/CrudPage";
import { ItemForm } from "../components/ItemForm";

export function ItemsPage() {
  return (
    <CrudPage<Item>
      entityName="Item"
      entityNamePlural="Items"
      api={itemsApi}
      columns={[
        { key: "id", header: "ID" },
        { key: "name", header: "Name" },
        { key: "description", header: "Description" },
        {
          key: "price",
          header: "Price",
          render: (v) => `$${Number(v).toFixed(2)}`,
        },
      ]}
      FormComponent={ItemForm}
    />
  );
}
