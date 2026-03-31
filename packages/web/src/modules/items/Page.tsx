"use client";

import { useEffect, useState } from "react";
import type { Item, Product, WithId } from "@wpbot/shared";
import { CrudPage } from "@/components/CrudPage";
import { ItemForm } from "./Form";
import { api } from "./api";
import { api as productsApi } from "../products/api";

export function ItemsPage() {
  const [productMap, setProductMap] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    productsApi.fetchAll().then((products) => {
      setProductMap(new Map(products.map((p) => [p.id, p.name])));
    });
  }, []);

  return (
    <CrudPage<WithId<Item>>
      entityName="Variante"
      entityNamePlural="Variantes (Items)"
      api={api}
      columns={[
        { key: "id", header: "ID" },
        {
          key: "product_id",
          header: "Producto",
          render: (v) => productMap.get(Number(v)) ?? `#${v}`,
        },
        { key: "brand", header: "Marca" },
        { key: "reference", header: "Referencia" },
        { key: "stock", header: "Stock" },
      ]}
      FormComponent={ItemForm}
    />
  );
}
