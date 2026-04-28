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

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default AppWithWeatherSync;