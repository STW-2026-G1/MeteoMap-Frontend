/**
 * @file SignUpPage.tsx
 * @description Página de registro de nuevos usuarios con validación de formulario,
 * selección de avatar y opción de registro con Google OAuth.
 * @author MeteoMap Team
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { ImageWithFallback } from "../components/common/ImageWithFallback";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { GoogleLogin } from '@react-oauth/google';

export default function SignUpPage() {
  const [Name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [avatarStyle, setAvatarStyle] = useState("avataaars");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const { register, loginGoogle, loading, error: authError } = useAuth();
  const navigate = useNavigate();

  const avatarStyles = [
    { value: "avataaars", label: "Avataaars" },
    { value: "bottts", label: "Bottts" },
    { value: "lorelei", label: "Lorelei" },
    { value: "pixel-art", label: "Pixel Art" },
    { value: "thumbs", label: "Thumbs" },
    { value: "notionists", label: "Notionists" },
    { value: "notionists-neutral", label: "Notionists Neutral" },
    { value: "dylan", label: "Dylan" },
    { value: "croodles", label: "Croodles" },
    { value: "personas", label: "Personas" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) return;
    setError("");
    
    const result = await register(email, password, Name, avatarStyle);
    if (result.success) {
      navigate("/mapa");
    } else {
      setError(result.errorMessage || "Error al registrarse");
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      const result = await loginGoogle(credentialResponse.credential);
      if (result.success) {
        navigate("/mapa");
      } else {
        setError(result.errorMessage || "Error al registrarse con Google");
      }
    }
  };

  const handleGoogleError = () => {
    setError("Error al registrarse con Google");
  };

  return (
    <>
      <Header />
      <div className="min-h-screen grid lg:grid-cols-2 pt-16">
        {/* Left Column - Image */}
        <div className="relative hidden lg:block">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1707584144334-8b343e88117c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGNsaW1iZXIlMjBtYXAlMjBzbm93fGVufDF8fHx8MTc3NDQzNTEzN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Alpinista consultando mapa"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-12">
            <h2 className="text-white text-4xl font-bold mb-4 leading-tight">
              Únete a la mayor red de<br />seguridad en montaña
            </h2>
            <p className="text-white/90 text-lg">
              Miles de montañeros comparten información en tiempo real
            </p>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="flex items-center justify-center p-8 lg:p-12 bg-white">
          <div className="w-full max-w-md space-y-8">
            {/* Logo */}
            <div className="text-center">
              <Link to="/" className="inline-block">
                <h1 className="text-3xl font-bold text-slate-900">Meteo Map</h1>
              </Link>
              <p className="mt-2 text-slate-600">Crea tu cuenta</p>
            </div>

            {/* Google y Github Sign Up */}
            <div className="flex flex-col gap-3 justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="outline"
                shape="rectangular"
                width="100%"
                text="signup_with"
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
                <span className="flex-1 text-center pl-4">Sign up with GitHub</span>
                <span className="w-5 h-5" />
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">O con tu email</span>
              </div>
            </div>

            {/* Sign Up Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-600 ml-2">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="Name">Nombre</Label>
                <Input
                  id="Name"
                  type="text"
                  placeholder="Juan Pérez"
                  value={Name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
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
                <p className="text-xs text-slate-500">
                  Mínimo 8 caracteres, incluir mayúscula, minúscula, número y carácter especial (!@#$%^&*)
                </p>
              </div>

              {/* Avatar Style */}
              <div className="space-y-2">
                <Label htmlFor="avatarStyle">Estilo de Avatar</Label>
                <div className="flex items-center gap-4">
                  <Select value={avatarStyle} onValueChange={setAvatarStyle}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecciona un estilo de avatar" />
                    </SelectTrigger>
                    <SelectContent>
                      {avatarStyles.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://api.dicebear.com/9.x/${style.value}/svg?seed=${Name || 'example'}`}
                              alt={style.label}
                              className="w-8 h-8 rounded-full"
                            />
                            <span>{style.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex-shrink-0">
                    <img
                      src={`https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${Name || 'example'}`}
                      alt="Avatar preview"
                      className="w-12 h-12 rounded-full border-2 border-gray-200"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Elige el estilo para tu avatar generado automáticamente
                </p>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-slate-600 leading-tight cursor-pointer"
                >
                  Acepto los{" "}
                  <Link to="/terminos" className="text-blue-600 hover:underline">
                    términos de uso
                  </Link>{" "}
                  y la{" "}
                  <Link to="/privacidad" className="text-blue-600 hover:underline">
                    política de privacidad
                  </Link>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!acceptTerms || loading}
              >
                {loading ? "Registrando..." : "Crear cuenta"}
              </Button>
            </form>

            {/* Login Link */}
            <div className="text-center text-sm">
              <span className="text-slate-600">¿Ya tienes cuenta?</span>{" "}
              <Link to="/login" className="text-blue-600 hover:underline font-medium">
                Inicia sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}