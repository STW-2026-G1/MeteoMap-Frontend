import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Header } from "../components/Header";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Switch } from "../components/ui/switch";
import { Slider } from "../components/ui/slider";
import { Card } from "../components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../components/ui/accordion";
import { AIAssistant } from "../components/AIAssistant";
import { ZoneSidebar } from "../components/ZoneSidebar";
import { CreateReportModal } from "../components/CreateReportModal";
import { useAemetAlerts } from "../components/AemetAlertsLayer";
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

interface UserReport {
  id: string;
  userName: string;
  avatar: string;
  condition: string;
  timestamp: string;
  updatedAt: string;
  isEdited: boolean;
  categoryIcon: string;
  riskType?: string;
  description?: string;
  confirmations?: number;
  denials?: number;
  location?: string;
}

interface ZoneData {
  id: string;
  name: string;
  elevation: string;
  temperature: number;
  wind: number;
  weather: string;
  isFavorite: boolean;
  coordinates?: [number, number]; // [lng, lat]
  reports: UserReport[];
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
    aemetAlerts: true,
  });

  const [layerOpacity, setLayerOpacity] = useState({
    temperature: 30,
    precipitation: 30,
    wind: 40,
    aemetAlerts: 70,
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
         const weatherCode = zone.cache_meteo?.datos_crudos?.current?.codigo_clima ?? 0;

          transformedZonesData[zone._id] = {
            id: zone._id, // <--- USA EL ID DE MONGO, NO EL INDEX
            name: zone.nombre || `Zone ${index + 1}`,
            elevation: '1.500m',
            temperature: temp,
            wind: wind,
            weather: weatherCode,
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
  /* HOOK AEMET: Alertas meteorológicas desde AEMET                            */
  /* Carga y gestiona las alertas de riesgo meteorológico                      */
  /* ========================================================================== */
  const { alerts: aemetAlerts, loading: aemetLoading, fetchAlerts: refreshAemetAlerts } = useAemetAlerts(
    mapInstanceRef.current,
    layers.aemetAlerts,
    layerOpacity.aemetAlerts / 100
  );

  /* ========================================================================== */
  /* EFECTO 2: Cargar zonas favoritas del usuario autenticado                */
  /* Obtiene las zonas marcadas como favoritas desde el backend               */
  /* ========================================================================== */
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const token = localStorage.getItem('meteomap_token');
        if (!token) {
          console.log('No hay usuario autenticado');
          return;
        }

        const response = await fetch(`${SERVER_URL}/user/me/favorites`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const favoriteIds = data.preferencias.map((pref: any) => 
            typeof pref === 'string' ? pref : pref._id
          );
          setFavoriteZones(new Set(favoriteIds));
          console.log('Favoritas cargadas:', favoriteIds);
        }
      } catch (error) {
        console.error('Error cargando favoritas:', error);
      }
    };

    loadFavorites();
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
      const meteorologicalData = weatherData.data?.datos_meteorologicos || 
                                weatherData.data?.cache_meteo?.datos_crudos || {};
      const temperature = meteorologicalData.temperatura ?? 0;
      const wind = meteorologicalData.velocidad_viento ?? 0;
      const weatherCode = meteorologicalData.descripcion ?? 0;

      /* Extraer coordenadas */
      const [lng, lat] = apiZone.geolocalizacion?.coordinates || [0, 0];

      /* Paso 3: Construir objeto ZoneData con datos actualizados de la API */
      const completeZoneData: ZoneData = {
        id: zoneId,
        name: apiZone.nombre || `Zone ${zoneId}`,
        elevation: '1.500m',
        temperature: temperature,
        wind: wind,
        weather: weatherCode,
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
   * Centra el mapa en una alerta AEMET y abre su popup
   * @param alert - Datos de la alerta AEMET
   */
  const handleAemetAlertClick = (alert: any) => {
    if (!mapInstanceRef.current) return;

    const { latitud, longitud } = alert.coordenadas;

    // Validar coordenadas
    if (!latitud || !longitud || isNaN(latitud) || isNaN(longitud)) {
      console.warn('Coordenadas inválidas para la alerta:', alert.id);
      return;
    }

    // Centrar el mapa en la alerta con zoom 12
    mapInstanceRef.current.setView([latitud, longitud], 12, {
      animate: true,
    });

    console.log('📍 Navegando a alerta:', alert.tipo, 'en', alert.zona);
  };

  /**
   * Alterna el estado favorito de una zona
   * Sincroniza con el backend para persistir los cambios
   * @param zoneId - ID único de la zona
   */
  const handleToggleFavorite = async (zoneId: string) => {
    const token = localStorage.getItem('meteomap_token');
    if (!token) {
      alert('Debes iniciar sesión para agregar a favoritos');
      return;
    }

    const isCurrentlyFavorite = favoriteZones.has(zoneId);
    const accion = isCurrentlyFavorite ? 'remove' : 'add';

    // Actualizar estado local inmediatamente (optimistic update)
    setFavoriteZones(prev => {
      const newFavorites = new Set(prev);
      if (isCurrentlyFavorite) {
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

    // Sincronizar con el backend
    try {
      const response = await fetch(`${SERVER_URL}/user/me/favorites`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ zonaId: zoneId, accion: accion })
      });

      if (!response.ok) {
        // Revertir cambios si falla
        setFavoriteZones(prev => {
          const newFavorites = new Set(prev);
          if (isCurrentlyFavorite) {
            newFavorites.add(zoneId);
          } else {
            newFavorites.delete(zoneId);
          }
          return newFavorites;
        });
        alert('Error al actualizar favoritos');
      }
    } catch (error) {
      console.error('Error sincronizando favoritos:', error);
      // Revertir cambios si falla
      setFavoriteZones(prev => {
        const newFavorites = new Set(prev);
        if (isCurrentlyFavorite) {
          newFavorites.add(zoneId);
        } else {
          newFavorites.delete(zoneId);
        }
        return newFavorites;
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
         
           
        </div>

        {/* Panel de control de capas - Versión Mobile */}
        <div className="absolute bottom-20 left-4 right-4 z-[1000] md:hidden">
          <Card className="p-3">
         
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

        {/* Desplegable de Alertas AEMET - Reemplaza la leyenda */}
        {layers.aemetAlerts && (
          <div className="absolute top-20 right-4 z-[1000] w-72 hidden md:block max-h-[calc(100vh-7rem)] sm:block">
            <Card className="bg-white shadow-lg">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="aemet-alerts">
                  <AccordionTrigger className="px-4 py-3 hover:bg-red-50 text-left">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <span>
                        Alertas AEMET {aemetAlerts.length > 0 && `(${aemetAlerts.length})`}
                      </span>
                      {aemetLoading && <span className="ml-auto text-xs animate-spin">⚙️</span>}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    {aemetAlerts.length === 0 ? (
                      <div className="text-sm text-green-700 bg-green-50 p-3 rounded">
                        ✅ No hay alertas meteorológicas activas
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={refreshAemetAlerts}
                          disabled={aemetLoading}
                          className="w-full mb-3 text-xs px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          title="Actualizar alertas"
                        >
                          🔄 {aemetLoading ? 'Actualizando...' : 'Actualizar'}
                        </button>
                        <div className="space-y-2 max-h-[350px] overflow-y-auto">
                          {/* Ordenar alertas por severidad: rojo > amarillo > verde */}
                          {[
                            ...aemetAlerts.filter(a => a.nivelNumerico >= 3), // Rojo: crítico
                            ...aemetAlerts.filter(a => a.nivelNumerico === 2), // Amarillo: warning
                            ...aemetAlerts.filter(a => a.nivelNumerico === 1), // Verde: información
                          ].map((alert) => {
                            // Determinar color del borde y fondo según severidad
                            let borderColor = '#f87171'; // Rojo por defecto
                            let bgColor = '#fee2e2';
                            let hoverColor = '#fecaca';

                            if (alert.nivelNumerico >= 3) {
                              borderColor = '#ef4444'; // Rojo: crítico
                              bgColor = '#fca5a5';
                              hoverColor = '#f87171';
                            } else {
                              borderColor = '#f59e0b'; // Amarillo: warning
                              bgColor = '#fef3c7';
                              hoverColor = '#fde68a';
                            }

                            return (
                              <div
                                key={alert.id}
                                className="p-3 rounded border-l-4 transition-colors cursor-pointer hover:shadow-md"
                                style={{
                                  borderLeftColor: borderColor,
                                  backgroundColor: bgColor,
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverColor)}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = bgColor)}
                                onClick={() => handleAemetAlertClick(alert)}
                              >
                                <div className="flex items-start gap-2">
                                  <span className="text-lg flex-shrink-0">⚠️</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-gray-900">{alert.tipo}</p>
                                    <p className="text-xs text-gray-600">{alert.zona}</p>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{alert.descripcion}</p>
                                    <p className="text-xs font-medium mt-1" style={{ color: borderColor }}>
                                      {alert.nivel}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          </div>
        )}

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
              navigate(`/foro?zone=${encodeURIComponent(selectedZone.name)}&id=${selectedZone.id}&elevation=${encodeURIComponent(selectedZone.elevation)}&temp=${selectedZone.temperature}&wind=${selectedZone.wind}&avalanche=${selectedZone.weather}&comments=${commentsParam}`);
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
