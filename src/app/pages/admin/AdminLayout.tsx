import { Link, Outlet, useLocation } from "react-router";
import { Users, FileText, Map, LayoutDashboard, Menu, X } from "lucide-react";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "../../components/ui/sheet";
import { Button } from "../../components/ui/button";

export default function AdminLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/admin/usuarios", label: "Usuarios", icon: Users },
    { path: "/admin/moderacion", label: "Moderación", icon: FileText },
    { path: "/admin/configuracion", label: "Configuración", icon: Map },
  ];

  const NavItems = ({ onClick }: { onClick?: () => void }) => (
    <>
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path || (location.pathname === "/admin" && item.path === "/admin/dashboard");
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              isActive
                ? "bg-blue-600 text-white shadow-lg"
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex-1 flex pt-16">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6 pt-8 shadow-2xl">
          <div className="w-full">
            <h2 className="text-2xl font-bold mb-8 text-white">Panel Admin</h2>
            <nav className="space-y-2">
              <NavItems />
            </nav>
          </div>
        </aside>

        {/* Mobile Menu Button */}
        <div className="lg:hidden fixed bottom-6 right-6 z-40">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                size="icon"
                className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-2xl"
              >
                <Menu className="h-6 w-6 text-white" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-gradient-to-b from-slate-900 to-slate-800 text-white border-0">
              <div className="py-6">
                <h2 className="text-2xl font-bold mb-8 text-white">Panel Admin</h2>
                <nav className="space-y-2">
                  <NavItems onClick={() => setMobileMenuOpen(false)} />
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
