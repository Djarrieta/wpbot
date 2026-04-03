import { Link, useLocation } from "react-router";
import { modules } from "@/modules";

const adminItem = { href: "/admin", label: "Panel", icon: "📊" };
const moduleItems = modules.map((m) => ({
  href: m.basePath,
  label: m.label,
  icon: m.icon,
}));

interface SidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  } | null;
  onLogout?: () => void;
}

export function Sidebar({ user, onLogout }: SidebarProps) {
  const { pathname } = useLocation();
  const isAdmin = user?.role === "admin";
  const navItems = [...(isAdmin ? [adminItem] : []), ...moduleItems];

  return (
    <aside className="w-60 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-200 dark:border-gray-800">
        <Link
          to="/"
          className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent m-0 no-underline"
        >
          wpbot
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium no-underline transition-all duration-200 ${
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2">
            {user.image && (
              <img
                src={user.image}
                alt=""
                className="w-8 h-8 rounded-full"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate m-0">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate m-0">
                {user.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="w-full mt-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors text-left cursor-pointer bg-transparent border-none"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </aside>
  );
}
