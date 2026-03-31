"use client";

import type { ChatHistory, WithId } from "@wpbot/shared";
import { CrudPage } from "@/components/CrudPage";
import { ChatHistoryForm } from "./Form";
import { api } from "./api";

const columns = [
  { key: "id" as const, header: "ID" },
  { key: "user_id" as const, header: "Usuario" },
  {
    key: "role" as const,
    header: "Rol",
    render: (value: WithId<ChatHistory>[keyof WithId<ChatHistory>]) =>
      value === "assistant" ? "🤖 Asistente" : "👤 Usuario",
  },
  {
    key: "message" as const,
    header: "Mensaje",
    render: (value: WithId<ChatHistory>[keyof WithId<ChatHistory>]) => {
      const text = String(value ?? "");
      return text.length > 80 ? text.slice(0, 80) + "…" : text;
    },
  },
  {
    key: "requires_human" as const,
    header: "Requiere Humano",
    render: (value: WithId<ChatHistory>[keyof WithId<ChatHistory>]) =>
      value ? "⚠️ Sí" : "No",
  },
  { key: "timestamp" as const, header: "Fecha" },
];

export function ChatHistoryPage() {
  return (
    <CrudPage<WithId<ChatHistory>>
      title="Historial de Chat"
      api={api}
      columns={columns}
      FormComponent={ChatHistoryForm}
    />
  );
}
