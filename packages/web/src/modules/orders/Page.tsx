"use client";

import { useCallback, useState } from "react";
import type { Order, OrderItem, WithId } from "@wpbot/shared";
import { CrudPage } from "@/components/CrudPage";
import { Table } from "@/components/Table";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { OrderForm } from "./Form";
import { api } from "./api";
import { api as orderItemsApi } from "../order_items/api";
import { api as itemsApi } from "../items/api";
import { OrderItemForm } from "../order_items/Form";

export function OrdersPage() {
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
  const [savingItem, setSavingItem] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);

  const loadOrderItems = useCallback(async (orderId: number) => {
    try {
      setLoadingItems(true);
      const items = await orderItemsApi.fetchAll({ order_id: orderId });
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
      setItemError(
        e instanceof Error
          ? e.message
          : "Error al obtener artículos del pedido",
      );
    } finally {
      setLoadingItems(false);
    }
  }, []);

  function handleViewOrder(order: WithId<Order>) {
    setViewingOrder(order);
    loadOrderItems(order.id);
  }

  async function handleAddItem(data: Omit<OrderItem, "id">) {
    if (!viewingOrder) return;
    try {
      setSavingItem(true);
      await orderItemsApi.create({ ...data, order_id: viewingOrder.id });
      setShowAddItem(false);
      await loadOrderItems(viewingOrder.id);
    } catch (e) {
      setItemError(
        e instanceof Error ? e.message : "Error al agregar artículo",
      );
    } finally {
      setSavingItem(false);
    }
  }

  async function handleUpdateItem(data: Omit<OrderItem, "id">) {
    if (!editingItem || !viewingOrder) return;
    try {
      setSavingItem(true);
      await orderItemsApi.update(editingItem.id, data);
      setEditingItem(null);
      await loadOrderItems(viewingOrder.id);
    } catch (e) {
      setItemError(
        e instanceof Error ? e.message : "Error al actualizar artículo",
      );
    } finally {
      setSavingItem(false);
    }
  }

  async function handleDeleteItem() {
    if (!deletingItem || !viewingOrder) return;
    try {
      setSavingItem(true);
      await orderItemsApi.delete(deletingItem.id);
      setDeletingItem(null);
      await loadOrderItems(viewingOrder.id);
    } catch (e) {
      setItemError(
        e instanceof Error ? e.message : "Error al eliminar artículo",
      );
    } finally {
      setSavingItem(false);
    }
  }

  return (
    <CrudPage<WithId<Order>>
      entityName="Pedido"
      entityNamePlural="Pedidos"
      api={api}
      columns={[
        { key: "id", header: "ID" },
        { key: "user_id", header: "ID Usuario" },
        { key: "date", header: "Fecha" },
        { key: "status", header: "Estado" },
        { key: "shipping_city", header: "Ciudad" },
        { key: "payment_method", header: "Pago" },
      ]}
      FormComponent={OrderForm}
      nameField="id"
      extraActions={(order) => (
        <Button variant="secondary" onClick={() => handleViewOrder(order)}>
          Artículos
        </Button>
      )}
    >
      {/* Order Items Modal */}
      <Modal
        open={!!viewingOrder}
        title={`Pedido #${viewingOrder?.id} - Artículos`}
        onClose={() => {
          setViewingOrder(null);
          setOrderItems([]);
          setItemError(null);
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

          {itemError && (
            <div className="flex justify-between items-center bg-red-900/20 border border-red-600 text-red-400 px-4 py-3 rounded-md mb-4">
              {itemError}
              <button
                className="bg-transparent border-none text-red-400 cursor-pointer text-base px-1"
                onClick={() => setItemError(null)}
              >
                ✕
              </button>
            </div>
          )}

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
                {
                  key: "image_sent",
                  header: "Imagen",
                  render: (v) => (v ? "Sí" : "No"),
                },
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
          loading={savingItem}
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
            loading={savingItem}
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
          <Button
            variant="danger"
            onClick={handleDeleteItem}
            disabled={savingItem}
          >
            {savingItem ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </Modal>
    </CrudPage>
  );
}
