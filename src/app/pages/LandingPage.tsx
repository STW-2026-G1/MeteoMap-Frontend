import { Link } from "react-router";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { AlertTriangle, Users, Bot } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-16 min-h-[600px] md:min-h-[700px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1701614753266-9ad5ba4f86ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbm93eSUyMG1vdW50YWluJTIwbGFuZHNjYXBlJTIwcGFub3JhbWF8ZW58MXx8fHwxNzc0NDI0ODgzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 max-w-4xl mx-auto leading-tight">
            Tu seguridad en la montaña: Monitorización de riesgos en tiempo real
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Accede a datos oficiales de AEMET y reportes de la comunidad para tomar decisiones informadas en tus aventuras de montaña
          </p>
          <Link to="/mapa">
            <Button size="lg" className="text-lg px-8 py-6 h-auto bg-blue-600 hover:bg-blue-700">
              Ver Mapa en Vivo
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="como-funciona" className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            Cómo funciona
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Meteo Map combina datos oficiales con inteligencia colectiva para ofrecerte información precisa y actualizada
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Feature 1 */}
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="text-xl mb-2">Alertas Oficiales</CardTitle>
                <CardDescription className="text-base">
                  Información en tiempo real sobre riesgo de aludes y condiciones meteorológicas adversas directamente de AEMET
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2 */}
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl mb-2">Reportes de la Comunidad</CardTitle>
                <CardDescription className="text-base">
                  Comparte y accede a observaciones en terreno de otros montañeros: condiciones de nieve, visibilidad y más
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3 */}
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto mb-4 w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <Bot className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl mb-2">Asistente IA Inteligente</CardTitle>
                <CardDescription className="text-base">
                  Obtén recomendaciones personalizadas y análisis de riesgo basados en tu ruta planificada y experiencia
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
