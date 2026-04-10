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

interface MapMarker {
  id: number;
  lat: number;
  lng: number;
  type: 'snow' | 'ice' | 'alert';
  label: string;
}

interface ZoneData {
  id: number;
  name: string;
  elevation: string;
  temperature: number;
  wind: number;
  avalancheLevel: number;
  isFavorite: boolean;
  reports: Array<{
    id: number;
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
  const [favoriteZones, setFavoriteZones] = useState<Set<number>>(new Set([2])); // Pico Aneto es favorito por defecto
  const [createReportModalOpen, setCreateReportModalOpen] = useState(false);

  // Markers centered around Pyrenees mountains
  const markers: MapMarker[] = [
    { id: 1, lat: 42.65, lng: 0.85, type: 'snow', label: 'Nieve inestable - Valle de Benasque' },
    { id: 2, lat: 42.75, lng: 0.65, type: 'ice', label: 'Placas de hielo - Pico Aneto' },
    { id: 3, lat: 42.55, lng: 0.75, type: 'alert', label: 'Alerta aludes - Zona Maladeta' },
    { id: 4, lat: 42.85, lng: 0.95, type: 'snow', label: 'Nieve polvo - Pista Cerler' },
    { id: 5, lat: 42.45, lng: 0.55, type: 'ice', label: 'Hielo negro - Carretera A-139' },
    { id: 6, lat: 42.70, lng: 1.05, type: 'alert', label: 'Precaución - Collado del Infierno' },
  ];

  // Weather data points - coordenadas geográficas específicas
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

  // Complete zone data with reports
  const zonesData: { [key: number]: ZoneData } = {
    1: {
      id: 1,
      name: 'Valle de Benasque',
      elevation: '1.140m',
      temperature: -2,
      wind: 18,
      avalancheLevel: 2,
      isFavorite: favoriteZones.has(1),
      reports: [
        {
          id: 1,
          userName: 'Carlos_Montañero',
          avatar: '',
          condition: 'Nieve polvo en buen estado. Cuidado con las zonas de sombra.',
          timestamp: 'hace 2h',
          photo: 'https://images.unsplash.com/photo-1770064182538-0f88c61455eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbm93eSUyMG1vdW50YWluJTIwcGVhayUyMGNvbmRpdGlvbnN8ZW58MXx8fHwxNzc0NDQzMTYwfDA&ixlib=rb-4.1.0&q=80&w=1080',
        },
        {
          id: 2,
          userName: 'Laura_Ski',
          avatar: '',
          condition: 'Visibilidad perfecta. Temperatura agradable para esquiar.',
          timestamp: 'hace 5h',
        },
      ],
    },
    2: {
      id: 2,
      name: 'Pico Aneto',
      elevation: '3.404m',
      temperature: -4,
      wind: 25,
      avalancheLevel: 3,
      isFavorite: favoriteZones.has(2),
      reports: [
        {
          id: 3,
          userName: 'MiguelAlpinista',
          avatar: '',
          condition: 'Mucho viento en la cumbre. Placas de hielo detectadas en cara norte.',
          timestamp: 'hace 1h',
          photo: 'https://images.unsplash.com/photo-1772032253819-ab75f447d5d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMHRyYWlsJTIwaWNlJTIwaGF6YXJkfGVufDF8fHx8MTc3NDQ0MzE2M3ww&ixlib=rb-4.1.0&q=80&w=1080',
        },
        {
          id: 4,
          userName: 'Ana_Guía',
          avatar: '',
          condition: 'Recomiendo crampones obligatorios. Condiciones técnicas.',
          timestamp: 'hace 3h',
        },
        {
          id: 5,
          userName: 'JavierPirineos',
          avatar: '',
          condition: 'Impresionantes vistas hoy. Nieve firme en la aproximación.',
          timestamp: 'ayer',
        },
      ],
    },
    3: {
      id: 3,
      name: 'Zona Maladeta',
      elevation: '2.580m',
      temperature: -5,
      wind: 32,
      avalancheLevel: 4,
      isFavorite: favoriteZones.has(3),
      reports: [
        {
          id: 6,
          userName: 'Rescue_Team',
          avatar: '',
          condition: '⚠️ ALERTA: Peligro notable de aludes. Evitar la zona hasta nueva orden.',
          timestamp: 'hace 30min',
        },
        {
          id: 7,
          userName: 'Sofia_Trekking',
          avatar: '',
          condition: 'Escuchamos ruidos de avalanchas pequeñas. Precaución extrema.',
          timestamp: 'hace 2h',
        },
      ],
    },
    4: {
      id: 4,
      name: 'Pista Cerler',
      elevation: '1.500m',
      temperature: 1,
      wind: 15,
      avalancheLevel: 1,
      isFavorite: favoriteZones.has(4),
      reports: [
        {
          id: 8,
          userName: 'PistasAbiertas',
          avatar: '',
          condition: 'Todas las pistas operativas. Nieve en condiciones óptimas.',
          timestamp: 'hace 4h',
        },
      ],
    },
    5: {
      id: 5,
      name: 'Carretera A-139',
      elevation: '800m',
      temperature: 3,
      wind: 12,
      avalancheLevel: 2,
      isFavorite: favoriteZones.has(5),
      reports: [
        {
          id: 9,
          userName: 'DGT_Huesca',
          avatar: '',
          condition: 'Hielo negro en el km 15. Circular con precaución y cadenas.',
          timestamp: 'hace 1h',
        },
      ],
    },
    6: {
      id: 6,
      name: 'Collado del Infierno',
      elevation: '2.721m',
      temperature: -3,
      wind: 28,
      avalancheLevel: 3,
      isFavorite: favoriteZones.has(6),
      reports: [],
    },
  };

  const handleZoneSelect = (zoneId: number) => {
    const zone = zonesData[zoneId];
    if (zone) {
      setSelectedZone({ ...zone, isFavorite: favoriteZones.has(zoneId) });
    }
  };

  const handleZoneClose = () => {
    setSelectedZone(null);
  };

  const handleToggleFavorite = (zoneId: number) => {
    setFavoriteZones(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(zoneId)) {
        newFavorites.delete(zoneId);
      } else {
        newFavorites.add(zoneId);
      }
      return newFavorites;
    });
    
