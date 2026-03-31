"use client";

import { useEffect, useState } from "react";
import type { Item, Product, WithId } from "@wpbot/shared";
import { GenericForm, type FormField } from "@/components/GenericForm";
import { api as productsApi } from "../products/api";

const staticFields: FormField[] = [
  {
    name: "brand",
    label: "Marca",
    type: "text",
    placeholder: "Ej: Samsung, Apple, Xiaomi",
  },
  {
    name: "reference",
    label: "Referencia",
    type: "text",
    placeholder: "Ej: Galaxy S24 Ultra, iPhone 15 Pro",
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

  useEffect(() => {
    productsApi.fetchAll().then(setProducts);
  }, []);

  const fields: FormField[] = [
    {
      name: "product_id",
      label: "Producto",
      type: "select",
      options: products.map((p) => ({ value: String(p.id), label: p.name })),
      required: true,
    },
    ...staticFields,
  ];

  return (
    <GenericForm<WithId<Item>>
      fields={fields}
      initial={initial}
      onSubmit={(data) => {
        data.product_id = Number(data.product_id);
        onSubmit(data);
      }}
      onCancel={onCancel}
      loading={loading}
    />
  );
}
