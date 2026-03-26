"use client";

import { useEffect, useCallback, useState } from "react";
import type { User, WithId } from "@wpbot/shared";
import { Table } from "@/components/Table";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { PageSkeleton } from "@/components/PageSkeleton";
import { UserForm } from "./Form";
import { api, mergeUsers } from "./api";

export function UsersPage() {
  const [data, setData] = useState<WithId<User>[]>([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<WithId<User> | null>(null);
  const [deleting, setDeleting] = useState<WithId<User> | null>(null);
  const [merging, setMerging] = useState<WithId<User> | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      setError(null);
      setData(await api.fetchAll());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar usuarios");
    } finally {
      setInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreate(formData: Omit<WithId<User>, "id">) {
    try {
      setSaving(true);
      const created = await api.create(formData);
      setData((prev) => [...prev, created]);
      setShowCreate(false);
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
      const updated = await api.update(editing.id, formData);
      // If merged, the edited user may have been absorbed — reload
      if ((updated as any).merged) {
        await loadData();
      } else {
        setData((prev) => prev.map((r) => (r.id === editing.id ? updated : r)));
      }
      setEditing(null);
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
      setData((prev) => prev.filter((r) => r.id !== deleting.id));
      setDeleting(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar usuario");
    } finally {
      setSaving(false);
    }
  }

  async function handleMerge() {
    if (!merging || !mergeTargetId) return;
    const targetId = parseInt(mergeTargetId, 10);
    if (isNaN(targetId) || targetId === merging.id) return;
    try {
      setSaving(true);
      await mergeUsers(targetId, merging.id);
      setMerging(null);
      setMergeTargetId("");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al fusionar usuarios");
    } finally {
      setSaving(false);
    }
  }

  if (initialLoad) return <PageSkeleton />;

  const mergeTargets = merging ? data.filter((u) => u.id !== merging.id) : [];

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
        actions={(row) => (
          <>
            <Button variant="secondary" onClick={() => setEditing(row)}>
              Editar
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setMerging(row);
                setMergeTargetId("");
              }}
            >
              Fusionar
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

      <Modal
        open={merging !== null}
        title="Fusionar Usuarios"
        onClose={() => {
          setMerging(null);
          setMergeTargetId("");
        }}
      >
        {merging && (
          <div className="flex flex-col gap-4">
            <p className="text-left text-gray-700 dark:text-gray-300 m-0">
              Fusionar <strong>{merging.name || `#${merging.id}`}</strong>{" "}
              {merging.email ? `(${merging.email})` : ""} en otro usuario. Se
              transferirán órdenes, historial de chat e identidades al usuario
              destino, y este usuario será eliminado.
            </p>

            <label className="flex flex-col gap-1 text-left">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Usuario destino
              </span>
              <select
                value={mergeTargetId}
                onChange={(e) => setMergeTargetId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Seleccionar usuario...</option>
                {mergeTargets.map((u) => (
                  <option key={u.id} value={u.id}>
                    #{u.id} — {u.name || "Sin nombre"}{" "}
                    {u.email ? `(${u.email})` : ""}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex justify-end gap-3 mt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setMerging(null);
                  setMergeTargetId("");
                }}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleMerge}
                disabled={saving || !mergeTargetId}
              >
                {saving ? "Fusionando..." : "Fusionar"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
