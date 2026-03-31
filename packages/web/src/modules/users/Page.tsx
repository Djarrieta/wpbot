"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import type { User, WithId } from "@wpbot/shared";
import { Table } from "@/components/Table";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { PageSkeleton } from "@/components/PageSkeleton";
import { UserForm } from "./Form";
import { api } from "./api";

export function UsersPage() {
  const [data, setData] = useState<WithId<User>[]>([]);
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
  const [editing, setEditing] = useState<WithId<User> | null>(null);
  const [deleting, setDeleting] = useState<WithId<User> | null>(null);

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
      setError(e instanceof Error ? e.message : "Error al cargar usuarios");
    } finally {
      setInitialLoad(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreate(formData: Omit<WithId<User>, "id">) {
    try {
      setSaving(true);
      await api.create(formData);
      setShowCreate(false);
      loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear usuario");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(formData: Omit<WithId<User>, "id">) {
    if (!editing) return;
    try {
      setSaving(true);
      await api.update(editing.id, formData);
      setEditing(null);
      loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al actualizar usuario");
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
      setError(e instanceof Error ? e.message : "Error al eliminar usuario");
    } finally {
      setSaving(false);
    }
  }

  if (initialLoad) return <PageSkeleton />;

  return (
    <div className="w-full max-w-5xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white m-0">
          Usuarios
        </h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={loadData}>
            Actualizar
          </Button>
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            + Nuevo Usuario
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

      <Table<WithId<User>>
        columns={[
          { key: "id", header: "ID" },
          { key: "name", header: "Nombre" },
          { key: "email", header: "Correo" },
          { key: "phone", header: "Teléfono" },
          { key: "role", header: "Rol" },
        ]}
        data={data}
        keyField="id"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        actions={(row) => (
          <>
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
        title="Nuevo Usuario"
        onClose={() => setShowCreate(false)}
      >
        <UserForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          loading={saving}
        />
      </Modal>

      <Modal
        open={editing !== null}
        title="Editar Usuario"
        onClose={() => setEditing(null)}
      >
        {editing && (
          <UserForm
            initial={editing}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            loading={saving}
          />
        )}
      </Modal>

      <Modal
        open={deleting !== null}
        title="Eliminar Usuario"
        onClose={() => setDeleting(null)}
      >
        {deleting && (
          <div>
            <p className="mb-6 text-left text-gray-700 dark:text-gray-300">
              ¿Estás seguro que deseas eliminar{" "}
              <strong>{deleting.name || `Usuario #${deleting.id}`}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setDeleting(null)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={saving}>
                {saving ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
