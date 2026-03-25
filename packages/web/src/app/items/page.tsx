import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/PageSkeleton";

const ItemsPage = dynamic(
  () => import("@/modules/items/Page").then((m) => ({ default: m.ItemsPage })),
  { loading: () => <PageSkeleton /> },
);

export default function ItemsRoute() {
  return <ItemsPage />;
}
