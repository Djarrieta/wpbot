"use client";

import { useState, type FormEvent } from "react";
import type { Item, OrderItem, WithId } from "@wpbot/shared";
import { Button } from "@/components/Button";
import { SearchSelect } from "@/components/SearchSelect";
import { api as itemsApi } from "../items/api";

interface OrderItemFormProps {
  initial?: WithId<OrderItem>;
  onSubmit: (data: Omit<OrderItem, "id">) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function OrderItemForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: OrderItemFormProps) {
  const [selectedItemId, setSelectedItemId] = useState<number>(
    initial?.item_id ?? 0,
  );
  const [selectedItem, setSelectedItem] = useState<WithId<Item> | null>(null);
  const [quantity, setQuantity] = useState<string>(
    initial?.quantity ? String(initial.quantity) : "1",
  );
  const [unitPrice, setUnitPrice] = useState<string>(
    initial?.unit_price != null ? String(initial.unit_price) : "",
  );
  const [imageSent, setImageSent] = useState<boolean>(
    initial?.image_sent ?? false,
  );

  function handleItemChange(id: number, record: WithId<Item> | null) {
    setSelectedItemId(id);
    setSelectedItem(record);
    if (record) {
      setUnitPrice(String(record.price));
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const item = selectedItem;
    onSubmit({
      order_id: initial?.order_id ?? 0,
      item_id: selectedItemId,
      item_name: item?.name ?? initial?.item_name ?? "",
      quantity: Number(quantity),
      unit_price: Number(unitPrice),
      device_reference: item
        ? [item.brand, item.reference].filter(Boolean).join(" ")
        : initial?.device_reference ?? "",
      image_sent: imageSent,
    });
  }

  const isValid =
    selectedItemId > 0 && Number(quantity) >= 1 && Number(unitPrice) >= 0;

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-1 text-left">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Artículo
        </span>
        <SearchSelect<WithId<Item>>
          apiClient={itemsApi}
          value={selectedItemId}
          onChange={handleItemChange}
          labelKey="name"
          placeholder="Buscar artículo..."
          required
          autoFocus
          renderOption={(item) =>
            `${item.name} — $${item.price}${item.brand ? ` (${item.brand} ${item.reference ?? ""})` : ""}`
          }
        />
      </label>

      <label className="flex flex-col gap-1 text-left">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Cantidad
        </span>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="1"
          required
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-left">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Precio Unitario
        </span>
        <input
          type="number"
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
          min="0"
          step="0.01"
          required
          className={inputClass}
        />
      </label>

      <label className="flex items-center gap-2 text-left">
        <input
          type="checkbox"
          checked={imageSent}
          onChange={(e) => setImageSent(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Imagen enviada
        </span>
      </label>

      <div className="flex justify-end gap-3 mt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={!isValid || loading}>
          {loading ? "Guardando..." : initial ? "Actualizar" : "Agregar"}
        </Button>
      </div>
    </form>
  );
}
