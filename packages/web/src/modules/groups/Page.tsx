"use client";

import type { Group, WithId } from "@wpbot/shared";
import { CrudPage } from "@/components/CrudPage";
import { GroupForm } from "./Form";
import { api } from "./api";

export function GroupsPage() {
  return (
    <CrudPage<WithId<Group>>
      entityName="Grupo"
      entityNamePlural="Grupos"
      api={api}
      columns={[
        { key: "id", header: "ID" },
        { key: "name", header: "Nombre" },
      ]}
      FormComponent={GroupForm}
    />
  );
}
