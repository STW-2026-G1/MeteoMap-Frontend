import { createBrowserRouter } from "react-router";
import LandingPage from "./pages/LandingPage";
import MapViewer from "./pages/MapViewer";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFoundPage from "./pages/NotFoundPage";
import ZoneForumPage from "./pages/ZoneForumPage";
import StatsPage from "./pages/StatsPage";
import ProfilePage from "./pages/ProfilePage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/mapa",
    Component: MapViewer,
  },
  {
    path: "/foro",
    Component: ZoneForumPage,
  },
  {
    path: "/estadisticas",
    Component: StatsPage,
  },
  {
    path: "/perfil",
    Component: ProfilePage,
  },
  {
    path: "/registro",
    Component: SignUpPage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/recuperar-password",
    Component: ForgotPasswordPage,
  },
  {
    path: "/reset-password",
    Component: ResetPasswordPage,
  },
  {
    path: "*",
    Component: NotFoundPage,
  },
]);