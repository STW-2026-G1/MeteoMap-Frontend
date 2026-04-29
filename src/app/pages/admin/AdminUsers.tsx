import { useEffect, useMemo, useState } from "react";
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
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Pencil, Trash2, RefreshCw, Search, RotateCcw, UserRound } from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000/api";

type AdminUser = {
  id: string;
  nombre: string;
  email: string;
  estado: "ACTIVO" | "ELIMINADO";
  rol: string;
  provider?: string;
  biografia?: string;
  ubicacion?: string;
  avatar_style?: string;
  avatar_seed?: string;
  avatar_url?: string;
  createdAt?: string;
  updatedAt?: string;
};

type EditFormState = {
  nombre: string;
  email: string;
  estado: "ACTIVO" | "ELIMINADO";
  biografia: string;
  ubicacion: string;
  avatar_style: string;
};

const emptyForm: EditFormState = {
  nombre: "",
  email: "",
  estado: "ACTIVO",
  biografia: "",
  ubicacion: "",
  avatar_style: "avataaars",
};

function getStateBadgeClasses(estado: string) {
  if (estado === "ACTIVO") {
    return "bg-green-100 text-green-800";
  }

  if (estado === "BLOQUEADO") {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-red-100 text-red-800";
}

function getProviderLabel(provider?: string) {
  if (provider === "google") return "Google";
  if (provider === "local") return "Local";
  return "Desconocido";
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<EditFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const filteredUsers = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return users;

    return users.filter((user) => {
      return (
        user.nombre.toLowerCase().includes(normalized) ||
        user.email.toLowerCase().includes(normalized) ||
        user.estado.toLowerCase().includes(normalized) ||
        getProviderLabel(user.provider).toLowerCase().includes(normalized)
      );
    });
  }, [searchTerm, users]);

  const loadUsers = async () => {
    const token = localStorage.getItem("meteomap_token");

    if (!token) {
      setError("No se encontró una sesión válida.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data?.error || data?.message || "No se pudieron cargar los usuarios";
        throw new Error(message);
      }

      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openEditDialog = (user: AdminUser) => {
    setEditingUser(user);
    setForm({
      nombre: user.nombre || "",
      email: user.email || "",
      estado: user.estado || "ACTIVO",
      biografia: user.biografia || "",
      ubicacion: user.ubicacion || "",
      avatar_style: user.avatar_style || "avataaars",
    });
  };

  const closeEditDialog = () => {
    setEditingUser(null);
    setForm(emptyForm);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    const token = localStorage.getItem("meteomap_token");
    if (!token) {
      toast.error("No se encontró la sesión.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "No se pudo actualizar el usuario");
      }

      setUsers((currentUsers) =>
        currentUsers.map((user) => (user.id === editingUser.id ? data.user : user))
      );
      toast.success("Usuario actualizado correctamente");
      closeEditDialog();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = (user: AdminUser) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    const token = localStorage.getItem("meteomap_token");
    if (!token) {
      toast.error("No se encontró la sesión.");
      setShowDeleteConfirm(false);
      return;
    }

    setDeletingId(userToDelete.id);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || data?.message || "No se pudo eliminar el usuario");
      }

      setUsers((currentUsers) => currentUsers.filter((currentUser) => currentUser.id !== userToDelete.id));
      toast.success("Usuario eliminado correctamente");
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRestoreUser = (user: AdminUser) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const confirmRestoreUser = async () => {
    if (!userToDelete) return;

    const token = localStorage.getItem("meteomap_token");
    if (!token) {
      toast.error("No se encontró la sesión.");
      setShowDeleteConfirm(false);
      return;
    }

    setRestoringId(userToDelete.id);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userToDelete.id}/restore`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || data?.message || "No se pudo restaurar el usuario");
      }

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) => (currentUser.id === userToDelete.id ? data.user : currentUser))
      );
      toast.success("Usuario restaurado correctamente");
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      toast.error(message);
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500 mt-2">Gestión de usuarios registrados, excluyendo administradores</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, email o estado"
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={loadUsers} disabled={loading} className="shrink-0">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Recargar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5 border-0 shadow-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-100">Activos</p>
              <p className="text-3xl font-bold mt-1">{filteredUsers.filter((user) => user.estado === "ACTIVO").length}</p>
            </div>
            <UserRound className="h-10 w-10 text-blue-100" />
          </div>
        </Card>
        <Card className="p-5 border-0 shadow-lg bg-gradient-to-br from-red-600 to-red-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-100">Eliminados</p>
              <p className="text-3xl font-bold mt-1">{filteredUsers.filter((user) => user.estado === "ELIMINADO").length}</p>
            </div>
            <RotateCcw className="h-10 w-10 text-red-100" />
          </div>
        </Card>
      </div>

      {error && (
        <Card className="p-4 border-red-200 bg-red-50 text-red-800">
          {error}
        </Card>
      )}

      {/* Desktop Table */}
      <Card className="overflow-hidden border-0 shadow-lg hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-700 hover:to-slate-800">
              <TableHead className="text-white font-semibold">Nombre</TableHead>
              <TableHead className="text-white font-semibold">Correo electrónico</TableHead>
              <TableHead className="text-white font-semibold">Estado</TableHead>
              <TableHead className="text-white font-semibold">Origen</TableHead>
              <TableHead className="w-36 text-white font-semibold text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-gray-500">
                  Cargando usuarios...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-gray-500">
                  No hay usuarios para mostrar
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-blue-50/50 transition-colors border-b border-gray-100">
                  <TableCell className="py-5 font-medium text-gray-900">
                    <div className="flex flex-col">
                      <span>{user.nombre || "Sin nombre"}</span>
                      <span className="text-xs text-gray-500">ID: {user.id}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 text-gray-600">{user.email}</TableCell>
                  <TableCell className="py-5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStateBadgeClasses(user.estado)}`}>
                      {user.estado}
                    </span>
                  </TableCell>
                  <TableCell className="py-5 text-gray-600">{getProviderLabel(user.provider)}</TableCell>
                  <TableCell className="py-5">
                    <div className="flex gap-2 justify-center">
                      {user.estado === "ACTIVO" ? (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                            onClick={() => openEditDialog(user)}
                          >
                            <Pencil className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                            onClick={() => handleDeleteUser(user)}
                            disabled={deletingId === user.id}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
                          onClick={() => handleRestoreUser(user)}
                          disabled={restoringId === user.id}
                        >
                          <RotateCcw className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <Card className="p-4 border-0 shadow-md text-center text-gray-500">Cargando usuarios...</Card>
        ) : filteredUsers.length === 0 ? (
          <Card className="p-4 border-0 shadow-md text-center text-gray-500">No hay usuarios para mostrar</Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id} className="p-4 border-0 shadow-md">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{user.nombre || "Sin nombre"}</h3>
                    <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                    <p className="text-xs text-gray-500 mt-1">{getProviderLabel(user.provider)}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStateBadgeClasses(user.estado)}`}>
                    {user.estado}
                  </span>
                </div>
                <div className="flex gap-2 pt-2">
                  {user.estado === "ACTIVO" ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                        onClick={() => openEditDialog(user)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                        onClick={() => handleDeleteUser(user)}
                        disabled={deletingId === user.id}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                      onClick={() => handleRestoreUser(user)}
                      disabled={restoringId === user.id}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restaurar
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!editingUser} onOpenChange={(open) => (!open ? closeEditDialog() : null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>
              Actualiza datos básicos del usuario. Los administradores no aparecen en esta lista.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => setForm((current) => ({ ...current, nombre: e.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="estado">Estado</Label>
              <select
                id="estado"
                value={form.estado}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    estado: "ACTIVO",
                  }))
                }
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled
              >
                <option value="ACTIVO">ACTIVO</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ubicacion">Ubicación</Label>
              <Input
                id="ubicacion"
                value={form.ubicacion}
                onChange={(e) => setForm((current) => ({ ...current, ubicacion: e.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="biografia">Biografía</Label>
              <textarea
                id="biografia"
                value={form.biografia}
                onChange={(e) => setForm((current) => ({ ...current, biografia: e.target.value }))}
                className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Biografía del usuario"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser} disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {userToDelete?.estado === "ACTIVO" ? "Eliminar usuario" : "Restaurar usuario"}
            </DialogTitle>
            <DialogDescription>
              {userToDelete?.estado === "ACTIVO"
                ? `¿Estás seguro que deseas eliminar a ${userToDelete?.nombre || userToDelete?.email}? Esta acción marcará la cuenta como eliminada.`
                : `¿Estás seguro que deseas restaurar a ${userToDelete?.nombre || userToDelete?.email}? Volverá al estado ACTIVO.`}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setUserToDelete(null);
              }}
              disabled={deletingId === userToDelete?.id || restoringId === userToDelete?.id}
            >
              Cancelar
            </Button>
            <Button
              variant={userToDelete?.estado === "ACTIVO" ? "destructive" : "default"}
              onClick={() => {
                if (userToDelete?.estado === "ACTIVO") {
                  confirmDeleteUser();
                } else {
                  confirmRestoreUser();
                }
              }}
              disabled={deletingId === userToDelete?.id || restoringId === userToDelete?.id}
            >
              {deletingId === userToDelete?.id || restoringId === userToDelete?.id
                ? "Procesando..."
                : userToDelete?.estado === "ACTIVO"
                ? "Eliminar"
                : "Restaurar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
