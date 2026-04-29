import { Link, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Cloud, Menu, X, BarChart3, LogOut, RefreshCw, Shield } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { ImageWithFallback } from "./common/ImageWithFallback";
import { useWeatherSync } from "../../hooks/useWeatherSync";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { syncWeather } = useWeatherSync();
  const navigate = useNavigate();
  const isAdmin = user?.rol === "ADMIN";

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate("/");
  };

  const handleWeatherSync = async () => {
    setIsSyncing(true);
    toast.loading("Actualizando datos meteorológicos...");
    
    try {
      await syncWeather();
      toast.success("✓ Datos meteorológicos actualizados");
    } catch (error) {
      toast.error("Error al actualizar datos meteorológicos");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Cloud className="h-8 w-8 text-blue-600" />
            <span className="font-bold text-xl text-gray-900">Meteo Map</span>
          </Link>

          {/* Desktop Navigation & Auth - Combined */}
          <div className="hidden md:flex items-center gap-6">
            {/* Navigation Links */}
            <Link to="/mapa" className="text-gray-700 hover:text-blue-600 transition-colors text-sm font-medium">
              Mapa
            </Link>
            <a href="/#como-funciona" className="text-gray-700 hover:text-blue-600 transition-colors text-sm font-medium">
              Cómo funciona
            </a>

            {/* Auth buttons / User menu */}
            {isAuthenticated ? (
              <>
                {/* Weather Sync Button */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-700 hover:text-blue-600"
                  onClick={handleWeatherSync}
                  disabled={isSyncing}
                  title="Sincronizar datos meteorológicos"
                >
                  <RefreshCw className={`h-5 w-5 ${isSyncing ? "animate-spin" : ""}`} />
                </Button>

                {/* Stats/Chart Button */}
                <Button variant="ghost" size="icon" className="text-gray-700" asChild>
                  <Link to="/estadisticas">
                    <BarChart3 className="h-5 w-5" />
                  </Link>
                </Button>

                {/* User Dropdown Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full p-0 overflow-hidden w-8 h-8">
                      <ImageWithFallback
                        src={user?.avatar_url}
                        fallback={`https://api.dicebear.com/9.x/${user?.avatar_style || 'avataaars'}/svg?seed=${user?.avatar_seed || user?.name || 'User'}`}
                        alt="Avatar"
                        className="w-full h-full rounded-full object-cover"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/perfil" className="cursor-pointer">
                        Mi Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/mapa" className="cursor-pointer">
                        Ver Mapa
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/estadisticas" className="cursor-pointer">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Estadísticas
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer">
                          <Shield className="h-4 w-4 mr-2" />
                          Panel Admin
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 h-9 px-4 text-sm font-medium"
                  asChild
                >
                  <Link to="/login">Iniciar Sesión</Link>
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 h-9 px-4 text-sm font-medium"
                  asChild
                >
                  <Link to="/registro">Registrarse</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4 mt-8">
                <Link
                  to="/mapa"
                  className="text-lg text-gray-700 hover:text-blue-600 transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mapa
                </Link>
                <a
                  href="/#como-funciona"
                  className="text-lg text-gray-700 hover:text-blue-600 transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Cómo funciona
                </a>

                {isAuthenticated ? (
                  <>
                    <div className="border-t pt-4 mt-4">
                      <div className="flex items-center gap-3 mb-4 p-2 bg-gray-50 rounded-lg">
                        <ImageWithFallback
                          src={user?.avatar_url}
                          fallback={`https://api.dicebear.com/9.x/${user?.avatar_style || 'avataaars'}/svg?seed=${user?.avatar_seed || user?.name || 'User'}`}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm font-medium">{user?.name}</p>
                          <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>
                      </div>
                    </div>

                    <Link
                      to="/perfil"
                      className="flex items-center gap-2 text-lg text-gray-700 hover:text-blue-600 transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Mi Perfil
                    </Link>

                    <Link
                      to="/estadisticas"
                      className="flex items-center gap-2 text-lg text-gray-700 hover:text-blue-600 transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <BarChart3 className="h-5 w-5" />
                      Estadísticas
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 text-lg text-gray-700 hover:text-blue-600 transition-colors py-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Shield className="h-5 w-5" />
                        Panel Admin
                      </Link>
                    )}

                    <Button
                      variant="ghost"
                      className="justify-start w-full text-gray-700 hover:text-blue-600"
                      onClick={handleWeatherSync}
                      disabled={isSyncing}
                    >
                      <RefreshCw className={`h-5 w-5 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                      {isSyncing ? "Sincronizando..." : "Actualizar Meteorología"}
                    </Button>

                    <Button
                      variant="outline"
                      className="justify-start text-red-600 border-red-200 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-5 w-5 mr-2" />
                      Cerrar Sesión
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="border-t pt-4 mt-4 space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        asChild
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Link to="/login">Iniciar Sesión</Link>
                      </Button>
                      <Button
                        className="w-full justify-start"
                        asChild
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Link to="/registro">Registrarse</Link>
                      </Button>
                    </div>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}