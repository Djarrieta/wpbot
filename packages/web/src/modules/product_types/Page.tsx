"use client";

import type { ProductType, WithId } from "@wpbot/shared";
import { CrudPage } from "@/components/CrudPage";
import { ProductTypeForm } from "./Form";
import { api } from "./api";

export function ProductTypesPage() {
  return (
    <CrudPage<WithId<ProductType>>
      entityName="Tipo de Producto"
      entityNamePlural="Tipos de Producto"
      api={api}
      columns={[
        { key: "id", header: "ID" },
        { key: "name", header: "Nombre" },
        { key: "description", header: "Descripción" },
      ]}
      FormComponent={ProductTypeForm}
    />
  );
}
