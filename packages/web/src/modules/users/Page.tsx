"use client";

import { useEffect, useState } from "react";
import type { User, Shipping, WithId } from "@wpbot/shared";
import { CrudPage } from "@/components/CrudPage";
import { UserForm } from "./Form";
import { api } from "./api";

export function UsersPage() {
  const [cityMap, setCityMap] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    fetch("/api/store/shipping")
      .then((r) => (r.ok ? r.json() : []))
      .then((cities: WithId<Shipping>[]) =>
        setCityMap(
          new Map(cities.map((c) => [c.id, `${c.city}, ${c.department}`])),
        ),
      )
      .catch(() => {});
  }, []);

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
        { key: "role", header: "Rol" },
        {
          key: "shipping_city_id",
          header: "Ciudad envío",
          render: (v) => (v ? (cityMap.get(Number(v)) ?? String(v)) : "—"),
        },
        {
          key: "shipping_address",
          header: "Dirección envío",
          render: (v) => (v ? String(v) : "—"),
        },
      ]}
      FormComponent={UserForm}
    />
  );
}
