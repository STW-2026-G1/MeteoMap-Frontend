
/**
 * @file main.tsx
 * @description Punto de entrada de la aplicación React, renderiza el componente App
 * en el elemento root del DOM.
 * @author MeteoMap Team
 */

  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(<App />);
  