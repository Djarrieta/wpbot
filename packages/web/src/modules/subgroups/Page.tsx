"use client";

import { useEffect, useState } from "react";
import type { Group, Subgroup, WithId } from "@wpbot/shared";
import { CrudPage } from "@/components/CrudPage";
import { SubgroupForm } from "./Form";
import { api } from "./api";
import { api as groupsApi } from "../groups/api";

export function SubgroupsPage() {
  const [groupMap, setGroupMap] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    groupsApi.fetchAll().then((groups) => {
      setGroupMap(new Map(groups.map((g) => [g.id, g.name])));
    });
  }, []);

  return (
    <CrudPage<WithId<Subgroup>>
      entityName="Subgrupo"
      entityNamePlural="Subgrupos"
      api={api}
      columns={[
        { key: "id", header: "ID" },
        {
          key: "group_id",
          header: "Grupo",
          render: (v) => groupMap.get(Number(v)) ?? `#${v}`,
        },
        { key: "name", header: "Nombre" },
      ]}
      FormComponent={SubgroupForm}
    />
  );
}