    // Update selected zone if it's the one being toggled
    if (selectedZone && selectedZone.id === zoneId) {
      setSelectedZone({
        ...selectedZone,
        isFavorite: !selectedZone.isFavorite,
      });
    }
  };

  const createCustomIcon = (color: string) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
    });
  };

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

  const getIconSvg = (type: string) => {
    const iconMap: { [key: string]: string } = {
      snow: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="m17 20-5-5 5-5"/><path d="m7 4 5 5-5 5"/></svg>',
      ice: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 1 0 6 0V5a3 3 0 0 0-3-3z"/></svg>',
      alert: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>',
    };
    return iconMap[type] || '';
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create map
    const map = L.map(mapRef.current, {
      zoomControl: false,
    }).setView([42.65, 0.75], 8);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Add markers
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
      
      // Add click handler to open zone sidebar
      leafletMarker.on('click', () => {
        handleZoneSelect(marker.id);
      });
      
      userMarkersRef.current.push(leafletMarker);
    });

    // Add weather data points
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

    // Cleanup
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
  }, []);

  // Handle layer visibility and marker filtering
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    
    // Control marker visibility
    userMarkersRef.current.forEach((marker, index) => {
      const markerData = markers[index];
      
      // Check if marker should be visible based on layers
      let shouldShow = true;
      
      // Hide all user reports if layer is off
      if (!layers.userReports) {
        shouldShow = false;
      } 
      // Hide only alert markers if avalanche layer is off
      else if (!layers.avalanche && markerData.type === 'alert') {
        shouldShow = false;
      }
      
      if (shouldShow && !map.hasLayer(marker)) {
        marker.addTo(map);
      } else if (!shouldShow && map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });

    // Control temperature markers visibility and opacity
    weatherLayersRef.current.temperature.forEach((marker) => {
      if (layers.temperature) {
        if (!map.hasLayer(marker)) {
          marker.addTo(map);
        }
        // Update opacity
        const element = marker.getElement();
        if (element) {
          element.style.opacity = `${layerOpacity.temperature / 100}`;
        }
      } else if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });

    // Control precipitation markers visibility and opacity
    weatherLayersRef.current.precipitation.forEach((marker) => {
      if (layers.precipitation) {
        if (!map.hasLayer(marker)) {
          marker.addTo(map);
        }
        // Update opacity
        const element = marker.getElement();
        if (element) {
          element.style.opacity = `${layerOpacity.precipitation / 100}`;
        }
      } else if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });

    // Control wind markers visibility and opacity
    weatherLayersRef.current.wind.forEach((marker) => {
      if (layers.wind) {
        if (!map.hasLayer(marker)) {
          marker.addTo(map);
        }
        // Update opacity
        const element = marker.getElement();
        if (element) {
          element.style.opacity = `${layerOpacity.wind / 100}`;
        }
      } else if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });
  }, [layers, layerOpacity]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="relative flex-1 mt-16">
        {/* Map Container */}
        <div className="absolute inset-0">
          <div ref={mapRef} className="h-full w-full" />
        </div>

        {/* Search Bar */}
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

        {/* Layer Control Panel - Desktop */}
        <div className="absolute top-20 right-4 z-[1000] w-72 hidden md:block max-h-[calc(100vh-7rem)] overflow-y-auto">
          <Card className="p-4">
            <h3 className="font-semibold mb-4 text-gray-900">Capas del Mapa</h3>
            <div className="space-y-5">
              {/* User Reports */}
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

              {/* Temperature */}
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

              {/* Precipitation */}
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

              {/* Wind */}
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

              {/* Avalanche Alerts */}
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

        {/* Mobile Layer Control */}
        <div className="absolute bottom-20 left-4 right-4 z-[1000] md:hidden">
          <Card className="p-3">
            <h3 className="font-semibold mb-3 text-sm text-gray-900">Capas</h3>
            <div className="space-y-3">
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

        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
          <Button
            size="icon"
            variant="secondary"
            className="bg-white hover:bg-gray-100 shadow-lg"
            onClick={handleZoomIn}
          >
            <Plus className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="bg-white hover:bg-gray-100 shadow-lg"
            onClick={handleZoomOut}
          >
            <Minus className="h-5 w-5" />
          </Button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] hidden sm:block">
          <Card className="p-3">
            <h4 className="font-semibold text-xs mb-2 text-gray-900">Leyenda</h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Snowflake className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-gray-700">Nieve inestable</span>
              </div>
              <div className="flex items-center gap-2">
                <IceCreamCone className="h-4 w-4 text-cyan-500" />
                <span className="text-xs text-gray-700">Placas de hielo</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-xs text-gray-700">Alerta aludes</span>
              </div>
            </div>
          </Card>
        </div>

        {/* AI Assistant Floating Button */}
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

        {/* AI Assistant Panel */}
        <AIAssistant open={aiAssistantOpen} onOpenChange={setAiAssistantOpen} />

        {/* Zone Sidebar */}
        <ZoneSidebar 
          zone={selectedZone} 
          onClose={handleZoneClose} 
          onToggleFavorite={handleToggleFavorite}
          onCreateReport={() => setCreateReportModalOpen(true)}
          onViewAllReports={() => {
            if (selectedZone) {
              navigate(`/foro?zone=${encodeURIComponent(selectedZone.name)}&id=${selectedZone.id}&elevation=${encodeURIComponent(selectedZone.elevation)}&temp=${selectedZone.temperature}&wind=${selectedZone.wind}&avalanche=${selectedZone.avalancheLevel}`);
            }
          }}
        />

        {/* Create Report Modal */}
        <CreateReportModal 
          open={createReportModalOpen} 
          onOpenChange={setCreateReportModalOpen}
          zoneName={selectedZone?.name || ''}
        />
      </div>
    </div>
  );
}