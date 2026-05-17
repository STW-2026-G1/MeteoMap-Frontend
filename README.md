# MeteoMap - Frontend

Interfaz de usuario para la plataforma de seguridad en montaña MeteoMap. Permite interactuar con mapas interactivos, visualizar el clima, participar en foros de zonas y crear reportes comunitarios.

> Nota: Para obtener información más detallada, consultar el pdf de documentación en la carpeta `docs/`.

## Características Principales

*   **Mapas Interactivos:** Visualización de zonas, reportes y geolocalización usando Leaflet.
*   **Autenticación:** Inicio de sesión y registro integrado con el backend, soportando Google OAuth.
*   **Gestión de Reportes:** Interfaz fluida para crear, validar y desmentir reportes sobre el estado de la montaña.
*   **Asistente IA:** Chat integrado para realizar consultas a la inteligencia artificial de MeteoMap.
*   **Diseño Responsive:** Interfaz adaptable a diferentes dispositivos.

## Stack Tecnológico

*   **Core:** React 18, TypeScript, Vite
*   **Estilos y Componentes:** Tailwind CSS v4, Radix UI, Shadcn UI
*   **Mapas:** Leaflet, React-Leaflet
*   **Rutas:** React Router 7
*   **Formularios y Validación:** React Hook Form
*   **Autenticación:** @react-oauth/google, Github OAuth2, credenciales nativas (email y contraseña)

## Requisitos y Configuración

1.  Asegúrate de tener Node.js instalado.
2.  Instala las dependencias:
    ```bash
    npm install
    ```
3.  Configura las variables de entorno (por ejemplo, URL del backend) basándote en un archivo `.env` local.

## Ejecución

*   **Servidor de desarrollo:**
    ```bash
    npm run dev
    ```
*   **Construir para producción:**
    ```bash
    npm run build
    ```
*   **Análisis de tipos:**
    ```bash
    npx tsc --noEmit
    ```

## Acceso a la app

Una vez lanzado el backend y el frontend, se puede acceder a la aplicación en: `http://localhost:5173`