import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import type {
  Order,
  OrderItem,
  OrderStatus,
  Shipping,
  WithId,
} from "@wpbot/shared";
import { ORDER_STATUS_LABELS } from "@wpbot/shared";
import { useAuth } from "@/hooks/useAuth";
import { SessionIcon } from "@/components/SessionIcon";
import { ConfirmModal } from "@/components/ConfirmModal";

type OrderWithItems = WithId<Order> & { items: WithId<OrderItem>[] };

type ProfileData = {
  id: number;
  name: string;
  email: string;
  phone: string;
  shipping_city_id: number | null;
  shipping_address: string;
};

export default function ProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [shippingCities, setShippingCities] = useState<WithId<Shipping>[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<number | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cityId, setCityId] = useState<number>(0);
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login?callbackUrl=/profile");
      return;
    }
    if (!authLoading && user) {
      Promise.all([
        fetch("/api/store/profile", { credentials: "include" }).then((r) =>
          r.ok ? r.json() : null,
        ),
        fetch("/api/store/shipping").then((r) => (r.ok ? r.json() : [])),
      ])
        .then(([profileData, cities]) => {
          setShippingCities(cities);
          if (profileData) {
            setProfile(profileData);
            setName(profileData.name ?? "");
            setPhone(profileData.phone ?? "");
            setCityId(profileData.shipping_city_id ?? 0);
            setAddress(profileData.shipping_address ?? "");
          }
        })
        .catch(() => setError("Error al cargar perfil"))
        .finally(() => setLoading(false));

      fetch("/api/store/orders", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setOrders(data))
        .catch(() => {})
        .finally(() => setOrdersLoading(false));
    }
  }, [authLoading, user, navigate]);

  const handleCancelOrder = useCallback(async (orderId: number) => {
    setCancellingOrder(orderId);
    try {
      const res = await fetch(`/api/store/orders/${orderId}/cancel`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Error al cancelar pedido");
      }
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cancelar pedido");
    } finally {
      setCancellingOrder(null);
      setConfirmCancelId(null);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    if (!phone.trim()) {
      setError("El teléfono es obligatorio");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/store/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          shipping_city_id: cityId || null,
          shipping_address: address.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ error: "Error al guardar" }));
        setError(data.error ?? "Error al guardar");
        return;
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  const isAdmin = user?.role === "admin";

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Cargando...</div>
      </div>
    );
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
              className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 no-underline transition-colors"
            >
              Tienda
            </Link>
            <Link
              to="/about"
              className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 no-underline transition-colors"
            >
              Nosotros
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 no-underline transition-colors"
              >
                Admin
              </Link>
            )}
            <SessionIcon />
          </nav>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white m-0 mb-6">
          Mi perfil
        </h2>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            {profile?.email}
          </div>

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

            <div>
              <label
                htmlFor="profile-city"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Ciudad de envío
              </label>
              <select
                id="profile-city"
                value={cityId}
                onChange={(e) => setCityId(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value={0}>— Seleccionar ciudad —</option>
                {shippingCities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.city}, {c.department}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="profile-address"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Dirección de envío
              </label>
              <input
                id="profile-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Calle, número, barrio..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-600 text-red-400 px-3 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-900/20 border border-green-600 text-green-400 px-3 py-2 rounded-md text-sm">
                Perfil actualizado correctamente
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 text-sm transition-colors cursor-pointer"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setConfirmLogout(true)}
              className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-transparent border-none cursor-pointer"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Orders section */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white m-0 mt-10 mb-6">
          Mis pedidos
        </h2>

        <div className="space-y-4">
          {ordersLoading ? (
            <div className="text-gray-400 text-center py-8">
              Cargando pedidos...
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 text-center text-gray-500">
              No tienes pedidos aún.
            </div>
          ) : (
            orders.map((order) => {
              const total = order.items.reduce(
                (s, i) => s + i.quantity * i.unit_price,
                0,
              );
              const isExpanded = expandedOrder === order.id;
              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedOrder(isExpanded ? null : order.id)
                    }
                    className="w-full text-left px-5 py-4 bg-transparent border-none cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        Pedido #{order.id}
                      </span>
                      <StatusBadge status={order.status ?? "pending"} />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(order.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        ${total.toLocaleString("es-CO")}
                      </span>
                      <span
                        className={`text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      >
                        ▾
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-4 border-t border-gray-100 dark:border-gray-800">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-3 mb-3">
                        <div>Ciudad: {order.shipping_city || "—"}</div>
                        <div>Pago: {order.payment_method || "—"}</div>
                        <div className="col-span-2">
                          Dirección: {order.shipping_address || "—"}
                        </div>
                      </div>
                      {order.items.length === 0 ? (
                        <p className="text-sm text-gray-400 py-2">
                          Sin artículos
                        </p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                              <th className="pb-1 font-medium">Artículo</th>
                              <th className="pb-1 font-medium text-center">
                                Cant.
                              </th>
                              <th className="pb-1 font-medium text-right">
                                Precio
                              </th>
                              <th className="pb-1 font-medium text-right">
                                Subtotal
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item) => (
                              <tr
                                key={item.id}
                                className="border-b border-gray-50 dark:border-gray-800/50"
                              >
                                <td className="py-1.5 text-gray-700 dark:text-gray-300">
                                  {item.item_name || `#${item.item_id}`}
                                </td>
                                <td className="py-1.5 text-center text-gray-600 dark:text-gray-400">
                                  {item.quantity}
                                </td>
                                <td className="py-1.5 text-right text-gray-600 dark:text-gray-400">
                                  ${item.unit_price.toLocaleString("es-CO")}
                                </td>
                                <td className="py-1.5 text-right text-gray-700 dark:text-gray-300 font-medium">
                                  $
                                  {(
                                    item.quantity * item.unit_price
                                  ).toLocaleString("es-CO")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td
                                colSpan={3}
                                className="pt-2 text-right font-semibold text-gray-700 dark:text-gray-300"
                              >
                                Total
                              </td>
                              <td className="pt-2 text-right font-bold text-gray-900 dark:text-white">
                                ${total.toLocaleString("es-CO")}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      )}

                      {(order.status === "pending" ||
                        order.status === "confirmed") && (
                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setConfirmCancelId(order.id)}
                            disabled={cancellingOrder === order.id}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 font-medium disabled:opacity-50 transition-colors cursor-pointer"
                          >
                            {cancellingOrder === order.id
                              ? "Cancelando..."
                              : "Cancelar pedido"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      <ConfirmModal
        open={confirmCancelId !== null}
        title="Cancelar pedido"
        message={
          <>
            ¿Estás seguro de que deseas cancelar el pedido #{confirmCancelId}?
            Esta acción no se puede deshacer.
          </>
        }
        confirmLabel="Sí, cancelar pedido"
        cancelLabel="No, mantener"
        loadingLabel="Cancelando..."
        variant="danger"
        loading={cancellingOrder !== null}
        onConfirm={() => confirmCancelId && handleCancelOrder(confirmCancelId)}
        onCancel={() => setConfirmCancelId(null)}
      />

      <ConfirmModal
        open={confirmLogout}
        title="Cerrar sesión"
        message="¿Estás seguro de que deseas cerrar sesión?"
        confirmLabel="Cerrar sesión"
        variant="danger"
        onConfirm={() => {
          setConfirmLogout(false);
          logout();
        }}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  shipped:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivered:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function StatusBadge({ status }: { status: string }) {
  const key = status as OrderStatus;
  const label = ORDER_STATUS_LABELS[key] ?? status;
  const color =
    STATUS_COLORS[key] ??
    "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
      {label}
    </span>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}
