import { Link } from "react-router";
import { useAuth } from "@/hooks/useAuth";

export function SessionIcon() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
    );
  }

  if (!user) {
    return (
      <Link
        to="/login"
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 no-underline transition-colors"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
          />
        </svg>
        Iniciar sesión
      </Link>
    );
  }

  return (
    <Link
      to="/admin"
      className="flex items-center gap-2 no-underline transition-colors"
      title={user.email ?? undefined}
    >
      {user.image ? (
        <img
          src={user.image}
          alt={user.name ?? ""}
          className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-medium">
          {(user.name?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
        </div>
      )}
      <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:inline">
        {user.name ?? user.email}
      </span>
    </Link>
  );
}
