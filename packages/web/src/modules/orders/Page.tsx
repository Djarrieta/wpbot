"use client";

import { useEffect, useCallback, useState } from "react";
import type { Order, OrderItem, WithId } from "@wpbot/shared";
import { Table } from "@/components/Table";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { OrderForm } from "./Form";
import { api } from "./api";
import { api as orderItemsApi } from "../order_items/api";
import { api as itemsApi } from "../items/api";
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
      setError(e instanceof Error ? e.message : "Error al obtener pedidos");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOrderItems = useCallback(async (orderId: number) => {
    try {
      setLoadingItems(true);
      const items = await orderItemsApi.fetchAll({ order_id: orderId });
      // Fill item_name from catalog for items missing it
      const needsName = items.some((i) => !i.item_name);
      if (needsName) {
        const catalog = await itemsApi.fetchAll();
        const catalogMap = new Map(catalog.map((c) => [c.id, c.name]));
        for (const item of items) {
          if (!item.item_name) {
            item.item_name = catalogMap.get(item.item_id) ?? "";
          }
        }
      }
      setOrderItems(items);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Error al obtener artículos del pedido",
      );
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
      setError(e instanceof Error ? e.message : "Error al crear pedido");
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
      setError(e instanceof Error ? e.message : "Error al actualizar pedido");
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
      setError(e instanceof Error ? e.message : "Error al eliminar pedido");
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
      setError(e instanceof Error ? e.message : "Error al agregar artículo");
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
      setError(e instanceof Error ? e.message : "Error al actualizar artículo");
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
      setError(e instanceof Error ? e.message : "Error al eliminar artículo");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-6 text-gray-500">Cargando pedidos...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Pedidos
        </h1>
        <Button onClick={() => setShowCreate(true)}>+ Nuevo Pedido</Button>
      </div>

      {error && (
        <div className="p-4 mb-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300">
          {error}
          <button className="ml-2 underline" onClick={() => setError(null)}>
            Cerrar
          </button>
        </div>
      )}

      <Table
        columns={[
          { key: "id", header: "ID" },
          { key: "user_id", header: "ID Usuario" },
          { key: "date", header: "Fecha" },
          { key: "status", header: "Estado" },
          { key: "shipping_city", header: "Ciudad" },
          { key: "payment_method", header: "Pago" },
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
              Artículos
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setEditing(order)}
            >
              Editar
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => setDeleting(order)}
            >
              Eliminar
            </Button>
          </>
        )}
      />

      {/* Create Order Modal */}
      <Modal
        open={showCreate}
        title="Crear Pedido"
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
        title="Editar Pedido"
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
        title="Eliminar Pedido"
        onClose={() => setDeleting(null)}
      >
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          ¿Estás seguro que deseas eliminar el Pedido #{deleting?.id}?
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setDeleting(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={saving}>
            {saving ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </Modal>

      {/* Order Items Modal */}
      <Modal
        open={!!viewingOrder}
        title={`Pedido #${viewingOrder?.id} - Artículos`}
        onClose={() => {
          setViewingOrder(null);
          setOrderItems([]);
        }}
      >
        <div className="min-w-[500px]">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Usuario: {viewingOrder?.user_id} | Fecha: {viewingOrder?.date} |
              Estado: {viewingOrder?.status}
            </p>
            <Button size="sm" onClick={() => setShowAddItem(true)}>
              + Agregar Artículo
            </Button>
          </div>

          {loadingItems ? (
            <p className="text-gray-500">Cargando artículos...</p>
          ) : orderItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No hay artículos en este pedido.
            </p>
          ) : (
            <Table
              columns={[
                { key: "item_id", header: "ID Artículo" },
                { key: "item_name", header: "Artículo" },
                { key: "quantity", header: "Cant." },
                { key: "unit_price", header: "Precio Unit." },
                { key: "image_sent", header: "Imagen", render: (v) => (v ? "Sí" : "No") },
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
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setDeletingItem(item)}
                  >
                    Eliminar
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
        title="Agregar Artículo al Pedido"
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
        title="Editar Artículo"
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
        title="Eliminar Artículo"
        onClose={() => setDeletingItem(null)}
      >
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          ¿Estás seguro que deseas eliminar este artículo del pedido?
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setDeletingItem(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDeleteItem} disabled={saving}>
            {saving ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
