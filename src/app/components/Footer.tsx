import { Cloud } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Cloud className="h-6 w-6 text-blue-400" />
            <span className="font-semibold">Meteo Map</span>
          </div>
          <p className="text-gray-400 text-sm text-center md:text-left">
            © 2026 Meteo Map. Datos proporcionados por AEMET y la comunidad.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Privacidad
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Términos
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Contacto
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
