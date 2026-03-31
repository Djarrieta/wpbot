"use client";

import type { Product, WithId } from "@wpbot/shared";
import { CrudPage } from "@/components/CrudPage";
import { ProductForm } from "./Form";
import { api } from "./api";

export function ProductsPage() {
  return (
    <CrudPage<WithId<Product>>
      entityName="Producto"
      entityNamePlural="Productos"
      api={api}
      columns={[
        { key: "id", header: "ID" },
        { key: "name", header: "Nombre" },
        { key: "type", header: "Tipo" },
        {
          key: "price",
          header: "Precio",
          render: (v) => `$${Number(v).toLocaleString()}`,
        },
        {
          key: "requires_device",
          header: "Req. Dispositivo",
          render: (v) => (v ? "Sí" : "No"),
        },
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
      FormComponent={ProductForm}
    />
  );
}
