/**
 * @file ContactPage.tsx
 * @description Página de contacto informativa sin funcionalidades de envío.
 * @author MeteoMap Team
 */

import { Link } from "react-router";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Mail, MessageSquareText } from "lucide-react";

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 pt-24 pb-12 px-4">
        <section className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10 space-y-6">
          <header className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">Contacto</h1>
          </header>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 flex items-start gap-3">
            <Mail className="h-5 w-5 text-blue-700 mt-0.5" />
            <div>
              <p className="text-sm text-slate-700">Correo de contacto oficial</p>
              <p className="text-lg font-semibold text-slate-900">meteomap@gmail.com</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 flex items-start gap-3">
            <MessageSquareText className="h-5 w-5 text-slate-700 mt-0.5" />
            <p className="text-slate-700 leading-relaxed">
              Para dudas sobre el proyecto, incidencias o sugerencias, puedes escribir al correo anterior.
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
