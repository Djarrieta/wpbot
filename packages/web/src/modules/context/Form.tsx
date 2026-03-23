import type { Context, WithId } from "@wpbot/shared";
import { GenericForm, type FormField } from "../../components/GenericForm";

const fields: FormField[] = [
  {
    name: "topic",
    label: "Tema",
    type: "text",
    placeholder: "Nombre del tema",
    required: true,
  },
  {
    name: "content",
    label: "Contenido",
    type: "textarea",
    placeholder: "Información detallada del contexto...",
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
