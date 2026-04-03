"use client";

import { useEffect, useState } from "react";
import type { Product, ProductType, WithId } from "@wpbot/shared";
import { GenericForm, type FormField } from "@/components/GenericForm";
import { api as productTypesApi } from "@/modules/product_types/api";

interface ProductFormProps {
  initial?: WithId<Product>;
  onSubmit: (data: Omit<Product, "id">) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ProductForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: ProductFormProps) {
  const [productTypes, setProductTypes] = useState<WithId<ProductType>[]>([]);

  useEffect(() => {
    productTypesApi.fetchAll().then(setProductTypes).catch(() => {});
  }, []);

  const fields: FormField[] = [
    {
      name: "name",
      label: "Nombre",
      type: "text",
      placeholder: "Nombre del producto",
      required: true,
    },
    {
      name: "description",
      label: "Descripción",
      type: "textarea",
      placeholder: "Descripción del producto",
    },
    {
      name: "product_type_id",
      label: "Tipo de Producto",
      type: "select",
      options: productTypes.map((pt) => ({
        value: String(pt.id),
        label: pt.name,
      })),
      required: true,
    },
    {
      name: "price",
      label: "Precio",
      type: "number",
      placeholder: "0",
      min: "0",
      step: "1",
      required: true,
    },
    {
      name: "image_url",
      label: "URL de imagen",
      type: "text",
      placeholder: "https://ejemplo.com/imagen.jpg",
      required: true,
    },
    {
      name: "requires_device",
      label: "Requiere dispositivo (marca/modelo)",
      type: "checkbox",
    },
  ];

  return (
    <GenericForm<WithId<Product>>
      fields={fields}
      initial={initial}
      onSubmit={onSubmit}
      onCancel={onCancel}
      loading={loading}
    />
  );
}
