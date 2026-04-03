import { useEffect, useState, useCallback } from "react";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

let nextId = 0;

export function useToast(duration = 3000) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = ++nextId;
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    [duration],
  );

  const success = useCallback(
    (message: string) => show(message, "success"),
    [show],
  );

  const error = useCallback(
    (message: string) => show(message, "error"),
    [show],
  );

  const info = useCallback(
    (message: string) => show(message, "info"),
    [show],
  );

  return { toasts, show, success, error, info };
}

const variantStyles: Record<ToastVariant, string> = {
  success:
    "bg-green-600 dark:bg-green-500 text-white",
  error:
    "bg-red-600 dark:bg-red-500 text-white",
  info:
    "bg-gray-900 dark:bg-white text-white dark:text-gray-900",
};

export function ToastContainer({ toasts }: { toasts: ToastItem[] }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: ToastItem }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      className={`text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg transition-all duration-200 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      } ${variantStyles[toast.variant]}`}
    >
      {toast.message}
    </div>
  );
}
