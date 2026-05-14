/**
 * @file MapViewer.tsx
 * @description Página principal con visualización de mapa interactivo que muestra zonas,
 * reportes meteorológicos y permite crear nuevos reportes, favoritos y filtros de zonas.
 * Integra información de tiempo real y gestión de favoritos del usuario.
 * @author MeteoMap Team
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
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
import {
  Search,
  Plus,
  Minus,
  AlertTriangle,
  MessageCircle,
  X,
  MapPin,
  Loader,
  RefreshCw,
  Filter, 
  Check
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { toast } from "sonner";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ZoneData } from "../types/weather";

const SERVER_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3000/api';
interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  color: string;
  nivel?: string;
}

export default function MapViewer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  const [reportRefreshTrigger, setReportRefreshTrigger] = useState(0);

  /* ========================================================================== */
  /* ESTADO - Dynamic Data Management                                          */
  /* Gestiona los datos obtenidos de la API y su transformación               */
  /* ========================================================================== */
  const [apiZones, setApiZones] = useState<any[]>([]);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  // Nuevos estados para las alertas
  const [aemetAlerts, setAemetAlerts] = useState<any[]>([]);
  const [alertMarkers, setAlertMarkers] = useState<MapMarker[]>([]);
  const [aemetLoading, setAemetLoading] = useState(false);
  // Mostrar polígonos en el mapa en lugar de sólo marcadores
  const [showPolygons, setShowPolygons] = useState(false);
  const polygonsLayerRef = useRef<L.GeoJSON[]>([]);

  // Añade también una referencia para los marcadores de alertas en el mapa (junto a userMarkersRef en la línea 45)
  const alertMarkersRef = useRef<L.Marker[]>([]);
  const [zonesDataState, setZonesDataState] = useState<{ [key: string]: ZoneData }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Referencia a los datos de zonas transformadas
  const zonesData = zonesDataState;

  /* ========================================================================== */
  /* ESTADO - Search Zones                                                     */
  /* Gestiona la búsqueda de zonas por nombre                                  */
  /* ========================================================================== */
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<ZoneData[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ========================================================================== */
  /* ESTADO - Gestion de alertas                                                */
  /* Gestiona las funcionalidades del panel de alertas (actulizar,filtrar,...)  */
  /* ========================================================================== */
  const [isRefreshingAlerts, setIsRefreshingAlerts] = useState(false);
  // Por defecto ocultamos las alertas 'verde'
  const [activeAlertLevels, setActiveAlertLevels] = useState<string[]>(['amarillo', 'naranja', 'rojo']);
  
  /**
   * Obtiene el rango de severidad de una alerta basado en su nivel de color
   * @param {string | undefined} nivel - Nivel de alerta (rojo, naranja, amarillo, verde)
   * @returns {number} Rango de severidad (0-4)
   */
  const getAlertSeverityRank = (nivel: string | undefined) => {
    const n = (nivel || '').toLowerCase();
    if (n === 'rojo') return 4;
    if (n === 'naranja') return 3;
    if (n === 'amarillo') return 2;
    if (n === 'verde') return 1;
    return 0;
  };

  /**
   * Genera una clave única para agrupar alertas por zona
   * @param {any} alert - Objeto de alerta
   * @returns {string} Clave de zona de la alerta
   */
  const getAlertZoneKey = (alert: any) => {
    const zone = String(alert?.zona || '').trim().toLowerCase();
    if (zone) return `zone:${zone}`;

    const lat = alert?.coordenadas?.latitud || alert?.geolocalizacion?.coordinates?.[1];
    const lng = alert?.coordenadas?.longitud || alert?.geolocalizacion?.coordinates?.[0];
    if (typeof lat === 'number' && typeof lng === 'number') {
      return `coord:${lat.toFixed(3)}:${lng.toFixed(3)}`;
    }

    return String(alert?.id || alert?._id || 'unknown-zone');
  };

  /**
   * Genera una clave única para el tipo de alerta
   * @param {any} alert - Objeto de alerta
   * @returns {string} Clave del tipo de alerta
   */
  const getAlertTypeKey = (alert: any) => {
    const type = String(alert?.tipo || '').trim().toLowerCase();
    return type || 'sin-tipo';
  };

  const seededUnit = (seed: string) => {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i += 1) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const normalized = (h >>> 0) / 4294967295;
    return normalized;
  };

  // Alertas filtradas por color y deduplicadas por zona+tipo+color, priorizando severidad.
  // Regla: mismo tipo y mismo color en misma zona => prevalece la más severa;
  // mismo tipo con distinto color => se conservan; distinto tipo => se conservan.
  const filteredAlerts = useMemo(() => {
    const filtered = aemetAlerts.filter((alert) => {
      const level = (alert?.nivel || '').toLowerCase();
      return activeAlertLevels.includes(level);
    });

    const bestByZoneAndTypeAndColor = new Map<string, any>();
    filtered.forEach((alert) => {
      const color = alert?.color || mapLevelToColor(alert?.nivel).color;
      const key = `${getAlertZoneKey(alert)}|type:${getAlertTypeKey(alert)}|color:${color}`;
      const current = bestByZoneAndTypeAndColor.get(key);

      if (!current) {
        bestByZoneAndTypeAndColor.set(key, alert);
        return;
      }

      const currentRank = getAlertSeverityRank(current?.nivel);
      const nextRank = getAlertSeverityRank(alert?.nivel);
      if (nextRank > currentRank) {
        bestByZoneAndTypeAndColor.set(key, alert);
      }
    });

    return Array.from(bestByZoneAndTypeAndColor.values()).sort(
      (a, b) => getAlertSeverityRank(b?.nivel) - getAlertSeverityRank(a?.nivel)
    );
  }, [aemetAlerts, activeAlertLevels]);

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
            label: zone.nombre || "Zona sin nombre",
            color: '#3b82f6',
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
  /* EFECTO 2: Obtener Alertas de la API                                          */
  /* ========================================================================== */
  /**
   * Obtiene y actualiza las alertas de AEMET desde el servidor
   * @async
   * @param {boolean} [includePolygons] - Si se incluyen polígonos de alertas
   * @returns {Promise<void>}
   */
  const refreshAemetAlerts = async (includePolygons?: boolean) => {
    try {
      setAemetLoading(true);
      const usePolygons = typeof includePolygons === 'boolean' ? includePolygons : showPolygons;
      const apiUrl = `${SERVER_URL}/aemet-alerts${usePolygons ? '?withPolygons=true' : ''}`; // incluir polígonos si está activado
      console.log('Fetching alerts from:', apiUrl);

      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const apiResponse = await response.json();
      const alertsFromApi = apiResponse.data || apiResponse;

      // const transformedAlertMarkers: MapMarker[] = alertsFromApi.map((alert: any) => {
      //   // Adaptar según tu modelo: alert.coordenadas.latitud o alert.geolocalizacion...
      //   const lat = alert.coordenadas?.latitud || alert.geolocalizacion?.coordinates?.[1] || 0;
      //   const lng = alert.coordenadas?.longitud || alert.geolocalizacion?.coordinates?.[0] || 0;
       

      //   return {
      //     id: alert.id,
      //     lat: lat,
      //     lng: lng,
      //     label: alert.tipo || "Alerta",
      //     color: alert.color || '#f59e0b',
      //   };
      // });

      setAemetAlerts(alertsFromApi);
      // setAlertMarkers(transformedAlertMarkers);
    } catch (err) {
      console.error('❌ Error loading alerts:', err);
    } finally {
      setAemetLoading(false);
    }
  };

  useEffect(() => {
    refreshAemetAlerts();
  }, []);

  // Este efecto transforma las alertas priorizadas al formato de marcadores
