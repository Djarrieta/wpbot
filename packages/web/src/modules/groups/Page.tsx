"use client";

import { useCallback, useState } from "react";
import type { Group, Subgroup, WithId } from "@wpbot/shared";
import { CrudPage } from "@/components/CrudPage";
import { Table } from "@/components/Table";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { GroupForm } from "./Form";
import { api } from "./api";
import { api as subgroupsApi } from "../subgroups/api";
import { SubgroupForm } from "../subgroups/Form";

export function GroupsPage() {
  // Subgroups state
  const [viewingGroup, setViewingGroup] = useState<WithId<Group> | null>(null);
  const [subgroups, setSubgroups] = useState<WithId<Subgroup>[]>([]);
  const [loadingSubgroups, setLoadingSubgroups] = useState(false);
  const [showAddSubgroup, setShowAddSubgroup] = useState(false);
  const [editingSubgroup, setEditingSubgroup] =
    useState<WithId<Subgroup> | null>(null);
  const [deletingSubgroup, setDeletingSubgroup] =
    useState<WithId<Subgroup> | null>(null);
  const [savingSubgroup, setSavingSubgroup] = useState(false);
  const [subgroupError, setSubgroupError] = useState<string | null>(null);

  const loadSubgroups = useCallback(async (groupId: number) => {
    try {
      setLoadingSubgroups(true);
      const items = await subgroupsApi.fetchAll({ group_id: groupId });
      setSubgroups(items);
    } catch (e) {
      setSubgroupError(
        e instanceof Error ? e.message : "Error al obtener subgrupos del grupo",
      );
    } finally {
      setLoadingSubgroups(false);
    }
  }, []);

  function handleViewGroup(group: WithId<Group>) {
    setViewingGroup(group);
    loadSubgroups(group.id);
  }

  async function handleAddSubgroup(data: Omit<Subgroup, "id">) {
    if (!viewingGroup) return;
    try {
      setSavingSubgroup(true);
      await subgroupsApi.create({ ...data, group_id: viewingGroup.id });
      setShowAddSubgroup(false);
      await loadSubgroups(viewingGroup.id);
    } catch (e) {
      setSubgroupError(
        e instanceof Error ? e.message : "Error al agregar subgrupo",
      );
    } finally {
      setSavingSubgroup(false);
    }
  }

  async function handleUpdateSubgroup(data: Omit<Subgroup, "id">) {
    if (!editingSubgroup || !viewingGroup) return;
    try {
      setSavingSubgroup(true);
      await subgroupsApi.update(editingSubgroup.id, data);
      setEditingSubgroup(null);
      await loadSubgroups(viewingGroup.id);
    } catch (e) {
      setSubgroupError(
        e instanceof Error ? e.message : "Error al actualizar subgrupo",
      );
    } finally {
      setSavingSubgroup(false);
    }
  }

  async function handleDeleteSubgroup() {
    if (!deletingSubgroup || !viewingGroup) return;
    try {
      setSavingSubgroup(true);
      await subgroupsApi.delete(deletingSubgroup.id);
      setDeletingSubgroup(null);
      await loadSubgroups(viewingGroup.id);
    } catch (e) {
      setSubgroupError(
        e instanceof Error ? e.message : "Error al eliminar subgrupo",
      );
    } finally {
      setSavingSubgroup(false);
    }
  }

  return (
    <CrudPage<WithId<Group>>
      entityName="Grupo"
      entityNamePlural="Grupos"
      api={api}
      columns={[
        { key: "id", header: "ID" },
        { key: "name", header: "Nombre" },
      ]}
      FormComponent={GroupForm}
      extraActions={(group) => (
        <Button variant="secondary" onClick={() => handleViewGroup(group)}>
          Subgrupos
        </Button>
      )}
    >
      {/* Subgroups List Modal */}
      <Modal
        open={!!viewingGroup}
        title={`Grupo #${viewingGroup?.id} - Subgrupos`}
        onClose={() => {
          setViewingGroup(null);
          setSubgroups([]);
          setSubgroupError(null);
        }}
      >
        <div className="min-w-[500px]">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Grupo: {viewingGroup?.name}
            </p>
            <Button size="sm" onClick={() => setShowAddSubgroup(true)}>
              + Agregar Subgrupo
            </Button>
          </div>

          {subgroupError && (
            <div className="flex justify-between items-center bg-red-900/20 border border-red-600 text-red-400 px-4 py-3 rounded-md mb-4">
              {subgroupError}
              <button
                className="bg-transparent border-none text-red-400 cursor-pointer text-base px-1"
                onClick={() => setSubgroupError(null)}
              >
                ✕
              </button>
            </div>
          )}

          {loadingSubgroups ? (
            <p className="text-gray-500">Cargando subgrupos...</p>
          ) : subgroups.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No hay subgrupos en este grupo.
            </p>
          ) : (
            <Table
              columns={[
                { key: "id", header: "ID" },
                { key: "name", header: "Nombre" },
              ]}
              data={subgroups}
              keyField="id"
              actions={(subgroup) => (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setEditingSubgroup(subgroup)}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setDeletingSubgroup(subgroup)}
                  >
                    Eliminar
                  </Button>
                </>
              )}
            />
          )}
        </div>
      </Modal>

      {/* Add Subgroup Modal */}
      <Modal
        open={showAddSubgroup}
        title="Agregar Subgrupo"
        onClose={() => setShowAddSubgroup(false)}
      >
        <SubgroupForm
          initial={
            { group_id: viewingGroup?.id ?? 0, name: "" } as WithId<Subgroup>
          }
          onSubmit={handleAddSubgroup}
          onCancel={() => setShowAddSubgroup(false)}
          loading={savingSubgroup}
          fixedGroupId={viewingGroup?.id}
        />
      </Modal>

      {/* Edit Subgroup Modal */}
      <Modal
        open={!!editingSubgroup}
        title="Editar Subgrupo"
        onClose={() => setEditingSubgroup(null)}
      >
        {editingSubgroup && (
          <SubgroupForm
            initial={editingSubgroup}
            onSubmit={handleUpdateSubgroup}
            onCancel={() => setEditingSubgroup(null)}
            loading={savingSubgroup}
            fixedGroupId={viewingGroup?.id}
          />
        )}
      </Modal>

      {/* Delete Subgroup Confirmation */}
      <Modal
        open={!!deletingSubgroup}
        title="Eliminar Subgrupo"
        onClose={() => setDeletingSubgroup(null)}
      >
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          ¿Estás seguro que deseas eliminar el subgrupo "
          {deletingSubgroup?.name}"?
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setDeletingSubgroup(null)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteSubgroup}
            disabled={savingSubgroup}
          >
            {savingSubgroup ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </Modal>
    </CrudPage>
  );
}
