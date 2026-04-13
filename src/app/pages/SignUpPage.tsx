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
import { AlertCircle } from "lucide-react";
import { GoogleLogin } from '@react-oauth/google';

export default function SignUpPage() {
  const [Name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

            {/* Google Sign Up */}
            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="outline"
                shape="rectangular"
                width="100%"
                text="signup_with"
              />
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
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
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