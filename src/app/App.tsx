/**
 * @file App.tsx
 * @description Componente raíz de la aplicación que envuelve los proveedores de contexto,
 * autenticación Google OAuth y sincronización de datos meteorológicos.
 * @author MeteoMap Team
 */

import { RouterProvider } from "react-router";
import { router } from "./routes.tsx";
import { AuthProvider } from "./contexts/AuthContext";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from "./components/ui/sonner";
import { useWeatherSync } from "../hooks/useWeatherSync";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

/**
 * Componente envolvedor que ejecuta la sincronización de datos meteorológicos
 */
function AppWithWeatherSync() {
  // Hook que sincroniza datos meteorológicos cada 3 horas
  useWeatherSync();

  if (!GOOGLE_CLIENT_ID) {
    console.warn("VITE_GOOGLE_CLIENT_ID no está configurado. El login con Google quedará desactivado.");
  }

  const appContent = (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );

  if (!GOOGLE_CLIENT_ID) {
    return appContent;
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || ""}>
      {appContent}
    </GoogleOAuthProvider>
  );
}

export default AppWithWeatherSync;