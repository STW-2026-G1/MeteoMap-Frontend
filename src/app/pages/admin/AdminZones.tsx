import { useState } from "react";
import { Card } from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Pencil, Trash2, Plus } from "lucide-react";

const mockZones = [
  { id: 1, name: "Sierra de Guadarrama", coords: "40.78, -4.02", status: "Activo" },
  { id: 2, name: "Picos de Europa", coords: "43.20, -4.85", status: "Activo" },
  { id: 3, name: "Valle de Barrabés", coords: "42.60, 0.50", status: "Activo" },
];

const mockCategories = [
  { id: 1, name: "Alud" },
  { id: 2, name: "Nieve Blanda" },
  { id: 3, name: "Placas de hielo" },
  { id: 4, name: "Grietas" },
];

export default function AdminZones() {
  const [zones, setZones] = useState(mockZones);
  const [categories, setCategories] = useState(mockCategories);

  const handleDeleteZone = (id: number) => {
    setZones(zones.filter((zone) => zone.id !== id));
  };

  const handleDeleteCategory = (id: number) => {
    setCategories(categories.filter((cat) => cat.id !== id));
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Configuración del Sistema</h1>
        <p className="text-gray-500 mt-2">Gestión de zonas y categorías</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl md:text-2xl font-bold">Gestión de Zonas</h2>
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md text-sm">
              <Plus className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Añadir</span>
            </Button>
          </div>

          {/* Desktop Table */}
          <Card className="overflow-hidden border-0 shadow-lg hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-700 hover:to-slate-800">
                  <TableHead className="text-white font-semibold">Nombre</TableHead>
                  <TableHead className="text-white font-semibold">Coordenadas</TableHead>
                  <TableHead className="text-white font-semibold">Estado</TableHead>
                  <TableHead className="w-32 text-white font-semibold text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((zone) => (
                  <TableRow key={zone.id} className="hover:bg-blue-50/50 transition-colors border-b border-gray-100">
                    <TableCell className="py-5 font-medium text-gray-900">{zone.name}</TableCell>
                    <TableCell className="py-5 text-gray-600 font-mono text-sm">{zone.coords}</TableCell>
                    <TableCell className="py-5">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {zone.status}
                      </span>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex gap-2 justify-center">
                        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                          <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                          onClick={() => handleDeleteZone(zone.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {zones.map((zone) => (
              <Card key={zone.id} className="p-4 border-0 shadow-md">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{zone.name}</h3>
                      <p className="text-xs text-gray-600 font-mono mt-1">{zone.coords}</p>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                        {zone.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                      onClick={() => handleDeleteZone(zone.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl md:text-2xl font-bold">Categorías</h2>
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md text-sm">
              <Plus className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Añadir</span>
            </Button>
          </div>

          <Card className="p-4 md:p-6 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 md:p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
                >
                  <span className="font-medium text-gray-900 text-sm md:text-base">{category.name}</span>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" className="h-8 w-8 md:h-9 md:w-9 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                      <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 md:h-9 md:w-9 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
