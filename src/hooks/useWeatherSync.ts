/**
 * @file useWeatherSync.ts
 * @description Hook personalizado que sincroniza datos meteorológicos cada 3 horas,
 * se ejecuta automáticamente en background con manejo silencioso de errores.
 * @author MeteoMap Team
 */

import { useEffect } from "react";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000/api";

/**
 * Hook para sincronizar datos meteorológicos cada 3 horas
 * - Se ejecuta al montar el componente
 * - Se ejecuta cada 3 horas automáticamente
 * - Manejo silencioso de errores (sin afectar UX)
 */
export const useWeatherSync = () => {
  useEffect(() => {
    // Ejecutar sincronización inmediatamente
    syncWeather();

    // Sincronizar cada 3 horas (10800000 ms = 3 * 60 * 60 * 1000)
    const interval = setInterval(() => {
      syncWeather();
    }, 10800000); // 3 horas

    // Limpiar intervalo al desmontar
    return () => clearInterval(interval);
  }, []);

  /**
   * Sincroniza datos meteorológicos con el backend
   * @async
   * @returns {Promise<void>}
   */
  const syncWeather = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/zones/weather`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        // Log silencioso - no mostrar al usuario
        console.warn(
          `Weather sync failed with status ${response.status}. Data may be outdated.`
        );
        return;
      }

      // Intentar parsear respuesta JSON
      const result = await response.json();

      // Log de éxito en consola
      console.log(
        `✓ Weather sync completed: ${result.success}/${result.success + result.failed} zones updated`
      );
    } catch (error) {
      // Log silencioso - error de red u otros
      console.warn("Weather sync network error:", error instanceof Error ? error.message : "Unknown error");
    }
  };

  /**
   * Permitir sincronización manual desde componentes
   */
  return { syncWeather };
};

export default useWeatherSync;
