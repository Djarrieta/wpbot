"use client";

import { useEffect, useState } from "react";
import type { Item, Product, Group, Subgroup, WithId } from "@wpbot/shared";
import { CrudPage } from "@/components/CrudPage";
import { ItemForm } from "./Form";
import { api } from "./api";
import { api as productsApi } from "../products/api";
import { api as groupsApi } from "../groups/api";
import { api as subgroupsApi } from "../subgroups/api";

export function ItemsPage() {
  const [productMap, setProductMap] = useState<Map<number, string>>(new Map());
  const [subgroupLabel, setSubgroupLabel] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    productsApi.fetchAll().then((products) => {
      setProductMap(new Map(products.map((p) => [p.id, p.name])));
    });
    Promise.all([groupsApi.fetchAll(), subgroupsApi.fetchAll()]).then(
      ([groups, subgroups]) => {
        const gMap = new Map(groups.map((g) => [g.id, g.name]));
        setSubgroupLabel(
          new Map(
            subgroups.map((sg) => [
              sg.id,
              `${gMap.get(sg.group_id) ?? "?"} — ${sg.name}`,
            ]),
          ),
        );
      },
    );
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
        {
          key: "subgroup_id",
          header: "Dispositivo",
          render: (v) => {
            const id = Number(v);
            return id ? subgroupLabel.get(id) ?? `#${id}` : "—";
          },
        },
        { key: "stock", header: "Stock" },
      ]}
      FormComponent={ItemForm}
    />
  );
}
