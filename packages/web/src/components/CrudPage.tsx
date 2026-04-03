import {
  useEffect,
  useCallback,
  useState,
  useRef,
  type ComponentType,
} from "react";
import { Table } from "./Table";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { ConfirmModal } from "./ConfirmModal";
import { PageSkeleton } from "./PageSkeleton";
import type { ApiClient } from "@/lib/createApiClient";

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
  extraActions?: (row: T) => React.ReactNode;
  children?: React.ReactNode;
}

export function CrudPage<T extends { id: number }>({
  entityName,
  entityNamePlural,
  api,
  columns,
  FormComponent,
  nameField = "name" as keyof T,
  extraActions,
  children,
}: CrudPageProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value);
      setPage(1);
    }, 300);
  }

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const params: Record<string, string | number> & {
        page: number;
        limit: number;
      } = { page, limit };
      if (searchQuery) params.search = searchQuery;
      const result = await api.fetchPaginated(params);
      setData(result.data);
      setTotalPages(result.totalPages);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : `Failed to fetch ${entityNamePlural.toLowerCase()}`,
      );
    } finally {
      setInitialLoad(false);
    }
  }, [api, entityNamePlural, page, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreate(formData: Omit<T, "id">) {
    try {
      setSaving(true);
      await api.create(formData);
      setShowCreate(false);
      loadData();
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
      loadData();
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
      loadData();
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

  if (initialLoad) {
    return <PageSkeleton />;
  }

  return (
    <div className="w-full max-w-5xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white m-0">
          {entityNamePlural}
        </h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={loadData}>
            Actualizar
          </Button>
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            + Nuevo {entityName}
          </Button>
        </div>
      </div>

      <div className="relative mb-4">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
          />
        </svg>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Buscar..."
          className="w-full pl-9 pr-9 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {searchInput && (
          <button
            onClick={() => {
              setSearchInput("");
              setSearchQuery("");
              setPage(1);
              if (debounceRef.current) clearTimeout(debounceRef.current);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-transparent border-none cursor-pointer"
          >
            ✕
          </button>
        )}
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
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        actions={(row) => (
          <>
            {extraActions?.(row)}
            <Button variant="secondary" onClick={() => setEditing(row)}>
              Editar
            </Button>
            <Button variant="danger" onClick={() => setDeleting(row)}>
              Eliminar
            </Button>
          </>
        )}
      />

      <Modal
        open={showCreate}
        title={`Nuevo ${entityName}`}
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
        title={`Editar ${entityName}`}
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

      <ConfirmModal
        open={deleting !== null}
        title={`Eliminar ${entityName}`}
        message={
          deleting && (
            <>
              ¿Estás seguro que deseas eliminar{" "}
              <strong>{String(deleting[nameField])}</strong>?
            </>
          )
        }
        confirmLabel="Eliminar"
        loadingLabel="Eliminando..."
        variant="danger"
        loading={saving}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />

      {children}
    </div>
  );
}
