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
        { key: "stock", header: "Stock" },
        {
          key: "image_url",
          header: "Imagen",
          render: (v) =>
            v ? (
              <img
                src={String(v)}
                alt=""
                className="w-10 h-10 rounded object-cover"
              />
            ) : (
              "—"
            ),
        },
      ]}
      FormComponent={ItemForm}
    />
  );
}
