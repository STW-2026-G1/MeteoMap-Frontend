import { useEffect, useMemo, useState } from "react";
import { MapContainer, CircleMarker, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { MapPinned, Pencil, Plus, RefreshCw, Shapes, Trash2 } from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000/api";
const DEFAULT_CENTER: [number, number] = [42.7, -1.6];

type AdminZone = {
  _id: string;
  nombre: string;
  descripcion?: string;
  estado: "ACTIVA" | "INACTIVA";
  geolocalizacion: {
    type: "Point";
    coordinates: [number, number];
  };
  createdAt?: string;
  updatedAt?: string;
};

type AdminCategory = {
  _id: string;
  nombre: string;
  descripcion?: string;
  icono_marcador?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ZoneFormState = {
  nombre: string;
  descripcion: string;
  estado: "ACTIVA" | "INACTIVA";
  latitud: string;
  longitud: string;
};

type CategoryFormState = {
  nombre: string;
  descripcion: string;
  icono_marcador: string;
};

type DeleteTarget =
  | { kind: "zone"; zone: AdminZone }
  | { kind: "category"; category: AdminCategory }
  | null;

const emptyZoneForm: ZoneFormState = {
  nombre: "",
  descripcion: "",
  estado: "ACTIVA",
  latitud: "",
  longitud: "",
};

const emptyCategoryForm: CategoryFormState = {
  nombre: "",
  descripcion: "",
  icono_marcador: "",
};

function getErrorMessage(data: any, fallback: string) {
  const validationMessage = Array.isArray(data?.errors) && data.errors.length > 0 ? data.errors[0]?.message : null;
  return validationMessage || data?.message || data?.error || fallback;
}

function getToken() {
  return localStorage.getItem("meteomap_token");
}

function formatCoordinates(zone: AdminZone) {
  const [lng, lat] = zone.geolocalizacion.coordinates;
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function MapCoordinatePicker({
  value,
  onChange,
}: {
  value: [number, number] | null;
  onChange: (coordinates: [number, number]) => void;
}) {
  function ClickHandler() {
    useMapEvents({
      click(event) {
        onChange([event.latlng.lng, event.latlng.lat]);
      },
    });

    return null;
  }

  const center: [number, number] = value ? [value[1], value[0]] : DEFAULT_CENTER;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <MapContainer center={center} zoom={6} scrollWheelZoom className="h-72 w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler />
        {value && (
          <CircleMarker
            center={[value[1], value[0]]}
            radius={12}
            pathOptions={{ color: "#2563eb", fillColor: "#60a5fa", fillOpacity: 0.9, weight: 3 }}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default function AdminZones() {
  const [zones, setZones] = useState<AdminZone[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [savingZone, setSavingZone] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [deletingZoneId, setDeletingZoneId] = useState<string | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

  const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<AdminZone | null>(null);
  const [zoneForm, setZoneForm] = useState<ZoneFormState>(emptyZoneForm);

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const filteredZones = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return zones;

    return zones.filter((zone) => {
      return (
        zone.nombre.toLowerCase().includes(normalized) ||
        (zone.descripcion || "").toLowerCase().includes(normalized) ||
        zone.estado.toLowerCase().includes(normalized) ||
        formatCoordinates(zone).toLowerCase().includes(normalized)
      );
    });
  }, [searchTerm, zones]);

  const filteredCategories = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return categories;

    return categories.filter((category) => {
      return (
        category.nombre.toLowerCase().includes(normalized) ||
        (category.descripcion || "").toLowerCase().includes(normalized) ||
        (category.icono_marcador || "").toLowerCase().includes(normalized)
      );
    });
  }, [searchTerm, categories]);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [zonesResponse, categoriesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/zones?estado=ALL`),
        fetch(`${API_BASE_URL}/categories`),
      ]);

      const zonesData = await zonesResponse.json();
      const categoriesData = await categoriesResponse.json();

      if (!zonesResponse.ok) {
        throw new Error(zonesData?.message || zonesData?.error || "No se pudieron cargar las zonas");
      }

      if (!categoriesResponse.ok) {
        throw new Error(
          categoriesData?.message || categoriesData?.error || "No se pudieron cargar las categorías"
        );
      }

      setZones(Array.isArray(zonesData?.data) ? zonesData.data : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateZoneDialog = () => {
    setEditingZone(null);
    setZoneForm(emptyZoneForm);
    setZoneDialogOpen(true);
  };

  const openEditZoneDialog = (zone: AdminZone) => {
    setEditingZone(zone);
    setZoneForm({
      nombre: zone.nombre || "",
      descripcion: zone.descripcion || "",
      estado: zone.estado || "ACTIVA",
      latitud: String(zone.geolocalizacion.coordinates[1] ?? ""),
      longitud: String(zone.geolocalizacion.coordinates[0] ?? ""),
    });
    setZoneDialogOpen(true);
  };

  const closeZoneDialog = () => {
    setZoneDialogOpen(false);
    setEditingZone(null);
    setZoneForm(emptyZoneForm);
  };

  const openCreateCategoryDialog = () => {
    setEditingCategory(null);
    setCategoryForm(emptyCategoryForm);
    setCategoryDialogOpen(true);
  };

  const openEditCategoryDialog = (category: AdminCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      nombre: category.nombre || "",
      descripcion: category.descripcion || "",
      icono_marcador: category.icono_marcador || "",
    });
    setCategoryDialogOpen(true);
  };

  const closeCategoryDialog = () => {
    setCategoryDialogOpen(false);
    setEditingCategory(null);
    setCategoryForm(emptyCategoryForm);
  };

  const saveZone = async () => {
    const token = getToken();

    if (!token) {
      toast.error("No se encontró una sesión válida");
      return;
    }

    const lat = Number(zoneForm.latitud);
    const lng = Number(zoneForm.longitud);

    if (!zoneForm.nombre.trim()) {
      toast.error("El nombre de la zona es obligatorio");
      return;
    }

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      toast.error("Las coordenadas deben ser números válidos");
      return;
    }

    setSavingZone(true);
    try {
      const payload = {
        nombre: zoneForm.nombre.trim(),
        descripcion: zoneForm.descripcion.trim(),
        estado: zoneForm.estado,
        geolocalizacion: {
          type: "Point",
          coordinates: [lng, lat],
        },
      };

      const response = await fetch(
        editingZone ? `${API_BASE_URL}/zones/${editingZone._id}` : `${API_BASE_URL}/zones`,
        {
          method: editingZone ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(getErrorMessage(data, "No se pudo guardar la zona"));
      }

      const savedZone = data?.data;
      if (savedZone) {
        setZones((currentZones) => {
          if (editingZone) {
            return currentZones.map((zone) => (zone._id === editingZone._id ? savedZone : zone));
          }

          return [savedZone, ...currentZones];
        });
      }

      toast.success(editingZone ? "Zona actualizada" : "Zona creada");
      closeZoneDialog();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      toast.error(message);
    } finally {
      setSavingZone(false);
    }
  };

  const saveCategory = async () => {
    const token = getToken();

    if (!token) {
      toast.error("No se encontró una sesión válida");
      return;
    }

    if (!categoryForm.nombre.trim()) {
      toast.error("El nombre de la categoría es obligatorio");
      return;
    }

    setSavingCategory(true);
    try {
      const payload = {
        nombre: categoryForm.nombre.trim(),
        descripcion: categoryForm.descripcion.trim(),
        icono_marcador: categoryForm.icono_marcador.trim(),
      };

      const response = await fetch(
        editingCategory ? `${API_BASE_URL}/categories/${editingCategory._id}` : `${API_BASE_URL}/categories`,
        {
          method: editingCategory ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(getErrorMessage(data, "No se pudo guardar la categoría"));
      }

      const savedCategory = data?.category;
      if (savedCategory) {
        setCategories((currentCategories) => {
          if (editingCategory) {
            return currentCategories.map((category) =>
              category._id === editingCategory._id ? savedCategory : category
            );
          }

          return [savedCategory, ...currentCategories];
        });
      }

      toast.success(editingCategory ? "Categoría actualizada" : "Categoría creada");
      closeCategoryDialog();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      toast.error(message);
    } finally {
      setSavingCategory(false);
    }
  };

  const openDeleteDialog = (target: DeleteTarget) => {
    setDeleteTarget(target);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    const token = getToken();
    if (!token) {
      toast.error("No se encontró una sesión válida");
      closeDeleteDialog();
      return;
    }

    try {
      if (deleteTarget.kind === "zone") {
        setDeletingZoneId(deleteTarget.zone._id);
        const response = await fetch(`${API_BASE_URL}/zones/${deleteTarget.zone._id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(getErrorMessage(data, "No se pudo eliminar la zona"));
        }

        setZones((currentZones) => currentZones.filter((currentZone) => currentZone._id !== deleteTarget.zone._id));
        toast.success("Zona eliminada");
      } else {
        setDeletingCategoryId(deleteTarget.category._id);
        const response = await fetch(`${API_BASE_URL}/categories/${deleteTarget.category._id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(getErrorMessage(data, "No se pudo eliminar la categoría"));
        }

        setCategories((currentCategories) =>
          currentCategories.filter((currentCategory) => currentCategory._id !== deleteTarget.category._id)
        );
        toast.success("Categoría eliminada");
      }

      closeDeleteDialog();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      toast.error(message);
    } finally {
      setDeletingZoneId(null);
      setDeletingCategoryId(null);
    }
  };

  const zoneCoordinates =
    zoneDialogOpen && zoneForm.latitud && zoneForm.longitud
      ? ([Number(zoneForm.longitud), Number(zoneForm.latitud)] as [number, number])
      : null;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Zonas y categorías</h1>
          <p className="text-gray-500 mt-2">Alta, edición y mantenimiento del catálogo del sistema</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-80">
            <Shapes className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar zonas o categorías"
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={loadData} disabled={loading} className="shrink-0">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Recargar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5 border-0 shadow-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <p className="text-sm text-blue-100">Zonas</p>
          <p className="text-3xl font-bold mt-1">{zones.length}</p>
        </Card>
        <Card className="p-5 border-0 shadow-lg bg-gradient-to-br from-slate-800 to-slate-900 text-white">
          <p className="text-sm text-slate-300">Categorías</p>
          <p className="text-3xl font-bold mt-1">{categories.length}</p>
        </Card>
      </div>

      {error && <Card className="p-4 border-red-200 bg-red-50 text-red-800">{error}</Card>}

      <div className="grid grid-cols-1 gap-6 md:gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl md:text-2xl font-bold">Gestión de Zonas</h2>
            <Button
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md text-sm"
              onClick={openCreateZoneDialog}
            >
              <Plus className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Añadir zona</span>
            </Button>
          </div>

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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-gray-500">
                      Cargando zonas...
                    </TableCell>
                  </TableRow>
                ) : filteredZones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-gray-500">
                      No hay zonas para mostrar
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredZones.map((zone) => (
                    <TableRow key={zone._id} className="hover:bg-blue-50/50 transition-colors border-b border-gray-100">
                      <TableCell className="py-5 font-medium text-gray-900">
                        <div className="flex flex-col">
                          <span>{zone.nombre}</span>
                          <span className="text-xs text-gray-500">ID: {zone._id}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-5 text-gray-600 font-mono text-sm">{formatCoordinates(zone)}</TableCell>
                      <TableCell className="py-5">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            zone.estado === "ACTIVA"
                              ? "bg-green-100 text-green-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {zone.estado}
                        </span>
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                            onClick={() => openEditZoneDialog(zone)}
                          >
                            <Pencil className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                            onClick={() => openDeleteDialog({ kind: "zone", zone })}
                            disabled={deletingZoneId === zone._id}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          <div className="md:hidden space-y-3">
            {loading ? (
              <Card className="p-4 border-0 shadow-md text-center text-gray-500">Cargando zonas...</Card>
            ) : filteredZones.length === 0 ? (
              <Card className="p-4 border-0 shadow-md text-center text-gray-500">No hay zonas para mostrar</Card>
            ) : (
              filteredZones.map((zone) => (
                <Card key={zone._id} className="p-4 border-0 shadow-md">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{zone.nombre}</h3>
                        <p className="text-sm text-gray-600 mt-1 font-mono">{formatCoordinates(zone)}</p>
                        <p className="text-xs text-gray-500 mt-1">ID: {zone._id}</p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          zone.estado === "ACTIVA"
                            ? "bg-green-100 text-green-800"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {zone.estado}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                        onClick={() => openEditZoneDialog(zone)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                        onClick={() => openDeleteDialog({ kind: "zone", zone })}
                        disabled={deletingZoneId === zone._id}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl md:text-2xl font-bold">Categorías</h2>
            <Button
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md text-sm"
              onClick={openCreateCategoryDialog}
            >
              <Plus className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Añadir categoría</span>
            </Button>
          </div>

          <Card className="p-4 md:p-6 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            <div className="space-y-3">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Cargando categorías...</div>
              ) : filteredCategories.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No hay categorías para mostrar</div>
              ) : (
                filteredCategories.map((category) => (
                  <div
                    key={category._id}
                    className="flex items-center justify-between p-3 md:p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 text-sm md:text-base truncate">
                          {category.nombre}
                        </span>
                        {category.icono_marcador ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {category.icono_marcador}
                          </span>
                        ) : null}
                      </div>
                      {category.descripcion ? (
                        <p className="text-xs md:text-sm text-gray-500 mt-1 line-clamp-2">
                          {category.descripcion}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 md:h-9 md:w-9 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                        onClick={() => openEditCategoryDialog(category)}
                      >
                        <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 md:h-9 md:w-9 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                        onClick={() => openDeleteDialog({ kind: "category", category })}
                        disabled={deletingCategoryId === category._id}
                      >
                        <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={zoneDialogOpen} onOpenChange={(open) => (!open ? closeZoneDialog() : null)}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingZone ? "Editar zona" : "Añadir zona"}</DialogTitle>
            <DialogDescription>
              Define el nombre, el estado y selecciona las coordenadas haciendo clic sobre el mapa.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="zone-name">Nombre</Label>
                <Input
                  id="zone-name"
                  value={zoneForm.nombre}
                  onChange={(e) => setZoneForm((current) => ({ ...current, nombre: e.target.value }))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="zone-description">Descripción</Label>
                <textarea
                  id="zone-description"
                  value={zoneForm.descripcion}
                  onChange={(e) => setZoneForm((current) => ({ ...current, descripcion: e.target.value }))}
                  className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Descripción breve de la zona"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="zone-status">Estado</Label>
                <select
                  id="zone-status"
                  value={zoneForm.estado}
                  onChange={(e) =>
                    setZoneForm((current) => ({
                      ...current,
                      estado: e.target.value as "ACTIVA" | "INACTIVA",
                    }))
                  }
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="ACTIVA">ACTIVA</option>
                  <option value="INACTIVA">INACTIVA</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="zone-lat">Latitud</Label>
                  <Input
                    id="zone-lat"
                    inputMode="decimal"
                    value={zoneForm.latitud}
                    onChange={(e) => setZoneForm((current) => ({ ...current, latitud: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="zone-lng">Longitud</Label>
                  <Input
                    id="zone-lng"
                    inputMode="decimal"
                    value={zoneForm.longitud}
                    onChange={(e) => setZoneForm((current) => ({ ...current, longitud: e.target.value }))}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/50 p-4 text-sm text-blue-900">
                <p className="font-semibold">Consejo</p>
                <p className="mt-1 text-blue-800">
                  Haz clic en el mapa para posicionar la zona. Los campos de latitud y longitud se actualizarán automáticamente.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <MapPinned className="h-4 w-4 text-blue-600" />
                Selección en mapa
              </div>
              <MapCoordinatePicker
                value={zoneCoordinates}
                onChange={(coordinates) =>
                  setZoneForm((current) => ({
                    ...current,
                    longitud: String(coordinates[0]),
                    latitud: String(coordinates[1]),
                  }))
                }
              />
              <p className="text-xs text-gray-500">
                Coordenadas guardadas como <span className="font-mono">[longitud, latitud]</span> en MongoDB.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeZoneDialog} disabled={savingZone}>
              Cancelar
            </Button>
            <Button onClick={saveZone} disabled={savingZone}>
              {savingZone ? "Guardando..." : editingZone ? "Guardar cambios" : "Crear zona"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryDialogOpen} onOpenChange={(open) => (!open ? closeCategoryDialog() : null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Editar categoría" : "Añadir categoría"}</DialogTitle>
            <DialogDescription>
              Gestiona las categorías que después se usan al crear reportes.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="category-name">Nombre</Label>
              <Input
                id="category-name"
                value={categoryForm.nombre}
                onChange={(e) => setCategoryForm((current) => ({ ...current, nombre: e.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category-icon">Icono marcador</Label>
              <Input
                id="category-icon"
                value={categoryForm.icono_marcador}
                onChange={(e) =>
                  setCategoryForm((current) => ({ ...current, icono_marcador: e.target.value }))
                }
                placeholder="snowflake, mountain, alert-triangle..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category-description">Descripción</Label>
              <textarea
                id="category-description"
                value={categoryForm.descripcion}
                onChange={(e) => setCategoryForm((current) => ({ ...current, descripcion: e.target.value }))}
                className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Descripción de la categoría"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeCategoryDialog} disabled={savingCategory}>
              Cancelar
            </Button>
            <Button onClick={saveCategory} disabled={savingCategory}>
              {savingCategory ? "Guardando..." : editingCategory ? "Guardar cambios" : "Crear categoría"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={(open) => (!open ? closeDeleteDialog() : null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {deleteTarget?.kind === "zone" ? "Eliminar zona" : "Eliminar categoría"}
            </DialogTitle>
            <DialogDescription>
              {deleteTarget?.kind === "zone"
                ? `¿Seguro que deseas eliminar la zona ${deleteTarget.zone.nombre}? Se borrarán también sus reportes, comentarios y se quitará de favoritos.`
                : `¿Seguro que deseas eliminar la categoría ${deleteTarget?.category.nombre}? Se borrarán también sus reportes y comentarios asociados.`}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteDialog} disabled={deletingZoneId !== null || deletingCategoryId !== null}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deletingZoneId !== null || deletingCategoryId !== null}
            >
              {deletingZoneId !== null || deletingCategoryId !== null ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}