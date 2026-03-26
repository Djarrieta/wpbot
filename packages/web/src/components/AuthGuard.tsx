import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";

export function AuthGuard() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={`/login?callbackUrl=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Acceso restringido
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Tu cuenta no tiene permisos de administrador. Contacta a un administrador para obtener acceso.
          </p>
          <button
            type="button"
            onClick={logout}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer border-none"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
