import type { Context, WithId } from "@wpbot/shared";
import { CrudPage } from "../../components/CrudPage";
import { ContextForm } from "./Form";
import { api } from "./api";

export function ContextPage() {
  return (
    <CrudPage<WithId<Context>>
      entityName="Contexto"
      entityNamePlural="Contexto"
      api={api}
      columns={[
        { key: "id", header: "ID" },
        { key: "topic", header: "Tema" },
        { key: "content", header: "Contenido" },
        {
          key: "always_inject",
          header: "Auto-inyectar",
          render: (value) => (value ? "✓ Sí" : "No"),
        },
      ]}
      FormComponent={ContextForm}
    />
  );
}
