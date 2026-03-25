import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/PageSkeleton";

const ShippingPage = dynamic(
  () =>
    import("@/modules/shipping/Page").then((m) => ({
      default: m.ShippingPage,
    })),
  { loading: () => <PageSkeleton /> },
);

export default function ShippingRoute() {
  return <ShippingPage />;
}
