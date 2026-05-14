/**
 * @file StatsPage.tsx
 * @description Página de estadísticas que muestra información agregada de reportes
 * y métricas meteorológicas del sistema, con selección por zona.
 * @author MeteoMap Team
 */

import { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { ReportDetailModal } from "../components/ReportDetailModal";
import {
  MapPin,
  ThermometerSun,
  Wind,
  AlertTriangle,
  TrendingUp,
  Clock,
  Users,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Edit2,
  Check,
  X,
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
  const [selectedReportForModal, setSelectedReportForModal] = useState<any>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Estados para selección de métricas (IDs basados en Open-Meteo)
  const [isEditingMetrics, setIsEditingMetrics] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<Set<string>>(new Set(["temperature_2m", "apparent_temperature", "wind_speed_10m"]));
  const [tempSelectedMetrics, setTempSelectedMetrics] = useState<Set<string>>(new Set(["temperature_2m", "apparent_temperature", "wind_speed_10m"]));

  // Lista completa de métricas que se extraen de Open-Meteo (current)
  const metricsAvailable = [
    { id: "temperature_2m", label: "Temperatura", unit: "°C", color: "#ef4444" },
    { id: "relative_humidity_2m", label: "Humedad", unit: "%", color: "#60a5fa" },
    { id: "apparent_temperature", label: "Sensación Térmica", unit: "°C", color: "#3b82f6" },
    // 'Clima' eliminado como métrica seleccionable en la gráfica
    { id: "wind_speed_10m", label: "Viento (vel)", unit: "km/h", color: "#10b981" },
    { id: "wind_direction_10m", label: "Dirección Viento", unit: "°", color: "#7c3aed" },
    { id: "precipitation", label: "Precipitación", unit: "mm", color: "#0ea5e9" },
    { id: "rain", label: "Lluvia", unit: "mm", color: "#0369a1" },
    { id: "snowfall", label: "Nieve", unit: "cm", color: "#93c5fd" },
    { id: "visibility", label: "Visibilidad", unit: "m", color: "#64748b" },
  ];

  // Mapeos auxiliares: clave de gráfico (forecast) para métricas con datos horarios
  const chartKeyForMetric = (metricId: string) => {
    if (metricId === "temperature_2m") return "temperatura";
    if (metricId === "relative_humidity_2m") return "humedad";
    if (metricId === "apparent_temperature") return "sensacionTermica";
    if (metricId === "wind_speed_10m") return "vientoKmh";
    if (metricId === "wind_direction_10m") return "direccionViento";
    if (metricId === "precipitation") return "precipitacion";
    if (metricId === "rain") return "lluvia";
    if (metricId === "snowfall") return "nieve";
    if (metricId === "visibility") return "visibilidad";
    return null;
  };

  // Obtener valor actual para un metricId desde currentZone con múltiples alias
  const getCurrentMetricValue = (metricId: string, zone: any) => {
    if (!zone) return "—";

    const check = (keys: string[]) => {
      for (const k of keys) {
        const parts = k.split(".");
        let val: any = zone;
        for (const p of parts) {
          if (val == null) break;
          val = val[p];
        }
        if (val !== undefined && val !== null) return val;
      }
      return null;
    };

    switch (metricId) {
      case "temperature_2m":
        return check(["temperature", "temperatura", "cache_meteo.current.datos_crudos.temperatura"]) ?? "—";
      case "apparent_temperature":
        return check(["sensacionTermica", "temperatura_aparente", "apparent_temperature"]) ?? "—";
      case "relative_humidity_2m":
        return check(["humedad", "relative_humidity_2m"]) ?? "—";
      case "weather_code":
        return zone.weather?.description ?? zone.codigo_clima ?? zone.weather?.code ?? "—";
      case "wind_speed_10m":
        return check(["wind", "velocidad_viento", "wind_speed_10m"]) ?? "—";
      case "wind_direction_10m":
        return check(["direccion_viento", "wind_direction_10m"]) ?? "—";
      case "precipitation":
        return check(["precipitacion", "precipitation"]) ?? "—";
      case "rain":
        return check(["lluvia", "rain"]) ?? "—";
      case "showers":
        return check(["showers"]) ?? "—";
      case "snowfall":
        return check(["nieve", "snowfall"]) ?? "—";
      case "visibility":
        return check(["visibilidad", "visibility"]) ?? "—";
      default:
        return "—";
    }
  };

  // Calcular índice de riesgo
  const calculateRiskIndex = (zone: any): RiskIndex => {
    let riskLevel = 20;

    if (zone.weather) {
      const weatherCode = zone.weather.code || 0;
      
      if (weatherCode === 0 || weatherCode === 1) {
         riskLevel = 20;
      } else if (weatherCode === 2) {
         riskLevel = 30;
      } else if (weatherCode >= 45 && weatherCode <= 55) {
         riskLevel = 50;
      } else if (weatherCode >= 71 && weatherCode <= 86) {
         riskLevel = 70;
      } else if (weatherCode >= 95 && weatherCode <= 99) {
         riskLevel = 100;
      } else {
         // Para cualquier otro código no especificado (como lluvia moderada, lloviznas, etc.)
         riskLevel = 40; 
      }
    }

    if (zone.temperature !== undefined) {
      if (zone.temperature < -5) {
        riskLevel += 15;
      } else if (zone.temperature < 0) {
        riskLevel += 10;
      } else if (zone.temperature > 30) {
        riskLevel += 15;
      }
    }

    console.log(`Lista de reportes relevantes para la zona ${zone.name}:`, zone.reportsList);
    
    const relevantReportsList = (zone.reportsList || []).filter((report: any) => {
      let categoryName = report.categoria_id?.nombre || "";
      
      // Si el nombre llega vacío y tenemos el arreglo de categorías en el estado, lo buscamos manualmente
      if (!categoryName && categories.length > 0) {
        const found = categories.find((cat) => cat._id === report.categoria_id || cat._id === report.categoria_id?._id);
        if (found) categoryName = found.nombre;
      }
      
      // Ignoramos los reportes de 'Buenas condiciones'
      return categoryName.toLowerCase() !== "buenas condiciones";
    });

    const recentReports = relevantReportsList.length;
    console.log(`Zona: ${zone.name}, Reportes relevantes en las últimas 24h: ${recentReports}`);

    if (recentReports >= 1 && recentReports <= 2) {
       riskLevel += 5;
    } else if (recentReports >= 3 && recentReports <= 5) {
       riskLevel += 15;
    } else if (recentReports >= 6) {
       riskLevel += 25;
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

  // Funciones para manejar métricas
  const handleMetricToggle = (metricId: string) => {
    const newSet = new Set(tempSelectedMetrics);
    if (newSet.has(metricId)) {
      newSet.delete(metricId);
    } else {
      if (newSet.size < 3) {
        newSet.add(metricId);
      } else {
        toast.error("Máximo 3 métricas permitidas");
        return;
      }
    }
    setTempSelectedMetrics(newSet);
  };

  const handleSaveMetrics = () => {
    setSelectedMetrics(new Set(tempSelectedMetrics));
    setIsEditingMetrics(false);
    // TODO: Guardar en BD cuando se implemente la API de preferencias de usuario
  };

  const handleCancelMetrics = () => {
    setTempSelectedMetrics(new Set(selectedMetrics));
    setIsEditingMetrics(false);
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

        try {
          const catResponse = await fetch(`${API_BASE_URL}/categories`, {
            headers: {
              'Authorization': `Bearer ${token}` 
            }
          });
          if (catResponse.ok) {
            const dataCategories = await catResponse.json();
            setCategories(dataCategories);
            console.log('Categorías cargadas:', dataCategories);
          }
        } catch (catError) {
          console.error('Error al cargar las categorías:', catError);
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
                  const forecastData = zoneInfo.cache_meteo?.forecast?.datos_crudos || [];

                  const hasConfirmedReports = recentReportsList.some(
                    (report: any) => report.validaciones?.usuarios_confirmaron?.length > 0
                  );

                  // Corrección: Ahora pasamos "reportsList" al calculateRiskIndex
                  const riskData = calculateRiskIndex({
                    name: zoneInfo.nombre || zone.nombre || "Zona sin nombre",
                    weather: { code: meteoData.codigo_clima },
                    temperature: meteoData.temperatura,
                    reportsList: recentReportsList,
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
                    humedad: meteoData.humedad ?? null,
                    codigo_clima: meteoData.codigo_clima ?? null,
                    descripcion: meteoData.descripcion ?? null,
                    direccionViento: meteoData.direccion_viento ?? null,
                    precipitacion: meteoData.precipitacion ?? null,
                    lluvia: meteoData.lluvia ?? null,
                    chubascos: meteoData.chubascos ?? null,
                    nieve: meteoData.nieve ?? null,
                    visibilidad: meteoData.visibilidad ?? null,
                    weather: {
                      code: meteoData.codigo_clima,
                      description: meteoData.descripcion
                    },
                    currentRaw: meteoData,
                    riskLevel: riskData.riskLevel,
                    riskType: riskData.riskType,
                    riskColor: riskData.riskColor,
                    recentReports: recentReportsList.length,
                    reportsList: recentReportsList,
                    forecast: forecastData,
                  };
                } else {
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
                    forecast: [],
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
                  forecast: [],
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

  // Sincronizar currentReports al seleccionar una zona
  useEffect(() => {
    if (selectedZone && favoriteZones.length > 0) {
      const zone = favoriteZones.find((z) => z.zoneId === selectedZone);
      if (zone && zone.reportsList) {
        // Corrección: Filtrar los reportes para no mostrar los de "Buenas condiciones" en el UI
        const mappedList = zone.reportsList
          .map((report: any) => ({
            id: report._id,
            user: report.usuario_id?.perfil?.nombre || "Usuario desconocido",
            avatar: report.usuario_id?.perfil?.avatar_url || "",
            time: new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            report: report.contenido?.descripcion || "Sin descripción",
            categoryName: report.categoria_id?.nombre || "Sin categoría",
            categoryIcon: report.categoria_id?.icono_marcador || "",
            confirmations: report.validaciones?.usuarios_confirmaron?.length ?? 0,
            denials: report.validaciones?.usuarios_desmintieron?.length ?? 0,
          }));
        setCurrentReports(mappedList);
      } else {
        setCurrentReports([]);
      }
    } else {
      setCurrentReports([]);
    }
  }, [selectedZone, favoriteZones, categories]);

  // Cargar datos meteorológicos reales de la BD (últimas 12+ horas)
  useEffect(() => {
    if (selectedZone && favoriteZones.length > 0) {
      const currentZoneData = favoriteZones.find((z) => z.zoneId === selectedZone);
      const forecastSource = currentZoneData?.forecast?.datos_crudos || currentZoneData?.forecast || [];

      if (Array.isArray(forecastSource) && forecastSource.length > 0) {
        const processedData = forecastSource.map((item: any, index: number) => {
          const hour = item.hora || item.time || `${String(index).padStart(2, "0")}:00`;
          const temperatura = Number(item.temperatura ?? item.temp ?? 0);
          const temperaturaAparente = Number(item.temperatura_aparente ?? item.sensacionTermica ?? temperatura);
          const humedad = item.humedad ?? item.relative_humidity_2m ?? null;
          const velocidadViento = Number(item.velocidad_viento ?? item.vientoKmh ?? 0);
          const direccionViento = item.direccion_viento ?? item.direccionViento ?? null;
          const precipitacion = item.precipitacion ?? item.precipitation ?? null;
          const lluvia = item.lluvia ?? item.rain ?? null;
          const chubascos = item.chubascos ?? item.showers ?? null;
          const nieve = item.nieve ?? item.snowfall ?? null;
          const visibilidad = item.visibilidad ?? item.visibility ?? null;

          return {
            day: hour,
            temperatura,
            sensacionTermica: temperaturaAparente,
            humedad: humedad !== null ? Number(humedad) : null,
            vientoKmh: velocidadViento,
            direccionViento: direccionViento !== null ? Number(direccionViento) : null,
            precipitacion: precipitacion !== null ? Number(precipitacion) : null,
            lluvia: lluvia !== null ? Number(lluvia) : null,
            chubascos: chubascos !== null ? Number(chubascos) : null,
            nieve: nieve !== null ? Number(nieve) : null,
            visibilidad: visibilidad !== null ? Number(visibilidad) : null,
          };
        });
        
        console.log('Datos meteorológicos cargados de la BD:', processedData);
        setWeatherEvolutionData(processedData);
      } else {
        // Fallback si no hay datos
        console.log('No hay datos de forecast disponibles para la zona');
        setWeatherEvolutionData([]);
      }
    } else {
      setWeatherEvolutionData([]);
    }
  }, [selectedZone, favoriteZones]);

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

  const getWeatherVisual = (description?: string) => {
    const text = (description || "").toLowerCase();

    if (text.includes("tormenta")) {
      return { icon: CloudLightning, iconClass: "text-violet-600" };
    }
    if (text.includes("nieve")) {
      return { icon: CloudSnow, iconClass: "text-cyan-600" };
    }
    if (text.includes("lluvia") || text.includes("llovizna") || text.includes("chubasc")) {
      return { icon: CloudRain, iconClass: "text-blue-600" };
    }
    if (text.includes("despejado")) {
      return { icon: Sun, iconClass: "text-amber-500" };
    }

    return { icon: Cloud, iconClass: "text-slate-500" };
  };

  const weatherVisual = getWeatherVisual(currentZone?.weather?.description);
  const WeatherIcon = weatherVisual.icon;

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
               <div className="mb-5 inline-flex items-center gap-3 rounded-xl bg-slate-100/80 border border-slate-200 px-4 py-2.5 shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 border border-slate-200">
                  <WeatherIcon className={`h-4 w-4 ${weatherVisual.iconClass}`} />
                </div>
                <div className="text-left leading-tight">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Clima actual</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {currentZone?.weather?.description || "Sin datos disponibles"}
                  </p>
                </div>
              </div>
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
            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
              {currentReports.length > 0 ? (
                currentReports.map((report, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      const reportData = {
                        id: report.id,
                        userName: report.user,
                        avatar: report.avatar,
                        condition: report.report,
                        timestamp: report.time,
                        riskType: report.categoryName, 
                        location: currentZone?.name || "Zona desconocida",
                        description: report.report,
                        categoryIcon: report.categoryIcon,
                        validations: report.validations,
                        confirmations: report.confirmations || 0,
                        denials: report.denials || 0,
                      };
                      setSelectedReportForModal(reportData);
                      setReportModalOpen(true);
                    }}
                    className="w-full text-left p-4 rounded-lg border-l-4 transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-pointer bg-blue-50 border-blue-500 hover:bg-blue-100"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{report.categoryIcon}</span>
                        <span className="font-semibold text-sm text-gray-900 truncate max-w-[120px]">
                          {report.user}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs px-2 py-0.5 bg-white/80 rounded border border-gray-200 text-gray-700 font-medium">
                        <span>{report.categoryName}</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 line-clamp-2">{report.report}</p>

                    <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{report.time}</span>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-center text-gray-500 text-sm py-8">No hay reportes para esta zona.</p>
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
                Temperatura, sensación térmica y velocidad del viento (próximas 12 horas)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              {!isEditingMetrics ? (
                <button
                  onClick={() => {
                    setTempSelectedMetrics(new Set(selectedMetrics));
                    setIsEditingMetrics(true);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Editar métricas"
                >
                  <Edit2 className="h-5 w-5 text-gray-600" />
                </button>
              ) : null}
            </div>
          </div>

          {/* Panel de selección de métricas - Solo visible en modo edición */}
          {isEditingMetrics && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Seleccionar Métricas (máx. 3)</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveMetrics}
                    className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                  >
                    <Check className="h-4 w-4" />
                    Guardar
                  </button>
                  <button
                    onClick={handleCancelMetrics}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {metricsAvailable.map((metric) => (
                  <label key={metric.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-blue-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={tempSelectedMetrics.has(metric.id)}
                      onChange={() => handleMetricToggle(metric.id)}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: metric.color }}
                      />
                      <div>
                        <div className="font-medium text-gray-900">{metric.label}</div>
                        <div className="text-xs text-gray-600">{metric.unit}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

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
              {metricsAvailable
                .filter((metric) => selectedMetrics.has(metric.id))
                .map((metric) => {
                  const dataKey = chartKeyForMetric(metric.id);
                  if (!dataKey) return null;

                  return (
                    <Line
                      key={`${metric.id}-line`}
                      type="monotone"
                      dataKey={dataKey}
                      stroke={metric.color}
                      strokeWidth={3}
                      dot={{ fill: metric.color, r: 5 }}
                      name={`${metric.label}${metric.unit ? ` (${metric.unit})` : ""}`}
                      activeDot={{ r: 7 }}
                    />
                  );
                })}
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-8 mb-4 text-center">
            <h3 className="text-lg font-semibold text-gray-900">Datos actuales</h3>
            <p className="text-sm text-gray-600">
              Valores en este momento para la zona seleccionada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {metricsAvailable
              .filter((m) => selectedMetrics.has(m.id))
              .slice(0, 3)
              .map((m) => (
                <div key={m.id} className="bg-white/50 rounded-lg p-4 flex items-center gap-3 border">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: `${m.color}22` }}>
                    {/* icon */}
                    {m.id.includes("temp") ? (
                      <ThermometerSun className={`h-6 w-6`} style={{ color: m.color }} />
                    ) : m.id.includes("wind") ? (
                      <Wind className={`h-6 w-6`} style={{ color: m.color }} />
                    ) : (
                      <Cloud className={`h-6 w-6`} style={{ color: m.color }} />
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">{m.label}</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {typeof getCurrentMetricValue(m.id, currentZone) === 'number'
                        ? `${getCurrentMetricValue(m.id, currentZone)}${m.unit}`
                        : `${getCurrentMetricValue(m.id, currentZone)} ${m.unit}`}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>

      <ReportDetailModal
        report={selectedReportForModal}
        zoneName={currentZone?.name || ""}
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
      />

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