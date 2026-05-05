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
       zoneName,                           // 1. Nombre completo ("Parque Nacional de Ordesa y Monte Perdido") 
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
  return 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?q=80&w=1176&auto=format&fit=crop';
};

/**
 * Mapeo local de zonas conocidas a búsquedas específicas de Unsplash
 */
const zoneImageMappings: { [key: string]: string } = {
  "Parque Natural de Redes": "https://images.unsplash.com/photo-1616849068479-376693e487d2?q=80&w=1471&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Parque Natural de Somiedo": "https://images.unsplash.com/photo-1721816209668-610abc4a0715?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Parque Natural de la Serranía de Cuenca": "https://images.unsplash.com/photo-1676489399370-314a381ee597?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Parque Natural del Delta del Ebro": "https://images.unsplash.com/photo-1573943563284-965efa90ba1c?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Parque Natural del Alto Tajo": "https://images.unsplash.com/photo-1593745551959-2a709e163a4e?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Parque Natural de la Font Roja": "https://images.unsplash.com/photo-1536778542960-85e8f3de61dd?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Parque Natural de la Albufera": "https://plus.unsplash.com/premium_photo-1697730423415-589a05ffac5e?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Parque Natural de la Sierra de Espadán": "https://images.unsplash.com/photo-1742544690244-8dd32b456086?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Parque Nacional de Garajonay": "https://images.unsplash.com/photo-1678735827199-7952f38899c2?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Parque Nacional de Tablas de Daimiel": "https://images.unsplash.com/photo-1669403908923-9279e2e2f2b5?q=80&w=736&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Parque Natural de Despeñaperros": "https://images.unsplash.com/photo-1546882588-d9bd63f85a7e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGNhdGFyYXRhfGVufDB8fDB8fHww",
  "Parque Natural de la Sierra de Andújar": "https://plus.unsplash.com/premium_photo-1664304345250-7a2e06a7382d?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Parque Natural de la Sierra Norte de Sevilla": "https://images.unsplash.com/photo-1644176778083-7f4f0693841f?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Parque Natural Sierra de Hornachuelos": "https://images.unsplash.com/photo-1575104867603-ef1d95cfc70f?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Parque Natural Sierra María-Los Vélez": "https://plus.unsplash.com/premium_photo-1697729475505-3b951ffbfa15?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Parque Natural de las Sierras Subbéticas": "https://images.unsplash.com/photo-1634978158966-ef87e229adaa?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Parque Natural de la Sierra de Baza": "https://plus.unsplash.com/premium_photo-1733317210949-71d7fccc7cf5?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Parque Natural de la Sierra de Huétor": "https://plus.unsplash.com/premium_photo-1697729780758-e6421bf51175?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Parque Natural de Oyambre": "https://images.unsplash.com/photo-1734913724690-2dad10d86c70?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Parque Natural del Peñón de Ifach": "https://images.unsplash.com/photo-1605489095062-ad488743ddfa?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Parque Natural del Lago de Sanabria": "https://images.unsplash.com/photo-1774973726093-3d377dfd0ed4?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
};

/**
 * Obtiene imagen de mapeo local o Unsplash
 */
export const getZoneImage = async (zoneName: string): Promise<string> => {
  if (zoneImageMappings[zoneName]) {
    console.log(` Imagen de mapeo local para ${zoneName}`);
    return zoneImageMappings[zoneName];
  }

  return await getZoneImageFromUnsplash(zoneName);
};