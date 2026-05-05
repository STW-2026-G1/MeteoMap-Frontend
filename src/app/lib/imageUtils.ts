/**
 * Utilidades para obtener imágenes dinámicamente desde Unsplash API
 */

// Cache para evitar múltiples requests por la misma zona
const imageCache: { [key: string]: string } = {};

/**
 * Helper para extraer el nombre central (elimina prefijos comunes)
 */
const getCoreZoneName = (name: string): string => {
  let core = name;
  const prefixes = [
    "Parque Natural del",
    "Parque Natural de las",
    "Parque Natural de la",
    "Parque Natural de",
    "Parque Nacional del",
    "Parque Nacional de la",
    "Parque Nacional de",
    "Parque Nacional de las",
    "Parque Nacional de los",
    "Parque Natural",
    "Parque Nacional",
    "Reserva Natural de",
  ];

  for (const prefix of prefixes) {
    if (core.startsWith(prefix)) {
      core = core.substring(prefix.length).trim();
      break;
    }
  }
  return core;
};

/**
 * Obtiene una imagen de Unsplash basada en el nombre de la zona
 * @param zoneName - Nombre de la zona (ej: "Ordesa y Monte Perdido")
 * @returns URL de imagen de Unsplash o fallback genérico
 */
export const getZoneImageFromUnsplash = async (zoneName: string): Promise<string> => {
  if (imageCache[zoneName]) {
    return imageCache[zoneName];
  }

  try {
    const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
    if (!accessKey) return getDefaultImage();

    const coreName = getCoreZoneName(zoneName);

    // Secuencia de términos ordenados de mayor precisión a menor precisión
    const termsToTry = [
       zoneName,                          // 1. Nombre completo ("Parque Nacional de Ordesa y Monte Perdido") 
       `${coreName} landscape nature`,     // 2. Nombre simplificado + descriptores
    ];

    let data: any = { results: [] };
    let matchedTerm = "";

    // Iteramos por la lista hasta encontrar un resultado
    for (const term of termsToTry) {
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(term)}&per_page=1&orientation=landscape`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Client-ID ${accessKey}` }
      });

      if (res.ok) {
        const resultData = await res.json();
        if (resultData.results && resultData.results.length > 0) {
          data = resultData;
          matchedTerm = term;
          break; // Nos quedamos con el primer resultado válido
        }
      }
    }

    // Resultado final
    if (data.results && data.results.length > 0) {
      const imageUrl = `${data.results[0].urls.regular}?w=800&h=600&fit=crop&q=80`;
      imageCache[zoneName] = imageUrl;
      console.log(`✅ Imagen encontrada usando: "${matchedTerm}"`);
      return imageUrl;
    }

    return getDefaultImage();
  } catch (error) {
    console.error(`Error obteniendo imagen para ${zoneName}:`, error);
    return getDefaultImage();
  }
};

/**
 * Obtiene imágenes para múltiples zonas de forma eficiente
 */
export const getZoneImagesFromUnsplash = async (
  zoneNames: string[]
): Promise<{ [key: string]: string }> => {
  const images: { [key: string]: string } = {};
  const batchSize = 5;
  
  for (let i = 0; i < zoneNames.length; i += batchSize) {
    const batch = zoneNames.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (name) => ({
        name,
        url: await getZoneImageFromUnsplash(name)
      }))
    );

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        images[result.value.name] = result.value.url;
      }
    });
  }

  return images;
};

/**
 * Obtiene la imagen por defecto (fallback)
 */
export const getDefaultImage = (): string => {
  return 'https://images.unsplash.com/photo-1551524164-687a55dd1126?w=800&h=600&fit=crop&q=80';
};

/**
 * Mapeo local de zonas conocidas a búsquedas específicas de Unsplash
 */
const zoneImageMappings: { [key: string]: string } = {
  "Parque Natural de Redes": "https://images.unsplash.com/photo-1616849068479-376693e487d2?q=80&w=1471&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
};

/**
 * Obtiene imagen de mapeo local o Unsplash
 */
export const getZoneImage = async (zoneName: string): Promise<string> => {
  if (zoneImageMappings[zoneName]) {
    console.log(`📍 Imagen de mapeo local para ${zoneName}`);
    return zoneImageMappings[zoneName];
  }

  return await getZoneImageFromUnsplash(zoneName);
};