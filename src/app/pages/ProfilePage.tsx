import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useAuth } from "../contexts/AuthContext";
import { ImageWithFallback } from "../components/common/ImageWithFallback";
import {
  MapPin,
  FileText,
  Settings,
  Calendar,
  ThumbsUp,
  MessageSquare,
  AlertTriangle,
  Info,
  Edit,
  Save,
  X,
  Heart,
  Trash2,
  Plus,
  Lock,
} from "lucide-react";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3000/api';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [favoriteZones, setFavoriteZones] = useState<any[]>([]);
  const [profileData, setProfileData] = useState({
    id: user?.id || 'User',
    name: user?.name || user?.nombre || "Usuario",
    email: user?.email || "",
    bio: "Amante de la montaña y el esquí. Llevo 5 años explorando los Pirineos.",
    location: "Huesca, España",
    experience: "Avanzado",
    avatar_style: user?.avatar_style || "avataaars",
    avatar_seed: user?.avatar_seed || user?.name || user?.nombre || "Usuario",
    avatar_url: user?.avatar_url,
  });

  // Estados para diálogos
  const [editReportDialog, setEditReportDialog] = useState<number | null>(null);
  const [addZoneDialog, setAddZoneDialog] = useState(false);
  const [changePasswordDialog, setChangePasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | null>(null);
  const [deleteAccountDialog, setDeleteAccountDialog] = useState(false);
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Sync state with user context if it changes (e.g., after login or update)
  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        id: user.id || prev.id,
        name: user.name || user.nombre || prev.name,
        email: user.email || prev.email,
        bio: user.biografia || prev.bio,
        location: user.ubicacion || prev.location,
        avatar_style: user.avatar_style || prev.avatar_style,
        avatar_seed: user.avatar_seed || user.name || user.nombre || prev.avatar_seed,
        avatar_url: user.avatar_url,
      }));
    }
  }, [user]);

  // Validate password strength in real-time
  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength(null);
      return;
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
    const isLongEnough = newPassword.length >= 8;

    const conditions = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar, isLongEnough];
    const metConditions = conditions.filter(Boolean).length;

    let strength: "weak" | "medium" | "strong" = "weak";
    if (metConditions >= 4) {
      strength = "strong";
    } else if (metConditions >= 3) {
      strength = "medium";
    }

    setPasswordStrength(strength);
  }, [newPassword]);

  const avatarStyles = [
    { value: "avataaars", label: "Avataaars" },
    { value: "bottts", label: "Bottts" },
    { value: "lorelei", label: "Lorelei" },
    { value: "pixel-art", label: "Pixel Art" },
    { value: "thumbs", label: "Thumbs" },
    { value: "notionists", label: "Notionists" },
    { value: "notionists-neutral", label: "Notionists Neutral" },
    { value: "dylan", label: "Dylan" },
    { value: "croodles", label: "Croodles" },
    { value: "personas", label: "Personas" },
  ];

  // Mock data - Mis Reportes
  const [myReports, setMyReports] = useState<any[]>([]);
  const [myReportsRaw, setMyReportsRaw] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ value: string; label: string; icon: string }[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);


  // Mock data - Estadísticas del usuario
  const userStats = {
    totalReports: myReports.length,
    confirmations: myReports.reduce((acc, curr) => acc + curr.confirmations, 0),
    favoriteZones: favoriteZones.length,
  };

  useEffect(() => {
    if (!user || !user.id) return;
    const fetchMyReports = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/reports?usuarioId=${user.id}`);
        if (!response.ok) throw new Error("Error fetching user reports");
        const data = await response.json();

        if (data.reports) {
          setMyReportsRaw(data.reports);
          const mapped = data.reports.map((r: any) => ({
            id: r._id,
            zone: r.zona_id?.nombre || "Zona Desconocida",
            title: r.categoria_id?.nombre || "Reporte",
            categoria_id: r.categoria_id?._id || r.categoria_id,
            description: r.contenido?.descripcion || "",
            date: new Date(r.updatedAt).toLocaleString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }),
            confirmations: r.validaciones?.usuarios_confirmaron?.length ?? 0,
            comments: 0,
            status: r.estado === "ACTIVO" ? "active" : "resolved",
            icon: r.categoria_id?.icono_marcador || "⚠️"
          }));
          setMyReports(mapped);
        }
      } catch (error) {
        console.error("Error al cargar mis reportes:", error);
      }
    };
    fetchMyReports();
  }, [user]);

  // Cargar categorías del backend
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (response.ok) {
          const data = await response.json();
          const mapped = data.map((cat: any) => ({
            value: cat._id,
            label: cat.nombre,
            icon: cat.icono_marcador || "⚠️"
          }));
          setCategories(mapped);
        } else {
          toast.error("Error al cargar categorías");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Cargar zonas favoritas del backend
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const token = localStorage.getItem('meteomap_token');
        if (!token) {
          console.log('No hay usuario autenticado para cargar favoritas');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/user/me/favorites`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const preferences = data.preferencias || [];

          // Transformar referencias a zonas en objetos con datos completos
          const mappedFavorites = preferences.map((pref: any, index: number) => {
            const zone = typeof pref === 'object' ? pref : { _id: pref };
            return {
              id: index, // ID local para React key
              zoneId: zone._id || zone.id, // ObjectId para enviar al backend
              name: zone.nombre || zone.name || "Zona sin nombre",
              region: zone.departamento || "Región desconocida",
              image: "https://images.unsplash.com/photo-1551524164-687a55dd1126?w=800", // Default image
              riskLevel: zone.nivelAvalanchas || 50,
              lastVisit: new Date().toISOString().split('T')[0],
              totalReports: 0,
            };
          });

          setFavoriteZones(mappedFavorites);
          console.log('Favoritas cargadas:', mappedFavorites);
        }
      } catch (error) {
        console.error('Error cargando favoritas:', error);
      }
    };

    loadFavorites();
  }, []);

  // Tipos de riesgo - ya no se usa, usamos categories

  // Estado para nuevo reporte editado
  const [editedReport, setEditedReport] = useState({
    categoria_id: "",
    descripcion: "",
  });

  // Estado para nueva zona
  const [newZone, setNewZone] = useState({
    name: "",
    region: "",
  });

  const handleSaveProfile = async () => {
    // Determine if we should clear avatar_url based on style change
    // If the style being saved is NOT what we had originally or from google, 
    // we want to effectively "switch" to dicebear
    const result = await updateProfile({
      nombre: profileData.name,
      email: profileData.email,
      avatar_style: profileData.avatar_style,
      biografia: profileData.bio,
      ubicacion: profileData.location,
    });
    if (result.success) {
      setIsEditingProfile(false);
      // Re-initialize profile data with updated user values from context
      if (user) {
        setProfileData({
          ...profileData,
          name: user.name || user.nombre || "Usuario",
          email: user.email || "",
          bio: user.biografia || "",
          location: user.ubicacion || "",
          avatar_style: user.avatar_style || "avataaars",
          avatar_seed: user.avatar_seed || user.name || user.nombre || "Usuario",
          avatar_url: user.avatar_url,
        });
      }
    } else {
      // Handle error - maybe show an alert
      alert(result.errorMessage || "Error al actualizar perfil");
    }
  };

  const handleEditReport = (reportId: string) => {
    const report = myReports.find((r) => r.id === reportId);
    if (report) {
      // Intentar encontrar el ID de la categoría basado en el nombre si 'tipo' no es el ID
      // Pero idealmente el reporte ya debería tener categoria_id si lo hemos cargado correctamente
      // En mapped ya pusimos 'title' como nombre. Necesitamos el ID real.
      // Vamos a ajustar el mapping en fetchMyReports para que incluya el ID.

      const originalReport = myReportsRaw.find((r: any) => r._id === reportId);

      setEditedReport({
        categoria_id: originalReport?.categoria_id?._id || originalReport?.categoria_id || "",
        descripcion: report.description,
      });
      setEditReportDialog(reportId as any);
    }
  };

  const handleSaveReport = async () => {
    const token = localStorage.getItem('meteomap_token');
    if (!token) {
      toast.error("Debes estar autenticado para editar reportes");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/reports/${editReportDialog}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          descripcion: editedReport.descripcion,
          categoria_id: editedReport.categoria_id
        })
      });

      if (response.ok) {
        setMyReports(
          myReports.map((r) =>
            r.id === editReportDialog
              ? { ...r, description: editedReport.descripcion, title: categories.find(c => c.value === editedReport.categoria_id)?.label || r.title }
              : r
          )
        );
        setEditReportDialog(null);
        toast.success("Reporte actualizado correctamente");
      } else {
        const error = await response.json();
        toast.error(error.message || error.error || "Error al actualizar el reporte");
      }
    } catch (error) {
      console.error("Error al editar reporte:", error);
      toast.error("Error de conexión");
    }
  };

  const handleDeleteReport = async (reportId: number | string) => {
    const token = localStorage.getItem('meteomap_token');
    if (!token) {
      toast.error("Debes estar autenticado para eliminar reportes");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setMyReports(myReports.filter((r) => r.id !== reportId));
        toast.success("Reporte eliminado correctamente");
      } else {
        const error = await response.json();
        toast.error(error.error || "Error al eliminar el reporte");
      }
    } catch (error) {
      console.error("Error al eliminar reporte:", error);
      toast.error("Error de conexión");
    }
  };

  const handleRemoveZone = async (zoneId: number | string) => {
    const token = localStorage.getItem('meteomap_token');
    if (!token) {
      alert('Debes estar autenticado para eliminar favoritos');
      return;
    }

    // Actualizar estado local inmediatamente
    setFavoriteZones(favoriteZones.filter((z) => z.zoneId !== zoneId));

    // Sincronizar con el backend
    try {
      const response = await fetch(`${API_BASE_URL}/user/me/favorites`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ zonaId: zoneId, accion: 'remove' })
      });

      if (!response.ok) {
        // Revertir cambios si falla
        const zone = favoriteZones.find(z => z.zoneId === zoneId);
        if (zone) {
          setFavoriteZones([...favoriteZones, zone]);
        }
        alert('Error al eliminar de favoritos');
      }
    } catch (error) {
      console.error('Error eliminando favorito:', error);
      // Revertir cambios si falla
      const zone = favoriteZones.find(z => z.zoneId === zoneId);
      if (zone) {
        setFavoriteZones([...favoriteZones, zone]);
      }
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");

    // Frontend validation - ensure password is strong
    if (!currentPassword) {
      setPasswordError("Contraseña actual requerida");
      return;
    }

    if (!newPassword) {
      setPasswordError("Nueva contraseña requerida");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }

    // Validate password strength requirements
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      setPasswordError("La contraseña debe contener: mayúscula, minúscula, número y carácter especial");
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/user/updatepassword`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("meteomap_token")}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setPasswordError(errorData.message || errorData.error || "Error al cambiar la contraseña");
        setPasswordLoading(false);
        return;
      }

      // Éxito - cerrar diálogo y limpiar campos
      setChangePasswordDialog(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Mostrar toast de éxito
      toast.success("✓ Contraseña actualizada", {
        description: "Redirigiendo a inicio de sesión...",
        duration: 2000,
      });

      // Logout y redirigir a login después de 1.5 segundos
      setTimeout(async () => {
        await logout();
        navigate("/login");
      }, 1500);
    } catch (err) {
      setPasswordError("Error de conexión. Intenta de nuevo.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError("");
    setDeleteLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/user/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("meteomap_token")}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        setDeleteError(errorData.message || errorData.error || "Error al eliminar la cuenta");
        setDeleteLoading(false);
        return;
      }

      // Éxito - logout y redirigir a landing
      toast.success("✓ Cuenta eliminada", {
        description: "Si cambias de opinión, contacta con soporte en los próximos 30 días",
        duration: 3000,
      });

      setTimeout(async () => {
        await logout();
        navigate("/");
      }, 2000);
    } catch (err) {
      setDeleteError("Error de conexión. Intenta de nuevo.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const getReportTypeInfo = (type: string) => {
    switch (type) {
      case "danger":
        return { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" };
      case "warning":
        return { icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" };
      default:
        return { icon: Info, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" };
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk < 30) return "text-green-600";
    if (risk < 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-gray-50 to-purple-50">
      <Header />

      <div className="flex-1 mt-16 container mx-auto px-4 py-8 max-w-[1400px]">
        {/* Profile Header Card */}
        <Card className="p-6 md:p-8 mb-8 bg-white/80 backdrop-blur">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Avatar */}
            <div className="relative">
              <ImageWithFallback
                src={profileData.avatar_url}
                fallback={`https://api.dicebear.com/9.x/${profileData.avatar_style}/svg?seed=${profileData.avatar_seed}`}
                alt="Avatar"
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover shadow-lg"
              />
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{profileData.name}</h1>
              </div>
              <p className="text-gray-600 mb-4">{profileData.bio}</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{profileData.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Miembro desde {user && user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }) : 'hace poco'}</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 w-full md:w-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{userStats.totalReports}</div>
                <div className="text-xs text-gray-600">Reportes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{userStats.confirmations}</div>
                <div className="text-xs text-gray-600">Validaciones</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{userStats.favoriteZones}</div>
                <div className="text-xs text-gray-600">Zonas</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs Navigation */}
        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto gap-2 bg-white/80 p-2">
            <TabsTrigger value="reports" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Mis Reportes</span>
              <span className="sm:hidden">Reportes</span>
            </TabsTrigger>
            <TabsTrigger value="zones" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Zonas Favoritas</span>
              <span className="sm:hidden">Zonas</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configuración</span>
              <span className="sm:hidden">Config</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Mis Reportes */}
          <TabsContent value="reports" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Mis Reportes</h2>
            </div>

            <div className="grid gap-4">
              {myReports.map((report) => {
                const typeInfo = getReportTypeInfo(report.type);
                const TypeIcon = typeInfo.icon;

                return (
                  <Card key={report.id} className={`p-6 border-l-4 ${typeInfo.border} hover:shadow-lg transition-shadow`}>
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Icon */}
                      <div className={`${typeInfo.bg} p-4 rounded-lg h-fit flex items-center justify-center text-2xl`}>
                        {report.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-semibold text-gray-900">{report.title}</h3>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span className="font-medium">{report.zone}</span>
                              <span>•</span>
                              <Calendar className="h-4 w-4" />
                              <span>{report.date}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {/* Edit Report Dialog */}
                            <Dialog open={editReportDialog === report.id} onOpenChange={(open) => !open && setEditReportDialog(null)}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => handleEditReport(report.id)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[525px]">
                                <DialogHeader>
                                  <DialogTitle>Editar Reporte</DialogTitle>
                                  <DialogDescription>
                                    Actualiza el tipo y descripción de tu reporte
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-type">Tipo de Riesgo</Label>
                                    <Select value={editedReport.categoria_id} onValueChange={(value) => setEditedReport({ ...editedReport, categoria_id: value })}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecciona categoría" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {categories.map((type) => (
                                          <SelectItem key={type.value} value={type.value}>
                                            <span className="flex items-center gap-2">
                                              <span>{type.icon}</span>
                                              {type.label}
                                            </span>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-description">Descripción</Label>
                                    <Textarea
                                      id="edit-description"
                                      rows={4}
                                      value={editedReport.descripcion}
                                      onChange={(e) => setEditedReport({ ...editedReport, descripcion: e.target.value })}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setEditReportDialog(null)}>
                                    Cancelar
                                  </Button>
                                  <Button onClick={handleSaveReport} className="bg-blue-600 hover:bg-blue-700">
                                    Guardar Cambios
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            {/* Delete Report Dialog */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar reporte?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. El reporte "{report.title}" será eliminado permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteReport(report.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>

                        <p className="text-gray-700 mb-4">{report.description}</p>

                        {/* Stats */}
                        <div className="flex gap-6 text-sm">
                          <div className="flex items-center gap-1 text-green-600">
                            <ThumbsUp className="h-4 w-4" />
                            <span className="font-medium">{report.confirmations}</span>
                            <span className="text-gray-600">confirmaciones</span>
                          </div>
                          <div className="flex items-center gap-1 text-blue-600">
                            <MessageSquare className="h-4 w-4" />
                            <span className="font-medium">{report.comments}</span>
                            <span className="text-gray-600">comentarios</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Tab: Zonas Favoritas */}
          <TabsContent value="zones" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Zonas Favoritas</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteZones.map((zone) => (
                <Card key={zone.id} className="overflow-hidden hover:shadow-xl transition-shadow group">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={zone.image}
                      alt={zone.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-white/90 hover:bg-red-50 border-none"
                          >
                            <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar de favoritos?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {zone.name} será eliminada de tu lista de zonas favoritas.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveZone(zone.zoneId)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <Badge className={`${getRiskColor(zone.riskLevel)} bg-white/90 font-semibold`}>
                        Riesgo: {zone.riskLevel}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{zone.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{zone.region}</p>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center justify-between">
                        <span>Última visita:</span>
                        <span className="font-medium">
                          {new Date(zone.lastVisit).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Tus reportes:</span>
                        <span className="font-medium">{zone.totalReports}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => navigate('/mapa')}
                    >
                      Ver Detalles
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab: Configuración */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Configuración del Perfil</h2>
                  <p className="text-gray-600">Actualiza tu información personal</p>
                </div>
                {!isEditingProfile ? (
                  <Button onClick={() => setIsEditingProfile(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} className="bg-green-600 hover:bg-green-700">
                      <Save className="h-4 w-4 mr-2" />
                      Guardar
                    </Button>
                    <Button
                      onClick={() => setIsEditingProfile(false)}
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Name */}
                <div>
                  <Label htmlFor="name" className="text-base font-semibold mb-2 block">
                    Nombre
                  </Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    disabled={!isEditingProfile}
                    className="text-base h-11"
                  />
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email" className="text-base font-semibold mb-2 block">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    disabled={!isEditingProfile}
                    className="text-base h-11"
                  />
                </div>

                {/* Bio */}
                <div>
                  <Label htmlFor="bio" className="text-base font-semibold mb-2 block">
                    Biografía
                  </Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    disabled={!isEditingProfile}
                    rows={4}
                    className="text-base resize-none"
                  />
                </div>

                {/* Location */}
                <div>
                  <Label htmlFor="location" className="text-base font-semibold mb-2 block">
                    Ubicación
                  </Label>
                  <Input
                    id="location"
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                    disabled={!isEditingProfile}
                    className="text-base h-11"
                  />
                </div>

                {/* Avatar Style - Always show to allow switching to generated avatar */}
                <div>
                  <Label htmlFor="avatarStyle" className="text-base font-semibold mb-2 block">
                    Estilo de Avatar
                  </Label>
                  <div className="flex items-center gap-4">
                    <Select
                      value={profileData.avatar_style}
                      onValueChange={(value) => setProfileData({ ...profileData, avatar_style: value })}
                      disabled={!isEditingProfile}
                    >
                      <SelectTrigger className="flex-1 text-base h-11">
                        <SelectValue placeholder="Selecciona un estilo de avatar" />
                      </SelectTrigger>
                      <SelectContent>
                        {avatarStyles.map((style) => (
                          <SelectItem key={style.value} value={style.value}>
                            <div className="flex items-center gap-3">
                              <img
                                src={`https://api.dicebear.com/9.x/${style.value}/svg?seed=${profileData.avatar_seed}`}
                                alt={style.label}
                                className="w-8 h-8 rounded-full"
                              />
                              <span>{style.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex-shrink-0">
                      <img
                        src={`https://api.dicebear.com/9.x/${profileData.avatar_style}/svg?seed=${profileData.avatar_seed}`}
                        alt="Avatar preview"
                        className="w-12 h-12 rounded-full border-2 border-gray-200"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Elige un estilo si prefieres usar un avatar generado en lugar de tu foto de perfil
                  </p>
                </div>
              </div>
            </Card>

            {/* Security Settings */}
            <Card className="p-6 border-red-200 bg-red-50/50">
              <h3 className="text-lg font-bold text-red-900 mb-2">Seguridad y Cuenta</h3>
              <p className="text-sm text-red-700 mb-4">
                Gestiona la seguridad de tu cuenta
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Change Password Dialog */}
                <Dialog open={changePasswordDialog} onOpenChange={setChangePasswordDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-100">
                      <Lock className="h-4 w-4 mr-2" />
                      Cambiar Contraseña
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Cambiar Contraseña</DialogTitle>
                      <DialogDescription>
                        Actualiza tu contraseña para mantener tu cuenta segura
                      </DialogDescription>
                    </DialogHeader>
                    {passwordError && (
                      <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-red-300 bg-red-50">
                        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-red-900">Error</p>
                          <p className="text-sm text-red-800">{passwordError}</p>
                        </div>
                      </div>
                    )}
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Contraseña Actual</Label>
                        <Input
                          id="current-password"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          disabled={passwordLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">Nueva Contraseña</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          disabled={passwordLoading}
                        />
                        {newPassword && (
                          <div className="space-y-2">
                            <div className="flex gap-1 h-1">
                              <div className={`flex-1 rounded-full ${passwordStrength === "weak" ? "bg-red-500" : passwordStrength === "medium" ? "bg-yellow-500" : passwordStrength === "strong" ? "bg-green-500" : "bg-gray-200"}`} />
                              <div className={`flex-1 rounded-full ${["medium", "strong"].includes(passwordStrength || "") ? (passwordStrength === "strong" ? "bg-green-500" : "bg-yellow-500") : "bg-gray-200"}`} />
                              <div className={`flex-1 rounded-full ${passwordStrength === "strong" ? "bg-green-500" : "bg-gray-200"}`} />
                            </div>
                            <p className={`text-xs font-medium ${passwordStrength === "weak" ? "text-red-600" :
                                passwordStrength === "medium" ? "text-yellow-600" :
                                  "text-green-600"
                              }`}>
                              Contraseña {passwordStrength || "débil"}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={passwordLoading}
                        />
                      </div>
                      {newPassword !== confirmPassword && confirmPassword && (
                        <p className="text-sm text-red-600">Las contraseñas no coinciden</p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setChangePasswordDialog(false);
                          setPasswordError("");
                        }}
                        disabled={passwordLoading}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleChangePassword}
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={!currentPassword || !newPassword || newPassword !== confirmPassword || passwordLoading || passwordStrength !== "strong"}
                      >
                        {passwordLoading ? "Cambiando..." : "Cambiar Contraseña"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Delete Account Dialog */}
                <Dialog open={deleteAccountDialog} onOpenChange={setDeleteAccountDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-red-400 text-red-700 hover:bg-red-100">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar Cuenta
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>¿Eliminar tu cuenta?</DialogTitle>
                      <DialogDescription>
                        Esta acción es permanente. Se eliminarán todos tus datos:
                        reportes, zonas favoritas, comentarios e información de perfil.
                        <br />
                        <strong>Si cambias de opinión, contacta soporte en los próximos 30 días para recuperarla.</strong>
                      </DialogDescription>
                    </DialogHeader>
                    {deleteError && (
                      <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-red-300 bg-red-50">
                        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-red-900">Error</p>
                          <p className="text-sm text-red-800">{deleteError}</p>
                        </div>
                      </div>
                    )}
                    <div className="grid gap-4 py-4">
                      <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                        <p className="text-sm text-red-800">
                          <strong>⚠️ Para confirmar,</strong> escribe tu email: <strong>{user?.email}</strong>
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="delete-email-confirm">Tu email</Label>
                        <Input
                          id="delete-email-confirm"
                          type="email"
                          value={deleteEmailConfirm}
                          onChange={(e) => setDeleteEmailConfirm(e.target.value)}
                          disabled={deleteLoading}
                          placeholder="Escribe tu email para confirmar"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDeleteAccountDialog(false);
                          setDeleteEmailConfirm("");
                          setDeleteError("");
                        }}
                        disabled={deleteLoading}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleDeleteAccount}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={deleteEmailConfirm !== user?.email || deleteLoading}
                      >
                        {deleteLoading ? "Eliminando..." : "Sí, eliminar mi cuenta"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}