import { defineConfig } from "cypress";
import { loadEnv } from "vite";

const env = loadEnv("test", process.cwd(), "");

export default defineConfig({
  allowCypressEnv: false,
  env: {
    API_BASE_URL: env.CYPRESS_API_BASE_URL || env.VITE_API_BASE_URL || "http://localhost:3000/api",
  },

  e2e: {
    baseUrl: "http://localhost:5173",

    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
