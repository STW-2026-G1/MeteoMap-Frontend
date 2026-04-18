import { useState } from "react";
import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { CheckCircle, Mail, ArrowLeft, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3000/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data?.message || data?.error || "Error al procesar la solicitud";
        setError(errorMessage);
        return;
      }

      setSubmitted(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      console.error("Forgot password error:", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 pt-16">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 space-y-6 text-center border border-gray-100">
              {/* Success Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>

              {/* Success Message */}
              <div className="space-y-3">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  ¡Revisa tu correo!
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Te hemos enviado un enlace a{" "}
                  <span className="font-semibold text-blue-600">{email}</span>{" "}
                  para restablecer tu acceso.
                </p>
                <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                  💡 Si no recibes el correo en unos minutos, revisa tu carpeta de spam o correo no deseado.
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-4">
                <Button asChild className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base">
                  <Link to="/login">Volver al inicio de sesión</Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setSubmitted(false)}
                >
                  Intentar con otro correo
                </Button>
              </div>
            </div>

            {/* Footer Help */}
            <div className="mt-6 text-center text-sm text-gray-600">
              <p>
                ¿Necesitas ayuda?{" "}
                <a href="mailto:soporte@meteomap.com" className="text-blue-600 hover:underline font-medium">
                  Contacta con soporte
                </a>
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 pt-16">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 space-y-8 border border-gray-100">
            {/* Header Section */}
            <div className="text-center space-y-3">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                ¿Problemas para entrar?
              </h1>
              
              <p className="text-gray-600 leading-relaxed">
                Introduce tu email y te enviaremos un enlace para restablecer tu acceso
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Correo electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 text-base"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base font-semibold"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar enlace de recuperación"}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
            </div>

            {/* Back to Login */}
            <div className="text-center">
              <Button
                variant="ghost"
                className="text-gray-700 hover:text-gray-900 font-medium"
                asChild
              >
                <Link to="/login">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al Login
                </Link>
              </Button>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-sm text-gray-600">
              ¿No tienes cuenta?{" "}
              <Link to="/registro" className="text-blue-600 hover:underline font-medium">
                Regístrate aquí
              </Link>
            </p>
            <p className="text-sm text-gray-500">
              <Link to="/" className="hover:text-gray-700 hover:underline">
                ← Volver a la página principal
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}