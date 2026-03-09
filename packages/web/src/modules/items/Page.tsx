import type { Item, WithId } from "@wpbot/shared";
import { CrudPage } from "../../components/CrudPage";
import { ItemForm } from "./Form";
import { api } from "./api";

export function ItemsPage() {
  return (
    <CrudPage<WithId<Item>>
      entityName="Item"
      entityNamePlural="Items"
      api={api}
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
