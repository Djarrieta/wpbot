import type { User } from "../types";
import { usersApi } from "../api/users";
import { CrudPage } from "../components/CrudPage";
import { UserForm } from "../components/UserForm";

export function UsersPage() {
  return (
    <CrudPage<User>
      entityName="User"
      entityNamePlural="Users"
      api={usersApi}
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
