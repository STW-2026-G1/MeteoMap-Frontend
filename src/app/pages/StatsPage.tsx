import { useState } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  MapPin,
  ThermometerSun,
  Wind,
  AlertTriangle,
  TrendingUp,
  Clock,
  Users,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function StatsPage() {
  const [selectedZone, setSelectedZone] = useState("formigal");

  // Mock data - Zonas favoritas
  const favoriteZones = [
    { id: "formigal", name: "Formigal", riskLevel: 45 },
    { id: "benasque", name: "Benasque", riskLevel: 67 },
    { id: "ordesa", name: "Ordesa", riskLevel: 32 },
    { id: "aneto", name: "Pico Aneto", riskLevel: 78 },
    { id: "candanchu", name: "Candanchú", riskLevel: 23 },
  ];

  // Mock data - Reportes recientes por zona
  const recentReportsData = {
    formigal: [
      { user: "Carlos M.", report: "Nieve polvo, buenas condiciones", time: "hace 15 min", type: "info" },
      { user: "Laura G.", report: "Visibilidad reducida en cotas altas", time: "hace 1h", type: "warning" },
      { user: "Miguel S.", report: "Viento fuerte en cumbres", time: "hace 2h", type: "danger" },
      { user: "Ana P.", report: "Condiciones estables", time: "hace 3h", type: "info" },
      { user: "Jorge L.", report: "Temperatura en descenso", time: "hace 4h", type: "info" },
    ],
    benasque: [
      { user: "Pedro R.", report: "Placas de hielo en norte", time: "hace 20 min", type: "danger" },
      { user: "María F.", report: "Nieve dura", time: "hace 1h", type: "warning" },
      { user: "Luis M.", report: "Buena visibilidad", time: "hace 2h", type: "info" },
    ],
    ordesa: [
      { user: "Elena T.", report: "Senderos despejados", time: "hace 30 min", type: "info" },
      { user: "Raúl V.", report: "Niebla en valles", time: "hace 1h", type: "warning" },
    ],
    aneto: [
      { user: "Javier B.", report: "Condiciones técnicas", time: "hace 10 min", type: "danger" },
      { user: "Sofia C.", report: "Grietas visibles", time: "hace 45 min", type: "danger" },
      { user: "David H.", report: "Viento muy fuerte", time: "hace 1h", type: "danger" },
    ],
    candanchu: [
      { user: "Isabel N.", report: "Nieve fresca 10cm", time: "hace 25 min", type: "info" },
      { user: "Roberto K.", report: "Pistas en buen estado", time: "hace 2h", type: "info" },
    ],
  };

  // Mock data - Evolución meteorológica (últimos 7 días)
  const weatherEvolutionData = [
    { day: "Lun", temperatura: 5, sensacionTermica: 2, vientoKmh: 15 },
    { day: "Mar", temperatura: 7, sensacionTermica: 4, vientoKmh: 20 },
    { day: "Mié", temperatura: 6, sensacionTermica: 3, vientoKmh: 25 },
    { day: "Jue", temperatura: 4, sensacionTermica: 0, vientoKmh: 30 },
    { day: "Vie", temperatura: 3, sensacionTermica: -2, vientoKmh: 35 },
    { day: "Sáb", temperatura: 2, sensacionTermica: -3, vientoKmh: 28 },
    { day: "Dom", temperatura: 4, sensacionTermica: 1, vientoKmh: 22 },
  ];

  const currentZone = favoriteZones.find((z) => z.id === selectedZone);
  const currentReports = recentReportsData[selectedZone as keyof typeof recentReportsData] || [];
  const riskLevel = currentZone?.riskLevel || 0;

  // Determinar color y estado del riesgo
  const getRiskColor = (risk: number) => {
    if (risk < 30) return { color: "text-green-600", bg: "bg-green-500", label: "Bajo", bgLight: "bg-green-50" };
    if (risk < 60) return { color: "text-yellow-600", bg: "bg-yellow-500", label: "Moderado", bgLight: "bg-yellow-50" };
    return { color: "text-red-600", bg: "bg-red-500", label: "Alto", bgLight: "bg-red-50" };
  };

  const riskInfo = getRiskColor(riskLevel);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-purple-50">
      <Header />

      <div className="mt-16 container mx-auto px-4 py-8 max-w-[1400px]">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Dashboard Personal
          </h1>
          <p className="text-gray-600 text-lg">
            Monitorea las condiciones de riesgo en tus zonas favoritas
          </p>
        </div>

        {/* Selector de Zonas Favoritas */}
        <Card className="p-6 mb-8 bg-white/80 backdrop-blur">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Zona Seleccionada</h2>
          </div>
          <Select value={selectedZone} onValueChange={setSelectedZone}>
            <SelectTrigger className="w-full md:w-[300px] h-12 text-base">
              <SelectValue placeholder="Selecciona una zona" />
            </SelectTrigger>
            <SelectContent>
              {favoriteZones.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>
                  <div className="flex items-center justify-between w-full gap-3">
                    <span>{zone.name}</span>
                    <Badge
                      className={`ml-2 ${
                        zone.riskLevel < 30
                          ? "bg-green-100 text-green-700"
                          : zone.riskLevel < 60
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {zone.riskLevel}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        {/* Grid Principal - Índice de Riesgo + Actividad */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Velocímetro de Riesgo */}
          <Card className="lg:col-span-2 p-8 bg-white/80 backdrop-blur">
            <div className="flex flex-col items-center justify-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Índice de Riesgo - {currentZone?.name}
              </h2>
              <p className="text-gray-600 mb-8 text-center">
                Evaluación en tiempo real basada en reportes y condiciones meteorológicas
              </p>

              {/* Velocímetro Circular */}
              <div className="relative w-64 h-64 mb-6">
                {/* Círculo de fondo */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="128"
                    cy="128"
                    r="100"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="20"
                  />
                  {/* Círculo de progreso */}
                  <circle
                    cx="128"
                    cy="128"
                    r="100"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="20"
                    strokeDasharray={`${(riskLevel / 100) * 628} 628`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Valor central */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-6xl font-bold ${riskInfo.color}`}>
                    {riskLevel}
                  </span>
                  <span className="text-gray-600 text-lg mt-2">de 100</span>
                </div>
              </div>

              {/* Estado del Riesgo */}
              <div className={`${riskInfo.bgLight} ${riskInfo.color} px-6 py-3 rounded-full font-semibold text-lg flex items-center gap-2`}>
                <AlertTriangle className="h-5 w-5" />
                Riesgo {riskInfo.label}
              </div>

              {/* Leyenda */}
              <div className="flex gap-6 mt-8 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full" />
                  <span className="text-gray-700">0-29: Bajo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full" />
                  <span className="text-gray-700">30-59: Moderado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full" />
                  <span className="text-gray-700">60-100: Alto</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Lista de Actividad Reciente */}
          <Card className="p-6 bg-white/80 backdrop-blur">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Actividad Reciente</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Reportes de usuarios en <span className="font-semibold">{currentZone?.name}</span>
            </p>

            {/* Contador de reportes */}
            <div className="bg-blue-50 rounded-lg p-4 mb-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{currentReports.length}</div>
              <div className="text-sm text-gray-600 mt-1">reportes hoy</div>
            </div>

            {/* Lista de reportes */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
              {currentReports.map((report, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${
                    report.type === "danger"
                      ? "bg-red-50 border-red-500"
                      : report.type === "warning"
                      ? "bg-yellow-50 border-yellow-500"
                      : "bg-blue-50 border-blue-500"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold text-sm text-gray-900">{report.user}</span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {report.time}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{report.report}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Gráfico de Evolución Meteorológica */}
        <Card className="p-6 md:p-8 bg-white/80 backdrop-blur">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Evolución Meteorológica
              </h2>
              <p className="text-gray-600">
                Temperatura, sensación térmica y velocidad del viento (últimos 7 días)
              </p>
            </div>
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>

          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={weatherEvolutionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="day"
                stroke="#6b7280"
                style={{ fontSize: "14px" }}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: "14px" }}
                label={{ value: "°C / km/h", angle: -90, position: "insideLeft" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                iconType="line"
              />
              <Line
                key="temperatura-line"
                type="monotone"
                dataKey="temperatura"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ fill: "#ef4444", r: 5 }}
                name="Temperatura (°C)"
                activeDot={{ r: 7 }}
              />
              <Line
                key="sensacionTermica-line"
                type="monotone"
                dataKey="sensacionTermica"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: "#3b82f6", r: 5 }}
                name="Sensación Térmica (°C)"
                activeDot={{ r: 7 }}
              />
              <Line
                key="vientoKmh-line"
                type="monotone"
                dataKey="vientoKmh"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: "#10b981", r: 5 }}
                name="Viento (km/h)"
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Resumen de indicadores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-red-50 rounded-lg p-4 flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <ThermometerSun className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Temp. Actual</div>
                <div className="text-2xl font-bold text-gray-900">
                  {weatherEvolutionData[weatherEvolutionData.length - 1].temperatura}°C
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ThermometerSun className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Sensación Térmica</div>
                <div className="text-2xl font-bold text-gray-900">
                  {weatherEvolutionData[weatherEvolutionData.length - 1].sensacionTermica}°C
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Wind className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Viento</div>
                <div className="text-2xl font-bold text-gray-900">
                  {weatherEvolutionData[weatherEvolutionData.length - 1].vientoKmh} km/h
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Footer />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}