useEffect(() => {
    const groupedByZone = new Map<string, any[]>();
    filteredAlerts.forEach((alert: any) => {
      const zoneKey = getAlertZoneKey(alert);
      const bucket = groupedByZone.get(zoneKey) || [];
      bucket.push(alert);
      groupedByZone.set(zoneKey, bucket);
    });

    const transformed: MapMarker[] = [];

    groupedByZone.forEach((zoneAlerts) => {
      const typeCounts = zoneAlerts.reduce((acc: Record<string, number>, alert: any) => {
        const typeKey = getAlertTypeKey(alert);
        acc[typeKey] = (acc[typeKey] || 0) + 1;
        return acc;
      }, {});

      zoneAlerts.forEach((alert: any, index: number) => {
        const baseLat = alert.coordenadas?.latitud || alert.geolocalizacion?.coordinates?.[1] || 0;
        const baseLng = alert.coordenadas?.longitud || alert.geolocalizacion?.coordinates?.[0] || 0;

        let lat = baseLat;
        let lng = baseLng;

        // Si hay varios tipos en la misma zona, desplazamos sólo los tipos que no se repiten.
        // Si el mismo tipo aparece varias veces (aunque cambie el color), se deja sin jitter.
        const typeKey = getAlertTypeKey(alert);
        const shouldJitter = Object.keys(typeCounts).length > 1 && typeCounts[typeKey] === 1;

        if (shouldJitter) {
          const seedBase = `${alert.id || alert._id || ''}|${getAlertZoneKey(alert)}|${getAlertTypeKey(alert)}|${index}`;
          const angleBase = (index / zoneAlerts.length) * Math.PI * 2;
          const angleNoise = (seededUnit(`${seedBase}:angle`) - 0.5) * 0.35;
          const angle = angleBase + angleNoise;
          const radius = 0.006 + seededUnit(`${seedBase}:radius`) * 0.0025;
          lat = baseLat + Math.sin(angle) * radius;
          lng = baseLng + Math.cos(angle) * radius;
        }

        transformed.push({
          id: alert.id || alert._id,
          lat,
          lng,
          label: alert.tipo || "Alerta",
          color: mapLevelToColor(alert.nivel).color,
          nivel: alert.nivel,
        });
      });
    });

  setAlertMarkers(transformed);
}, [filteredAlerts]);

  /* ========================================================================== */
  /* EFECTO 3: Cargar zonas favoritas del usuario autenticado                */
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
  /* EFECTO 4: Cleanup para timeouts de búsqueda                               */
  /* Limpia el timeout cuando se desmonta el componente o cuando cambia query  */
  /* ========================================================================== */
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  /* ========================================================================== */
  /* EFECTO 5: Procesar parámetro 'zone' de URL (ej: ?zone=123abc)           */
  /* Si viene del perfil o del buscador, hace zoom a esa zona automáticamente */
  /* ========================================================================== */
  useEffect(() => {
    const zoneId = searchParams.get('zone');

    if (!zoneId) {
      return;
    }
    
    // Intentar hacer zoom si todo está listo
    if (mapReady && mapInstanceRef.current && zonesDataState[zoneId]) {
      const baseZone = zonesDataState[zoneId];
      console.log(`✓ Zona encontrada: ${baseZone.name}`);
      if (!baseZone.coordinates) {
        return;
      }

      const [lng, lat] = baseZone.coordinates;
      console.log(`📍 Coordenadas: lat=${lat}, lng=${lng}`);
      
      // Hacer zoom suave a las coordenadas
      mapInstanceRef.current.flyTo([lat, lng], 10, {
        duration: 1.5,
        animate: true,
      });
      
      // Seleccionar la zona para mostrar en sidebar
      setTimeout(async () => {
        // Obtener datos meteorológicos actualizados (igual que handleZoneSelect)
        try {
          const weatherApiUrl = `${SERVER_URL}/zones/${zoneId}/weather`;
          
          const weatherResponse = await fetch(weatherApiUrl);
          
          if (weatherResponse.ok) {
            const weatherData = await weatherResponse.json();
            const meteorologicalData = weatherData.data?.datos_meteorologicos ||
              weatherData.data?.cache_meteo?.datos_crudos || {};
            
            const temperature = meteorologicalData.temperatura ?? 0;
            const wind = meteorologicalData.velocidad_viento ?? 0;
            const weatherCode = meteorologicalData.descripcion ?? 0;
            
            const updatedZone: ZoneData = {
              ...baseZone,
              temperature,
              wind,
              weather: weatherCode,
              isFavorite: favoriteZones.has(zoneId),
            };
            
            setSelectedZone(updatedZone);
          } else {
            // Si falla el fetch, usar datos del state
            setSelectedZone({ ...baseZone, isFavorite: favoriteZones.has(zoneId) });
          }
        } catch (err) {
          console.error('❌ Error obteniendo datos meteorológicos:', err);
          // Fallback: usar datos del state
          setSelectedZone({ ...baseZone, isFavorite: favoriteZones.has(zoneId) });
        }
        
        // Limpiar el parámetro de la URL para evitar repetir el zoom
        window.history.replaceState({}, '', window.location.pathname);
      }, 500);
      
      return;
    }
    
    // Si no está listo, mostrar qué falta
    if (!mapReady) console.log('   - Mapa no inicializado');
    if (!zonesDataState[zoneId]) console.log('   - Zona no encontrada en state');
    
  }, [searchParams, zonesDataState, mapReady, favoriteZones]);

  /* ========================================================================== */
  /* HANDLERS - User Interaction Management                                    */
  /* Funciones para gestionar interacciones del usuario con el mapa y zonas    */
  /* ========================================================================== */

  /**
   * Selecciona una zona y obtiene sus datos meteorológicos actualizados
   * @async
   * @param {string} zoneId - ID de la zona a seleccionar
   * @returns {Promise<void>}
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
        coordinates: [lng, lat] as [number, number],
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
   * @returns {void}
   */
  const handleZoneClose = () => {
    setSelectedZone(null);
  };

  /**
   * Centra el mapa en una alerta AEMET y abre su popup de información
   * @param {any} alert - Datos de la alerta AEMET
   * @returns {void}
   */
  const handleAemetAlertClick = (alert: any) => {
    if (!mapInstanceRef.current) return;

    const latitud = alert?.coordenadas?.latitud ?? alert?.geolocalizacion?.coordinates?.[1];
    const longitud = alert?.coordenadas?.longitud ?? alert?.geolocalizacion?.coordinates?.[0];

    // Validar coordenadas
    if (typeof latitud !== 'number' || typeof longitud !== 'number' || isNaN(latitud) || isNaN(longitud)) {
      console.warn('Coordenadas inválidas para la alerta:', alert.id);
      return;
    }

    // Centrar el mapa en la alerta con zoom 9
    mapInstanceRef.current.setView([latitud+0.2, longitud], 9, {
      animate: true,
    });

    const popupHtml = buildAemetAlertPopupHtml(alert, mapLevelToColor(alert?.nivel).color);
    L.popup({ maxWidth: 320, closeButton: true, autoPan: true })
      .setLatLng([latitud, longitud])
      .setContent(popupHtml)
      .openOn(mapInstanceRef.current);

    console.log('Navegando a alerta:', alert.tipo, 'en', alert.zona);
  };

  /**
   * Gestiona la funcionalidad del boton de actulizar de alertas
   */
  const handleRefreshAemet = async () => {
    try {
      setIsRefreshingAlerts(true);
      const response = await fetch(`${SERVER_URL}/aemet-alerts?refresh=true${showPolygons ? '&withPolygons=true' : ''}`);
      const result = await response.json();
      
      if (result.status === "success") {
        // Suponiendo que tu estado de alertas se llama 'aemetAlerts'
        // Si usas otro nombre en el set, cámbialo aquí:
        setAemetAlerts(result.data); 
        console.log("Alertas actualizadas forzosamente");
      }
    } catch (error) {
      console.error("Error al refrescar alertas:", error);
    } finally {
      setIsRefreshingAlerts(false);
    }
  };
  /**
   * Alterna el estado de un filtro(color) de las alertas
   * @param string - Filtro/color a alternar
   */
  const toggleAlertLevel = (level: string) => {
  setActiveAlertLevels(prev => 
    prev.includes(level) 
      ? prev.filter(l => l !== level) 
      : [...prev, level]
    );
  };

  /**
   * Alterna el estado favorito de una zona
   * Sincroniza con el backend para persistir los cambios
   * @param zoneId - ID único de la zona
   */
  const handleToggleFavorite = async (zoneId: string) => {
    const token = localStorage.getItem('meteomap_token');
    if (!token) {
      toast.error('Debes iniciar sesión para agregar a favoritos');
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
        toast.error('Error al actualizar favoritos');
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
      html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });
  };

  // Mapear nivel -> color y opacidades para polígonos
  const mapLevelToColor = (nivel: string | undefined) => {
    const n = (nivel || '').toLowerCase();
    switch (n) {
      case 'verde':
        return { color: '#86efac', fillOpacity: 0.12, weight: 1.5, opacity: 0.55 };
      case 'amarillo':
        return { color: '#fbbf24', fillOpacity: 0.24, weight: 2, opacity: 0.75 };
      case 'naranja':
        return { color: '#f97316', fillOpacity: 0.42, weight: 3, opacity: 0.95 };
      case 'rojo':
        return { color: '#ef4444', fillOpacity: 0.55, weight: 4, opacity: 1 };
      default:
        return { color: '#f59e0b', fillOpacity: 0.3, weight: 2, opacity: 0.85 };
    }
  };

  const getAlertPaneName = (nivel: string | undefined) => {
    const n = (nivel || '').toLowerCase();
    switch (n) {
      case 'verde':
        return 'alert-pane-verde';
      case 'amarillo':
        return 'alert-pane-amarillo';
      case 'naranja':
        return 'alert-pane-naranja';
      case 'rojo':
        return 'alert-pane-rojo';
      default:
        return 'alert-pane-default';
    }
  };

  const getAlertPointPaneName = (nivel: string | undefined) => {
    const n = (nivel || '').toLowerCase();
    switch (n) {
      case 'verde':
        return 'alert-point-pane-verde';
      case 'amarillo':
        return 'alert-point-pane-amarillo';
      case 'naranja':
        return 'alert-point-pane-naranja';
      case 'rojo':
        return 'alert-point-pane-rojo';
      default:
        return 'alert-point-pane-default';
    }
  };

  const ensureAlertPanes = (map: L.Map) => {
    const panes = [
      { name: 'alert-pane-verde', zIndex: 410 },
      { name: 'alert-pane-amarillo', zIndex: 420 },
      { name: 'alert-pane-naranja', zIndex: 430 },
      { name: 'alert-pane-rojo', zIndex: 440 },
      { name: 'alert-pane-default', zIndex: 425 },
    ];

    panes.forEach(({ name, zIndex }) => {
      let pane = map.getPane(name);
      if (!pane) {
        pane = map.createPane(name);
      }
      pane.style.zIndex = String(zIndex);
      pane.style.pointerEvents = 'auto';
    });
  };

  const ensureAlertPointPanes = (map: L.Map) => {
    const panes = [
      { name: 'alert-point-pane-verde', zIndex: 510 },
      { name: 'alert-point-pane-amarillo', zIndex: 520 },
      { name: 'alert-point-pane-naranja', zIndex: 530 },
      { name: 'alert-point-pane-rojo', zIndex: 540 },
      { name: 'alert-point-pane-default', zIndex: 525 },
    ];

    panes.forEach(({ name, zIndex }) => {
      let pane = map.getPane(name);
      if (!pane) {
        pane = map.createPane(name);
      }
      pane.style.zIndex = String(zIndex);
      pane.style.pointerEvents = 'auto';
    });
  };

  const buildAemetAlertPopupHtml = (alert: any, colorOverride?: string) => {
    const color = colorOverride || mapLevelToColor(alert?.nivel).color;
    const alertTimeOptions: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Madrid',
      timeZoneName: 'short',
    };

    const inicioStr = alert?.validez_inicio
      ? new Date(alert.validez_inicio).toLocaleString('es-ES', alertTimeOptions)
      : 'Desconocida';
    const finStr = alert?.validez_fin
      ? new Date(alert.validez_fin).toLocaleString('es-ES', alertTimeOptions)
      : 'Desconocida';

    return `
      <div style="min-width: 240px; max-width: 300px; max-height: 380px; overflow-y: auto; font-family: sans-serif; padding-right: 4px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; border-bottom: 2px solid ${color}; padding-bottom: 4px;">
          <div style="width: 16px; height: 16px; border-radius: 50%; background-color: ${color};"></div>
          <span style="font-weight: bold; text-transform: uppercase; color: ${color}; letter-spacing: 0.5px;">
            NIVEL ${alert?.nivel || 'DESCONOCIDO'}
          </span>
        </div>

        <div style="margin-bottom: 10px;">
          <div style="font-weight: 800; font-size: 1.1em; margin-bottom: 4px; color: #1f2937; line-height: 1.2;">
            ${alert?.tipo || 'Alerta Meteorológica'}
          </div>
          <div style="color: #4b5563; font-size: 0.9em; margin-bottom: 8px;">
            📍 <strong>${alert?.zona || 'Zona no especificada'}</strong>
          </div>

          <div style="font-size: 0.9em; line-height: 1.4; background: #f3f4f6; padding: 8px; border-radius: 6px; border-left: 4px solid ${color}; color: #374151;">
            ${alert?.descripcion || 'Sin descripción disponible.'}
          </div>
        </div>

        ${alert?.instrucciones && alert.instrucciones !== 'No hay instrucciones adicionales.' ? `
          <div style="margin-bottom: 10px; background: #fffbeb; border: 1px solid #fef3c7; padding: 8px; border-radius: 6px;">
            <span style="color: #92400e; font-size: 0.85em; font-weight: bold; display: block; margin-bottom: 3px;">⚠️ Instrucciones oficiales:</span>
            <span style="color: #92400e; font-size: 0.85em; line-height: 1.3; display: block;">${alert.instrucciones}</span>
          </div>
        ` : ''}

        <div style="font-size: 0.85em; background: #f8fafc; padding: 8px; border-radius: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; color: #475569; margin-bottom: 10px; border: 1px solid #e2e8f0;">
          <div style="grid-column: span 2;"><strong>Probabilidad:</strong> <span style="float: right;">${alert?.probabilidad || 'N/A'}</span></div>
          <div style="grid-column: span 2;"><strong>Certidumbre:</strong> <span style="float: right;">${alert?.certidumbre || 'N/A'}</span></div>
          <div style="grid-column: span 2;"><strong>Urgencia:</strong> <span style="float: right;">${alert?.urgencia || 'N/A'}</span></div>
        </div>

        <div style="font-size: 0.8em; border-top: 1px solid #e2e8f0; padding-top: 8px; color: #64748b; display: grid; gap: 4px;">
          <div style="display: flex; justify-content: space-between;"><strong>Inicio:</strong> <span>${inicioStr}</span></div>
          <div style="display: flex; justify-content: space-between;"><strong>Fin:</strong> <span>${finStr}</span></div>

          ${alert?.enlace ? `
            <a href="${alert.enlace}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: none; font-weight: bold; margin-top: 8px; display: block; text-align: center; background: #eff6ff; padding: 6px; border-radius: 4px;">
              Ver aviso en AEMET ↗
            </a>
          ` : ''}
        </div>
      </div>
    `;
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

    ensureAlertPanes(map);
    ensureAlertPointPanes(map);

    mapInstanceRef.current = map;
    setMapReady(true);

