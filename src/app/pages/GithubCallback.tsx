import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Header } from "../components/Header";

export default function GithubCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginGithub, error } = useAuth();
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");

    if (code && !hasAttemptedRef.current) {
      hasAttemptedRef.current = true;
      loginGithub(code).then((result) => {
        if (result.success) {
          navigate("/mapa");
        }
        // Si hay error, se mostrará en el componente ya que fallará y no redirigirá
      });
    } else if (!code) {
      navigate("/login");
    }
  }, [searchParams, loginGithub, navigate]);

  return (
    <>
      <Header />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 pt-16">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">Autenticando con GitHub</h1>
          
          {error ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <button
                onClick={() => navigate("/login")}
                className="text-blue-600 hover:underline text-sm font-medium"
              >
                Volver a Iniciar Sesión
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4 text-slate-600">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p>Por favor, espera mientras validamos tus credenciales...</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
