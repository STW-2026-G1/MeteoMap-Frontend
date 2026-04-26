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
import { ProtectedRoute } from "./components/ProtectedRoute";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminModeration from "./pages/admin/AdminModeration";
import AdminZones from "./pages/admin/AdminZones";

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
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
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
    path: "/admin",
    Component: AdminLayout,
    children: [
      {
        index: true,
        Component: AdminDashboard,
      },
      {
        path: "dashboard",
        Component: AdminDashboard,
      },
      {
        path: "usuarios",
        Component: AdminUsers,
      },
      {
        path: "moderacion",
        Component: AdminModeration,
      },
      {
        path: "configuracion",
        Component: AdminZones,
      },
    ],
  },
  {
    path: "*",
    Component: NotFoundPage,
  },
]);