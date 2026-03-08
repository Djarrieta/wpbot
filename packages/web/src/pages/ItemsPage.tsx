import { useEffect, useState } from "react";
import type { Item } from "../types";
import * as api from "../api/items";
import { Table } from "../components/Table";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { ItemForm } from "../components/ItemForm";

export function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState<Item | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.fetchItems();
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch items");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(data: Omit<Item, "id">) {
    try {
      setSaving(true);
      await api.createItem(data);
      setShowCreate(false);
      await loadItems();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create item");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(data: Omit<Item, "id">) {
    if (!editing) return;
    try {
      setSaving(true);
      await api.updateItem(editing.id, data);
      setEditing(null);
      await loadItems();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update item");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      setSaving(true);
      await api.deleteItem(deleting.id);
      setDeleting(null);
      await loadItems();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete item");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-8 text-center text-gray-500">Loading items...</div>
    );
  }

  return (
    <div className="w-full max-w-5xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white m-0">
          Items
        </h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={loadItems}>
            Refresh
          </Button>
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            + New Item
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex justify-between items-center bg-red-900/20 border border-red-600 text-red-400 px-4 py-3 rounded-md mb-4">
          {error}
          <button
            className="bg-transparent border-none text-red-400 cursor-pointer text-base px-1"
            onClick={() => setError(null)}
          >
            ✕
          </button>
        </div>
      )}

      <Table<Item>
        columns={[
          { key: "id", header: "ID" },
          { key: "name", header: "Name" },
          { key: "description", header: "Description" },
          {
            key: "price",
            header: "Price",
            render: (v) => `$${Number(v).toFixed(2)}`,
          },
        ]}
        data={items}
        keyField="id"
        actions={(item) => (
          <>
            <Button variant="secondary" onClick={() => setEditing(item)}>
              Edit
            </Button>
            <Button variant="danger" onClick={() => setDeleting(item)}>
              Delete
            </Button>
          </>
        )}
      />

      {/* Create Modal */}
      <Modal
        open={showCreate}
        title="New Item"
        onClose={() => setShowCreate(false)}
      >
        <ItemForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          loading={saving}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editing !== null}
        title="Edit Item"
        onClose={() => setEditing(null)}
      >
        {editing && (
          <ItemForm
            initial={editing}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            loading={saving}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleting !== null}
        title="Delete Item"
        onClose={() => setDeleting(null)}
      >
        {deleting && (
          <div>
            <p className="mb-6 text-left text-gray-700 dark:text-gray-300">
              Are you sure you want to delete <strong>{deleting.name}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setDeleting(null)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={saving}>
                {saving ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
