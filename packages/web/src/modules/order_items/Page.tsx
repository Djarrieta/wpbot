"use client";

import type { OrderItem, WithId } from "@wpbot/shared";
import { CrudPage } from "@/components/CrudPage";
import { OrderItemForm } from "./Form";
import { api } from "./api";

export function OrderItemsPage() {
  return (
    <CrudPage<WithId<OrderItem>>
      entityName="Order Item"
      entityNamePlural="Order Items"
      api={api}
      columns={[
        { key: "id", header: "ID" },
        { key: "order_id", header: "Order ID" },
        { key: "item_id", header: "Item ID" },
        { key: "item_name", header: "Item" },
        { key: "quantity", header: "Quantity" },
        { key: "unit_price", header: "Unit Price" },
        {
          key: "image_sent",
          header: "Imagen Enviada",
          render: (v) => (v ? "Sí" : "No"),
        },
      ]}
      FormComponent={OrderItemForm}
    />
  );
}
