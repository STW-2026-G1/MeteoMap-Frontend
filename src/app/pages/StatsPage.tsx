import { useState, useEffect } from "react";
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

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3000/api';

interface RiskIndex {
  riskLevel: number;
  riskType: "Bajo" | "Moderado" | "Alto" | "Muy Alto";
  riskColor: string;
}

export default function StatsPage() {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [favoriteZones, setFavoriteZones] = useState<any[]>([]);
  const [currentReports, setCurrentReports] = useState<any[]>([]);
  const [weatherEvolutionData, setWeatherEvolutionData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calcular índice de riesgo
  const calculateRiskIndex = (zone: any): RiskIndex => {
    let riskLevel = 20;

    if (zone.weather) {
      const weatherCode = zone.weather.code || 0;
      if (weatherCode === 0 || weatherCode === 1) {
        riskLevel = 20;
      } else if (weatherCode === 2) {
        riskLevel = 30;
      } else if (weatherCode === 45 || weatherCode === 48 || weatherCode === 51 || weatherCode === 53 || weatherCode === 55) {
        riskLevel = 50;
      } else if (weatherCode === 71 || weatherCode === 73 || weatherCode === 75 || weatherCode === 77 || weatherCode === 80 || weatherCode === 81 || weatherCode === 82) {
        riskLevel = 70;
      } else if (weatherCode === 85 || weatherCode === 86) {
        riskLevel = 70;
      } else if (weatherCode === 95 || weatherCode === 96 || weatherCode === 99) {
        riskLevel = 100;
      } else {
        riskLevel = 40;
      }
    }

    if (zone.temperature !== undefined) {
      if (zone.temperature < -5) {
        riskLevel += 15;
      } else if (zone.temperature < 0) {
        riskLevel += 10;
      }
    }

    const recentReports = zone.recentReports || 0;
    if (recentReports >= 1 && recentReports <= 2) {
      riskLevel += 5;
    } else if (recentReports >= 3 && recentReports <= 5) {
      riskLevel += 15;
    } else if (recentReports >= 6) {
      riskLevel += 25;
    }

    if (zone.hasConfirmedReports) {
      riskLevel += 20;
    }

    riskLevel = Math.min(Math.max(riskLevel, 0), 100);

    let riskType: "Bajo" | "Moderado" | "Alto" | "Muy Alto" = "Bajo";
    let riskColor = "bg-green-100 text-green-800";

    if (riskLevel >= 75) {
      riskType = "Muy Alto";
      riskColor = "bg-red-100 text-red-800";
    } else if (riskLevel >= 60) {
      riskType = "Alto";
      riskColor = "bg-orange-100 text-orange-800";
    } else if (riskLevel >= 30) {
      riskType = "Moderado";
      riskColor = "bg-yellow-100 text-yellow-800";
    }

    return {
      riskLevel: Math.round(riskLevel),
      riskType,
      riskColor,
    };
  };

  // Cargar zonas favoritas con datos reales
  useEffect(() => {
    const loadFavoritesWithData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('meteomap_token');
        if (!token) {
          console.log('No hay usuario autenticado para cargar favoritas');
          setIsLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/user/me/favorites`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const preferences = data.preferencias || [];

          const mappedFavorites = await Promise.all(
            preferences.map(async (pref: any) => {
              const zone = typeof pref === 'object' ? pref : { _id: pref };
              const zoneId = zone._id || zone.id;

              try {
                const zoneResponse = await fetch(`${API_BASE_URL}/zones/${zoneId}`);
                let recentReportsList: any[] = [];

                try {
                  const reportsResponse = await fetch(`${API_BASE_URL}/reports?zonaId=${zoneId}`, {
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  });

                  if (reportsResponse.ok) {
                    const reportsData = await reportsResponse.json();
                    
                    const now = new Date();
                    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    
                    recentReportsList = (reportsData.reports || []).filter((report: any) => {
                      const reportDate = new Date(report.createdAt || report.fecha);
                      return reportDate >= oneDayAgo;
                    });
                  }
                } catch (e) {
                  console.error(`Error cargando reportes para la zona ${zoneId}:`, e);
                }

                if (zoneResponse.ok) {
                  const zoneData = await zoneResponse.json();
                  const zoneInfo = zoneData.data || zoneData.zone || zoneData;
                  const meteoData = zoneInfo.cache_meteo?.current?.datos_crudos || {};

                  const hasConfirmedReports = recentReportsList.some(
                    (report: any) => report.validaciones?.usuarios_confirmaron?.length > 0
                  );

                  const riskData = calculateRiskIndex({
                    weather: { code: meteoData.codigo_clima },
                    temperature: meteoData.temperatura,
                    recentReports: recentReportsList.length,
                    hasConfirmedReports,
                  });

                  return {
                    id: zoneId,
                    zoneId,
                    name: zoneInfo.nombre || zone.nombre || "Zona sin nombre",
                    region: zoneInfo.departamento || "Región desconocida",
                    temperature: meteoData.temperatura || 0,
                    wind: meteoData.velocidad_viento || 0,
                    sensacionTermica: meteoData.temperatura_aparente || 0,
                    weather: {
                      code: meteoData.codigo_clima,
                      description: meteoData.descripcion
                    },
                    riskLevel: riskData.riskLevel,
                    riskType: riskData.riskType,
                    riskColor: riskData.riskColor,
                    recentReports: recentReportsList.length,
                    reportsList: recentReportsList,
                  };
                } else {
                  return {
                    id: zoneId,
                    zoneId,
                    name: zone.nombre || zone.name || "Zona sin nombre",
                    region: zone.departamento || "Región desconocida",
                    temperature: 0,
                    wind: 0,
                    sensationTermica: 0,
                    weather: {},
                    riskLevel: 50,
                    riskType: "Moderado",
                    riskColor: "bg-yellow-100 text-yellow-800",
                    recentReports: 0,
                    reportsList: [],
                  };
                }
              } catch (error) {
                console.error(`Error cargando datos de zona ${zoneId}:`, error);
                return {
                  id: zoneId,
                  zoneId,
                  name: zone.nombre || zone.name || "Zona sin nombre",
                  region: zone.departamento || "Región desconocida",
                  temperature: 0,
                  wind: 0,
                  sensacionTermica: 0,
                  weather: {},
                  riskLevel: 50,
                  riskType: "Moderado",
                  riskColor: "bg-yellow-100 text-yellow-800",
                  recentReports: 0,
                  reportsList: [],
                };
              }
            })
          );

          setFavoriteZones(mappedFavorites);
          if (mappedFavorites.length > 0) {
            setSelectedZone(mappedFavorites[0].zoneId);
          }
        }
      } catch (error) {
        console.error('Error cargando favoritas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFavoritesWithData();
  }, []);

  // **NUEVO useEffect: Sincroniza currentReports al seleccionar una zona**
  useEffect(() => {
    if (selectedZone && favoriteZones.length > 0) {
      const zone = favoriteZones.find((z) => z.zoneId === selectedZone);
      if (zone && zone.reportsList) {
        const mappedList = zone.reportsList.map((report: any) => ({
          user: report.usuario_id?.perfil?.nombre || "Usuario desconocido",
          time: new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          report: report.contenido?.descripcion || "Sin descripción",
          type: report.estado === "SOSPECHOSO" ? "warning" : report.estado === "LEGITIMO" ? "danger" : "info",
        }));
        setCurrentReports(mappedList);
      } else {
        setCurrentReports([]);
      }
    } else {
      setCurrentReports([]);
    }
  }, [selectedZone, favoriteZones]);

  // Generar datos meteorológicos de ejemplo (en producción vendría del backend)
  useEffect(() => {
    const mockWeatherData = [
      { day: "Lun", temperatura: 5, sensacionTermica: 2, vientoKmh: 15 },
      { day: "Mar", temperatura: 7, sensacionTermica: 4, vientoKmh: 20 },
      { day: "Mié", temperatura: 6, sensacionTermica: 3, vientoKmh: 25 },
      { day: "Jue", temperatura: 4, sensacionTermica: 0, vientoKmh: 30 },
      { day: "Vie", temperatura: 3, sensacionTermica: -2, vientoKmh: 35 },
      { day: "Sáb", temperatura: 2, sensacionTermica: -3, vientoKmh: 28 },
      { day: "Dom", temperatura: 4, sensacionTermica: 1, vientoKmh: 22 },
    ];
    setWeatherEvolutionData(mockWeatherData);
  }, []);

  const currentZone = favoriteZones.find((z) => z.zoneId === selectedZone);
  const riskLevel = currentZone?.riskLevel || 0;

  // Determinar color y estado del riesgo (4 niveles)
  const getRiskColor = (risk: number) => {
    if (risk < 30) return { color: "text-green-600", bg: "bg-green-500", label: "Bajo", bgLight: "bg-green-50" };
    if (risk < 60) return { color: "text-yellow-600", bg: "bg-yellow-500", label: "Moderado", bgLight: "bg-yellow-50" };
    if (risk < 75) return { color: "text-orange-600", bg: "bg-orange-500", label: "Alto", bgLight: "bg-orange-50" };
    return { color: "text-red-600", bg: "bg-red-500", label: "Muy Alto", bgLight: "bg-red-50" };
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
          <Select value={selectedZone || ""} onValueChange={setSelectedZone}>
            <SelectTrigger className="w-full md:w-[300px] h-12 text-base">
              <SelectValue placeholder={isLoading ? "Cargando zonas..." : "Selecciona una zona"} />
            </SelectTrigger>
            <SelectContent>
              {favoriteZones.map((zone) => (
                <SelectItem key={zone.zoneId} value={zone.zoneId}>
                  <div className="flex items-center justify-between w-full gap-3">
                    <span>{zone.name}</span>
                    <Badge
                      className={`ml-2 ${
                        zone.riskLevel < 30
                          ? "bg-green-100 text-green-700"
                          : zone.riskLevel < 60
                          ? "bg-yellow-100 text-yellow-700"
                          : zone.riskLevel < 75
                          ? "bg-orange-100 text-orange-700"
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
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="128"
                    cy="128"
                    r="100"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="20"
                  />
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
              <div className="flex gap-4 mt-8 text-sm flex-wrap justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full" />
                  <span className="text-gray-700">0-29: Bajo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full" />
                  <span className="text-gray-700">30-59: Moderado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 rounded-full" />
                  <span className="text-gray-700">60-74: Alto</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full" />
                  <span className="text-gray-700">75-100: Muy Alto</span>
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
              {currentReports.length > 0 ? (
                currentReports.map((report, index) => (
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
                ))
              ) : (
                <p className="text-center text-gray-500 text-sm py-4">No hay reportes para esta zona.</p>
              )}
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

          {/* Resumen de indicadores usando la zona real seleccionada */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-red-50 rounded-lg p-4 flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <ThermometerSun className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Temp. Actual</div>
                <div className="text-2xl font-bold text-gray-900">
                  {currentZone?.temperature || 0}°C
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
                  {currentZone?.sensacionTermica || 0}°C
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
                  {currentZone?.wind || 0} km/h
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