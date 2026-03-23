import type { Context, WithId } from "@wpbot/shared";
import { GenericForm, type FormField } from "../../components/GenericForm";

const fields: FormField[] = [
  {
    name: "topic",
    label: "Topic",
    type: "text",
    placeholder: "Topic name",
    required: true,
  },
  {
    name: "content",
    label: "Content",
    type: "textarea",
    placeholder: "Detailed context information...",
    required: true,
  },
  {
    name: "always_inject",
    label: "Siempre inyectar",
    type: "checkbox",
    required: false,
  },
];

interface ContextFormProps {
  initial?: WithId<Context>;
  onSubmit: (data: Omit<Context, "id">) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ContextForm(props: ContextFormProps) {
  return <GenericForm<WithId<Context>> fields={fields} {...props} />;
}
