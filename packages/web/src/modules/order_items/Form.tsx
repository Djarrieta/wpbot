"use client";

import { useState, useEffect, type FormEvent } from "react";
import type { Item, OrderItem, WithId } from "@wpbot/shared";
import { Button } from "@/components/Button";
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
  const [items, setItems] = useState<WithId<Item>[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  const [selectedItemId, setSelectedItemId] = useState<string>(
    initial?.item_id ? String(initial.item_id) : "",
  );
  const [quantity, setQuantity] = useState<string>(
    initial?.quantity ? String(initial.quantity) : "1",
  );
  const [unitPrice, setUnitPrice] = useState<string>(
    initial?.unit_price != null ? String(initial.unit_price) : "",
  );
  const [imageSent, setImageSent] = useState<boolean>(
    initial?.image_sent ?? false,
  );

  useEffect(() => {
    itemsApi.fetchAll().then((data) => {
      setItems(data);
      setLoadingItems(false);
    });
  }, []);

  function handleItemChange(itemId: string) {
    setSelectedItemId(itemId);
    const item = items.find((i) => i.id === Number(itemId));
    if (item) {
      setUnitPrice(String(item.price));
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const item = items.find((i) => i.id === Number(selectedItemId));
    onSubmit({
      order_id: initial?.order_id ?? 0,
      item_id: Number(selectedItemId),
      item_name: item?.name ?? "",
      quantity: Number(quantity),
      unit_price: Number(unitPrice),
      device_reference: [item?.brand, item?.reference]
        .filter(Boolean)
        .join(" "),
      image_sent: imageSent,
    });
  }

  const isValid =
    selectedItemId !== "" && Number(quantity) >= 1 && Number(unitPrice) >= 0;

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-1 text-left">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Artículo
        </span>
        {loadingItems ? (
          <p className="text-sm text-gray-500">Cargando artículos...</p>
        ) : (
          <select
            value={selectedItemId}
            onChange={(e) => handleItemChange(e.target.value)}
            className={inputClass}
            required
            autoFocus
          >
            <option value="">Seleccionar artículo...</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} — ${item.price}
                {item.brand ? ` (${item.brand} ${item.reference ?? ""})` : ""}
              </option>
            ))}
          </select>
        )}
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
