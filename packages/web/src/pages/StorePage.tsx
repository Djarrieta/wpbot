import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import type {
  Item,
  Product,
  Group,
  Subgroup,
  Shipping,
  WithId,
} from "@wpbot/shared";
import { SessionIcon } from "@/components/SessionIcon";
import { useAuth } from "@/hooks/useAuth";

type ProductWithItems = WithId<Product> & { items: WithId<Item>[] };
type Device = { label: string };

type CartEntry = {
  product: ProductWithItems;
  item: WithId<Item>;
  quantity: number;
  /** For requires_device=false products, device chosen from global list */
  deviceLabel: string;
};

/** Maps subgroup_id → "Group Name SubgroupName" */
type SubgroupLabelMap = Map<number, string>;

type StoreData = {
  products: ProductWithItems[];
  devices: Device[];
  subgroupLabels: SubgroupLabelMap;
};

async function fetchStore(): Promise<StoreData> {
  const [productsRes, itemsRes, groupsRes, subgroupsRes] = await Promise.all([
    fetch("/api/products"),
    fetch("/api/items"),
    fetch("/api/groups"),
    fetch("/api/subgroups"),
  ]);
  if (!productsRes.ok)
    throw new Error(`Failed to fetch products: ${productsRes.status}`);
  if (!itemsRes.ok)
    throw new Error(`Failed to fetch items: ${itemsRes.status}`);
  const products: WithId<Product>[] = await productsRes.json();
  const items: WithId<Item>[] = await itemsRes.json();
  const groups: WithId<Group>[] = groupsRes.ok ? await groupsRes.json() : [];
  const subgroups: WithId<Subgroup>[] = subgroupsRes.ok
    ? await subgroupsRes.json()
    : [];

  // Build subgroup label map
  const groupMap = new Map(groups.map((g) => [g.id, g.name]));
  const subgroupLabels: SubgroupLabelMap = new Map(
    subgroups.map((sg) => [
      sg.id,
      `${groupMap.get(sg.group_id) ?? "?"} ${sg.name}`,
    ]),
  );

  // Build unique device list from all subgroups
  const devices: Device[] = subgroups
    .map((sg) => ({ label: subgroupLabels.get(sg.id)! }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const filteredProducts = products
    .map((p) => ({
      ...p,
      items: items.filter((i) => i.product_id === p.id && i.stock > 0),
    }))
    .filter((p) => p.items.length > 0);

  return { products: filteredProducts, devices, subgroupLabels };
}

async function fetchShippingCities(): Promise<WithId<Shipping>[]> {
  const res = await fetch("/api/store/shipping");
  if (!res.ok) return [];
  return res.json();
}

function formatPrice(price: number) {
  return `$${price.toLocaleString()}`;
}

/* ── Product Card ── */

function ProductCard({
  product,
  devices,
  subgroupLabels,
  onAddToCart,
}: {
  product: ProductWithItems;
  devices: Device[];
  subgroupLabels: SubgroupLabelMap;
  onAddToCart: (
    product: ProductWithItems,
    itemId: number,
    deviceLabel: string,
  ) => void;
}) {
  // For requires_device products: selector picks from product.items
  // For !requires_device products: selector picks from global devices, item is the first (stock)
  const hasDeviceItems = product.requires_device && product.items.length > 0;

  const [selectedItemId, setSelectedItemId] = useState<number>(
    product.items[0].id,
  );
  const [selectedDevice, setSelectedDevice] = useState<string>(
    devices[0]?.label ?? "",
  );

  function handleAdd() {
    if (hasDeviceItems) {
      const item = product.items.find((i) => i.id === selectedItemId);
      onAddToCart(
        product,
        selectedItemId,
        item ? (subgroupLabels.get(item.subgroup_id) ?? "") : "",
      );
    } else {
      // Use the first item (for stock), pass the selected global device label
      onAddToCart(product, product.items[0].id, selectedDevice);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      {product.image_url && (
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white m-0">
            {product.name}
          </h3>
          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap ml-3">
            {formatPrice(product.price)}
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 m-0 line-clamp-3">
          {product.description || "Sin descripción"}
        </p>

        <div className="mt-3">
          <label
            htmlFor={`model-${product.id}`}
            className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1"
          >
            Selecciona tu modelo
          </label>
          {hasDeviceItems ? (
            <select
              id={`model-${product.id}`}
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              {product.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {subgroupLabels.get(item.subgroup_id) ?? `Item #${item.id}`}
                </option>
              ))}
            </select>
          ) : (
            <select
              id={`model-${product.id}`}
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              {devices.map((d) => (
                <option key={d.label} value={d.label}>
                  {d.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="mt-4 w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
            />
          </svg>
          Agregar al carrito
        </button>
      </div>
    </div>
  );
}

/* ── Cart Drawer ── */

function CartDrawer({
  cart,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  onClose,
}: {
  cart: CartEntry[];
  onUpdateQuantity: (cartKey: string, delta: number) => void;
  onRemove: (cartKey: string) => void;
  onCheckout: () => void;
  onClose: () => void;
}) {
  const subtotal = cart.reduce((s, e) => s + e.product.price * e.quantity, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-xl flex flex-col h-full">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white m-0">
            Carrito ({cart.reduce((s, e) => s + e.quantity, 0)})
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer bg-transparent border-none text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              Tu carrito está vacío
            </p>
          ) : (
            cart.map((entry) => {
              const cartKey = `${entry.item.id}-${entry.deviceLabel}`;
              return (
                <div
                  key={cartKey}
                  className="flex gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
                >
                  {entry.product.image_url && (
                    <img
                      src={entry.product.image_url}
                      alt={entry.product.name}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white m-0 truncate">
                      {entry.product.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 m-0 mt-0.5">
                      {entry.deviceLabel}
                    </p>
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 m-0 mt-1">
                      {formatPrice(entry.product.price * entry.quantity)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(cartKey, -1)}
                        className="w-7 h-7 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm flex items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        −
                      </button>
                      <span className="text-sm font-medium text-gray-900 dark:text-white w-6 text-center">
                        {entry.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(cartKey, 1)}
                        disabled={entry.quantity >= entry.item.stock}
                        className="w-7 h-7 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm flex items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(cartKey)}
                        className="ml-auto text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 cursor-pointer bg-transparent border-none"
                        title="Eliminar"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-800 p-5 space-y-3">
            <div className="flex justify-between text-sm font-bold text-gray-900 dark:text-white">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <button
              type="button"
              onClick={onCheckout}
              className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 text-sm transition-colors cursor-pointer"
            >
              Continuar con el pedido
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Profile Modal ── */

function ProfileModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/store/profile", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setName(data.name ?? "");
          setPhone(data.phone ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Ingresa tu nombre");
      return;
    }
    if (!phone.trim()) {
      setError("Ingresa tu teléfono");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/store/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ error: "Error al guardar" }));
        setError(data.error ?? "Error al guardar");
        return;
      }
      onSaved();
    } catch {
      setError("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white m-0">
              Completa tu perfil
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer bg-transparent border-none text-xl leading-none"
            >
              &times;
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 m-0 mb-4">
            Necesitamos tu nombre y teléfono para procesar el pedido.
          </p>

          {loading ? (
            <div className="py-8 text-center text-sm text-gray-400">
              Cargando...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="profile-name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Nombre
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre completo"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="profile-phone"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Teléfono
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Tu número de teléfono"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-600 text-red-400 px-3 py-2 rounded-md text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 text-sm transition-colors cursor-pointer"
              >
                {submitting ? "Guardando..." : "Guardar y continuar"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Checkout Modal ── */

const PAYMENT_METHODS = [
  { value: "contraentrega", label: "Contraentrega" },
  { value: "transferencia", label: "Transferencia bancaria" },
] as const;

function CheckoutModal({
  cart,
  shippingCities,
  defaultCityId,
  defaultAddress,
  onClose,
  onSuccess,
}: {
  cart: CartEntry[];
  shippingCities: WithId<Shipping>[];
  defaultCityId?: number;
  defaultAddress?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [shippingCityId, setShippingCityId] = useState<number>(
    defaultCityId && shippingCities.some((c) => c.id === defaultCityId)
      ? defaultCityId
      : (shippingCities[0]?.id ?? 0),
  );
  const [address, setAddress] = useState(defaultAddress ?? "");
  const [paymentMethod, setPaymentMethod] = useState<string>(
    PAYMENT_METHODS[0].value,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedShipping = shippingCities.find((c) => c.id === shippingCityId);
  const shippingCost = selectedShipping?.shipping_cost_cop ?? 0;
  const estimatedDays = selectedShipping?.delivery_estimated_days ?? 0;
  const subtotal = cart.reduce((s, e) => s + e.product.price * e.quantity, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) {
      setError("Ingresa tu dirección de envío");
      return;
    }
    if (!selectedShipping) {
      setError("Selecciona una ciudad de envío");
      return;
    }
    if (!paymentMethod) {
      setError("Selecciona un método de pago");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/store/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items: cart.map((e) => ({
            item_id: e.item.id,
            quantity: e.quantity,
            device_reference: e.deviceLabel,
          })),
          shipping_city: selectedShipping.city,
          shipping_address: address.trim(),
          payment_method: paymentMethod,
        }),
      });
      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ error: "Error al crear pedido" }));
        setError(data.error ?? "Error al crear pedido");
        return;
      }
      onSuccess();
    } catch {
      setError("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white m-0">
              Confirmar pedido
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer bg-transparent border-none text-xl leading-none"
            >
              &times;
            </button>
          </div>

          {/* Cart summary */}
          <div className="space-y-2 mb-4">
            {cart.map((entry) => (
              <div
                key={`${entry.item.id}-${entry.deviceLabel}`}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 flex justify-between items-start"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white m-0">
                    {entry.product.name} x{entry.quantity}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 m-0 mt-0.5">
                    {entry.deviceLabel}
                  </p>
                </div>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap ml-3">
                  {formatPrice(entry.product.price * entry.quantity)}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="checkout-city"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Ciudad de envío
              </label>
              {shippingCities.length > 0 ? (
                <select
                  id="checkout-city"
                  value={shippingCityId}
                  onChange={(e) => setShippingCityId(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  {shippingCities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.city}, {c.department}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 m-0">
                  No hay ciudades de envío configuradas
                </p>
              )}
              {selectedShipping && (
                <p className="text-xs text-gray-500 dark:text-gray-400 m-0 mt-1">
                  Envío: {formatPrice(shippingCost)} — Entrega estimada:{" "}
                  {estimatedDays} día{estimatedDays !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="checkout-address"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Dirección de envío
              </label>
              <input
                id="checkout-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Calle, número, barrio..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="checkout-payment"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Método de pago
              </label>
              <select
                id="checkout-payment"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm.value} value={pm.value}>
                    {pm.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-1">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>
                  Subtotal ({cart.reduce((s, e) => s + e.quantity, 0)} producto
                  {cart.reduce((s, e) => s + e.quantity, 0) !== 1 ? "s" : ""})
                </span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {selectedShipping && (
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Envío</span>
                  <span>{formatPrice(shippingCost)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-gray-900 dark:text-white pt-1">
                <span>Total</span>
                <span>{formatPrice(subtotal + shippingCost)}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-600 text-red-400 px-3 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 text-sm transition-colors cursor-pointer"
            >
              {submitting ? "Procesando..." : "Confirmar pedido"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ── Success Modal ── */

function OrderSuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl w-full max-w-sm p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white m-0 mb-2">
          ¡Pedido creado!
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 m-0 mb-6">
          Tu pedido ha sido registrado exitosamente. Nos pondremos en contacto
          contigo para coordinar el pago y envío.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 text-sm transition-colors cursor-pointer"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}

/* ── Floating Cart Button ── */

function CartButton({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-105 border-none"
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}

/* ── Toast notification ── */

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed bottom-24 right-6 z-40 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg animate-[fadeIn_0.2s_ease-out]">
      {message}
    </div>
  );
}

/* ── Main Store Page ── */

export default function StorePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductWithItems[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [subgroupLabels, setSubgroupLabels] = useState<SubgroupLabelMap>(
    new Map(),
  );
  const [shippingCities, setShippingCities] = useState<WithId<Shipping>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cart state — persist to localStorage
  const [cart, setCart] = useState<CartEntry[]>(() => {
    try {
      const saved = localStorage.getItem("wpbot_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("wpbot_cart", JSON.stringify(cart));
    } catch {}
  }, [cart]);
  // Profile data for auto-filling checkout
  const [profileShipping, setProfileShipping] = useState<{
    cityId?: number;
    address?: string;
  }>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const cartCount = cart.reduce((s, e) => s + e.quantity, 0);

  function loadStore() {
    return fetchStore().then(
      ({ products: prods, devices: devs, subgroupLabels: labels }) => {
        setProducts(prods);
        setDevices(devs);
        setSubgroupLabels(labels);
      },
    );
  }

  useEffect(() => {
    Promise.all([loadStore(), fetchShippingCities().then(setShippingCities)])
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Error loading products"),
      )
      .finally(() => setLoading(false));
  }, []);

  function handleAddToCart(
    product: ProductWithItems,
    itemId: number,
    deviceLabel: string,
  ) {
    const item = product.items.find((i) => i.id === itemId);
    if (!item) return;

    // Use a composite key: itemId + deviceLabel to allow same product with different devices
    const cartKey = `${itemId}-${deviceLabel}`;

    setCart((prev) => {
      const existing = prev.find(
        (e) => `${e.item.id}-${e.deviceLabel}` === cartKey,
      );
      if (existing) {
        if (existing.quantity >= item.stock) return prev;
        return prev.map((e) =>
          `${e.item.id}-${e.deviceLabel}` === cartKey
            ? { ...e, quantity: e.quantity + 1 }
            : e,
        );
      }
      return [...prev, { product, item, quantity: 1, deviceLabel }];
    });
    setToast(`${product.name} agregado al carrito`);
  }

  function handleUpdateQuantity(cartKey: string, delta: number) {
    setCart((prev) =>
      prev
        .map((e) =>
          `${e.item.id}-${e.deviceLabel}` === cartKey
            ? {
                ...e,
                quantity: Math.max(
                  0,
                  Math.min(e.item.stock, e.quantity + delta),
                ),
              }
            : e,
        )
        .filter((e) => e.quantity > 0),
    );
  }

  function handleRemove(cartKey: string) {
    setCart((prev) =>
      prev.filter((e) => `${e.item.id}-${e.deviceLabel}` !== cartKey),
    );
  }

  function handleCheckout() {
    if (!user) {
      navigate("/login?callbackUrl=/");
      return;
    }
    setCartOpen(false);
    // Check profile completeness before opening checkout
    fetch("/api/store/profile", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setProfileShipping({
            cityId: data.shipping_city_id || undefined,
            address: data.shipping_address || undefined,
          });
        }
        if (!data || !data.name || !data.phone) {
          setProfileOpen(true);
        } else {
          setCheckoutOpen(true);
        }
      })
      .catch(() => {
        // On error, try checkout anyway
        setCheckoutOpen(true);
      });
  }

  function handleProfileSaved() {
    setProfileOpen(false);
    setCheckoutOpen(true);
  }

  function handleOrderSuccess() {
    setCheckoutOpen(false);
    setCart([]);
    setShowSuccess(true);
    loadStore().catch(() => {});
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent m-0 no-underline"
          >
            wpbot Store
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-medium text-gray-900 dark:text-white no-underline transition-colors"
            >
              Tienda
            </Link>
            <Link
              to="/about"
              className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 no-underline transition-colors"
            >
              Nosotros
            </Link>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 bg-transparent border-none cursor-pointer transition-colors"
              title="Carrito"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>
            <SessionIcon />
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white m-0 mb-1">
            Productos
          </h2>
          <p className="text-gray-500 dark:text-gray-400 m-0">
            Explora nuestro catálogo de productos
          </p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-600 text-red-400 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-48 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-16">
            No hay productos disponibles.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                devices={devices}
                subgroupLabels={subgroupLabels}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating cart button (mobile-friendly) */}
      {cartCount > 0 && !cartOpen && !checkoutOpen && (
        <CartButton count={cartCount} onClick={() => setCartOpen(true)} />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* Cart drawer */}
      {cartOpen && (
        <CartDrawer
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemove={handleRemove}
          onCheckout={handleCheckout}
          onClose={() => setCartOpen(false)}
        />
      )}

      {/* Profile modal */}
      {profileOpen && (
        <ProfileModal
          onClose={() => setProfileOpen(false)}
          onSaved={handleProfileSaved}
        />
      )}

      {/* Checkout modal */}
      {checkoutOpen && (
        <CheckoutModal
          cart={cart}
          shippingCities={shippingCities}
          defaultCityId={profileShipping.cityId}
          defaultAddress={profileShipping.address}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={handleOrderSuccess}
        />
      )}

      {/* Success modal */}
      {showSuccess && (
        <OrderSuccessModal onClose={() => setShowSuccess(false)} />
      )}
    </div>
  );
}
