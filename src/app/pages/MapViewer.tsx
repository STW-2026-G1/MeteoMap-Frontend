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
  // Nuevos estados para las alertas
  const [aemetAlerts, setAemetAlerts] = useState<any[]>([]);
  const [alertMarkers, setAlertMarkers] = useState<MapMarker[]>([]);
  const [aemetLoading, setAemetLoading] = useState(false);

  // Añade también una referencia para los marcadores de alertas en el mapa (junto a userMarkersRef en la línea 45)
  const alertMarkersRef = useRef<L.Marker[]>([]);
  const [zonesDataState, setZonesDataState] = useState<{ [key: string]: ZoneData }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const [activeAlertLevels, setActiveAlertLevels] = useState<string[]>(['verde', 'amarillo', 'naranja', 'rojo']);
  // Variable que recoge las alertas filtradas por color
  const filteredAlerts = aemetAlerts.filter(alert => 
    activeAlertLevels.includes(alert.nivel.toLowerCase())
  );

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
  const refreshAemetAlerts = async () => {
    try {
      setAemetLoading(true);
      const apiUrl = `${SERVER_URL}/aemet-alerts`; // Asegúrate de que esta sea la ruta correcta de tu backend
      console.log('Fetching alerts from:', apiUrl);

      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const apiResponse = await response.json();
      const alertsFromApi = apiResponse.data || apiResponse;

      const transformedAlertMarkers: MapMarker[] = alertsFromApi.map((alert: any) => {
        // Adaptar según tu modelo: alert.coordenadas.latitud o alert.geolocalizacion...
        const lat = alert.coordenadas?.latitud || alert.geolocalizacion?.coordinates?.[1] || 0;
        const lng = alert.coordenadas?.longitud || alert.geolocalizacion?.coordinates?.[0] || 0;
       

        return {
          id: alert.id,
          lat: lat,
          lng: lng,
          label: alert.tipo || "Alerta",
          color: alert.color || '#f59e0b',
        };
      });

      setAemetAlerts(alertsFromApi);
      setAlertMarkers(transformedAlertMarkers);
    } catch (err) {
      console.error('❌ Error loading alerts:', err);
    } finally {
      setAemetLoading(false);
    }
  };

  useEffect(() => {
    refreshAemetAlerts();
  }, []);

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
  /* HANDLERS - User Interaction Management                                    */
  /* Funciones para gestionar interacciones del usuario con el mapa y zonas    */
  /* ========================================================================== */

  /**
   * Selecciona una zona para mostrar su información en el sidebar
   * Llama a la API para obtener datos meteorológicos actualizados
   * @param zoneId - ID de posición en el array (1-indexed)
   *
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
    mapInstanceRef.current.setView([latitud, longitud], 9, {
      animate: true,
    });

    console.log('Navegando a alerta:', alert.tipo, 'en', alert.zona);
  };

  /**
   * Gestiona la funcionalidad del boton de actulizar de alertas
   */
  const handleRefreshAemet = async () => {
    try {
      setIsRefreshingAlerts(true);
      const response = await fetch(`${SERVER_URL}/aemet-alerts?refresh=true`);
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
      html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });
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

    // 2. Crear los nuevos marcadores en memoria
    alertMarkers.forEach((marker) => {
      

      const leafletMarker = L.marker([marker.lat, marker.lng], { 
        icon: createCustomIcon(marker.color) 
      });

      // Buscamos la alerta completa en el estado usando el ID
      const fullAlert = aemetAlerts.find(a => (a.id || a._id) === marker.id);

      leafletMarker.on('click', () => {
        if (fullAlert) handleAemetAlertClick(fullAlert);
      });

      // 3. Construir el contenido del Popup
      let popupContent = '<div style="padding: 10px;">Cargando información...</div>';

      if (fullAlert) {
        // Formateo de fechas guardadas en variables seguras
        const inicioStr = fullAlert.validez_inicio ? new Date(fullAlert.validez_inicio).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Desconocida';
        const finStr = fullAlert.validez_fin ? new Date(fullAlert.validez_fin).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Desconocida';

        // HTML del popup usando las variables formateadas
        popupContent = `
          <div style="min-width: 240px; max-width: 300px; max-height: 380px; overflow-y: auto; font-family: sans-serif; padding-right: 4px;">
            
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; border-bottom: 2px solid ${marker.color || '#f59e0b'}; padding-bottom: 4px;">
              <div style="width: 16px; height: 16px; border-radius: 50%; background-color: ${marker.color};"></div>
              <span style="font-weight: bold; text-transform: uppercase; color: ${marker.color || '#f59e0b'}; letter-spacing: 0.5px;">
                NIVEL ${fullAlert.nivel || 'DESCONOCIDO'}
              </span>
            </div>
            
            <div style="margin-bottom: 10px;">
              <div style="font-weight: 800; font-size: 1.1em; margin-bottom: 4px; color: #1f2937; line-height: 1.2;">
                ${fullAlert.tipo || 'Alerta Meteorológica'}
              </div>
              <div style="color: #4b5563; font-size: 0.9em; margin-bottom: 8px;">
                📍 <strong>${fullAlert.zona || 'Zona no especificada'}</strong>
              </div>
              
              <div style="font-size: 0.9em; line-height: 1.4; background: #f3f4f6; padding: 8px; border-radius: 6px; border-left: 4px solid ${marker.color || '#d1d5db'}; color: #374151;">
                ${fullAlert.descripcion || 'Sin descripción disponible.'}
              </div>
            </div>

            ${fullAlert.instrucciones && fullAlert.instrucciones !== 'No hay instrucciones adicionales.' ? `
              <div style="margin-bottom: 10px; background: #fffbeb; border: 1px solid #fef3c7; padding: 8px; border-radius: 6px;">
                <span style="color: #92400e; font-size: 0.85em; font-weight: bold; display: block; margin-bottom: 3px;">⚠️ Instrucciones oficiales:</span>
                <span style="color: #92400e; font-size: 0.85em; line-height: 1.3; display: block;">${fullAlert.instrucciones}</span>
              </div>
            ` : ''}

            <div style="font-size: 0.85em; background: #f8fafc; padding: 8px; border-radius: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; color: #475569; margin-bottom: 10px; border: 1px solid #e2e8f0;">
              <div style="grid-column: span 2;"><strong>Probabilidad:</strong> <span style="float: right;">${fullAlert.probabilidad || 'N/A'}</span></div>
              <div style="grid-column: span 2;"><strong>Certidumbre:</strong> <span style="float: right;">${fullAlert.certidumbre || 'N/A'}</span></div>
              <div style="grid-column: span 2;"><strong>Urgencia:</strong> <span style="float: right;">${fullAlert.urgencia || 'N/A'}</span></div>
            </div>

            <div style="font-size: 0.8em; border-top: 1px solid #e2e8f0; padding-top: 8px; color: #64748b; display: grid; gap: 4px;">
              <div style="display: flex; justify-content: space-between;"><strong>Inicio:</strong> <span>${inicioStr}</span></div>
              <div style="display: flex; justify-content: space-between;"><strong>Fin:</strong> <span>${finStr}</span></div>
              
              ${fullAlert.enlace ? `
                <a href="${fullAlert.enlace}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: none; font-weight: bold; margin-top: 8px; display: block; text-align: center; background: #eff6ff; padding: 6px; border-radius: 4px;">
                  Ver aviso en AEMET ↗
                </a>
              ` : ''}
            </div>
          </div>
        `;
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

  }, [alertMarkers, aemetAlerts, layers.aemetAlerts]);

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
                        Alertas AEMET {filteredAlerts.length > 0 && `(${filteredAlerts.length})`}
                      </span>
                      {/* BOTÓN DE REFRESCAR */}
                      
                    </div>
                  </AccordionTrigger>                                 
                  <div className="pr-4 flex items-center gap-1">
                          {/* DESPLEGABLE DE FILTROS POR COLOR */}
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
                                  onSelect={(e) => e.preventDefault()} // Evita que se cierre al marcar
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
                            onClick={(e) => {
                              e.preventDefault();
                              handleRefreshAemet();
                            }}
                            disabled={isRefreshingAlerts}
                            title="Actualizar alertas"
                          >
                            <RefreshCw className={`h-4 w-4 ${isRefreshingAlerts ? 'animate-spin text-slate-500' : ''}`} />
                          </Button>
                        </div>
                  <AccordionContent className="px-4 pb-4">
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
