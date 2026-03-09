import type { User, WithId } from "@wpbot/shared";
import { CrudPage } from "../../components/CrudPage";
import { UserForm } from "./Form";
import { api } from "./api";

export function UsersPage() {
  return (
    <CrudPage<WithId<User>>
      entityName="User"
      entityNamePlural="Users"
      api={api}
      columns={[
        { key: "id", header: "ID" },
        { key: "name", header: "Name" },
        { key: "email", header: "Email" },
        { key: "phone", header: "Phone" },
      ]}
      FormComponent={UserForm}
    />
  );
}
