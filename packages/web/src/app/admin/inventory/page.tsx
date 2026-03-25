import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/PageSkeleton";

const InventoryPage = dynamic(
  () =>
    import("@/modules/inventory/Page").then((m) => ({
      default: m.InventoryPage,
    })),
  { loading: () => <PageSkeleton /> },
);

export default function InventoryRoute() {
  return <InventoryPage />;
}
