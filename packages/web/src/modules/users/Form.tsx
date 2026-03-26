"use client";

import type { User, WithId } from "@wpbot/shared";
import { GenericForm, type FormField } from "@/components/GenericForm";

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
];

interface UserFormProps {
  initial?: WithId<User>;
  onSubmit: (data: Omit<User, "id">) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function UserForm(props: UserFormProps) {
  return <GenericForm<WithId<User>> fields={fields} {...props} />;
}
