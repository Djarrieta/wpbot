import { useEffect, useCallback, useState } from "react";
import type { Order, OrderItem, WithId } from "@wpbot/shared";
import { Table } from "../../components/Table";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { OrderForm } from "./Form";
import { api } from "./api";
import { api as orderItemsApi } from "../order_items/api";
import { OrderItemForm } from "../order_items/Form";

export function OrdersPage() {
  const [orders, setOrders] = useState<WithId<Order>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Order modals
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<WithId<Order> | null>(null);
  const [deleting, setDeleting] = useState<WithId<Order> | null>(null);

  // Order items state
  const [viewingOrder, setViewingOrder] = useState<WithId<Order> | null>(null);
  const [orderItems, setOrderItems] = useState<WithId<OrderItem>[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<WithId<OrderItem> | null>(
    null,
  );
  const [deletingItem, setDeletingItem] = useState<WithId<OrderItem> | null>(
    null,
  );

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setOrders(await api.fetchAll());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOrderItems = useCallback(async (orderId: number) => {
    try {
      setLoadingItems(true);
      const items = await orderItemsApi.fetchAll({ order_id: orderId });
      setOrderItems(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch order items");
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (viewingOrder) {
      loadOrderItems(viewingOrder.id);
    }
  }, [viewingOrder, loadOrderItems]);

  // Order CRUD handlers
  async function handleCreate(data: Omit<Order, "id">) {
    try {
      setSaving(true);
      await api.create(data);
      setShowCreate(false);
      await loadOrders();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create order");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(data: Omit<Order, "id">) {
    if (!editing) return;
    try {
      setSaving(true);
      await api.update(editing.id, data);
      setEditing(null);
      await loadOrders();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update order");
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
      await loadOrders();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete order");
    } finally {
      setSaving(false);
    }
  }

  // Order Items CRUD handlers
  async function handleAddItem(data: Omit<OrderItem, "id">) {
    if (!viewingOrder) return;
    try {
      setSaving(true);
      await orderItemsApi.create({ ...data, order_id: viewingOrder.id });
      setShowAddItem(false);
      await loadOrderItems(viewingOrder.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add item");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateItem(data: Omit<OrderItem, "id">) {
    if (!editingItem || !viewingOrder) return;
    try {
      setSaving(true);
      await orderItemsApi.update(editingItem.id, data);
      setEditingItem(null);
      await loadOrderItems(viewingOrder.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update item");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteItem() {
    if (!deletingItem || !viewingOrder) return;
    try {
      setSaving(true);
      await orderItemsApi.delete(deletingItem.id);
      setDeletingItem(null);
      await loadOrderItems(viewingOrder.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete item");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-6 text-gray-500">Loading orders...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Orders
        </h1>
        <Button onClick={() => setShowCreate(true)}>+ New Order</Button>
      </div>

      {error && (
        <div className="p-4 mb-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300">
          {error}
          <button className="ml-2 underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      <Table
        columns={[
          { key: "id", header: "ID" },
          { key: "user_id", header: "User ID" },
          { key: "date", header: "Date" },
          { key: "status", header: "Status" },
        ]}
        data={orders}
        keyField="id"
        actions={(order) => (
          <>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setViewingOrder(order)}
            >
              Items
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setEditing(order)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => setDeleting(order)}
            >
              Delete
            </Button>
          </>
        )}
      />

      {/* Create Order Modal */}
      <Modal
        open={showCreate}
        title="Create Order"
        onClose={() => setShowCreate(false)}
      >
        <OrderForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          loading={saving}
        />
      </Modal>

      {/* Edit Order Modal */}
      <Modal
        open={!!editing}
        title="Edit Order"
        onClose={() => setEditing(null)}
      >
        {editing && (
          <OrderForm
            initial={editing}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            loading={saving}
          />
        )}
      </Modal>

      {/* Delete Order Confirmation */}
      <Modal
        open={!!deleting}
        title="Delete Order"
        onClose={() => setDeleting(null)}
      >
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          Are you sure you want to delete Order #{deleting?.id}?
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setDeleting(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={saving}>
            {saving ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>

      {/* Order Items Modal */}
      <Modal
        open={!!viewingOrder}
        title={`Order #${viewingOrder?.id} - Items`}
        onClose={() => {
          setViewingOrder(null);
          setOrderItems([]);
        }}
      >
        <div className="min-w-[500px]">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              User: {viewingOrder?.user_id} | Date: {viewingOrder?.date} |
              Status: {viewingOrder?.status}
            </p>
            <Button size="sm" onClick={() => setShowAddItem(true)}>
              + Add Item
            </Button>
          </div>

          {loadingItems ? (
            <p className="text-gray-500">Loading items...</p>
          ) : orderItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No items in this order.
            </p>
          ) : (
            <Table
              columns={[
                { key: "item_id", header: "Item ID" },
                { key: "quantity", header: "Qty" },
                { key: "unit_price", header: "Unit Price" },
              ]}
              data={orderItems}
              keyField="id"
              actions={(item) => (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setEditingItem(item)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setDeletingItem(item)}
                  >
                    Delete
                  </Button>
                </>
              )}
            />
          )}

          {/* Total */}
          {orderItems.length > 0 && (
            <div className="mt-4 text-right font-semibold text-gray-900 dark:text-white">
              Total: $
              {orderItems
                .reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
                .toFixed(2)}
            </div>
          )}
        </div>
      </Modal>

      {/* Add Item Modal */}
      <Modal
        open={showAddItem}
        title="Add Item to Order"
        onClose={() => setShowAddItem(false)}
      >
        <OrderItemForm
          onSubmit={handleAddItem}
          onCancel={() => setShowAddItem(false)}
          loading={saving}
        />
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        open={!!editingItem}
        title="Edit Item"
        onClose={() => setEditingItem(null)}
      >
        {editingItem && (
          <OrderItemForm
            initial={editingItem}
            onSubmit={handleUpdateItem}
            onCancel={() => setEditingItem(null)}
            loading={saving}
          />
        )}
      </Modal>

      {/* Delete Item Confirmation */}
      <Modal
        open={!!deletingItem}
        title="Delete Item"
        onClose={() => setDeletingItem(null)}
      >
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          Are you sure you want to remove this item from the order?
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setDeletingItem(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteItem} disabled={saving}>
            {saving ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
