/**
 * @file Header.tsx
 * @description Componente encabezado global de la aplicación que incluye navegación,
 * menú usuario autenticado, botón de sincronización de datos y acceso a admin.
 * @author MeteoMap Team
 */

import { Link, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Cloud, Menu, X, BarChart3, LogOut, Shield, MapPin } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { ImageWithFallback } from "./common/ImageWithFallback";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "./ui/sheet";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.rol === "ADMIN";

  /**
   * Realiza el logout del usuario y redirige al inicio
   * @returns {void}
   */
  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate("/");
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
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden text-gray-700 hover:text-blue-600"
                aria-label="Abrir menú"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-96 p-0 flex flex-col bg-white">
              {/* Hidden title for accessibility */}
              <SheetTitle className="sr-only">Menú de Navegación</SheetTitle>
              
              {/* Menu Header */}
              <div className="px-6 py-6 border-b bg-gradient-to-r from-blue-50 to-blue-100/50">
                <div className="flex items-center gap-2">
                  <Cloud className="h-6 w-6 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-900">Menú</h2>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                <nav className="p-6 space-y-2">
                  {/* Main Navigation */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Navegación</p>
                    <div className="space-y-1">
                      <Link
                        to="/mapa"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <MapPin className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium">Mapa</span>
                      </Link>
                      <a
                        href="/#como-funciona"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Cloud className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium">Cómo funciona</span>
                      </a>
                    </div>
                  </div>

                  {isAuthenticated && (
                    <>
                      {/* User Profile Section */}
                      <div className="pt-4 mt-6 border-t">
                        <div className="px-4 py-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg flex items-center gap-3 mb-4">
                          <ImageWithFallback
                            src={user?.avatar_url}
                            fallback={`https://api.dicebear.com/9.x/${user?.avatar_style || 'avataaars'}/svg?seed=${user?.avatar_seed || user?.name || 'User'}`}
                            alt={user?.name || "Avatar"}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-200"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                            <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                          </div>
                        </div>

                        {/* User Menu Items */}
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-4">Cuenta</p>
                        <div className="space-y-1">
                          <Link
                            to="/perfil"
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Cloud className="h-5 w-5 flex-shrink-0" />
                            <span className="font-medium">Mi Perfil</span>
                          </Link>

                          <Link
                            to="/estadisticas"
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <BarChart3 className="h-5 w-5 flex-shrink-0" />
                            <span className="font-medium">Estadísticas</span>
                          </Link>

                          {isAdmin && (
                            <Link
                              to="/admin"
                              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <Shield className="h-5 w-5 flex-shrink-0 text-amber-600" />
                              <span className="font-medium">Panel Admin</span>
                            </Link>
                          )}

                        </div>
                      </div>
                    </>
                  )}
                </nav>
              </div>

              {/* Footer Actions */}
              <div className="border-t bg-gray-50 px-6 py-4 space-y-3">
                {isAuthenticated ? (
                  <Button
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50 font-medium"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="w-full font-medium"
                      asChild
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link to="/login">Iniciar Sesión</Link>
                    </Button>
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 font-medium"
                      asChild
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link to="/registro">Registrarse</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}