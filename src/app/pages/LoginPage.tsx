/**
 * @file LoginPage.tsx
 * @description Página de inicio de sesión con autenticación por email/contraseña
 * y opción de login con Google OAuth.
 * @author MeteoMap Team
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login, loginGoogle, loading, error: authError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const result = await login(email, password);
    if (result.success) {
      navigate("/mapa");
    } else {
      setError(result.errorMessage || "Credenciales incorrectas");
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      const result = await loginGoogle(credentialResponse.credential);
      if (result.success) {
        navigate("/mapa");
      } else {
        setError(result.errorMessage || "Error al iniciar sesión con Google");
      }
    }
  };

  const handleGoogleError = () => {
    setError("Error al iniciar sesión con Google");
  };

  return (
    <>
      <Header />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 pt-16">
        <div className="w-full max-w-md">
          {/* Card Container */}
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8" data-cy="login-card">
            {/* Logo */}
            <div className="text-center space-y-2">
              <Link to="/" className="inline-block">
                <h1 className="text-4xl font-bold text-slate-900">Meteo Map</h1>
              </Link>
              <p className="text-slate-600">Bienvenido de vuelta</p>
            </div>

            {/* Google y Github Login */}
            <div className="flex flex-col gap-3 justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="outline"
                shape="rectangular"
                width="100%"
              />

              <Button
                variant="outline"
                className="w-full text-sm font-normal py-5 flex items-center justify-between gap-2 border-[1.0px] rounded-sm"
                onClick={() => {
                  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
                  const redirectUri = `${window.location.origin}/auth/github/callback`;
                  window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;
                }}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.113.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
                <span className="flex-1 text-center pl-4">Sign in with GitHub</span>
                <span className="w-5 h-5" />
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">O con tu cuenta</span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5" data-cy="login-form">
              {error && (
                <Alert variant="destructive" data-cy="login-error">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                  data-cy="email-input"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link
                    to="/recuperar-password"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                    data-cy="password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-base"
                disabled={loading}
                data-cy="login-submit"
              >
                {loading ? "Cargando..." : "Entrar"}
              </Button>
            </form>

            <Separator />

            {/* Footer Links */}
            <div className="space-y-3 text-center text-sm">
              <div>
                <span className="text-slate-600">¿No tienes cuenta?</span>{" "}
                <Link to="/registro" className="text-blue-600 hover:underline font-medium">
                  Regístrate
                </Link>
              </div>
              <div>
                <Link to="/" className="text-slate-500 hover:text-slate-700 hover:underline">
                  ← Volver a la página principal
                </Link>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center text-sm text-slate-600">
            <p>
              Al iniciar sesión, aceptas nuestros{" "}
              <Link to="/terminos" className="text-blue-600 hover:underline">
                términos de servicio
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}