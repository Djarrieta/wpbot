import { useEffect, useCallback, useState, type ComponentType } from "react";
import { Table } from "./Table";
import { Button } from "./Button";
import { Modal } from "./Modal";
import type { ApiClient } from "../lib/createApiClient";

interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface CrudPageProps<T> {
  entityName: string;
  entityNamePlural: string;
  api: ApiClient<T>;
  columns: Column<T>[];
  FormComponent: ComponentType<{
    initial?: T;
    onSubmit: (data: Omit<T, "id">) => void;
    onCancel: () => void;
    loading?: boolean;
  }>;
  nameField?: keyof T;
}

export function CrudPage<T extends { id: number }>({
  entityName,
  entityNamePlural,
  api,
  columns,
  FormComponent,
  nameField = "name" as keyof T,
}: CrudPageProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setData(await api.fetchAll());
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : `Failed to fetch ${entityNamePlural.toLowerCase()}`,
      );
    } finally {
      setLoading(false);
    }
  }, [api, entityNamePlural]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreate(formData: Omit<T, "id">) {
    try {
      setSaving(true);
      await api.create(formData);
      setShowCreate(false);
      await loadData();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : `Failed to create ${entityName.toLowerCase()}`,
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(formData: Omit<T, "id">) {
    if (!editing) return;
    try {
      setSaving(true);
      await api.update(editing.id, formData);
      setEditing(null);
      await loadData();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : `Failed to update ${entityName.toLowerCase()}`,
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      setSaving(true);
      await api.delete(deleting.id);
      setDeleting(null);
      await loadData();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : `Failed to delete ${entityName.toLowerCase()}`,
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-8 text-center text-gray-500">
        Loading {entityNamePlural.toLowerCase()}...
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white m-0">
          {entityNamePlural}
        </h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={loadData}>
            Refresh
          </Button>
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            + New {entityName}
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

      <Table<T>
        columns={columns}
        data={data}
        keyField={"id" as keyof T}
        actions={(row) => (
          <>
            <Button variant="secondary" onClick={() => setEditing(row)}>
              Edit
            </Button>
            <Button variant="danger" onClick={() => setDeleting(row)}>
              Delete
            </Button>
          </>
        )}
      />

      <Modal
        open={showCreate}
        title={`New ${entityName}`}
        onClose={() => setShowCreate(false)}
      >
        <FormComponent
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          loading={saving}
        />
      </Modal>

      <Modal
        open={editing !== null}
        title={`Edit ${entityName}`}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <FormComponent
            initial={editing}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            loading={saving}
          />
        )}
      </Modal>

      <Modal
        open={deleting !== null}
        title={`Delete ${entityName}`}
        onClose={() => setDeleting(null)}
      >
        {deleting && (
          <div>
            <p className="mb-6 text-left text-gray-700 dark:text-gray-300">
              Are you sure you want to delete{" "}
              <strong>{String(deleting[nameField])}</strong>?
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
