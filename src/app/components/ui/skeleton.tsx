/**
 * @file skeleton.tsx
 * @description Componente de esqueleto (skeleton) para mostrar placeholders durante la carga de contenido.
 * @author MeteoMap Team
 */
import { cn } from "./utils";

/**
 * Componente de esqueleto (skeleton) para mostrar placeholders durante la carga de contenido.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
