/**
 * @file Cypress configuration file
 * @description Configuración para Cypress, incluyendo la carga de variables de entorno desde Vite.
 * @author MeteoMap Team
 */
import { defineConfig } from "cypress";
import { loadEnv } from "vite";

const env = loadEnv("test", process.cwd(), "");

export default defineConfig({
  // Permitir el uso de `Cypress.env()` en tests (necesario para lectura desde los tests)
  allowCypressEnv: true,
  env: {
    // Usa la variable de entorno de Vite para la URL base de la API, con un valor predeterminado para pruebas locales
    API_BASE_URL: env.VITE_API_BASE_URL || "http://localhost:3000/api",
  },

  e2e: {
    // Configura la URL base para las pruebas end-to-end
    baseUrl: 'http://localhost:5173',

    setupNodeEvents(on, config) {
      // Aquí se puede agregar cualquier configuración adicional o plugins para Cypress
    },
  },
});
