import { X, Star, Cloud, Thermometer, Wind, TrendingUp, Clock, User, MessageCircle, ThumbsUp, Send, Trash2, Edit2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { ReportDetailModal } from "./ReportDetailModal";
import { useState, useEffect, SetStateAction } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface UserReport {
  id: string;
  userId: string; // ID del autor del reporte
  userName: string;
  avatar: string;
  condition: string;
  timestamp: string;
  updatedAt: string;
  isEdited: boolean;
  categoryIcon: string;
  riskType?: string;
  description?: string;
  confirmations?: number;
  denials?: number;
  location?: string;
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
  replies?: Comment[];
}

interface ZoneData {
  id: string;
  name: string;
  elevation: string;
  temperature: number;
  wind: number;
  weather: number;
  isFavorite: boolean;
  coordinates?: [number, number];
  reports: UserReport[];
  comments?: Comment[];
}

interface ZoneSidebarProps {
  zone: ZoneData | null;
  onClose: () => void;
  onToggleFavorite: (zoneId: string) => void;
  onCreateReport: () => void;
  onViewAllReports: (currentComments: Comment[]) => void;
}


export function ZoneSidebar({ zone, onClose, onToggleFavorite, onCreateReport, onViewAllReports }: ZoneSidebarProps) {
  if (!zone) return null;

  const [dynamicComments, setDynamicComments] = useState<Comment[]>([]);
  const [dynamicReports, setDynamicReports] = useState<UserReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set()); // Cambiado a string por MongoID
  const [newCommentText, setNewCommentText] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [forecastData, setForecastData] = useState<Array<{time: string; temp: number}> | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const handleReportClick = (report: UserReport) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  useEffect(() => {
    const userInfo = localStorage.getItem('meteomap_user');
    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo);
        const userId = parsed.id || parsed._id || null;
        const userName = parsed.name || parsed.nombre || null;
        const userAvatar = parsed.avatar_url || `https://api.dicebear.com/9.x/${parsed.avatar_style || 'avataaars'}/svg?seed=${parsed.avatar_seed || userName || userId || "me"}`;
        setCurrentUserId(userId);
        setCurrentUserName(userName);
        setCurrentUserAvatar(userAvatar);
        console.log("Current User:", { id: userId, name: userName });
      } catch (error) {
        console.error("Error parsing user info:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (!zone.id) return;

    const fetchForecast = async () => {
      setForecastLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/zones/${zone.id}/forecast`);
        const data = await response.json();

        console.log('Response:', response.ok);
        console.log('Data completa:', data);
        console.log('Datos crudos forecast:', data.data?.datos_crudos);

        // El controller devuelve los datos transformados en "datos_crudos"
        if (response.ok && data.data && Array.isArray(data.data.datos_crudos)) {
          const forecastArray = data.data.datos_crudos;
         
          const transformedForecast = forecastArray.map((item: any, index: number) => ({
            time: item.hora,
            temp: Math.round(item.temperatura)
          }));

          console.log('Array original:', forecastArray);
          console.log('Array transformado:', transformedForecast);
          setForecastData(transformedForecast);
        } else {
          console.warn('No hay datos de pronóstico');
          setForecastData(null);
        }
      } catch (error) {
        console.error("Error cargando pronóstico:", error);
        setForecastData(null);
      } finally {
        setForecastLoading(false);
      }
    };

    fetchForecast();
  }, [zone.id]);

  useEffect(() => {
      if (!zone.id) return;

      const fetchReports = async () => {
         try {
            const response = await fetch(`${API_BASE_URL}/reports?zonaId=${zone.id}`);
            const data = await response.json();
            if (response.ok && data.reports) {
               const mappedReports = data.reports.map((r: any) => {
                  const createdAt = new Date(r.createdAt);
                  const updatedAt = new Date(r.updatedAt);
                  const isEdited = Math.abs(updatedAt.getTime() - createdAt.getTime()) > 1000;

                  return {
                     id: r._id,
                     userId: r.usuario_id?._id,
                     userName: r.usuario_id?.perfil?.nombre || "Usuario",
                     avatar: r.usuario_id?.perfil?.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${r.usuario_id?._id || r.usuario_id}`,
                     condition: r.categoria_id?.nombre || r.categoria?.nombre,
                     timestamp: createdAt.toLocaleString(),
                     updatedAt: updatedAt.toLocaleString(),
                     isEdited,
                     categoryIcon: r.categoria_id?.icono_marcador || "⚠️",
                     riskType: r.categoria_id?.nombre || r.categoria?.nombre,
                     description: r.contenido?.descripcion,
                     confirmations: r.validaciones?.usuarios_confirmaron?.length ?? 0,
                     denials: r.validaciones?.usuarios_desmintieron?.length ?? 0,
                     location: zone.name,
                     estado: r.estado,
                  };
               });
               setDynamicReports(mappedReports);
            }
         } catch (error) {
            console.error("Error fetching reports:", error);
         }
      };

      const fetchComments = async () => {
         setIsLoading(true);
         try {
            const response = await fetch(`${API_BASE_URL}/comments/zone/${zone.id}`);
            const data = await response.json();

            if (response.ok) {
            const initialLikedSet = new Set<string>();

            const mappedComments: Comment[] = data.comments.map((c: any) => {
               const hasLiked = currentUserId && c.likes.some((id: string) => String(id) === String(currentUserId));
               const uniqueLikes = new Set(c.likes.map((id: any) => String(id)));
               
               if (hasLiked) initialLikedSet.add(c._id);

               return {
                  id: c._id,
                  userId: c.usuario_id?._id || c.usuario_id,
                  userName: c.usuario_id?.perfil?.nombre || "Usuario Anónimo",
                  avatar: c.usuario_id?.perfil?.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${c.usuario_id?._id}`,
                  message: c.contenido,
                  timestamp: new Date(c.createdAt).toLocaleString(),
                  likes: uniqueLikes.size,
                  isLiked: !!hasLiked,
                  replies: []
               };
            });

            setLikedComments(initialLikedSet);
            setDynamicComments(mappedComments);
            
            // Cargamos las respuestas para cada comentario
            for (const comment of mappedComments) {
               try {
                  const repliesResponse = await fetch(`${API_BASE_URL}/comments/${comment.id}/replies`);
                  const repliesData = await repliesResponse.json();
                  
                  if (repliesResponse.ok) {
                     const mappedReplies: Comment[] = repliesData.replies.map((r: any) => ({
                        id: r._id || r.id,
                        userId: r.usuario_id?._id || r.usuario_id,
                        userName: r.usuario_id?.perfil?.nombre || "Usuario",
                        avatar: r.usuario_id?.perfil?.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${r.usuario_id?._id}`,
                        message: r.contenido,
                        timestamp: new Date(r.createdAt).toLocaleString(),
                        likes: r.likes?.length || 0,
                        isLiked: currentUserId ? r.likes?.some((id: any) => String(id) === String(currentUserId)) : false
                     }));
                     
                     // Actualizamos el comentario con sus respuestas
                     setDynamicComments(prev => prev.map(c => 
                        c.id === comment.id ? { ...c, replies: mappedReplies } : c
                     ));
                  }
               } catch (error) {
                  console.error(`Error cargando respuestas para comentario ${comment.id}:`, error);
               }
            }
            }
         } catch (error) {
            console.error("Error cargando comentarios:", error);
         } finally {
            setIsLoading(false);
         }
      };

      fetchComments();
      fetchReports();
   }, [zone.id, currentUserId]);

   const fetchReplies = async (commentId: string) => {
    // Si ya están expandidas, las cerramos
    if (expandedReplies.has(commentId)) {
      setExpandedReplies(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/comments/${commentId}/replies`);
      const data = await response.json();

      if (response.ok) {
        const mappedReplies: Comment[] = data.replies.map((r: any) => ({
          id: r._id,
          userId: r.usuario_id?._id || r.usuario_id,
          userName: r.usuario_id?.perfil?.nombre || "Usuario",
          avatar: r.usuario_id?.perfil?.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${r.usuario_id?._id}`,
          message: r.contenido,
          timestamp: new Date(r.createdAt).toLocaleString(),
          likes: r.likes?.length || 0,
          isLiked: currentUserId ? r.likes?.some((id: any) => String(id) === String(currentUserId)) : false,
        }));

        // Actualizamos el comentario padre con sus respuestas
        setDynamicComments(prev => prev.map(c => 
          c.id === commentId ? { ...c, replies: mappedReplies } : c
        ));

        // Marcamos como expandido
        setExpandedReplies(prev => new Set(prev).add(commentId));
      }
    } catch (error) {
      console.error("Error cargando respuestas:", error);
    }
  };

  const handleLikeComment = async (commentId: string) => {
      const rawToken = localStorage.getItem('meteomap_token');
      if (!rawToken || !currentUserId) {
         alert("Debes iniciar sesión para dar like");
         return;
      }

      const isAlreadyLiked = likedComments.has(commentId);

      const url = isAlreadyLiked 
         ? `${API_BASE_URL}/comments/${commentId}/unlike`
         : `${API_BASE_URL}/comments/${commentId}/like`;
      const method = isAlreadyLiked ? 'DELETE' : 'POST';

      setLikedComments(prev => {
         const newSet = new Set(prev);
         if (isAlreadyLiked) newSet.delete(commentId);
         else newSet.add(commentId);
         return newSet;
      });


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
            console.error("Error al sincronizar like con el servidor");
         }
      } catch (error) {
         console.error("Error de red en like:", error);
      }
   };

  const handleAddComment = async () => {
      if (!newCommentText.trim()) return;

      const rawToken = localStorage.getItem('meteomap_token'); 
      
      if (!rawToken) {
         alert("No se encontró el token. Por favor, inicia sesión de nuevo.");
         return;
      }

      setIsSubmittingComment(true);
      try {
         const response = await fetch(`${API_BASE_URL}/comments/zone/${zone.id}`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${rawToken}`, 
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
               userId: currentUserId ?? undefined,
               userName: currentUserName ?? "", 
               avatar: currentUserAvatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=me`,
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
      const confirmed = window.confirm("¿Estás seguro de que deseas eliminar este comentario?");
      if (!confirmed) {
         return;
      }

      try {
         const rawToken = localStorage.getItem('meteomap_token'); 

         if (!rawToken) {
            alert("Sesión expirada. Por favor, inicia sesión de nuevo.");
            return;
         }

         const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
            'Authorization': `Bearer ${rawToken}`,
            'Content-Type': 'application/json'
            },
         });

         if (response.ok) {
            setDynamicComments(prev => prev.filter(c => c.id !== commentId));
         } else {
            const data = await response.json();
            alert(data.message || "Error al borrar");
         }
      } catch (error) {
         console.error("Error en la petición DELETE:", error);
      }
   };

  const handleDeleteReply = async (replyId: string, commentId: string) => {
    const confirmDelete = window.confirm("¿Estás seguro de que quieres eliminar esta respuesta?");
    if (!confirmDelete) return;

    const rawToken = localStorage.getItem('meteomap_token');
    if (!rawToken) {
      alert("Sesión expirada. Por favor, inicia sesión de nuevo.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/comments/${replyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${rawToken}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        setDynamicComments(prev => prev.map(comment => {
          if (comment.id === commentId && comment.replies) {
            return {
              ...comment,
              replies: comment.replies.filter(reply => reply.id !== replyId)
            };
          }
          return comment;
        }));
      } else {
        const data = await response.json();
        alert(data.message || "Error al borrar la respuesta");
      }
    } catch (error) {
      console.error("Error en la petición DELETE:", error);
    }
  };

  const updateEditedComment = (commentId: string, newText: string): boolean => {
    let found = false;
    const updateInTree = (comments: Comment[]): Comment[] => {
      return comments.map(comment => {
        if (comment.id === commentId) {
          found = true;
          return { ...comment, message: newText };
        }
        if (comment.replies && comment.replies.length > 0) {
          const updatedReplies = updateInTree(comment.replies);
          if (updatedReplies !== comment.replies) {
            found = true;
            return { ...comment, replies: updatedReplies };
          }
        }
        return comment;
      });
    };
    
    setDynamicComments(prev => {
      const updated = updateInTree(prev);
      if (found) {
        return updated;
      }
      return prev;
    });
    
    return found;
  };

  const handleEditComment = async (commentId: string, newText: string) => {
    if (!newText.trim()) {
      alert("El comentario no puede estar vacío");
      return;
    }

    const rawToken = localStorage.getItem('meteomap_token');
    if (!rawToken) {
      alert("Sesión expirada. Por favor, inicia sesión de nuevo.");
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${rawToken}`,
        },
        body: JSON.stringify({ contenido: newText }),
      });

      if (response.ok) {
        updateEditedComment(commentId, newText);
        setEditingCommentId(null);
        setEditingText("");
      } else {
        const data = await response.json();
        alert(data.message || "Error al actualizar el comentario");
      }
    } catch (error) {
      console.error("Error en la petición PUT:", error);
      alert("Error al actualizar el comentario");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const comments = dynamicComments.length > 0 ? dynamicComments : [];

  const handleAddReply = async (commentId: string) => {
    if (!replyText.trim()) return;

    const rawToken = localStorage.getItem('meteomap_token');
    if (!rawToken) {
      alert("No se encontró el token. Por favor, inicia sesión de nuevo.");
      return;
    }

    setIsSubmittingReply(true);
    try {
      const response = await fetch(`${API_BASE_URL}/comments/${commentId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${rawToken}`,
        },
        body: JSON.stringify({ contenido: replyText }),
      });

      const data = await response.json();

      if (response.ok) {
        // Limpiamos los campos
        setReplyText("");
        setReplyingTo(null);
        
        // Cargamos las respuestas actualizadas desde el backend
        try {
          const repliesResponse = await fetch(`${API_BASE_URL}/comments/${commentId}/replies`);
          const repliesData = await repliesResponse.json();

          if (repliesResponse.ok) {
            const mappedReplies: Comment[] = repliesData.replies.map((r: any) => ({
              id: r._id,
              userId: r.usuario_id?._id || r.usuario_id,
              userName: r.usuario_id?.perfil?.nombre || "Usuario",
              avatar: r.usuario_id?.perfil?.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${r.usuario_id?._id}`,
              message: r.contenido,
              timestamp: new Date(r.createdAt).toLocaleString(),
              likes: r.likes?.length || 0,
              isLiked: currentUserId ? r.likes?.includes(currentUserId) : false,
            }));

            // Actualizamos el comentario padre con sus respuestas
            setDynamicComments(prev => prev.map(c => 
              c.id === commentId ? { ...c, replies: mappedReplies } : c
            ));

            // Marcamos como expandido para ver la respuesta que acabamos de agregar
            setExpandedReplies(prev => new Set(prev).add(commentId));
          }
        } catch (error) {
          console.error("Error cargando respuestas actualizadas:", error);
        }
      } else {
        alert(data.message || "Error al agregar respuesta");
      }
    } catch (error) {
      console.error("Error al agregar respuesta:", error);
      alert("Error de red al enviar la respuesta");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ x: -450 }}
          animate={{ x: 0 }}
          exit={{ x: -450 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed left-0 top-16 bottom-0 w-full sm:w-[420px] bg-white shadow-2xl z-[2000] flex flex-col overflow-hidden"
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
                  <Card className="p-3 text-center">
                    <Thermometer className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-gray-900">{zone.temperature}°C</p>
                    <p className="text-xs text-gray-500">Temperatura</p>
                  </Card>

                  <Card className="p-3 text-center">
                    <Wind className="h-5 w-5 text-teal-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-gray-900">{zone.wind}</p>
                    <p className="text-xs text-gray-500">km/h</p>
                  </Card>

                  <Card className="p-3 text-center flex flex-col justify-between min-h-[110px] ">
                    <Cloud className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                    <p className="text-sm font-bold text-gray-900 leading-tight whitespace-normal">{zone.weather}</p>
                    <p className="text-xs text-gray-500">Clima</p>
                  </Card>
                </div>

               
              </div>

              {/* Temperature Forecast */}
              {forecastData && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Evolución Temperatura (12h)</h3>
                <Card className="p-3">
                  {forecastLoading ? (
                    <div className="h-[150px] flex items-center justify-center text-gray-500">
                      <div className="h-4 w-4 rounded-full bg-blue-500 animate-spin mr-2"></div>
                      Cargando pronóstico...
                    </div>
                  ) : (
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={forecastData}>
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
                  )}
                </Card>
              </div>
              )}

              {/* User Reports */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Reportes Recientes de Usuarios</h3>
                <div className="space-y-3">
                  {dynamicReports.length > 0 ? (
                    <>
                      {dynamicReports.slice(0, 3).map((report) => (
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
                            <Avatar className="h-10 w-10 flex-shrink-0">
                              <AvatarImage src={report.avatar} alt={report.userName} />
                              <AvatarFallback>
                                {report.userName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-medium text-gray-900 text-sm truncate">
                                  {report.userName}
                                </p>
                                <div className="flex flex-col items-end gap-0.5 text-gray-500 text-[10px] whitespace-nowrap">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-2.5 w-2.5" />
                                    {report.isEdited ? report.updatedAt : report.timestamp}
                                  </div>
                                  {report.isEdited && (
                                    <span className="bg-gray-100 px-1 rounded text-[9px] font-bold uppercase text-gray-400">
                                      Editado
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-lg leading-none">{report.categoryIcon}</span>
                                <p className="text-sm text-gray-600 font-medium">{report.condition}</p>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}

                      {dynamicReports.length > 3 && (
                        <Button variant="outline" className="w-full" onClick={() => onViewAllReports(dynamicComments)}>
                          Ver todos los reportes de esta zona
                        </Button>
                      )}
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
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={comment.avatar} alt={comment.userName} />
                              <AvatarFallback>{comment.userName.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-medium text-gray-900 text-sm">{comment.userName}</p>
                                <div className="flex items-center gap-1 text-gray-500 text-xs whitespace-nowrap">
                                  <Clock className="h-3 w-3" />
                                  {comment.timestamp}
                                </div>
                              </div>
                              {editingCommentId === comment.id ? (
                                <div className="mt-2 space-y-2">
                                  <Textarea
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    className="min-h-16 resize-none text-sm"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                                      onClick={() => handleEditComment(comment.id, editingText)}
                                      disabled={isSubmittingEdit || !editingText.trim() || editingText === comment.message}
                                    >
                                      {isSubmittingEdit ? (
                                        <>
                                          <div className="h-3 w-3 rounded-full bg-white animate-spin mr-2" />
                                          Guardando...
                                        </>
                                      ) : (
                                        'Guardar'
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setEditingCommentId(null);
                                        setEditingText("");
                                      }}
                                    >
                                      Cancelar
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm text-gray-600 mt-1">{comment.message}</p>

                                  <div className="mt-2 flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className={`h-8 gap-1 transition-colors ${
                                        likedComments.has(comment.id)
                                          ? 'text-blue-600 hover:text-blue-700'
                                          : 'text-gray-600 hover:text-blue-600'
                                      }`}
                                      onClick={() => handleLikeComment(comment.id)}
                                      title="Me gusta"
                                    >
                                      <ThumbsUp className={`h-4 w-4 ${likedComments.has(comment.id) ? 'fill-current' : ''}`} />
                                      <span className="text-xs">
                                        {comment.likes}
                                      </span>
                                    </Button>

                                    {currentUserId === comment.userId && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 gap-1 text-gray-400 hover:text-blue-600 transition-colors"
                                          onClick={() => {
                                            setEditingCommentId(comment.id);
                                            setEditingText(comment.message);
                                          }}
                                          title="Editar comentario"
                                        >
                                          <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 gap-1 text-gray-400 hover:text-red-600 transition-colors"
                                          onClick={() => handleDeleteComment(comment.id)}
                                          title="Eliminar mi comentario"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </>
                                    )}

                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 gap-1 text-gray-600 hover:text-blue-600 transition-colors"
                                      onClick={() => {
                                        setReplyingTo(replyingTo === comment.id ? null : comment.id);
                                        setReplyText("");
                                      }}
                                      title="Responder"
                                    >
                                      <MessageCircle className="h-4 w-4" />
                                      <span className="text-xs">Responder</span>
                                    </Button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {replyingTo === comment.id && (
                            <div className="mt-3 ml-11 border-l-2 border-blue-300 pl-3">
                              <Textarea
                                placeholder="Escribe tu respuesta..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                rows={2}
                                className="mb-2 resize-none text-sm"
                              />
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyText("");
                                  }}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                  onClick={() => handleAddReply(comment.id)}
                                  disabled={isSubmittingReply || !replyText.trim()}
                                >
                                  {isSubmittingReply ? (
                                    <>
                                      <div className="h-3 w-3 rounded-full bg-white animate-spin mr-2" />
                                      Enviando...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="h-3 w-3 mr-1" />
                                      Responder
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}

                          {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-3">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 gap-1 text-xs text-blue-600 hover:text-blue-700"
                                onClick={() => fetchReplies(comment.id)}
                              >
                                {expandedReplies.has(comment.id) ? '▼' : '▶'} Ver respuestas ({comment.replies.length})
                              </Button>

                              {expandedReplies.has(comment.id) && (
                                <div className="mt-4 ml-8 space-y-3 border-l-2 border-blue-300 pl-4">
                                  {comment.replies.map((reply) => (
                                    <div
                                      key={reply.id}
                                      className="bg-gradient-to-r from-blue-50 to-blue-25 rounded-lg p-3 text-xs hover:shadow-sm transition-shadow border border-blue-100"
                                    >
                                      {editingCommentId === reply.id ? (
                                        <div className="space-y-2">
                                          <Textarea
                                            value={editingText}
                                            onChange={(e) => setEditingText(e.target.value)}
                                            className="min-h-12 resize-none text-xs"
                                          />
                                          <div className="flex gap-2">
                                            <Button
                                              size="sm"
                                              className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                                              onClick={() => handleEditComment(reply.id, editingText)}
                                              disabled={isSubmittingEdit || !editingText.trim() || editingText === reply.message}
                                            >
                                              {isSubmittingEdit ? 'Guardando...' : 'Guardar'}
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => {
                                                setEditingCommentId(null);
                                                setEditingText("");
                                              }}
                                            >
                                              Cancelar
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                              <Avatar className="h-6 w-6 flex-shrink-0">
                                                <AvatarImage src={reply.avatar} alt={reply.userName} />
                                                <AvatarFallback>{reply.userName.charAt(0).toUpperCase()}</AvatarFallback>
                                              </Avatar>
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <span className="font-semibold text-gray-900 text-xs">{reply.userName}</span>
                                                  <span className="text-gray-400 text-[11px]">•</span>
                                                  <span className="text-gray-500 text-[11px] whitespace-nowrap">{reply.timestamp}</span>
                                                </div>
                                              </div>
                                            </div>
                                            {currentUserId === reply.userId && (
                                              <div className="flex gap-1">
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  className="h-6 px-1 gap-1 text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
                                                  onClick={() => {
                                                    setEditingCommentId(reply.id);
                                                    setEditingText(reply.message);
                                                  }}
                                                  title="Editar respuesta"
                                                >
                                                  <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  className="h-6 px-1 gap-1 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                                                  onClick={() => handleDeleteReply(reply.id, comment.id)}
                                                  title="Eliminar respuesta"
                                                >
                                                  <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                          <p className="text-gray-700 text-xs leading-relaxed ml-8">{reply.message}</p>
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </Card>
                      ))}

                      {comments.length > 3 && (
                        <Button variant="outline" className="w-full text-sm" onClick={() => onViewAllReports(dynamicComments)}>
                          Ver todos los comentarios ({dynamicComments.length})
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

          <div className="flex-shrink-0 p-4 bg-white border-t border-gray-200 shadow-lg">
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md"
              onClick={onCreateReport}
            >
              Crear Nuevo Reporte
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>

      <ReportDetailModal
        report={selectedReport}
        zoneName={zone.name}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}