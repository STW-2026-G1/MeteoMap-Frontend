import { useEffect } from "react";

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
   * Llamar endpoint de sincronización meteorológica
   */
  const syncWeather = async () => {
    try {
      const response = await fetch("/api/zones/weather", {
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
