"use client";

import { useEffect, useState } from "react";
import type { Item, Product, Group, Subgroup, WithId } from "@wpbot/shared";
import { GenericForm, type FormField } from "@/components/GenericForm";
import { api as productsApi } from "../products/api";
import { api as groupsApi } from "../groups/api";
import { api as subgroupsApi } from "../subgroups/api";

interface ItemFormProps {
  initial?: WithId<Item>;
  onSubmit: (data: Omit<Item, "id">) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ItemForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: ItemFormProps) {
  const [products, setProducts] = useState<WithId<Product>[]>([]);
  const [groups, setGroups] = useState<WithId<Group>[]>([]);
  const [subgroups, setSubgroups] = useState<WithId<Subgroup>[]>([]);

  useEffect(() => {
    productsApi.fetchAll().then(setProducts);
    groupsApi.fetchAll().then(setGroups);
    subgroupsApi.fetchAll().then(setSubgroups);
  }, []);

  // Build subgroup options with group name prefix
  const subgroupOptions = subgroups.map((sg) => {
    const group = groups.find((g) => g.id === sg.group_id);
    return {
      value: String(sg.id),
      label: group ? `${group.name} — ${sg.name}` : sg.name,
    };
  });

  const fields: FormField[] = [
    {
      name: "product_id",
      label: "Producto",
      type: "select",
      options: products.map((p) => ({ value: String(p.id), label: p.name })),
      required: true,
    },
    {
      name: "subgroup_id",
      label: "Subgrupo (dispositivo)",
      type: "select",
      options: [{ value: "0", label: "— Sin dispositivo —" }, ...subgroupOptions],
    },
    {
      name: "stock",
      label: "Stock",
      type: "number",
      placeholder: "0",
      min: "0",
      step: "1",
      required: true,
    },
  ];

  return (
    <GenericForm<WithId<Item>>
      fields={fields}
      initial={initial}
      onSubmit={(data) => {
        data.product_id = Number(data.product_id);
        data.subgroup_id = Number(data.subgroup_id);
        onSubmit(data);
      }}
      onCancel={onCancel}
      loading={loading}
    />
  );
}
