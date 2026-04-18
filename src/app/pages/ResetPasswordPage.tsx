import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { AlertCircle, CheckCircle, Lock } from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3000/api';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | null>(null);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  // Validate password strength
  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength(null);
      return;
    }

    let strength: "weak" | "medium" | "strong" = "weak";
    
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
    const isLongEnough = newPassword.length >= 8;

    const conditions = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar, isLongEnough];
    const metConditions = conditions.filter(Boolean).length;

    if (metConditions >= 4) {
      strength = "strong";
    } else if (metConditions >= 3) {
      strength = "medium";
    }

    setPasswordStrength(strength);
  }, [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (!token) {
      setError("Token de recuperación inválido o ausente");
      return;
    }

    if (!newPassword) {
      setError("Por favor ingresa una contraseña");
      return;
    }

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    // Validar requisitos
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      setError("La contraseña debe contener mayúscula, minúscula, número y carácter especial");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data?.message || data?.error || "Error al resetear la contraseña";
        setError(errorMessage);
        return;
      }

      setSuccess(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Token validation
  if (!token) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 pt-16">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 space-y-6 text-center border border-gray-100">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-12 h-12 text-red-600" />
                </div>
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Enlace inválido
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  El enlace de recuperación no es válido o ha expirado.
                </p>
              </div>
              <Button asChild className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base">
                <Link to="/recuperar-password">Solicitar nuevo enlace</Link>
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Success state
  if (success) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 pt-16">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 space-y-6 text-center border border-gray-100">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  ¡Contraseña actualizada!
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Tu contraseña ha sido cambiada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.
                </p>
              </div>
              <Button
                onClick={() => navigate("/login")}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base font-semibold"
              >
                Ir a Login
              </Button>
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
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Lock className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Nueva contraseña
              </h1>
              <p className="text-gray-600 leading-relaxed">
                Ingresa tu nueva contraseña para recuperar acceso a tu cuenta
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-red-300 bg-red-50">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">Error</p>
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                  Nueva contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-12 text-base pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>

                {/* Password strength indicator */}
                {newPassword && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {["weak", "medium", "strong"].map((strength) => (
                        <div
                          key={strength}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            !passwordStrength
                              ? "bg-gray-200"
                              : ["weak", "medium", "strong"].indexOf(strength) <
                                  ["weak", "medium", "strong"].indexOf(passwordStrength)
                              ? "bg-green-500"
                              : ["weak", "medium", "strong"].indexOf(strength) ===
                                  ["weak", "medium", "strong"].indexOf(passwordStrength)
                              ? passwordStrength === "weak"
                                ? "bg-red-500"
                                : passwordStrength === "medium"
                                ? "bg-yellow-500"
                                : "bg-green-500"
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600">
                      {passwordStrength === "weak" && "Contraseña débil"}
                      {passwordStrength === "medium" && "Contraseña moderada"}
                      {passwordStrength === "strong" && "Contraseña fuerte"}
                    </p>
                  </div>
                )}

                {/* Requirements */}
                <div className="mt-3 space-y-1 text-xs text-gray-600">
                  <p className={/[A-Z]/.test(newPassword) ? "text-green-600" : ""}>
                    ✓ Al menos una mayúscula
                  </p>
                  <p className={/[a-z]/.test(newPassword) ? "text-green-600" : ""}>
                    ✓ Al menos una minúscula
                  </p>
                  <p className={/[0-9]/.test(newPassword) ? "text-green-600" : ""}>
                    ✓ Al menos un número
                  </p>
                  <p className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? "text-green-600" : ""}>
                    ✓ Al menos un carácter especial (!@#$, etc)
                  </p>
                  <p className={newPassword.length >= 8 ? "text-green-600" : ""}>
                    ✓ Mínimo 8 caracteres
                  </p>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirmar contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`h-12 text-base pr-10 ${
                      confirmPassword && newPassword !== confirmPassword
                        ? "border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-600">Las contraseñas no coinciden</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base font-semibold"
                disabled={
                  loading ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword ||
                  passwordStrength !== "strong"
                }
              >
                {loading ? "Actualizando..." : "Actualizar contraseña"}
              </Button>
            </form>

            {/* Footer */}
            <div className="text-center text-sm text-gray-600">
              <p>
                ¿Ya tienes acceso?{" "}
                <Link to="/login" className="text-blue-600 hover:underline font-medium">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
