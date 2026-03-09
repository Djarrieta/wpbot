import { useState, type FormEvent } from "react";
import type { User } from "../types";
import { Button } from "./Button";

interface UserFormProps {
  initial?: User;
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
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    });
  }

  const isValid = name.trim() !== "" && email.trim() !== "";

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-1 text-left">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Name
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className={inputClass}
          autoFocus
        />
      </label>

      <label className="flex flex-col gap-1 text-left">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Email
        </span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-left">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Phone
        </span>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 234 567 890"
          className={inputClass}
        />
      </label>

      <div className="flex justify-end gap-3 mt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={!isValid || loading}>
          {loading ? "Saving..." : initial ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
