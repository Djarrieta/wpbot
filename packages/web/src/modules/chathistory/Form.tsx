"use client";

import type { ChatHistory, WithId } from "@wpbot/shared";
import { GenericForm, type FormField } from "@/components/GenericForm";

const fields: FormField[] = [
  {
    name: "user_id",
    label: "ID Usuario",
    type: "number",
    placeholder: "ID del usuario",
    min: "1",
    required: true,
  },
  {
    name: "message",
    label: "Mensaje",
    type: "textarea",
    placeholder: "Contenido del mensaje",
    required: true,
    rows: 4,
  },
  {
    name: "role",
    label: "Rol",
    type: "select",
    required: true,
    options: [
      { value: "user", label: "Usuario" },
      { value: "assistant", label: "Asistente" },
    ],
  },
  {
    name: "timestamp",
    label: "Timestamp",
    type: "text",
    placeholder: "ISO timestamp",
    required: true,
  },
  {
    name: "requires_human",
    label: "Requiere atención humana",
    type: "checkbox",
  },
];

interface ChatHistoryFormProps {
  initial?: WithId<ChatHistory>;
  onSubmit: (data: Omit<ChatHistory, "id">) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ChatHistoryForm(props: ChatHistoryFormProps) {
  return <GenericForm<WithId<ChatHistory>> fields={fields} {...props} />;
}
