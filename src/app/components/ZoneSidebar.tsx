import { X, Star, AlertTriangle, Thermometer, Wind, TrendingUp, Clock, User, MessageCircle, ThumbsUp, Send, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { ReportDetailModal } from "./ReportDetailModal";
import { useState, useEffect } from "react";

interface UserReport {
  id: string;
  userName: string;
  avatar: string;
  condition: string;
  timestamp: string;
  photo?: string;
}

interface Comment {
  id: string; 
  userId?: string;
  userName: string;
  avatar: string;
  message: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
}

interface ZoneData {
  id: string;
  name: string;
  elevation: string;
  temperature: number;
  wind: number;
  avalancheLevel: number;
  isFavorite: boolean;
  reports: UserReport[];
  comments?: Comment[];
}

interface ZoneSidebarProps {
  zone: ZoneData | null;
  onClose: () => void;
  onToggleFavorite: (zoneId: string) => void;
  onCreateReport: () => void;
  onViewAllReports: () => void;
}

// Mock data for temperature forecast
const temperatureForecast = [
  { time: 'Ahora', temp: -4 },
  { time: '+1h', temp: -3 },
  { time: '+2h', temp: -2 },
  { time: '+3h', temp: -1 },
  { time: '+4h', temp: 0 },
  { time: '+5h', temp: 1 },
  { time: '+6h', temp: 2 },
];

const avalancheLevelColors: { [key: number]: string } = {
  1: "bg-green-500",
  2: "bg-yellow-500",
  3: "bg-orange-500",
  4: "bg-red-500",
  5: "bg-purple-500",
};

const avalancheLevelText: { [key: number]: string } = {
  1: "Bajo",
  2: "Moderado",
  3: "Notable",
  4: "Alto",
  5: "Muy Alto",
};

export function ZoneSidebar({ zone, onClose, onToggleFavorite, onCreateReport, onViewAllReports }: ZoneSidebarProps) {
  if (!zone) return null;

  const [dynamicComments, setDynamicComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set()); // Cambiado a string por MongoID
  const [newCommentText, setNewCommentText] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);

  // Obtener el userId y nombre del usuario actual
  useEffect(() => {
    const userInfo = localStorage.getItem('meteomap_user');
    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo);
        const userId = parsed.id || parsed._id || null;
        const userName = parsed.name || parsed.nombre || null;
        setCurrentUserId(userId);
        setCurrentUserName(userName);
        console.log("Current User:", { id: userId, name: userName });
      } catch (error) {
        console.error("Error parsing user info:", error);
      }
    }
  }, []);

  // Función para cargar comentarios desde el Backend
  useEffect(() => {
      if (!zone.id) return;

      const fetchComments = async () => {
         setIsLoading(true);
         try {
            const response = await fetch(`http://localhost:3000/api/comments/zone/${zone.id}`);
            const data = await response.json();

            if (response.ok) {
            const initialLikedSet = new Set<string>(); // Para rastrear likes visualmente

            const mappedComments: Comment[] = data.comments.map((c: any) => {
               // CRUCIAL: Verificamos si mi ID está en el array de likes del servidor
               const hasLiked = currentUserId && c.likes.some((id: string) => String(id) === String(currentUserId));
               const uniqueLikes = new Set(c.likes.map((id: any) => String(id)));
               
               if (hasLiked) initialLikedSet.add(c._id);

               return {
                  id: c._id,
                  userId: c.usuario_id?._id || c.usuario_id,
                  userName: c.usuario_id?.perfil?.nombre || "Usuario Anónimo",
                  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.usuario_id?._id}`,
                  message: c.contenido,
                  timestamp: new Date(c.createdAt).toLocaleDateString(),
                  likes: uniqueLikes.size, // Contamos likes únicos
                  isLiked: !!hasLiked,
               };
            });

            setLikedComments(initialLikedSet);
            setDynamicComments(mappedComments);
            }
         } catch (error) {
            console.error("Error cargando comentarios:", error);
         } finally {
            setIsLoading(false);
         }
      };

      fetchComments();
   }, [zone.id, currentUserId]); // <--- Se re-ejecuta cuando el usuario se loguea

  const handleLikeComment = async (commentId: string) => {
      const rawToken = localStorage.getItem('meteomap_token');
      if (!rawToken || !currentUserId) {
         alert("Debes iniciar sesión para dar like");
         return;
      }

      const isAlreadyLiked = likedComments.has(commentId);

      const url = isAlreadyLiked 
         ? `http://localhost:3000/api/comments/${commentId}/unlike` // <--- Ruta para quitar
         : `http://localhost:3000/api/comments/${commentId}/like`;   // <--- Ruta para dar
      const method = isAlreadyLiked ? 'DELETE' : 'POST';

      setLikedComments(prev => {
         const newSet = new Set(prev);
         if (isAlreadyLiked) newSet.delete(commentId);
         else newSet.add(commentId);
         return newSet;
      });

      // 2. Actualizamos el número en la lista inmediatamente (Solo +1 o -1)
      setDynamicComments(prev => prev.map(c => {
         if (c.id === commentId) {
            return {
            ...c,
            isLiked: !isAlreadyLiked,
            likes: isAlreadyLiked ? Math.max(0, c.likes - 1) : c.likes + 1
            };
         }
         return c;
      }));

      try {
         const response = await fetch(url, {
            method: method,
            headers: { 'Authorization': `Bearer ${rawToken}` }
         });

         if (!response.ok) {
            // Si el servidor falla, revertimos los cambios (Rollback)
            console.error("Error al sincronizar like con el servidor");
         }
      } catch (error) {
         console.error("Error de red en like:", error);
      }
   };

  const handleAddComment = async () => {
      if (!newCommentText.trim()) return;

      // BUSCAMOS LA CLAVE CORRECTA: meteomap_token
      const rawToken = localStorage.getItem('meteomap_token'); 
      
      if (!rawToken) {
         alert("No se encontró el token. Por favor, inicia sesión de nuevo.");
         return;
      }

      setIsSubmittingComment(true);
      try {
         console.log("Enviando ID:", zone.id);
         console.log("Enviando Contenido:", newCommentText);
         const response = await fetch(`http://localhost:3000/api/comments/zone/${zone.id}`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${rawToken}`, // Ahora sí enviará el JWT
            },
            body: JSON.stringify({
            contenido: newCommentText,
            }),
         });

         const data = await response.json();

         if (response.status === 201) { 
            const serverId = data.comment?._id || data._id;
            const newCommentMapped: Comment = {
               id: serverId,
               userId: currentUserId,
               userName: currentUserName, 
               avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=me`,
               message: newCommentText,
               timestamp: "Ahora mismo",
               likes: 0,
               isLiked: false,
            };

            setDynamicComments([newCommentMapped, ...dynamicComments]);
            setNewCommentText("");
            setIsAddingComment(false);
         } else {
            alert(data.message || "Error al publicar (Status: " + response.status + ")");
         }
      } catch (error) {
         console.error("Error de red:", error);
      } finally {
         setIsSubmittingComment(false);
      }
   };

  const handleDeleteComment = async (commentId: string) => {
      console.log("Iniciando proceso de borrado para:", commentId);
      
      const confirmed = window.confirm("¿Estás seguro de que deseas eliminar este comentario?");
      if (!confirmed) {
         console.log("Borrado cancelado por el usuario");
         return;
      }

      try {
         const rawToken = localStorage.getItem('meteomap_token'); 
         console.log("Token recuperado:", rawToken ? "Sí" : "No");

         if (!rawToken) {
            alert("Sesión expirada. Por favor, inicia sesión de nuevo.");
            return;
         }

         const response = await fetch(`http://localhost:3000/api/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
            'Authorization': `Bearer ${rawToken}`,
            'Content-Type': 'application/json'
            },
         });

         console.log("Respuesta del servidor (Status):", response.status);

         if (response.ok) {
            console.log("Borrado exitoso en servidor. Actualizando UI...");
            setDynamicComments(prev => prev.filter(c => c.id !== commentId));
         } else {
            const data = await response.json();
            console.error("Error devuelto por el servidor:", data);
            alert(data.message || "Error al borrar");
         }
      } catch (error) {
         console.error("Error catastrófico en la petición DELETE:", error);
      }
   };

  const comments = dynamicComments.length > 0 ? dynamicComments : [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: -400 }}
        animate={{ x: 0 }}
        exit={{ x: -400 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed left-0 top-16 bottom-0 w-full sm:w-96 bg-white shadow-2xl z-[2000] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex-shrink-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h2 className="text-xl font-bold">{zone.name}</h2>
              <p className="text-sm text-blue-100">{zone.elevation}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={() => onToggleFavorite(zone.id)}
              >
                <Star
                  className={`h-5 w-5 ${zone.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`}
                />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {/* Current Status */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Estado Actual
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {/* Temperature */}
                <Card className="p-3 text-center">
                  <Thermometer className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-900">{zone.temperature}°C</p>
                  <p className="text-xs text-gray-500">Temperatura</p>
                </Card>

                {/* Wind */}
                <Card className="p-3 text-center">
                  <Wind className="h-5 w-5 text-teal-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-900">{zone.wind}</p>
                  <p className="text-xs text-gray-500">km/h</p>
                </Card>

                {/* Avalanche Level */}
                <Card className="p-3 text-center">
                  <AlertTriangle className="h-5 w-5 text-red-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-900">{zone.avalancheLevel}/5</p>
                  <p className="text-xs text-gray-500">Aludes</p>
                </Card>
              </div>

              {/* Avalanche Level Badge */}
              <div className="mt-3">
                <Badge className={`${avalancheLevelColors[zone.avalancheLevel]} text-white w-full justify-center py-2`}>
                  Riesgo de Aludes: {avalancheLevelText[zone.avalancheLevel]}
                </Badge>
              </div>
            </div>

            {/* Temperature Forecast */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Evolución Temperatura (6h)</h3>
              <Card className="p-3">
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={temperatureForecast}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      stroke="#9ca3af"
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      stroke="#9ca3af"
                      domain={['dataMin - 1', 'dataMax + 1']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value) => [`${value}°C`, 'Temperatura']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="temp" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* User Reports */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Reportes Recientes de Usuarios</h3>
              <div className="space-y-3">
                {zone.reports.length > 0 ? (
                  <>
                    {zone.reports.map((report) => (
                      <Card 
                        key={report.id} 
                        className="p-3 hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300" 
                        onClick={() => handleReportClick(report)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleReportClick(report);
                          }
                        }}
                      >
                        <div className="flex gap-3">
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {report.userName.charAt(0).toUpperCase()}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-gray-900 text-sm truncate">
                                {report.userName}
                              </p>
                              <div className="flex items-center gap-1 text-gray-500 text-xs whitespace-nowrap">
                                <Clock className="h-3 w-3" />
                                {report.timestamp}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{report.condition}</p>
                          </div>
                        </div>

                        {/* Photo if exists */}
                        {report.photo && (
                          <div className="mt-2 rounded-md overflow-hidden">
                            <img 
                              src={report.photo} 
                              alt="Reporte" 
                              className="w-full h-32 object-cover"
                            />
                          </div>
                        )}
                      </Card>
                    ))}

                    {/* View All Button */}
                    <Button variant="outline" className="w-full" onClick={onViewAllReports}>
                      Ver todos los reportes de esta zona
                    </Button>
                  </>
                ) : (
                  <Card className="p-4 text-center text-gray-500">
                    <User className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No hay reportes en esta zona</p>
                    <p className="text-xs mt-1">Sé el primero en compartir información</p>
                  </Card>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Comentarios de la Comunidad
              </h3>

              {/* Add Comment Form */}
              {!isAddingComment ? (
                <Button
                  variant="outline"
                  className="w-full mb-3"
                  onClick={() => setIsAddingComment(true)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Añadir Comentario
                </Button>
              ) : (
                <Card className="p-3 mb-3 border-blue-300">
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Comparte tu experiencia en esta zona..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      className="min-h-16 resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        onClick={handleAddComment}
                        disabled={isSubmittingComment || !newCommentText.trim()}
                      >
                        {isSubmittingComment ? (
                          <>
                            <div className="h-3 w-3 rounded-full bg-white animate-spin mr-2" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="h-3 w-3 mr-1" />
                            Enviar
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsAddingComment(false);
                          setNewCommentText("");
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              <div className="space-y-3">
                {comments.length > 0 ? (
                  <>
                    {comments.slice(0, 3).map((comment) => (
                      <Card key={comment.id} className="p-3">
                        <div className="flex gap-3">
                          {/* Avatar */}
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={comment.avatar} alt={comment.userName} />
                            <AvatarFallback>{comment.userName.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-gray-900 text-sm">{comment.userName}</p>
                              <div className="flex items-center gap-1 text-gray-500 text-xs whitespace-nowrap">
                                <Clock className="h-3 w-3" />
                                {comment.timestamp}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{comment.message}</p>

                            {/* Like Button */}
                            <div className="mt-2 flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className={`h-6 px-2 gap-1 ${
                                  likedComments.has(comment.id)
                                    ? 'text-blue-600'
                                    : 'text-gray-500 hover:text-blue-600'
                                }`}
                                onClick={() => handleLikeComment(comment.id)}
                              >
                                <ThumbsUp className={`h-3 w-3 ${likedComments.has(comment.id) ? 'fill-current' : ''}`} />
                                <span className="text-xs">
                                  {comment.likes}
                                </span>
                              </Button>
                              
                              {/* Botón de borrar condicional */}
                              {(currentUserId === comment.userId) && (
                                 <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2 gap-1 text-gray-400 hover:text-red-600 transition-colors"
                                    onClick={(e) => {
                                       e.stopPropagation(); // Evita que el clic active eventos del padre
                                       console.log("Botón eliminar presionado para ID:", comment.id);
                                       handleDeleteComment(comment.id);
                                    }}
                                    title="Eliminar mi comentario"
                                 >
                                    <Trash2 className="h-3.5 w-3.5" />
                                 </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}

                    {comments.length > 3 && (
                      <Button variant="outline" className="w-full text-sm" onClick={onViewAllReports}>
                        Ver todos los comentarios ({comments.length})
                      </Button>
                    )}
                  </>
                ) : (
                  <Card className="p-4 text-center text-gray-500">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No hay comentarios aún</p>
                    <p className="text-xs mt-1">¡Sé el primero en comentar!</p>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Create Report Button at Bottom */}
        <div className="flex-shrink-0 p-4 bg-white border-t border-gray-200 shadow-lg">
          <Button
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md"
            onClick={onCreateReport}
          >
            Crear Nuevo Reporte
          </Button>
        </div>
      </motion.div>

      {/* Report Detail Modal */}
      <ReportDetailModal
        report={selectedReport}
        zoneName={zone.name}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </AnimatePresence>
  );
}