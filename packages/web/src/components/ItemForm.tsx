import { useState, type FormEvent } from "react";
import type { Item } from "../types";
import { Button } from "./Button";

interface ItemFormProps {
  initial?: Item;
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
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
    });
  }

  const isValid =
    name.trim() !== "" &&
    price !== "" &&
    !isNaN(Number(price)) &&
    Number(price) >= 0;

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-1 text-left">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Name
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name"
          className={inputClass}
          autoFocus
        />
      </label>

      <label className="flex flex-col gap-1 text-left">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Description
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Item description"
          rows={3}
          className={`${inputClass} resize-y`}
        />
      </label>

      <label className="flex flex-col gap-1 text-left">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Price
        </span>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.00"
          min="0"
          step="0.01"
          className={inputClass}
        />
      </label>

      <div className="flex justify-end gap-3 mt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={!isValid || loading}>
          {loading ? "Saving..." : initial ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
