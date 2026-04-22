import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Header } from "../components/Header";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Switch } from "../components/ui/switch";
import { Slider } from "../components/ui/slider";
import { Card } from "../components/ui/card";
import { AIAssistant } from "../components/AIAssistant";
import { ZoneSidebar } from "../components/ZoneSidebar";
import { CreateReportModal } from "../components/CreateReportModal";
import { 
  Search, 
  Plus, 
  Minus, 
  Snowflake, 
  AlertTriangle,
  CloudRain,
  Thermometer,
  IceCreamCone,
  MessageCircle,
  Wind,
  Users
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const SERVER_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3000/api';
interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  type: 'snow' | 'ice' | 'alert';
  label: string;
}

interface ZoneData {
  id: string;
  name: string;
  elevation: string;
  temperature: number;
  wind: number;
  avalancheLevel: number;
  isFavorite: boolean;
  coordinates?: [number, number]; // [lng, lat]
  reports: Array<{
    id: string;
    userName: string;
    avatar: string;
    condition: string;
    timestamp: string;
    photo?: string;
  }>;
}

export default function MapViewer() {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkersRef = useRef<L.Marker[]>([]);
  const weatherLayersRef = useRef<{
    temperature: L.Marker[];
    precipitation: L.Marker[];
    wind: L.Marker[];
  }>({
    temperature: [],
    precipitation: [],
    wind: [],
  });

  const [layers, setLayers] = useState({
    temperature: false,
    precipitation: false,
    avalanche: true,
    userReports: true,
    wind: false,
  });

  const [layerOpacity, setLayerOpacity] = useState({
    temperature: 30,
    precipitation: 30,
    wind: 40,
  });

  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ZoneData | null>(null);
  const [favoriteZones, setFavoriteZones] = useState<Set<string>>(new Set<string>([]));
  const [createReportModalOpen, setCreateReportModalOpen] = useState(false);

  /* ========================================================================== */
  /* ESTADO - Dynamic Data Management                                          */
  /* Gestiona los datos obtenidos de la API y su transformación               */
  /* ========================================================================== */
  const [apiZones, setApiZones] = useState<any[]>([]);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [zonesDataState, setZonesDataState] = useState<{ [key: string]: ZoneData }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ========================================================================== */
  /* DATOS ESTÁTICOS - Weather & Meteorological Data                          */
  /* Coordenadas y valores meteorológicos de ejemplo para visualización        */
  /* ========================================================================== */
  const temperatureData = [
    { lat: 42.60, lng: 0.70, temp: -2, color: '#f97316' },
    { lat: 42.70, lng: 0.95, temp: 5, color: '#ef4444' },
    { lat: 42.50, lng: 0.60, temp: -5, color: '#eab308' },
    { lat: 42.65, lng: 0.90, temp: 1, color: '#ea580c' },
  ];

  const precipitationData = [
    { lat: 42.58, lng: 0.65, precip: 15 },
    { lat: 42.52, lng: 0.85, precip: 8 },
    { lat: 42.68, lng: 0.78, precip: 22 },
  ];

  const windData = [
    { lat: 42.72, lng: 0.88, speed: 25, rotation: 45 },
    { lat: 42.52, lng: 0.70, speed: 18, rotation: 90 },
    { lat: 42.67, lng: 0.92, speed: 32, rotation: 12 },
    { lat: 42.58, lng: 0.82, speed: 15, rotation: -45 },
  ];

  // Referencia a los datos de zonas transformadas
  const zonesData = zonesDataState;

  /* ========================================================================== */
  /* EFECTO 1: API Data Fetching & Transformation                             */
  /* Obtiene datos de zonas desde la API y los transforma a formatos locales   */
  /* ========================================================================== */
  useEffect(() => {
    const fetchAndTransformZones = async () => {
      try {
        setLoading(true);

        /* Paso 1: Fetch desde el endpoint de API */
        const apiUrl = `${SERVER_URL}/zones`;
        console.log('Fetching zones from:', apiUrl);

        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const apiResponse = await response.json();
        const zonesFromApi = apiResponse.data;

        if (!Array.isArray(zonesFromApi)) {
          throw new Error('API response format is invalid');
        }

        console.log(`Loaded ${zonesFromApi.length} zones from API`);

        /* Paso 2: Transformar datos a formato MapMarker para renderizado */
        const transformedMarkers: MapMarker[] = zonesFromApi.map((zone: any) => {
            const [lng, lat] = zone.geolocalizacion?.coordinates || [0, 0];
            return {
               id: zone._id, // <--- USA EL ID DE MONGO, NO EL INDEX
               lat: lat,
               lng: lng,
               type: 'snow' as const,
               label: zone.nombre || "Zona sin nombre",
            };
         });

        /* Paso 3: Transformar datos a formato ZoneData para UI sidebar */
        const transformedZonesData: { [key: string]: ZoneData } = {};

        zonesFromApi.forEach((zone: any, index: number) => {
          const [lng, lat] = zone.geolocalizacion?.coordinates || [0, 0];
          const temp = zone.cache_meteo?.datos_crudos?.current?.temperature ?? 0;
          const wind = zone.cache_meteo?.datos_crudos?.current?.wind_speed_10m ?? 0;

          transformedZonesData[zone._id] = {
            id: zone._id, // <--- USA EL ID DE MONGO, NO EL INDEX
            name: zone.nombre || `Zone ${index + 1}`,
            elevation: '1.500m',
            temperature: temp,
            wind: wind,
            avalancheLevel: 2,
            isFavorite: false,
            coordinates: [lng, lat],
            reports: [],
          };
        });

        /* Paso 4: Actualizar estados y limpiar errores previos */
        setApiZones(zonesFromApi);
        setMarkers(transformedMarkers);
        setZonesDataState(transformedZonesData);
        setError(null);

        console.log('✅ Zones loaded and transformed successfully');
      } catch (err) {
        console.error('❌ Error loading zones:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAndTransformZones();
  }, []);

  /* ========================================================================== */
  /* HANDLERS - User Interaction Management                                    */
  /* Funciones para gestionar interacciones del usuario con el mapa y zonas    */
  /* ========================================================================== */

  /**
   * Selecciona una zona para mostrar su información en el sidebar
   * Llama a la API para obtener datos meteorológicos actualizados
   * @param zoneId - ID de posición en el array (1-indexed)
   *** TODO: DECIDIR SI LLAMAR A LA API EN CADA CLICK O NO
   */
  const handleZoneSelect = async (zoneId: string) => {
    try {
      /* Obtener la zona desde apiZones (índice es zoneId - 1) */
      const apiZone = apiZones.find(z => z._id === zoneId);
      
      if (!apiZone) {
        console.warn('Zona no encontrada con índice:', zoneId);
        return;
      }

      /* Obtener el ID de MongoDB (_id) de la zona */
      const mongoDbId = apiZone._id;
      console.log('Zona seleccionada - MongoDB ID:', mongoDbId);

      /* Paso 1: Llamar a la API para obtener datos meteorológicos actualizados */
      const weatherApiUrl = `${SERVER_URL}/zones/${mongoDbId}/weather`;
      console.log('Fetching updated weather from:', weatherApiUrl);

      const weatherResponse = await fetch(weatherApiUrl);
      
      if (!weatherResponse.ok) {
        throw new Error(`Weather API Error: ${weatherResponse.status} ${weatherResponse.statusText}`);
      }

      const weatherData = await weatherResponse.json();
      console.log('Weather data received:', weatherData);

      /* Paso 2: Extraer datos meteorológicos de la respuesta */
      const meteorologicalData = weatherData.datos_crudos?.current || 
                                apiZone.cache_meteo?.datos_crudos?.current || {};
      const temperature = meteorologicalData.temperature ?? 0;
      const wind = meteorologicalData.wind_speed_10m ?? 0;
      const weatherCode = meteorologicalData.weather_code ?? 0;

      /* Extraer coordenadas */
      const [lng, lat] = apiZone.geolocalizacion?.coordinates || [0, 0];

      /* Paso 3: Construir objeto ZoneData con datos actualizados de la API */
      const completeZoneData: ZoneData = {
        id: zoneId,
        name: apiZone.nombre || `Zone ${zoneId}`,
        elevation: '1.500m',
        temperature: temperature,
        wind: wind,
        avalancheLevel: 2,
        isFavorite: favoriteZones.has(zoneId),
        coordinates: [lng, lat],
        reports: [],
      };

      /* Paso 4: Actualizar estado con los datos completos */
      setSelectedZone(completeZoneData);

      console.log('Zona actualizada en sidebar:', {
        nombre: completeZoneData.name,
        mongoDbId: mongoDbId,
        coordenadas: { lat, lng },
        temperatura: temperature,
        viento: wind,
        codigoMeteo: weatherCode,
      });

    } catch (err) {
      console.error('Error al seleccionar zona:', err);
      
      /* Fallback: mostrar zona con datos cargados previamente */
      const zone = zonesData[zoneId];
      if (zone) {
        setSelectedZone({ ...zone, isFavorite: favoriteZones.has(zoneId) });
      }
    }
  };

  /**
   * Cierra el panel de información de la zona seleccionada
   */
  const handleZoneClose = () => {
    setSelectedZone(null);
  };

  /**
   * Alterna el estado favorito de una zona
   * @param zoneId - ID único de la zona
   */
  const handleToggleFavorite = (zoneId: string) => {
    setFavoriteZones(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(zoneId)) {
        newFavorites.delete(zoneId);
      } else {
        newFavorites.add(zoneId);
      }
      return newFavorites;
    });

    if (selectedZone && selectedZone.id === zoneId) {
      setSelectedZone({
        ...selectedZone,
        isFavorite: !selectedZone.isFavorite,
      });
    }
  };

  /* ========================================================================== */
  /* UTILIDADES - Icon & Marker Management                                    */
  /* Funciones para crear iconos personalizados y marcadores de mapa           */
  /* ========================================================================== */

  /**
   * Crea un icono personalizado con color y estilos especificados
   * @param color - Código de color hexadecimal para el icono
   * @returns Objeto de icono de Leaflet personalizado
   */
  const createCustomIcon = (color: string) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
    });
  };

  /**
   * Retorna el icono correspondiente según el tipo de marcador
   * @param type - Tipo de marcador ('snow' | 'ice' | 'alert')
   * @returns Icono de Leaflet personalizado
   */
  const getMarkerIcon = (type: string) => {
    switch (type) {
      case 'snow':
        return createCustomIcon('#3b82f6');
      case 'ice':
        return createCustomIcon('#06b6d4');
      case 'alert':
        return createCustomIcon('#ef4444');
      default:
        return createCustomIcon('#6b7280');
    }
  };

  /**
   * Retorna el SVG correspondiente para mostrar en los popups
   * @param type - Tipo de marcador para seleccionar el icono SVG
   * @returns String con código SVG del icono
   */
  const getIconSvg = (type: string) => {
    const iconMap: { [key: string]: string } = {
      snow: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="m17 20-5-5 5-5"/><path d="m7 4 5 5-5 5"/></svg>',
      ice: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 1 0 6 0V5a3 3 0 0 0-3-3z"/></svg>',
      alert: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>',
    };
    return iconMap[type] || '';
  };

  /* ========================================================================== */
  /* EFECTO 2: Map Initialization                                              */
  /* Inicializa Leaflet map, agrega marcadores y capas meteorológicas         */
  /* Se ejecuta cuando los marcadores están disponibles y loading es falso     */
  /* ========================================================================== */
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || loading || markers.length === 0) return;

    console.log('Initializing map with', markers.length, 'markers');

    /* Crear instancia de mapa Leaflet centrada en la región */
    const map = L.map(mapRef.current, {
      zoomControl: false,
    }).setView([42.65, 0.75], 8);

    /* Agregar capa de tiles de OpenStreetMap */
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    mapInstanceRef.current = map;

    /* Agregar marcadores de zonas al mapa */
    markers.forEach((marker) => {
      const leafletMarker = L.marker([marker.lat, marker.lng], {
        icon: getMarkerIcon(marker.type),
      }).addTo(map);

      const popupContent = `
        <div style="display: flex; align-items: center; gap: 8px;">
          ${getIconSvg(marker.type)}
          <span style="font-weight: 500;">${marker.label}</span>
        </div>
      `;

      leafletMarker.bindPopup(popupContent);

      leafletMarker.on('click', () => {
        handleZoneSelect(marker.id);
      });

      userMarkersRef.current.push(leafletMarker);
    });

    /* Agregar marcadores de temperatura al mapa */
    temperatureData.forEach((data) => {
      const marker = L.marker([data.lat, data.lng], {
        icon: L.divIcon({
          className: 'custom-weather-marker',
          html: `<div style="background-color: ${data.color}cc; color: white; padding: 6px 12px; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); white-space: nowrap;">${data.temp}°C</div>`,
          iconSize: [60, 30],
          iconAnchor: [30, 15],
        }),
      });

      weatherLayersRef.current.temperature.push(marker);
    });

    /* Agregar marcadores de precipitación al mapa */
    precipitationData.forEach((data) => {
      const marker = L.marker([data.lat, data.lng], {
        icon: L.divIcon({
          className: 'custom-weather-marker',
          html: `<div style="background-color: #2563ebcc; color: white; padding: 6px 12px; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); white-space: nowrap;">${data.precip} mm/h</div>`,
          iconSize: [80, 30],
          iconAnchor: [40, 15],
        }),
      });

      weatherLayersRef.current.precipitation.push(marker);
    });

    /* Agregar marcadores de viento al mapa */
    windData.forEach((data) => {
      const marker = L.marker([data.lat, data.lng], {
        icon: L.divIcon({
          className: 'custom-weather-marker',
          html: `
            <div style="background-color: #0d9488cc; color: white; padding: 6px 12px; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); white-space: nowrap; display: flex; align-items: center; gap: 4px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(${data.rotation}deg);">
                <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/>
                <path d="M9.6 4.6A2 2 0 1 1 11 8H2"/>
                <path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>
              </svg>
              <span>${data.speed} km/h</span>
            </div>
          `,
          iconSize: [120, 30],
          iconAnchor: [60, 15],
        }),
      });

      weatherLayersRef.current.wind.push(marker);
    });

    /* Limpieza de recursos cuando se desmonta el componente */
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      userMarkersRef.current = [];
      weatherLayersRef.current.temperature = [];
      weatherLayersRef.current.precipitation = [];
      weatherLayersRef.current.wind = [];
    };
  }, [loading, markers]);

  /* ========================================================================== */
  /* EFECTO 3: Layer Visibility & Opacity Control                              */
  /* Controla la visibilidad y opacidad de capas meteorológicas y marcadores   */
  /* Se actualiza cuando cambian los estados de capas u opacidad              */
  /* ========================================================================== */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    /* Control de visibilidad de marcadores de zonas */
    userMarkersRef.current.forEach((marker, index) => {
      const markerData = markers[index];

      let shouldShow = true;

      if (!layers.userReports) {
        shouldShow = false;
      } else if (!layers.avalanche && markerData.type === 'alert') {
        shouldShow = false;
      }

      if (shouldShow && !map.hasLayer(marker)) {
        marker.addTo(map);
      } else if (!shouldShow && map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });

    /* Control de visibilidad y opacidad de marcadores de temperatura */
    weatherLayersRef.current.temperature.forEach((marker) => {
      if (layers.temperature) {
        if (!map.hasLayer(marker)) {
          marker.addTo(map);
        }
        const element = marker.getElement();
        if (element) {
          element.style.opacity = `${layerOpacity.temperature / 100}`;
        }
      } else if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });

    /* Control de visibilidad y opacidad de marcadores de precipitación */
    weatherLayersRef.current.precipitation.forEach((marker) => {
      if (layers.precipitation) {
        if (!map.hasLayer(marker)) {
          marker.addTo(map);
        }
        const element = marker.getElement();
        if (element) {
          element.style.opacity = `${layerOpacity.precipitation / 100}`;
        }
      } else if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });

    /* Control de visibilidad y opacidad de marcadores de viento */
    weatherLayersRef.current.wind.forEach((marker) => {
      if (layers.wind) {
        if (!map.hasLayer(marker)) {
          marker.addTo(map);
        }
        const element = marker.getElement();
        if (element) {
          element.style.opacity = `${layerOpacity.wind / 100}`;
        }
      } else if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });
  }, [layers, layerOpacity, markers]);

  /**
   * Aumenta el nivel de zoom del mapa
   */
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  /**
   * Disminuye el nivel de zoom del mapa
   */
  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  /* ========================================================================== */
  /* RENDER - Main Component Output                                            */
  /* Estructura principal del componente con mapa, controles y paneles laterales*/
  /* ========================================================================== */
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="relative flex-1 mt-16">
        {/* Estado de carga: Spinner y mensaje de espera */}
        {loading && (
          <div className="absolute inset-0 z-[999] flex items-center justify-center bg-black/50">
            <Card className="p-6">
              <p className="text-center text-gray-700">Cargando zonas...</p>
            </Card>
          </div>
        )}

        {/* Estado de error: Mensaje de error personalizado */}
        {error && (
          <div className="absolute inset-0 z-[999] flex items-center justify-center bg-black/50">
            <Card className="p-6 bg-red-50 border-red-200">
              <p className="text-center text-red-700">Error: {error}</p>
            </Card>
          </div>
        )}

        {/* Contenedor del mapa Leaflet */}
        <div className="absolute inset-0">
          <div ref={mapRef} className="h-full w-full" />
        </div>

        {/* Barra de búsqueda posicionada en la parte superior */}
        <div className="absolute top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md z-[1000]">
          <Card className="p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar zona, pico o ruta..."
                className="pl-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </Card>
        </div>

        {/* Panel de control de capas - Versión Desktop */}
        <div className="absolute top-20 right-4 z-[1000] w-72 hidden md:block max-h-[calc(100vh-7rem)] overflow-y-auto">
          <Card className="p-4">
            <h3 className="font-semibold mb-4 text-gray-900">Capas del Mapa</h3>
            <div className="space-y-5">
              {/* Control de capa: Reportes de Usuarios */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span className="text-sm text-gray-700">Reportes de Usuarios</span>
                  </div>
                  <Switch
                    checked={layers.userReports}
                    onCheckedChange={(checked) =>
                      setLayers({ ...layers, userReports: checked })
                    }
                  />
                </div>
              </div>

              {/* Control de capa: Temperatura con slider de opacidad */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-gray-700">Temperatura</span>
                  </div>
                  <Switch
                    checked={layers.temperature}
                    onCheckedChange={(checked) =>
                      setLayers({ ...layers, temperature: checked })
                    }
                  />
                </div>
                {layers.temperature && (
                  <div className="pl-6 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Opacidad</span>
                      <span className="text-xs text-gray-700">{layerOpacity.temperature}%</span>
                    </div>
                    <Slider
                      value={[layerOpacity.temperature]}
                      onValueChange={(value) =>
                        setLayerOpacity({ ...layerOpacity, temperature: value[0] })
                      }
                      min={10}
                      max={100}
                      step={10}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              {/* Control de capa: Precipitación con slider de opacidad */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CloudRain className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-gray-700">Precipitación</span>
                  </div>
                  <Switch
                    checked={layers.precipitation}
                    onCheckedChange={(checked) =>
                      setLayers({ ...layers, precipitation: checked })
                    }
                  />
                </div>
                {layers.precipitation && (
                  <div className="pl-6 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Opacidad</span>
                      <span className="text-xs text-gray-700">{layerOpacity.precipitation}%</span>
                    </div>
                    <Slider
                      value={[layerOpacity.precipitation]}
                      onValueChange={(value) =>
                        setLayerOpacity({ ...layerOpacity, precipitation: value[0] })
                      }
                      min={10}
                      max={100}
                      step={10}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              {/* Control de capa: Viento con slider de intensidad */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wind className="h-4 w-4 text-teal-500" />
                    <span className="text-sm text-gray-700">Viento</span>
                  </div>
                  <Switch
                    checked={layers.wind}
                    onCheckedChange={(checked) =>
                      setLayers({ ...layers, wind: checked })
                    }
                  />
                </div>
                {layers.wind && (
                  <div className="pl-6 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Intensidad</span>
                      <span className="text-xs text-gray-700">{layerOpacity.wind}%</span>
                    </div>
                    <Slider
                      value={[layerOpacity.wind]}
                      onValueChange={(value) =>
                        setLayerOpacity({ ...layerOpacity, wind: value[0] })
                      }
                      min={10}
                      max={100}
                      step={10}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              {/* Control de capa: Alertas de Aludes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-gray-700">Alertas Aludes</span>
                  </div>
                  <Switch
                    checked={layers.avalanche}
                    onCheckedChange={(checked) =>
                      setLayers({ ...layers, avalanche: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Panel de control de capas - Versión Mobile */}
        <div className="absolute bottom-20 left-4 right-4 z-[1000] md:hidden">
          <Card className="p-3">
            <h3 className="font-semibold mb-3 text-sm text-gray-900">Capas</h3>
            <div className="space-y-3">
              {/* Control de temperatura (mobile) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-orange-500" />
                  <span className="text-xs text-gray-700">Temperatura</span>
                </div>
                <Switch
                  checked={layers.temperature}
                  onCheckedChange={(checked) =>
                    setLayers({ ...layers, temperature: checked })
                  }
                />
              </div>
              {/* Control de precipitación (mobile) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CloudRain className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-gray-700">Precipitación</span>
                </div>
                <Switch
                  checked={layers.precipitation}
                  onCheckedChange={(checked) =>
                    setLayers({ ...layers, precipitation: checked })
                  }
                />
              </div>
              {/* Control de alertas de aludes (mobile) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-xs text-gray-700">Alertas Aludes</span>
                </div>
                <Switch
                  checked={layers.avalanche}
                  onCheckedChange={(checked) =>
                    setLayers({ ...layers, avalanche: checked })
                  }
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Controles de Zoom */}
        <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
          {/* Botón para aumentar zoom */}
          <Button
            size="icon"
            variant="secondary"
            className="bg-white hover:bg-gray-100 shadow-lg"
            onClick={handleZoomIn}
          >
            <Plus className="h-5 w-5" />
          </Button>
          {/* Botón para disminuir zoom */}
          <Button
            size="icon"
            variant="secondary"
            className="bg-white hover:bg-gray-100 shadow-lg"
            onClick={handleZoomOut}
          >
            <Minus className="h-5 w-5" />
          </Button>
        </div>

        {/* Leyenda del Mapa - Información de iconos y capas */}
        <div className="absolute bottom-4 left-4 z-[1000] hidden sm:block">
          <Card className="p-3">
            <h4 className="font-semibold text-xs mb-2 text-gray-900">Leyenda</h4>
            <div className="space-y-1.5">
              {/* Icono: Nieve inestable */}
              <div className="flex items-center gap-2">
                <Snowflake className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-gray-700">Nieve inestable</span>
              </div>
              {/* Icono: Placas de hielo */}
              <div className="flex items-center gap-2">
                <IceCreamCone className="h-4 w-4 text-cyan-500" />
                <span className="text-xs text-gray-700">Placas de hielo</span>
              </div>
              {/* Icono: Alerta de aludes */}
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-xs text-gray-700">Alerta aludes</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Botón flotante del Asistente IA */}
        <div className="absolute top-20 left-4 z-[1000]">
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
            onClick={() => setAiAssistantOpen(true)}
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            <span className="hidden sm:inline">Asistente IA</span>
            <span className="sm:hidden">IA</span>
          </Button>
        </div>

        {/* Panel del Asistente IA */}
        <AIAssistant open={aiAssistantOpen} onOpenChange={setAiAssistantOpen} />

        {/* Panel Lateral de Detalles de Zona */}
        <ZoneSidebar
          zone={selectedZone}
          onClose={handleZoneClose}
          onToggleFavorite={handleToggleFavorite}
          onCreateReport={() => setCreateReportModalOpen(true)}
          onViewAllReports={(dynamicComments) => {
            if (selectedZone) {
              // Pasar comentarios dinámicos como JSON en la URL
              const commentsParam = encodeURIComponent(JSON.stringify(dynamicComments));
              navigate(`/foro?zone=${encodeURIComponent(selectedZone.name)}&id=${selectedZone.id}&elevation=${encodeURIComponent(selectedZone.elevation)}&temp=${selectedZone.temperature}&wind=${selectedZone.wind}&avalanche=${selectedZone.avalancheLevel}&comments=${commentsParam}`);
            }
          }}
        />

        {/* Modal para crear nuevo reporte */}
        <CreateReportModal
          open={createReportModalOpen}
          onOpenChange={setCreateReportModalOpen}
          zoneId={selectedZone?.id || ''}
          zoneName={selectedZone?.name || ''}

        />
      </div>
    </div>
  );
}
