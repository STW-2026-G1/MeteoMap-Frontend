/**
 * @file use-mobile.ts
 * @description Hook personalizado para detectar si el dispositivo es móvil basado en breakpoint de Tailwind.
 * @author MeteoMap Team
 */

import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Hook para detectar si el dispositivo es móvil usando media queries de Tailwind CSS.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
