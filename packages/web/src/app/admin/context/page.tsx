import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/PageSkeleton";

const ContextPage = dynamic(
  () =>
    import("@/modules/context/Page").then((m) => ({ default: m.ContextPage })),
  { loading: () => <PageSkeleton /> },
);

export default function ContextRoute() {
  return <ContextPage />;
}
