import type { User, WithId } from "@wpbot/shared";
import { GenericForm, type FormField } from "../../components/GenericForm";

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
  },
  { name: "phone", label: "Teléfono", type: "tel", placeholder: "+57 300 123 4567" },
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
