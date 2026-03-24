"use client";

import type { Item, WithId } from "@wpbot/shared";
import { CrudPage } from "@/components/CrudPage";
import { ItemForm } from "./Form";
import { api } from "./api";

export function ItemsPage() {
  return (
    <CrudPage<WithId<Item>>
      entityName="Artículo"
      entityNamePlural="Artículos"
      api={api}
      columns={[
        { key: "id", header: "ID" },
        { key: "name", header: "Nombre" },
        { key: "description", header: "Descripción" },
        {
          key: "price",
          header: "Precio",
          render: (v) => `$${Number(v).toFixed(2)}`,
        },
      ]}
      FormComponent={ItemForm}
    />
  );
}
