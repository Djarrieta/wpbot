import { useEffect, useState } from "react";
import type { User } from "../types";
import * as api from "../api/users";
import { Table } from "../components/Table";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { UserForm } from "../components/UserForm";

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.fetchUsers();
      setUsers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(data: Omit<User, "id">) {
    try {
      setSaving(true);
      await api.createUser(data);
      setShowCreate(false);
      await loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create user");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(data: Omit<User, "id">) {
    if (!editing) return;
    try {
      setSaving(true);
      await api.updateUser(editing.id, data);
      setEditing(null);
      await loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update user");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      setSaving(true);
      await api.deleteUser(deleting.id);
      setDeleting(null);
      await loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete user");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-8 text-center text-gray-500">Loading users...</div>
    );
  }

  return (
    <div className="w-full max-w-5xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white m-0">
          Users
        </h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={loadUsers}>
            Refresh
          </Button>
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            + New User
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

      <Table<User>
        columns={[
          { key: "id", header: "ID" },
          { key: "name", header: "Name" },
          { key: "email", header: "Email" },
          { key: "phone", header: "Phone" },
        ]}
        data={users}
        keyField="id"
        actions={(user) => (
          <>
            <Button variant="secondary" onClick={() => setEditing(user)}>
              Edit
            </Button>
            <Button variant="danger" onClick={() => setDeleting(user)}>
              Delete
            </Button>
          </>
        )}
      />

      {/* Create Modal */}
      <Modal
        open={showCreate}
        title="New User"
        onClose={() => setShowCreate(false)}
      >
        <UserForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          loading={saving}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editing !== null}
        title="Edit User"
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

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleting !== null}
        title="Delete User"
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
