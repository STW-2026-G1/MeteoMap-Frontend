"use client";

/**
 * @file table.tsx
 * @description Conjunto de componentes para construir tablas estilizadas, con soporte para encabezados, filas, celdas y pies de página.
 * @author MeteoMap Team
 */
import * as React from "react";

import { cn } from "./utils";

/**
 * Componente raíz de la tabla, que se encarga de renderizar el contenedor de la tabla y aplicar estilos básicos. Este componente acepta props para configurar el estilo y el comportamiento de la tabla, y utiliza un contenedor adicional para manejar el desbordamiento horizontal en caso de tablas con muchas columnas. Además, este componente tiene soporte para estilos personalizados a través de la prop className, y para renderizar cualquier contenido adicional dentro del contenedor de la tabla a través de los children.
 */
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

/**
 * Componente para el encabezado de la tabla, que se encarga de renderizar la sección de encabezado de la tabla y aplicar estilos específicos para los encabezados. Este componente debe usarse dentro de un componente Table para funcionar correctamente, ya que depende del contexto para aplicar los estilos adecuados a las filas y celdas del encabezado. Además, este componente tiene soporte para estilos personalizados a través de la prop className, y para renderizar cualquier contenido adicional dentro del encabezado a través de los children.
 */
function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  );
}

/**
 * Componente para el cuerpo de la tabla, que se encarga de renderizar la sección principal de la tabla donde se muestran los datos. Este componente debe usarse dentro de un componente Table para funcionar correctamente, ya que depende del contexto para aplicar los estilos adecuados a las filas y celdas del cuerpo. Además, este componente tiene soporte para estilos personalizados a través de la prop className, y para renderizar cualquier contenido adicional dentro del cuerpo a través de los children.
 */
function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

/**
 * Componente para el pie de página de la tabla, que se encarga de renderizar la sección de pie de página de la tabla y aplicar estilos específicos para los pies de página. Este componente debe usarse dentro de un componente Table para funcionar correctamente, ya que depende del contexto para aplicar los estilos adecuados a las filas y celdas del pie de página. Además, este componente tiene soporte para estilos personalizados a través de la prop className, y para renderizar cualquier contenido adicional dentro del pie de página a través de los children.
 */
function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Componente para las filas de la tabla, que se encarga de renderizar cada fila de la tabla y aplicar estilos específicos para las filas. Este componente debe usarse dentro de un componente TableHeader, TableBody o TableFooter para funcionar correctamente, ya que depende del contexto para aplicar los estilos adecuados a las celdas de la fila. Además, este componente tiene soporte para estilos personalizados a través de la prop className, y para renderizar cualquier contenido adicional dentro de la fila a través de los children.
 */
function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Componente para las celdas de encabezado de la tabla, que se encarga de renderizar cada celda del encabezado de la tabla y aplicar estilos específicos para las celdas de encabezado. Este componente debe usarse dentro de un componente TableHeader para funcionar correctamente, ya que depende del contexto para aplicar los estilos adecuados a las filas y celdas del encabezado. Además, este componente tiene soporte para estilos personalizados a través de la prop className, y para renderizar cualquier contenido adicional dentro de la celda de encabezado a través de los children.
 */
function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Componente para las celdas de datos de la tabla, que se encarga de renderizar cada celda del cuerpo o pie de página de la tabla y aplicar estilos específicos para las celdas de datos. Este componente debe usarse dentro de un componente TableBody o TableFooter para funcionar correctamente, ya que depende del contexto para aplicar los estilos adecuados a las filas y celdas del cuerpo o pie de página. Además, este componente tiene soporte para estilos personalizados a través de la prop className, y para renderizar cualquier contenido adicional dentro de la celda de datos a través de los children.
 */
function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Componente para el título o leyenda de la tabla, que se encarga de renderizar un título o descripción para la tabla y aplicar estilos específicos para el título. Este componente debe usarse dentro de un componente Table para funcionar correctamente, ya que depende del contexto para aplicar los estilos adecuados a la tabla. Además, este componente tiene soporte para estilos personalizados a través de la prop className, y para renderizar cualquier contenido adicional dentro del título a través de los children.
 */
function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
