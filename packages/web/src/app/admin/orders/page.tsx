import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/PageSkeleton";

const OrdersPage = dynamic(
  () =>
    import("@/modules/orders/Page").then((m) => ({ default: m.OrdersPage })),
  { loading: () => <PageSkeleton /> },
);

export default function OrdersRoute() {
  return <OrdersPage />;
}
