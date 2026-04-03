"use client";

import { useEffect, useState } from "react";
import type { User, Shipping, WithId } from "@wpbot/shared";
import { GenericForm, type FormField } from "@/components/GenericForm";

async function fetchShippingCities(): Promise<WithId<Shipping>[]> {
  const res = await fetch("/api/store/shipping");
  if (!res.ok) return [];
  return res.json();
}

interface UserFormProps {
  initial?: WithId<User>;
  onSubmit: (data: Omit<User, "id">) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function UserForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: UserFormProps) {
  const [shippingCities, setShippingCities] = useState<WithId<Shipping>[]>([]);

  useEffect(() => {
    fetchShippingCities().then(setShippingCities);
  }, []);

  const fields: FormField[] = [
    {
      name: "name",
      label: "Nombre",
      type: "text",
      placeholder: "Nombre completo",
    },
    {
      name: "email",
      label: "Correo electrónico",
      type: "email",
      placeholder: "usuario@ejemplo.com",
      required: true,
    },
    {
      name: "phone",
      label: "Teléfono",
      type: "tel",
      placeholder: "+57 300 123 4567",
    },
    {
      name: "role",
      label: "Rol",
      type: "select",
      options: [
        { value: "client", label: "Cliente" },
        { value: "admin", label: "Administrador" },
      ],
    },
    {
      name: "shipping_city_id",
      label: "Ciudad de envío",
      type: "select",
      options: [
        { value: "0", label: "— Sin ciudad —" },
        ...shippingCities.map((c) => ({
          value: String(c.id),
          label: `${c.city}, ${c.department}`,
        })),
      ],
    },
    {
      name: "shipping_address",
      label: "Dirección de envío",
      type: "text",
      placeholder: "Calle, número, barrio...",
    },
  ];

  return (
    <GenericForm<WithId<User>>
      fields={fields}
      initial={initial}
      onSubmit={(data) => {
        data.shipping_city_id = Number(data.shipping_city_id) || undefined;
        onSubmit(data);
      }}
      onCancel={onCancel}
      loading={loading}
    />
  );
}
