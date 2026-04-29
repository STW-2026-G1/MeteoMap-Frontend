import { useEffect, useMemo, useState } from "react";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { RefreshCw, Search, Trash2 } from "lucide-react";

export default function AdminModeration() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredReports = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return reports;

    return reports.filter((report) => {
      const userName = report.usuario_id?.perfil?.nombre || report.usuario_id?.nombre || report.usuario_id?.email || "";
      const categoryName = report.categoria_id?.nombre || report.categoria_id || "";
      const zoneName = report.zona_id?.nombre || report.zona_id || "";
      const description = report.contenido?.descripcion || "";

      return (
        userName.toLowerCase().includes(normalized) ||
        String(categoryName).toLowerCase().includes(normalized) ||
        String(zoneName).toLowerCase().includes(normalized) ||
        description.toLowerCase().includes(normalized) ||
        String(report.estado || "").toLowerCase().includes(normalized)
      );
    });
  }, [reports, searchTerm]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/reports`);
      const data = await resp.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const openDeleteDialog = (id: string) => {
    setDeletingId(id);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    const token = localStorage.getItem("meteomap_token");
    try {
      const resp = await fetch(`${API_BASE_URL}/admin/reports/${deletingId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        console.error("Failed to delete report:", err);
        return;
      }

      setReports((s) => s.filter((r) => r._id !== deletingId));
    } catch (err) {
      console.error(err);
    } finally {
      setDialogOpen(false);
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Moderación Reportes</h1>
          <p className="text-gray-500 mt-2">Revisión y moderación de reportes (todas las zonas)</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por usuario, zona, categoría o estado"
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={loadReports} disabled={loading} className="shrink-0">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Recargar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5 border-0 shadow-lg bg-gradient-to-br from-slate-800 to-slate-900 text-white">
          <p className="text-sm text-slate-300">Reportes totales</p>
          <p className="text-3xl font-bold mt-1">{reports.length}</p>
        </Card>
      </div>

      {loading ? (
        <Card className="p-4 border-0 shadow-lg text-gray-500">Cargando reportes...</Card>
      ) : (
        <Card className="overflow-hidden border-0 shadow-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-slate-700 to-slate-800">
                <TableHead className="text-white font-semibold">Fecha</TableHead>
                <TableHead className="text-white font-semibold">Usuario</TableHead>
                <TableHead className="text-white font-semibold">Tipo</TableHead>
                <TableHead className="text-white font-semibold">Zona</TableHead>
                <TableHead className="text-white font-semibold">Estado</TableHead>
                <TableHead className="w-32 text-white font-semibold text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-gray-500">
                    No hay reportes para mostrar
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map((report) => (
                  <TableRow key={report._id} className="hover:bg-red-50/30 transition-colors border-b border-gray-100">
                    <TableCell className="py-5 font-medium text-gray-900">{new Date(report.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="py-5 text-gray-700">{report.usuario_id?.perfil?.nombre || report.usuario_id?.nombre || report.usuario_id?.email}</TableCell>
                    <TableCell className="py-5">{report.categoria_id?.nombre || report.categoria_id}</TableCell>
                    <TableCell className="py-5 text-gray-700">{report.zona_id?.nombre || report.zona_id}</TableCell>
                    <TableCell className="py-5">{report.estado || 'pendiente'}</TableCell>
                    <TableCell className="py-5">
                      <div className="flex justify-center">
                        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg bg-red-500 hover:bg-red-600 transition-colors" onClick={() => openDeleteDialog(report._id)}>
                          <Trash2 className="h-4 w-4 text-white" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Delete confirmation dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold">Confirmar eliminación</h3>
            <p className="text-sm text-gray-600 mt-2">Esta acción borrará el reporte y sus comentarios asociados. ¿Deseas continuar?</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setDialogOpen(false); setDeletingId(null); }}>Cancelar</Button>
              <Button className="bg-red-500 text-white" onClick={confirmDelete}>Borrar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
