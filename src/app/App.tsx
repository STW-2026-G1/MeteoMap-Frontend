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

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

/**
 * Componente envolvedor principal de la aplicación
 */
function App() {

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;