/* Agregar marcadores de zonas al mapa */
    markers.forEach((marker) => {
      const leafletMarker = L.marker([marker.lat, marker.lng], {
        icon: createCustomIcon(marker.color), // <-- Pasamos directamente el color
      }).addTo(map);

      // Popup para zonas
      const popupContent = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${marker.color};"></div>
          <span style="font-weight: 500;">${marker.label}</span>
        </div>
      `;

      leafletMarker.bindPopup(popupContent);
      leafletMarker.on('click', () => handleZoneSelect(marker.id));
      userMarkersRef.current.push(leafletMarker);
    });

    /* Agregar marcadores de alertas al mapa */
    alertMarkers.forEach((marker) => {
      const leafletMarker = L.marker([marker.lat, marker.lng], {
        icon: createCustomIcon(marker.color), // <-- Pasamos directamente el color
        pane: getAlertPointPaneName(marker.nivel),
      }).addTo(map);

      // Popup limpio sin el getIconSvg
      const popupContent = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${marker.color};"></div>
            <span style="font-weight: 500;">${marker.label}</span>
          </div>
        `;

      leafletMarker.bindPopup(popupContent);
      leafletMarker.on('click', () => {
        const fullAlert = aemetAlerts.find(a => (a.id) === marker.id);
        if (fullAlert) handleAemetAlertClick(fullAlert);
      });

      alertMarkersRef.current.push(leafletMarker);
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
  /* EFECTO 3: Construir marcadores de Alertas en memoria                       */
  /* ========================================================================== */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    // 1. Limpiar los marcadores antiguos por completo
    alertMarkersRef.current.forEach(marker => marker.remove());
    alertMarkersRef.current = [];

    // Si estamos mostrando polígonos, no añadimos marcadores de alerta
    if (showPolygons) {
      // Limpieza de capa de polígonos existente
      polygonsLayerRef.current.forEach(layer => layer.remove());
      polygonsLayerRef.current = [];

      const features: any[] = [];
      filteredAlerts.forEach((alert) => {
        if (!alert.poligono_geojson) return;
        const nivel = (alert.nivel || '').toLowerCase();
        const mapped = mapLevelToColor(nivel);
        features.push({
          type: 'Feature',
          properties: {
            id: alert.id || alert._id,
            color: mapped.color,
            nivel: nivel,
            nivelNumerico: alert.nivelNumerico || 0,
            tipo: alert.tipo,
            zona: alert.zona,
            descripcion: alert.descripcion,
            validez_inicio: alert.validez_inicio,
            validez_fin: alert.validez_fin,
            instrucciones: alert.instrucciones,
            enlace: alert.enlace,
          },
          geometry: alert.poligono_geojson,
        });
      });

      // Orden de pintado: menor severidad primero, mayor severidad arriba
      features.sort((a: any, b: any) => {
        const sa = getAlertSeverityRank(a?.properties?.nivel);
        const sb = getAlertSeverityRank(b?.properties?.nivel);
        return sa - sb;
      });

      if (features.length > 0) {
        const featuresByPane = features.reduce((acc: Record<string, any[]>, feature) => {
          const paneName = getAlertPaneName(feature?.properties?.nivel);
          if (!acc[paneName]) acc[paneName] = [];
          acc[paneName].push(feature);
          return acc;
        }, {});

        const severityOrder = ['verde', 'amarillo', 'naranja', 'rojo', 'default'];
        const renderedLayers: L.GeoJSON[] = [];

        severityOrder.forEach((nivel) => {
          const paneName = getAlertPaneName(nivel);
          const paneFeatures = featuresByPane[paneName];
          if (!paneFeatures || paneFeatures.length === 0) return;

          const gj = L.geoJSON({ type: 'FeatureCollection', features: paneFeatures } as any, {
            pane: paneName,
            style: (feature: any) => {
              const p = feature.properties || {};
              const lvlStyle = mapLevelToColor(p.nivel);
              return {
                color: lvlStyle.color,
                weight: lvlStyle.weight,
                opacity: lvlStyle.opacity,
                fillColor: lvlStyle.color,
                fillOpacity: lvlStyle.fillOpacity,
                lineJoin: 'round',
                lineCap: 'round',
              };
            },
            onEachFeature: (feature: any, layer: any) => {
              layer.on({
                mouseover: (e: any) => {
                  const target = e.target;
                  const p = feature.properties || {};
                  const base = mapLevelToColor(p.nivel);
                  target.setStyle({
                    weight: Math.max(base.weight),
                    color: '#424345',
                    opacity: 1,
                    fillOpacity: Math.min(base.fillOpacity + 0.28, 0.75),
                  });
                  if (target.bringToFront) target.bringToFront();
                },
                mouseout: (e: any) => {
                  const target = e.target;
                  const p = feature.properties || {};
                  const base = mapLevelToColor(p.nivel);
                  target.setStyle({
                    color: base.color,
                    weight: base.weight,
                    opacity: base.opacity,
                    fillOpacity: base.fillOpacity,
                  });
                },
                click: (e: any) => {
                  const props = feature.properties;
                  const fullAlert = aemetAlerts.find((a) => (a.id || a._id) === props.id);
                  const popupHtml = buildAemetAlertPopupHtml(fullAlert || props, props.color);

                  if (mapInstanceRef.current) {
                    const bounds = e.target.getBounds ? e.target.getBounds() : null;
                    if (bounds) {
                      mapInstanceRef.current.fitBounds(bounds.pad(0.2), {
                        paddingTopLeft: [0, 160],
                        paddingBottomRight: [0, 40],
                      });
                    }
                  }
                  layer.bindPopup(popupHtml, {
                      maxWidth: 320,
                  }).openPopup();
                }
              });
            }
          }).addTo(map);

          renderedLayers.push(gj as L.GeoJSON);
        });

        polygonsLayerRef.current = renderedLayers;

        return; // no crear marcadores
      }

      return; // no crear marcadores
    }

    // Si venimos de modo polígonos, asegurarnos de limpiar la capa de polígonos
    if (!showPolygons && polygonsLayerRef.current.length > 0) {
      polygonsLayerRef.current.forEach(layer => layer.remove());
      polygonsLayerRef.current = [];
    }

    // 2. Crear los nuevos marcadores en memoria
    alertMarkers.forEach((marker) => {
      

      const leafletMarker = L.marker([marker.lat, marker.lng], { 
        icon: createCustomIcon(marker.color),
        pane: getAlertPointPaneName(marker.nivel),
      });

      // Buscamos la alerta completa en el estado usando el ID
      const fullAlert = aemetAlerts.find(a => (a.id || a._id) === marker.id);

      leafletMarker.on('click', () => {
        if (fullAlert) handleAemetAlertClick(fullAlert);
      });

      // 3. Construir el contenido del Popup
      let popupContent = '<div style="padding: 10px;">Cargando información...</div>';

      if (fullAlert) {
        popupContent = buildAemetAlertPopupHtml(fullAlert, marker.color);
      }

      // Añadimos el popup al marcador
      leafletMarker.bindPopup(popupContent, {
        maxWidth: 320,
      });

      // Si la capa está activa desde el principio, lo pintamos ya
      if (layers.aemetAlerts) {
        leafletMarker.addTo(map);
        const element = leafletMarker.getElement();
        if (element) element.style.opacity = `${layerOpacity.aemetAlerts / 100}`;
      }

      // Guardamos la referencia
      alertMarkersRef.current.push(leafletMarker);
    });

  }, [alertMarkers, aemetAlerts, filteredAlerts, layers.aemetAlerts, activeAlertLevels]);

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

  /**
   * Busca zonas por nombre. Intenta primero con la API, si falla busca localmente.
   * @param query - Término de búsqueda
   */
  const handleSearchZones = async (query: string) => {
    setSearchQuery(query);

    // Si la búsqueda tiene menos de 2 caracteres, limpiar resultados
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);

    try {
      // Intentar buscar en la API con timeout de 2 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const apiUrl = `${SERVER_URL}/zones/search?query=${encodeURIComponent(query)}`;
      const response = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const results = (data.data || []).map((zone: any) => {
          const [lng, lat] = zone.geolocalizacion?.coordinates || [0, 0];

          const currentData = zone.cache_meteo?.current?.datos_crudos;

          return {
            id: zone._id,
            name: zone.nombre || 'Zona sin nombre',
            elevation: '1.500m', // O zone.altitud si lo tienes
            temperature: currentData?.temperatura ?? 0,
            wind: currentData?.velocidad_viento ?? 0,
            weather: currentData?.descripcion ?? 0,
            isFavorite: favoriteZones.has(zone._id),
            coordinates: [lng, lat] as [number, number],
            reports: [],
          };
        }).slice(0, 10);

        setSearchResults(results);
        setShowSearchResults(true);
      } else {
        throw new Error('API search failed');
      }
    } catch (err) {
      // Fallback: buscar localmente filtrando apiZones
      console.log('API search failed, using local search:', err);

      const localResults = apiZones
        .filter(zone =>
          zone.nombre?.toLowerCase().includes(query.toLowerCase())
        )
        .map(zone => {
          const [lng, lat] = zone.geolocalizacion?.coordinates || [0, 0];
          return {
            id: zone._id,
            name: zone.nombre || 'Zona sin nombre',
            elevation: '1.500m',
            temperature: zone.cache_meteo?.datos_crudos?.current?.temperature ?? 0,
            wind: zone.cache_meteo?.datos_crudos?.current?.wind_speed_10m ?? 0,
            weather: zone.cache_meteo?.datos_crudos?.current?.descripcion ?? 0,
            isFavorite: favoriteZones.has(zone._id),
            coordinates: [lng, lat] as [number, number],
            reports: [],
          };
        })
        .slice(0, 10);

      setSearchResults(localResults);
      setShowSearchResults(true);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Selecciona una zona desde los resultados de búsqueda
   * Hace zoom al mapa, centra y cierra el dropdown
   * @param zone - Zona seleccionada
   */
  const handleSelectZone = (zone: ZoneData) => {
    setSelectedZone(zone);

    // Hacer zoom suave a las coordenadas (nivel 10)
    if (mapInstanceRef.current && zone.coordinates) {
      const [lng, lat] = zone.coordinates;
      mapInstanceRef.current.flyTo([lat, lng], 10, {
        duration: 1.5,
        animate: true,
      });
    }

    // Cerrar dropdown y limpiar búsqueda
    setShowSearchResults(false);
    setSearchQuery('');
    setSearchResults([]);
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

        {/* Leyenda y toggle de polígonos */}
        <div className="absolute bottom-6 right-6 z-[900] w-64 hidden md:block">
          <Card className="bg-white shadow-md p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="font-semibold text-sm">Leyenda</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 mr-2">Areas</span>
                <Switch checked={showPolygons} onCheckedChange={async (val) => {
                  const next = Boolean(val);
                  setShowPolygons(next);
                  try { await refreshAemetAlerts(next); } catch (e) { console.error(e); }
                }} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
                <span>Azul: zona</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#86efac', border: '1px solid rgba(0,0,0,0.06)' }} />
                <span>Verde: información</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#fbbf24' }} />
                <span>Amarillo: Aviso de peligro bajo</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#f97316' }} />
                <span>Naranja: Aviso de peligro moderado</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#ef4444' }} />
                <span>Rojo: Aviso de peligro crítico</span>
              </div>
            </div>
          </Card>
        </div>

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
                placeholder="Introduzca la zona que desea buscar..."
                value={searchQuery}
                onChange={(e) => handleSearchZones(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                className="pl-10 pr-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                data-cy="zone-search-input"
              />
              {isSearching ? (
                <Loader className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
              ) : searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowSearchResults(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}

              {/* Dropdown de resultados de búsqueda */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-[1001] max-h-80 overflow-y-auto">
                  {searchResults.map((zone, idx) => (
                    <div key={zone.id}>
                      <button
                        onClick={() => handleSelectZone(zone)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-start gap-3 border-0"
                        data-cy="zone-search-result"
                      >
                        <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{zone.name}</div>
                          <div className="text-sm text-gray-500 flex gap-2">
                            <span>📍 {zone.coordinates?.[1]?.toFixed(2)}, {zone.coordinates?.[0]?.toFixed(2)}</span>
                          </div>
                        </div>
                      </button>
                      {idx < searchResults.length - 1 && <div className="border-t border-gray-100" />}
                    </div>
                  ))}
                </div>
              )}

              {/* Mensaje cuando no hay resultados */}
              {showSearchResults && searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-[1001] px-4 py-3 text-sm text-gray-500 text-center">
                  No se encontraron zonas
                </div>
              )}
            </div>
          </Card>
        </div>


        {/* Controles de Zoom */}
        <div className="absolute bottom-6 left-4 z-[1000] flex flex-col gap-2">
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
          <div className="absolute top-20 right-4 z-[1000] w-85 hidden md:block max-h-[calc(100vh-7rem)] sm:block">
            <Card className="bg-white shadow-lg">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="aemet-alerts">
                  {/* AHORA LOS BOTONES ESTÁN DENTRO DEL TRIGGER */}
                  <AccordionTrigger className="px-4 py-3 hover:bg-red-50 text-left">
                    <div className="flex items-center justify-between w-full">
                      {/* Título a la izquierda */}
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <span>
                          Alertas AEMET {filteredAlerts.length > 0 && `(${filteredAlerts.length})`}
                        </span>
                      </div>

                      {/* Botones a la derecha (stopPropagation evita que se cierre el acordeón) */}
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        
                        {/* DESPLEGABLE DE FILTROS */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:bg-white hover:text-slate-900 transition-colors duration-200 cursor-pointer"
                              title="Filtrar por nivel de riesgo"
                            >
                              <Filter className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-white">
                            <DropdownMenuLabel>Filtrar por riesgo</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {[
                              { id: 'verde', label: 'Nivel Verde', color: 'bg-emerald-500' },
                              { id: 'amarillo', label: 'Nivel Amarillo', color: 'bg-yellow-400' },
                              { id: 'naranja', label: 'Nivel Naranja', color: 'bg-orange-500' },
                              { id: 'rojo', label: 'Nivel Rojo', color: 'bg-red-600' }
                            ].map((level) => (
                              <DropdownMenuCheckboxItem
                                key={level.id}
                                checked={activeAlertLevels.includes(level.id)}
                                onCheckedChange={() => toggleAlertLevel(level.id)}
                                onSelect={(e) => e.preventDefault()}
                                className="cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`h-2 w-2 rounded-full ${level.color}`} />
                                  {level.label}
                                </div>
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* BOTÓN DE REFRESCAR */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:bg-white hover:text-slate-900 transition-colors duration-200 cursor-pointer"
                          onClick={() => handleRefreshAemet()}
                          disabled={isRefreshingAlerts}
                          title="Actualizar alertas"
                        >
                          <RefreshCw className={`h-4 w-4 ${isRefreshingAlerts ? 'animate-spin text-slate-500' : ''}`} />
                        </Button>
                        {/* (Toggle moved to legend card below) */}
                      </div>
                    </div>
                  </AccordionTrigger>

          <AccordionContent className="px-4 pb-4">
            {/* ... resto de tu contenido ... */}
            {filteredAlerts.length === 0 ? (
              <div className="text-sm text-green-700 bg-green-50 p-3 rounded">
                ✅ No hay alertas meteorológicas activas
              </div>
              ) : (
                      <>                                              
                        <div className="space-y-2 max-h-[350px] overflow-y-auto">
                          {/* Ordenar alertas por severidad: rojo > narnaja > amarillo > verde */}
                          {[
                            ...filteredAlerts.filter(a => a.nivelNumerico >= 3), // Rojo: crítico
                            ...filteredAlerts.filter(a => a.nivelNumerico === 2), // Naranja: warning
                            ...filteredAlerts.filter(a => a.nivelNumerico === 1), // amarillo: moderado
                            ...filteredAlerts.filter(a => a.nivelNumerico === 0), // verde: info
                          ].map((alert) => {
                            // Determinar color base según la API
                            const borderColor = alert.color || '#f59e0b'; 
                            
                            // Mantenemos colores de fondo tenues como decoración
                            let bgColor = '#f3f4f6';
                            let hoverColor = '#e5e7eb';

                            if (alert.nivelNumerico >= 3) {
                              bgColor = '#fca5a5'; hoverColor = '#f87171';
                            } else if (alert.nivelNumerico == 2) {
                              bgColor = '#fee2e2'; hoverColor = '#fecaca';
                            } else if (alert.nivelNumerico == 1) {
                              bgColor = '#fef3c7'; hoverColor = '#fde68a';
                            } else if (alert.nivelNumerico == 0){
                               bgColor = '#e9fec7'; hoverColor = '#26b94b';
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
          reportRefreshTrigger={reportRefreshTrigger}
        />

        {/* Modal para crear nuevo reporte */}
        <CreateReportModal
          open={createReportModalOpen}
          onOpenChange={setCreateReportModalOpen}
          zoneId={selectedZone?.id || ''}
          zoneName={selectedZone?.name || ''}
          onReportCreated={() => setReportRefreshTrigger(prev => prev + 1)}
        />
      </div>
    </div>
  );
}
