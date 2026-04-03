"use client";

import { useEffect, useState } from "react";
import type { Group, Subgroup, WithId } from "@wpbot/shared";
import { GenericForm, type FormField } from "@/components/GenericForm";
import { api as groupsApi } from "../groups/api";

const staticFields: FormField[] = [
  {
    name: "name",
    label: "Nombre",
    type: "text",
    placeholder: "Ej: iPhone 16 Pro Max, Galaxy S25 Ultra",
    required: true,
  },
];

interface SubgroupFormProps {
  initial?: WithId<Subgroup>;
  onSubmit: (data: Omit<Subgroup, "id">) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function SubgroupForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: SubgroupFormProps) {
  const [groups, setGroups] = useState<WithId<Group>[]>([]);

  useEffect(() => {
    groupsApi.fetchAll().then(setGroups);
  }, []);

  const fields: FormField[] = [
    {
      name: "group_id",
      label: "Grupo",
      type: "select",
      options: groups.map((g) => ({ value: String(g.id), label: g.name })),
      required: true,
    },
    ...staticFields,
  ];

  return (
    <GenericForm<WithId<Subgroup>>
      fields={fields}
      initial={initial}
      onSubmit={(data) => {
        data.group_id = Number(data.group_id);
        onSubmit(data);
      }}
      onCancel={onCancel}
      loading={loading}
    />
  );
}
