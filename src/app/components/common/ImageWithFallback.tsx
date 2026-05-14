/**
 * @file ImageWithFallback.tsx
 * @description Componente de imagen con manejo de errores y fallback,
 * soporta carga de imagen alternativa y SVG de error como último recurso.
 * @author MeteoMap Team
 */

import React, { useState, forwardRef } from 'react'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

type ImageWithFallbackProps = React.ImgHTMLAttributes<HTMLImageElement> & { fallback?: string };

// 1. Envolvemos el componente en forwardRef
export const ImageWithFallback = forwardRef<HTMLImageElement | HTMLDivElement, ImageWithFallbackProps>(
  (props, ref) => { // 2. Recibimos 'ref' como segundo parámetro
    const [didError, setDidError] = useState(false)

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      if (props.fallback && e.currentTarget.src !== props.fallback) {
        e.currentTarget.src = props.fallback;
      } else {
        setDidError(true)
      }
    }

    const { src, alt, style, className, fallback, ...rest } = props

    return didError ? (
      <div
        // 3. Pasamos el ref al contenedor de error
        ref={ref as React.Ref<HTMLDivElement>} 
        className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
        style={style}
      >
        <div className="flex items-center justify-center w-full h-full">
          <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} />
        </div>
      </div>
    ) : (
      <img 
        // 4. Pasamos el ref a la imagen principal
        ref={ref as React.Ref<HTMLImageElement>}
        src={src || fallback} 
        alt={alt} 
        className={className} 
        style={style} 
        referrerPolicy="no-referrer"
        {...rest} 
        onError={handleError} 
      />
    )
  }
)

// Es una buena práctica ponerle un nombre para las herramientas de desarrollo de React
ImageWithFallback.displayName = 'ImageWithFallback'