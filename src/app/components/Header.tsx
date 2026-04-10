import { Link } from "react-router";
import { Button } from "./ui/button";
import { Cloud, Menu, X, BarChart3, User, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
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
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
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
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <User className="h-5 w-5" />
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
                        <User className="h-4 w-4 mr-2" />
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
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                          {(user?.name || user?.nombre || "U")?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{user?.name || user?.nombre}</p>
                          <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>
                      </div>
                    </div>

                    <Link
                      to="/perfil"
                      className="flex items-center gap-2 text-lg text-gray-700 hover:text-blue-600 transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-5 w-5" />
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