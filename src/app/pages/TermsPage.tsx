/**
 * @file TermsPage.tsx
 * @description Página informativa de términos de uso para MeteoMap.
 * @author MeteoMap Team
 */

import { Link } from "react-router";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 pt-24 pb-12 px-4">
        <section className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10 space-y-6">
          <header className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">Términos de Uso</h1>
            <p className="text-sm text-slate-500">Última actualización: 15 de mayo de 2026</p>
          </header>

          <div className="space-y-4 text-slate-700 leading-relaxed">
            <p>
              MeteoMap es una plataforma colaborativa para compartir información meteorológica y de seguridad en montaña.
              El usuario se compromete a hacer un uso responsable de la información publicada.
            </p>
            <p>
              No se permite publicar contenido ofensivo, falso de forma intencionada o que comprometa la seguridad de
              otras personas. El equipo administrador puede moderar o eliminar contenido que incumpla estas normas.
            </p>
            <p>
              La información mostrada en la plataforma tiene carácter orientativo y no sustituye criterios técnicos o
              profesionales para actividades de riesgo.
            </p>
            <p>
              Al registrarte y utilizar MeteoMap, aceptas estos términos y condiciones para el uso de la web y sus
              funcionalidades.
            </p>
          </div>

          <div className="pt-2">
            <Link to="/" className="text-blue-600 hover:underline font-medium">
              Volver al inicio
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
