import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import L from 'leaflet';

/**
 * Componente para mostrar marcadores de alertas AEMET sobre el mapa
 * Visualiza las alertas meteorológicas con colores e iconos según el nivel de alerta
 */
interface AlertData {
  id: string;
  zona: string;
  tipo: string;
  titular: string;
  nivel: string;
  nivelNumerico: number;
  descripcion: string;
  instrucciones: string;
  probabilidad: string;
  certidumbre: string;
  urgencia: string;
  enlace: string;
  coordenadas: {
    latitud: number;
    longitud: number;
  };
  emision: string;
  validez_inicio: string;
  validez_fin: string;
  color: string;
}

interface AemetAlertsLayerProps {
  map: L.Map | null;
  isVisible: boolean;
  opacity: number;
}

/**
 * Hook personalizado para manejar las alertas AEMET en el mapa
 */
export function useAemetAlerts(map: L.Map | null, isVisible: boolean, opacity: number) {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(false);
  const [markers, setMarkers] = useState<(L.Marker | L.CircleMarker)[]>([]);

  // Obtener alertas del API
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/aemet-alerts');
      const data = await response.json();

      if (data.status === 'success') {
        console.log('✅ Alertas AEMET cargadas:', data.data.length, 'alertas');
        setAlerts(data.data);
      }
    } catch (error) {
      console.error('❌ Error obteniendo alertas AEMET:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar marcadores cuando cambien las alertas o la visibilidad
  useEffect(() => {
    if (!map) {
      console.debug('Mapa no está listo aún');
      return;
    }

    // Limpiar marcadores anteriores
    markers.forEach((marker) => {
      try {
        map.removeLayer(marker);
      } catch (e) {
        console.debug('Error eliminando marcador');
      }
    });
    setMarkers([]);

    if (!isVisible) {
      console.debug('Alertas AEMET ocultas');
      return;
    }

    if (alerts.length === 0) {
      console.debug('No hay alertas para mostrar');
      return;
    }

    // Crear nuevos marcadores - ORDENADOS POR SEVERIDAD (rojo > amarillo > verde)
    // Primero separar alertas por nivel
    const alertsByLevel = {
      critical: alerts.filter(a => a.nivelNumerico >= 3), // Rojo: nivel 3-4
      warning: alerts.filter(a => a.nivelNumerico === 2),  // Amarillo: nivel 2
      info: alerts.filter(a => a.nivelNumerico === 1),     // Verde: nivel 1
    };

    // Función para obtener color según nivel
    const getAlertColor = (nivelNumerico: number): { fill: string; border: string } => {
      if (nivelNumerico >= 3) {
        return { fill: '#ff0000', border: '#cc0000' }; // Rojo: crítico
      } else {
        return { fill: '#ffb800', border: '#cc9200' }; // Amarillo: warning
      }
    };

    // Crear nuevos marcadores con orden de severidad
    const newMarkers: (L.Marker | L.CircleMarker)[] = [];

    // Procesar alertas por nivel (de mayor a menor severidad para que aparezcan encima)
    [...alertsByLevel.critical, ...alertsByLevel.warning, ...alertsByLevel.info].forEach((alert) => {
      try {
        const { latitud, longitud } = alert.coordenadas;

        // Validar coordenadas
        if (!latitud || !longitud || isNaN(latitud) || isNaN(longitud)) {
          console.warn('⚠️ Coordenadas inválidas para alerta:', alert.id);
          return;
        }

        // Función para obtener color de fondo según severidad
        const getBackgroundColor = (nivelNumerico: number): string => {
          if (nivelNumerico >= 3) {
            return '#ff3333'; // Rojo: crítico
          } else if (nivelNumerico === 2) {
            return '#ffb800'; // Amarillo: warning
          } else {
            return '#22c55e'; // Verde: información
          }
        };

        const bgColor = getBackgroundColor(alert.nivelNumerico);
        
        // Crear marcador con emoji de alerta - Solo el emoji sin fondo
        const marker = L.marker([latitud, longitud], {
          icon: L.divIcon({
            html: `
              <div style="
                font-size: 32px;
                line-height: 1;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.2));
                cursor: pointer;
                user-select: none;
                transition: transform 0.2s ease;
              " class="alert-emoji">
                ⚠️
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16],
            className: 'alert-emoji-icon',
          }),
        });

        // Agregar popup con información
        const popupContent = `
          <div class="alert-popup" style="font-family: sans-serif; max-width: 280px; max-height: 350px; overflow-y: auto; padding: 4px;">
            <h3 style="margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px; color: #1f2937; font-size: 16px;">
              <span>⚠️</span>
              <strong>${alert.tipo}</strong>
            </h3>
            
            <div style="background-color: ${alert.color}20; padding: 6px 8px; border-radius: 4px; border-left: 4px solid ${alert.color}; margin-bottom: 8px;">
              <p style="margin: 0; color: #374151; font-weight: bold; font-size: 13px;">${alert.zona}</p>
              <p style="margin: 2px 0 0 0; color: ${alert.color}; font-weight: bold; font-size: 12px; text-transform: uppercase;">
                NIVEL ${alert.nivel}
              </p>
            </div>

            <p style="margin: 6px 0; color: #4b5563; font-size: 13px; line-height: 1.4;">
              <strong>Descripción:</strong> ${alert.descripcion}
            </p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin: 8px 0; padding: 6px; background: #f3f4f6; border-radius: 4px; font-size: 11px; color: #4b5563;">
              <p style="margin: 0;"><strong>Probabilidad:</strong> ${alert.probabilidad}</p>
              <p style="margin: 0;"><strong>Certidumbre:</strong> ${alert.certidumbre}</p>
            </div>

            <div style="margin: 8px 0; padding: 8px; background: #fffbeb; border-radius: 4px; border: 1px solid #fef3c7;">
              <p style="margin: 0; color: #92400e; font-size: 12px; line-height: 1.4;">
                <strong>Instrucciones:</strong> ${alert.instrucciones}
              </p>
            </div>

            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280;">
              <p style="margin: 2px 0;"><strong>Inicio:</strong> ${new Date(alert.validez_inicio).toLocaleString('es-ES')}</p>
              <p style="margin: 2px 0;"><strong>Fin:</strong> ${new Date(alert.validez_fin).toLocaleString('es-ES')}</p>
              <p style="margin: 6px 0 0 0;">
                <a href="${alert.enlace}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: none; font-weight: bold;">
                  Ver aviso oficial en AEMET ↗
                </a>
              </p>
            </div>
          </div>
        `;
        marker.bindPopup(popupContent, {
          maxWidth: 280,
          className: 'alert-popup-style',
        });

        // Tooltip al pasar ratón
        marker.bindTooltip(`⚠️ ${alert.tipo} - ${alert.zona}`, {
          permanent: false,
          direction: 'top',
          offset: [0, -15],
          className: 'alert-tooltip',
        });

        // Event listener para abrir popup al hacer click
        marker.on('click', () => {
          console.log('Click en alerta:', alert.tipo, 'en', alert.zona);
          marker.openPopup();
        });

        marker.addTo(map);
        newMarkers.push(marker);
        console.log('✅ Marcador añadido:', alert.tipo, 'en', alert.zona);
      } catch (e) {
        console.error('Error creando marcador para alerta:', alert.id, e);
      }
    });

    setMarkers(newMarkers);
    console.log('✅ Total marcadores en mapa:', newMarkers.length);

    return () => {
      newMarkers.forEach((marker) => {
        try {
          map.removeLayer(marker);
        } catch (e) {
          console.debug('Error limpiando marcador');
        }
      });
    };
  }, [map, alerts, isVisible, opacity]);

  // Cargar alertas al montar el componente
  useEffect(() => {
    console.log('🔄 useAemetAlerts montado, cargando alertas iniciales...');
    fetchAlerts();

    // Actualizar alertas cada 30 minutos
    const interval = setInterval(() => {
      console.log('🔄 Actualizando alertas AEMET (cada 30 minutos)...');
      fetchAlerts();
    }, 1800000); // 30 minutos = 1800000 ms

    return () => {
      clearInterval(interval);
      console.log('🔄 useAemetAlerts desmontado');
    };
  }, []);

  return { alerts, loading, fetchAlerts };
}

/**
 * Panel de control para filtrar y visualizar alertas AEMET
 */
interface AemetAlertsPanelProps {
  alerts: AlertData[];
  loading: boolean;
  onRefresh: () => void;
}

export function AemetAlertsPanel({ alerts, loading, onRefresh }: AemetAlertsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (alerts.length === 0 && !loading) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-green-700">
          <AlertTriangle size={20} />
          <span>No hay alertas meteorológicas activas</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Alertas Meteorológicas AEMET</h3>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>

      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="border rounded-lg overflow-hidden"
          style={{ borderLeftColor: alert.color, borderLeftWidth: '4px' }}
        >
          <button
            onClick={() => setExpandedId(expandedId === alert.id ? null : alert.id)}
            className="w-full p-3 text-left hover:bg-gray-50 flex items-center justify-between"
          >
            <div className="flex items-center gap-3 flex-1">
              <AlertTriangle className="h-6 w-6" style={{ color: alert.color }} />
              <div>
                <p className="font-semibold">{alert.tipo}</p>
                <p className="text-sm text-gray-600">{alert.zona}</p>
              </div>
            </div>
            <span
              className="px-2 py-1 rounded text-sm font-semibold text-white"
              style={{ backgroundColor: alert.color }}
            >
              {alert.nivel}
            </span>
          </button>

          {expandedId === alert.id && (
            <div className="px-3 pb-3 border-t text-sm text-gray-700 space-y-2">
              <p>
                <strong>Descripción:</strong> {alert.descripcion}
              </p>
              <p>
                <strong>Inicio:</strong> {new Date(alert.validez_inicio).toLocaleString('es-ES')}
              </p>
              <p>
                <strong>Fin previsto:</strong> {new Date(alert.validez_fin).toLocaleString('es-ES')}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AemetAlertsLayer({ map, isVisible, opacity }: AemetAlertsLayerProps) {
  const { alerts, loading, fetchAlerts } = useAemetAlerts(map, isVisible, opacity);

  return (
    <div className="aemet-alerts-widget">
      <AemetAlertsPanel alerts={alerts} loading={loading} onRefresh={fetchAlerts} />
    </div>
  );
}
