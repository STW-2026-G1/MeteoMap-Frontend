import { useState } from "react";
import { useNavigate } from "react-router";
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
import {
  User,
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
  Camera,
  Lock,
  Upload,
} from "lucide-react";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || "Usuario",
    email: user?.email || "",
    bio: "Amante de la montaña y el esquí. Llevo 5 años explorando los Pirineos.",
    location: "Huesca, España",
    experience: "Avanzado",
    avatar: "",
  });

  // Estados para diálogos
  const [editReportDialog, setEditReportDialog] = useState<number | null>(null);
  const [addZoneDialog, setAddZoneDialog] = useState(false);
  const [changePasswordDialog, setChangePasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Mock data - Estadísticas del usuario
  const userStats = {
    totalReports: 47,
    confirmations: 156,
    favoriteZones: 5,
  };

  // Mock data - Mis Reportes
  const [myReports, setMyReports] = useState([
    {
      id: 1,
      zone: "Formigal",
      title: "Nieve polvo en Cota 1800",
      description: "Excelentes condiciones de nieve polvo en la zona alta. Visibilidad perfecta.",
      type: "info",
      date: "2026-03-24",
      confirmations: 12,
      comments: 5,
      status: "active",
    },
    {
      id: 2,
      zone: "Benasque",
      title: "Placas de hielo en cara norte",
      description: "Detectadas placas de hielo en acceso al Aneto. Precaución extrema.",
      type: "danger",
      date: "2026-03-22",
      confirmations: 28,
      comments: 15,
      status: "active",
    },
    {
      id: 3,
      zone: "Ordesa",
      title: "Sendero despejado",
      description: "El sendero del valle está completamente despejado y accesible.",
      type: "info",
      date: "2026-03-20",
      confirmations: 8,
      comments: 3,
      status: "resolved",
    },
    {
      id: 4,
      zone: "Candanchú",
      title: "Visibilidad reducida por niebla",
      description: "Niebla densa en cotas medias-altas. Recomendable posponer actividad.",
      type: "warning",
      date: "2026-03-18",
      confirmations: 15,
      comments: 7,
      status: "active",
    },
  ]);

  // Mock data - Zonas Favoritas
  const [favoriteZones, setFavoriteZones] = useState([
    {
      id: 1,
      name: "Formigal",
      region: "Huesca",
      image: "https://images.unsplash.com/photo-1551524164-687a55dd1126?w=800",
      riskLevel: 45,
      lastVisit: "2026-03-24",
      totalReports: 12,
    },
    {
      id: 2,
      name: "Benasque",
      region: "Huesca",
      image: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800",
      riskLevel: 67,
      lastVisit: "2026-03-22",
      totalReports: 8,
    },
    {
      id: 3,
      name: "Pico Aneto",
      region: "Huesca",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
      riskLevel: 78,
      lastVisit: "2026-03-15",
      totalReports: 15,
    },
    {
      id: 4,
      name: "Ordesa",
      region: "Huesca",
      image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
      riskLevel: 32,
      lastVisit: "2026-03-20",
      totalReports: 6,
    },
    {
      id: 5,
      name: "Candanchú",
      region: "Huesca",
      image: "https://images.unsplash.com/photo-1418290232843-5d7a0bd1b5d8?w=800",
      riskLevel: 23,
      lastVisit: "2026-03-18",
      totalReports: 9,
    },
  ]);

  // Estado para nuevo reporte editado
  const [editedReport, setEditedReport] = useState({
    title: "",
    description: "",
    type: "info",
    zone: "",
  });

  // Estado para nueva zona
  const [newZone, setNewZone] = useState({
    name: "",
    region: "",
  });

  const handleSaveProfile = () => {
    // Aquí guardarías los datos del perfil
    setIsEditingProfile(false);
  };

  const handleEditReport = (reportId: number) => {
    const report = myReports.find((r) => r.id === reportId);
    if (report) {
      setEditedReport({
        title: report.title,
        description: report.description,
        type: report.type,
        zone: report.zone,
      });
      setEditReportDialog(reportId);
    }
  };

  const handleSaveReport = () => {
    // Aquí guardarías el reporte editado
    setMyReports(
      myReports.map((r) =>
        r.id === editReportDialog
          ? { ...r, ...editedReport }
          : r
      )
    );
    setEditReportDialog(null);
  };

  const handleDeleteReport = (reportId: number) => {
    setMyReports(myReports.filter((r) => r.id !== reportId));
  };

  const handleAddZone = () => {
    // Aquí añadirías la zona
    const newId = Math.max(...favoriteZones.map((z) => z.id)) + 1;
    setFavoriteZones([
      ...favoriteZones,
      {
        id: newId,
        name: newZone.name,
        region: newZone.region,
        image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
        riskLevel: 50,
        lastVisit: new Date().toISOString().split("T")[0],
        totalReports: 0,
      },
    ]);
    setAddZoneDialog(false);
    setNewZone({ name: "", region: "" });
  };

  const handleRemoveZone = (zoneId: number) => {
    setFavoriteZones(favoriteZones.filter((z) => z.id !== zoneId));
  };

  const handleChangePassword = () => {
    // Aquí cambiarías la contraseña
    if (newPassword === confirmPassword && newPassword.length >= 6) {
      alert("Contraseña cambiada exitosamente");
      setChangePasswordDialog(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleDeleteAccount = () => {
    // Aquí eliminarías la cuenta
    alert("Cuenta eliminada");
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-purple-50">
      <Header />

      <div className="mt-16 container mx-auto px-4 py-8 max-w-[1400px]">
        {/* Profile Header Card */}
        <Card className="p-6 md:p-8 mb-8 bg-white/80 backdrop-blur">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Avatar */}
            <div className="relative">
              {profileData.avatar ? (
                <img
                  src={profileData.avatar}
                  alt="Avatar"
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl md:text-5xl font-bold shadow-lg">
                  {profileData.name.charAt(0).toUpperCase()}
                </div>
              )}
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
                  <span>Miembro desde Marzo 2025</span>
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
              <Button className="bg-blue-600 hover:bg-blue-700">
                <FileText className="h-4 w-4 mr-2" />
                Crear Reporte
              </Button>
            </div>

            <div className="grid gap-4">
              {myReports.map((report) => {
                const typeInfo = getReportTypeInfo(report.type);
                const TypeIcon = typeInfo.icon;

                return (
                  <Card key={report.id} className={`p-6 border-l-4 ${typeInfo.border} hover:shadow-lg transition-shadow`}>
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Icon */}
                      <div className={`${typeInfo.bg} p-4 rounded-lg h-fit`}>
                        <TypeIcon className={`h-6 w-6 ${typeInfo.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-semibold text-gray-900">{report.title}</h3>
                              {report.status === "resolved" && (
                                <Badge className="bg-gray-100 text-gray-700">Resuelto</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span className="font-medium">{report.zone}</span>
                              <span>•</span>
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(report.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
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
                                    Actualiza la información de tu reporte
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-title">Título</Label>
                                    <Input
                                      id="edit-title"
                                      value={editedReport.title}
                                      onChange={(e) => setEditedReport({ ...editedReport, title: e.target.value })}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-zone">Zona</Label>
                                    <Input
                                      id="edit-zone"
                                      value={editedReport.zone}
                                      onChange={(e) => setEditedReport({ ...editedReport, zone: e.target.value })}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-type">Tipo</Label>
                                    <Select value={editedReport.type} onValueChange={(value) => setEditedReport({ ...editedReport, type: value })}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="info">Información</SelectItem>
                                        <SelectItem value="warning">Advertencia</SelectItem>
                                        <SelectItem value="danger">Peligro</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-description">Descripción</Label>
                                    <Textarea
                                      id="edit-description"
                                      rows={4}
                                      value={editedReport.description}
                                      onChange={(e) => setEditedReport({ ...editedReport, description: e.target.value })}
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
              
              {/* Add Zone Dialog */}
              <Dialog open={addZoneDialog} onOpenChange={setAddZoneDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir Zona
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Añadir Zona Favorita</DialogTitle>
                    <DialogDescription>
                      Agrega una nueva zona a tu lista de favoritas
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="zone-name">Nombre de la Zona</Label>
                      <Input
                        id="zone-name"
                        placeholder="Ej: Valle de Tena"
                        value={newZone.name}
                        onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zone-region">Región</Label>
                      <Input
                        id="zone-region"
                        placeholder="Ej: Huesca"
                        value={newZone.region}
                        onChange={(e) => setNewZone({ ...newZone, region: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddZoneDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddZone} className="bg-blue-600 hover:bg-blue-700">
                      Añadir Zona
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                            <AlertDialogAction onClick={() => handleRemoveZone(zone.id)}>
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
                {/* Avatar Upload */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Foto de Perfil
                  </Label>
                  <div className="flex items-center gap-4">
                    {profileData.avatar ? (
                      <img
                        src={profileData.avatar}
                        alt="Avatar"
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                        {profileData.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={!isEditingProfile}
                      />
                      <label htmlFor="avatar-upload">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={!isEditingProfile}
                          onClick={() => document.getElementById('avatar-upload')?.click()}
                          asChild
                        >
                          <span className="cursor-pointer">
                            <Camera className="h-4 w-4 mr-2" />
                            Cambiar Foto
                          </span>
                        </Button>
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        JPG, PNG o GIF. Tamaño máximo 2MB
                      </p>
                    </div>
                  </div>
                </div>

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
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Contraseña Actual</Label>
                        <Input
                          id="current-password"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">Nueva Contraseña</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                      {newPassword !== confirmPassword && confirmPassword && (
                        <p className="text-sm text-red-600">Las contraseñas no coinciden</p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setChangePasswordDialog(false)}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleChangePassword}
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}
                      >
                        Cambiar Contraseña
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Delete Account Dialog */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="border-red-400 text-red-700 hover:bg-red-100">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar Cuenta
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminarán permanentemente todos tus datos:
                        reportes, zonas favoritas, comentarios y toda tu información de perfil.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Sí, eliminar mi cuenta
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}