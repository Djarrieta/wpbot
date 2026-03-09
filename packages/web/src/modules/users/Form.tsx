import type { User, WithId } from "@wpbot/shared";
import { GenericForm, type FormField } from "../../components/GenericForm";

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
  initial?: WithId<User>;
  onSubmit: (data: Omit<User, "id">) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function UserForm(props: UserFormProps) {
  return <GenericForm<WithId<User>> fields={fields} {...props} />;
}
