import { Routes, Route } from "react-router";
import { lazy, Suspense } from "react";
import { PageSkeleton } from "@/components/PageSkeleton";
import { AdminLayout } from "@/layouts/AdminLayout";
import { AuthGuard } from "@/components/AuthGuard";

const StorePage = lazy(() => import("@/pages/StorePage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));

const ItemsPage = lazy(() =>
  import("@/modules/items/Page").then((m) => ({ default: m.ItemsPage })),
);
const ProductsPage = lazy(() =>
  import("@/modules/products/Page").then((m) => ({ default: m.ProductsPage })),
);
const UsersPage = lazy(() =>
  import("@/modules/users/Page").then((m) => ({ default: m.UsersPage })),
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
const ChatHistoryPage = lazy(() =>
  import("@/modules/chathistory/Page").then((m) => ({
    default: m.ChatHistoryPage,
  })),
);
const GroupsPage = lazy(() =>
  import("@/modules/groups/Page").then((m) => ({ default: m.GroupsPage })),
);
const SubgroupsPage = lazy(() =>
  import("@/modules/subgroups/Page").then((m) => ({
    default: m.SubgroupsPage,
  })),
);
const ProductTypesPage = lazy(() =>
  import("@/modules/product_types/Page").then((m) => ({
    default: m.ProductTypesPage,
  })),
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
        <Route path="/profile" element={<ProfilePage />} />
        <Route element={<AuthGuard />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<DashboardPage />} />
            <Route path="/admin/products" element={<ProductsPage />} />
            <Route path="/admin/items" element={<ItemsPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/orders" element={<OrdersPage />} />
            <Route path="/admin/context" element={<ContextPage />} />
            <Route path="/admin/shipping" element={<ShippingPage />} />
            <Route path="/admin/chathistory" element={<ChatHistoryPage />} />
            <Route path="/admin/groups" element={<GroupsPage />} />
            <Route path="/admin/subgroups" element={<SubgroupsPage />} />
            <Route path="/admin/product_types" element={<ProductTypesPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
