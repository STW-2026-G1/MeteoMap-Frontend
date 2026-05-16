/**
 * @file tooltip.tsx
 * @description Componente de tooltip reutilizable basado en Radix UI, con estilos personalizados y animaciones.
 * Incluye un proveedor para configurar el retraso de aparición y componentes para el trigger y el contenido del tooltip.
 * @author MeteoMap Team
 */
"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "./utils";

/**
 * Componente proveedor para el tooltip, que permite configurar el retraso de aparición y otros parámetros globales del tooltip. Este componente debe envolver a cualquier componente Tooltip para que funcione correctamente, ya que proporciona el contexto necesario para la gestión del estado y la configuración del tooltip. Además, este componente tiene soporte para estilos personalizados a través de la prop className, y para renderizar cualquier contenido adicional dentro del proveedor a través de los children.
 */
function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

/**
 * Componente raíz del tooltip, que se encarga de renderizar el tooltip y proporcionar el contexto necesario para su funcionamiento. Este componente debe usarse dentro de un componente TooltipProvider para funcionar correctamente, ya que depende del contexto para gestionar el estado y la configuración del tooltip. Además, este componente tiene soporte para estilos personalizados a través de la prop className, y para renderizar cualquier contenido adicional dentro del tooltip a través de los children.
 */
function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  );
}

/**
 * Componente de disparador (trigger) para el tooltip, que se encarga de renderizar el elemento que activará la aparición del tooltip al interactuar con él. Este componente debe usarse dentro de un componente Tooltip para funcionar correctamente, ya que depende del contexto para gestionar el estado y la configuración del tooltip. Además, este componente tiene soporte para estilos personalizados a través de la prop className, y para renderizar cualquier contenido adicional dentro del trigger a través de los children.
 */
function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

/**
 * Componente de contenido para el tooltip, que se encarga de renderizar el contenido que se mostrará dentro del tooltip cuando se active. Este componente debe usarse dentro de un componente Tooltip para funcionar correctamente, ya que depende del contexto para gestionar el estado y la configuración del tooltip. Además, este componente tiene soporte para estilos personalizados a través de la prop className, y para renderizar cualquier contenido adicional dentro del tooltip a través de los children. Este componente también incluye una flecha (arrow) que apunta al elemento disparador, con estilos personalizados para su apariencia.
 */
function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="bg-primary fill-primary z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
