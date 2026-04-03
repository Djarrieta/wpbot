"use client";

import { useEffect, useState } from "react";
import type { Product, ProductType, WithId } from "@wpbot/shared";
import { CrudPage } from "@/components/CrudPage";
import { ProductForm } from "./Form";
import { api } from "./api";
import { api as productTypesApi } from "@/modules/product_types/api";

export function ProductsPage() {
  const [productTypes, setProductTypes] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    productTypesApi.fetchAll().then((types) => {
      setProductTypes(new Map(types.map((t) => [t.id, t.name])));
    }).catch(() => {});
  }, []);

  return (
    <CrudPage<WithId<Product>>
      entityName="Producto"
      entityNamePlural="Productos"
      api={api}
      columns={[
        { key: "id", header: "ID" },
        { key: "name", header: "Nombre" },
        {
          key: "product_type_id",
          header: "Tipo",
          render: (v) => productTypes.get(Number(v)) ?? `#${v}`,
        },
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
