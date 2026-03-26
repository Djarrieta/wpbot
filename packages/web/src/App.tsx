import { Routes, Route } from "react-router";
import { lazy, Suspense } from "react";
import { PageSkeleton } from "@/components/PageSkeleton";
import { AdminLayout } from "@/layouts/AdminLayout";
import { AuthGuard } from "@/components/AuthGuard";

const StorePage = lazy(() => import("@/pages/StorePage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));

const ItemsPage = lazy(() =>
  import("@/modules/items/Page").then((m) => ({ default: m.ItemsPage })),
);
const UsersPage = lazy(() =>
  import("@/modules/users/Page").then((m) => ({ default: m.UsersPage })),
);
const InventoryPage = lazy(() =>
  import("@/modules/inventory/Page").then((m) => ({
    default: m.InventoryPage,
  })),
);
const OrdersPage = lazy(() =>
  import("@/modules/orders/Page").then((m) => ({ default: m.OrdersPage })),
);
const ContextPage = lazy(() =>
  import("@/modules/context/Page").then((m) => ({ default: m.ContextPage })),
);
const ShippingPage = lazy(() =>
  import("@/modules/shipping/Page").then((m) => ({ default: m.ShippingPage })),
);

function Fallback() {
  return <PageSkeleton />;
}

export function App() {
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        <Route path="/" element={<StorePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AuthGuard />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<DashboardPage />} />
            <Route path="/admin/items" element={<ItemsPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/inventory" element={<InventoryPage />} />
            <Route path="/admin/orders" element={<OrdersPage />} />
            <Route path="/admin/context" element={<ContextPage />} />
            <Route path="/admin/shipping" element={<ShippingPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
