import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Cloud, Home } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <Cloud className="w-24 h-24 text-slate-300" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-slate-900">404</h1>
          <h2 className="text-2xl font-semibold text-slate-700">
            Página no encontrada
          </h2>
          <p className="text-slate-600">
            Lo sentimos, la página que buscas no existe o ha sido movida.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Volver al inicio
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/mapa">
              Ver mapa
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
