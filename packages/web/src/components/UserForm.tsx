import type { User } from "../types";
import { GenericForm, type FormField } from "./GenericForm";

const fields: FormField[] = [
  {
    name: "name",
    label: "Name",
    type: "text",
    placeholder: "Full name",
    required: true,
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "user@example.com",
    required: true,
  },
  { name: "phone", label: "Phone", type: "tel", placeholder: "+1 234 567 890" },
];

interface UserFormProps {
  initial?: User;
  onSubmit: (data: Omit<User, "id">) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function UserForm(props: UserFormProps) {
  return <GenericForm<User> fields={fields} {...props} />;
}
