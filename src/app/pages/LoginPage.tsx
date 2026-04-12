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
import { AlertCircle } from "lucide-react";
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
            {/* Logo */}
            <div className="text-center space-y-2">
              <Link to="/" className="inline-block">
                <h1 className="text-4xl font-bold text-slate-900">Meteo Map</h1>
              </Link>
              <p className="text-slate-600">Bienvenido de vuelta</p>
            </div>

            {/* Google Login */}
            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="outline"
                shape="rectangular"
                width="100%"
              />
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
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive">
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
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-base"
                disabled={loading}
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