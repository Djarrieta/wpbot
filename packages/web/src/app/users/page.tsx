import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/PageSkeleton";

const UsersPage = dynamic(
  () => import("@/modules/users/Page").then((m) => ({ default: m.UsersPage })),
  { loading: () => <PageSkeleton /> },
);

export default function UsersRoute() {
  return <UsersPage />;
}
