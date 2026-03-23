import type { User, WithId } from "@wpbot/shared";
import { CrudPage } from "../../components/CrudPage";
import { UserForm } from "./Form";
import { api } from "./api";

export function UsersPage() {
  return (
    <CrudPage<WithId<User>>
      entityName="Usuario"
      entityNamePlural="Usuarios"
      api={api}
      columns={[
        { key: "id", header: "ID" },
        { key: "name", header: "Nombre" },
        { key: "email", header: "Correo" },
        { key: "phone", header: "Teléfono" },
      ]}
      FormComponent={UserForm}
    />
  );
}
