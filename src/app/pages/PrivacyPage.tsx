/**
 * @file PrivacyPage.tsx
 * @description Página informativa de política de privacidad para MeteoMap.
 * @author MeteoMap Team
 */

import { Link } from "react-router";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 pt-24 pb-12 px-4">
        <section className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10 space-y-6">
          <header className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">Política de Privacidad</h1>
            <p className="text-sm text-slate-500">Última actualización: 15 de mayo de 2026</p>
          </header>

          <div className="space-y-4 text-slate-700 leading-relaxed">
            <p>
              En MeteoMap tratamos tus datos personales únicamente para ofrecer el servicio: autenticación,
              personalización del perfil y uso de funcionalidades de comunidad.
            </p>
            <p>
              Los datos que almacenamos pueden incluir nombre, correo electrónico, avatar y actividad dentro de la
              plataforma (por ejemplo, reportes y comentarios). MeteoMap es una aplicación orientada a un público
              abierto y no comercializamos tus datos personales.
            </p>
            <p>
              Puedes solicitar actualización o eliminación de tus datos de cuenta mediante los canales de contacto.
              También puedes gestionar parte de esta información desde tu perfil de usuario.
            </p>
            <h2 className="text-xl font-semibold text-slate-900 pt-2">Cambios a esta Política</h2>
            <p>
              Podemos actualizar esta política ocasionalmente. Te notificaremos de cambios significativos mediante un
              aviso en la plataforma o por correo electrónico. El uso continuado de Meteo Map después de los cambios
              constituye tu aceptación de la política actualizada.
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
