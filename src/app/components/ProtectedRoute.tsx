import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  unauthorizedRedirectTo?: string;
}

/**
 * Componente que protege rutas privadas redirigiendo al login
 * si el usuario no está autenticado.
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  unauthorizedRedirectTo = "/mapa",
}: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium animate-pulse">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirigir a login pero guardar la ubicación actual para volver después
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles?.length && (!user?.rol || !allowedRoles.includes(user.rol))) {
    return <Navigate to={unauthorizedRedirectTo} replace />;
  }

  return <>{children}</>;
}
