"use client";

/**
 * @file aspect-ratio.tsx
 * @description Componente para manejar relaciones de aspecto basado en Radix UI.
 * @author MeteoMap Team
 */

import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio";

/**
 * Componente AspectRatio — fuerza una relación de aspecto en su contenido.
 */
function AspectRatio({
  ...props
}: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />;
}

export { AspectRatio };
