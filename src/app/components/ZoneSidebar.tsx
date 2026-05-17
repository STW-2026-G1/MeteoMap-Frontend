/**
 * @file ZoneSidebar.tsx
 * @description Componente lateral que muestra información detallada de una zona seleccionada,
 * incluyendo imagen de la zona, datos meteorológicos, reportes de usuarios, comentarios y respuestas.
 * Permite crear, editar y eliminar comentarios y reportes con confirmación mediante diálogos.
 * @author MeteoMap Team
 */

import { X, Star, Cloud, Thermometer, Wind, TrendingUp, Clock, User, MessageCircle, ThumbsUp, Send, Trash2, Edit2, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { ReportDetailModal } from "./ReportDetailModal";
import { useState, useEffect, SetStateAction } from "react";
import { ZoneData, UserReport, Comment } from "../types/weather";
import { getZoneImage } from "../lib/imageUtils";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';


interface ZoneSidebarProps {
  zone: ZoneData | null;
  onClose: () => void;
  onToggleFavorite: (zoneId: string) => void;
  onCreateReport: () => void;
  onViewAllReports: (currentComments: Comment[]) => void;
  reportRefreshTrigger?: number;
}


export function ZoneSidebar({ zone, onClose, onToggleFavorite, onCreateReport, onViewAllReports, reportRefreshTrigger }: ZoneSidebarProps) {

  const zoneId = zone?.id;
  const zoneName = zone?.name;

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
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);
  const [advancedMetrics, setAdvancedMetrics] = useState<Record<string, any> | null>(null);
  const [advancedMetricsLoading, setAdvancedMetricsLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [zoneImageUrl, setZoneImageUrl] = useState<string | null>(null);

  // AlertDialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteDialogData, setDeleteDialogData] = useState<{ type: 'comment' | 'reply', commentId: string, replyId?: string } | null>(null);

  /**
   * Abre el modal de detalles del reporte
   * @param {UserReport} report - Reporte a mostrar
   * @returns {void}
   */
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
    if (!zone?.id) return;

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
  }, [zone?.id]);

  useEffect(() => {
    const loadZoneImage = async () => {
      if (!zoneName) return;

      try {
        const imageUrl = await getZoneImage(zoneName);
        setZoneImageUrl(imageUrl);
      } catch (error) {
        console.error("Error loading zone image:", error);
      }
    };

    loadZoneImage();
  }, [zoneName]);

  useEffect(() => {
    if (!zone?.id) return;

    const fetchAdvancedMetrics = async () => {
      setAdvancedMetricsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/zones/${zone.id}/weather`);
        const data = await response.json();

        const currentMetrics = data?.data?.datos_meteorologicos || data?.data?.cache_meteo?.current?.datos_crudos || null;
        setAdvancedMetrics(currentMetrics);
      } catch (error) {
        console.error("Error cargando métricas avanzadas:", error);
        setAdvancedMetrics(null);
      } finally {
        setAdvancedMetricsLoading(false);
      }
    };

    fetchAdvancedMetrics();
  }, [zone?.id]);

  const metricLabels: Record<string, string> = {
    temperatura_aparente: "Sensación térmica",
    humedad: "Humedad",
    direccion_viento: "Dirección viento",
    precipitacion: "Precipitación",
    lluvia: "Lluvia",
    nieve: "Nieve",
    visibilidad: "Visibilidad",
    codigo_clima: "Código clima",
  };

  const metricUnits: Record<string, string> = {
    temperatura_aparente: "°C",
    humedad: "%",
    direccion_viento: "°",
    precipitacion: "mm",
    lluvia: "mm",
    nieve: "cm",
    visibilidad: "m",
  };

  const hiddenAdvancedMetrics = new Set(["temperatura", "velocidad_viento", "descripcion"]);

  /**
   * Formatea el valor de una métrica con su unidad correspondiente
   * @param {string} key - Clave de la métrica
   * @param {any} value - Valor a formatear
   * @returns {string} Valor formateado con unidad
   */
  const formatMetricValue = (key: string, value: any) => {
    if (value === null || value === undefined || value === "") return "N/D";

    if (typeof value === "number") {
      const unit = metricUnits[key] ? ` ${metricUnits[key]}` : "";
      return `${Number.isInteger(value) ? value : value.toFixed(1)}${unit}`;
    }

    return String(value);
  };

  const advancedMetricEntries = Object.entries(advancedMetrics || {})
    .filter(([key]) => !hiddenAdvancedMetrics.has(key));

  useEffect(() => {
      if (!zone?.id) return;

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
                     userId: r.usuario_id?._id || r.usuario_id,
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
   }, [zone?.id, currentUserId, reportRefreshTrigger]);

  /**
   * Carga las respuestas de un comentario
   * @async
   * @param {string} commentId - ID del comentario
   * @returns {Promise<void>}
   */
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

  /**
   * Da like a un comentario o lo deslike
   * @async
   * @param {string} commentId - ID del comentario
   * @returns {Promise<void>}
   */
  const handleLikeComment = async (commentId: string) => {
      const rawToken = localStorage.getItem('meteomap_token');
      if (!rawToken || !currentUserId) {
        toast.error("Debes iniciar sesión para dar like");
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

  /**
   * Añade un nuevo comentario a la zona
   * @async
   * @returns {Promise<void>}
   */
  const handleAddComment = async () => {
      if (!newCommentText.trim()) return;

      const rawToken = localStorage.getItem('meteomap_token'); 
      
      if (!rawToken) {
        toast.error("No se encontró el token. Por favor, inicia sesión de nuevo.");
         return;
      }

      setIsSubmittingComment(true);
      try {
         const response = await fetch(`${API_BASE_URL}/comments/zone/${zone?.id}`, {
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
            toast.error(data.message || "Error al publicar (Status: " + response.status + ")");
         }
      } catch (error) {
         console.error("Error de red:", error);
      } finally {
         setIsSubmittingComment(false);
      }
   };

  /**
   * Abre el diálogo de confirmación para eliminar un comentario
   * @param {string} commentId - ID del comentario a eliminar
   * @returns {void}
   */
  const handleDeleteComment = (commentId: string) => {
    setDeleteDialogData({ type: 'comment', commentId });
    setDeleteDialogOpen(true);
  };

  /**
   * Abre el diálogo de confirmación para eliminar una respuesta
   * @param {string} replyId - ID de la respuesta a eliminar
   * @param {string} commentId - ID del comentario padre
   * @returns {void}
   */
  const handleDeleteReply = (replyId: string, commentId: string) => {
    setDeleteDialogData({ type: 'reply', commentId, replyId });
    setDeleteDialogOpen(true);
  };

  /**
   * Confirma y ejecuta la eliminación de un comentario o respuesta
   * @async
   * @returns {Promise<void>}
   */
  const confirmDelete = async () => {
    if (!deleteDialogData) return;

    const rawToken = localStorage.getItem('meteomap_token');
    if (!rawToken) {
      toast.error("Sesión expirada. Por favor, inicia sesión de nuevo.");
      setDeleteDialogOpen(false);
      return;
    }

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

    try {
      const deleteId = deleteDialogData.type === 'comment' ? deleteDialogData.commentId : deleteDialogData.replyId;
      const response = await fetch(`${API_BASE_URL}/comments/${deleteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${rawToken}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        if (deleteDialogData.type === 'comment') {
          setDynamicComments(comments.filter((comment) => comment.id !== deleteDialogData.commentId));
          toast.success("Comentario eliminado");
        } else {
          setDynamicComments(comments.map(comment => {
            if (comment.id === deleteDialogData.commentId && comment.replies) {
              return {
                ...comment,
                replies: comment.replies.filter(reply => reply.id !== deleteDialogData.replyId)
              };
            }
            return comment;
          }));
          toast.success("Respuesta eliminada");
        }
      } else {
        const data = await response.json();
        toast.error(data.message || "Error al borrar");
      }
    } catch (error) {
      console.error("Error en la petición DELETE:", error);
      toast.error("Error al eliminar");
    } finally {
      setDeleteDialogOpen(false);
      setDeleteDialogData(null);
    }
  };

  /**
   * Actualiza recursivamente un comentario editado en el árbol de comentarios
   * @param {string} commentId - ID del comentario a actualizar
   * @param {string} newText - Nuevo texto del comentario
   * @returns {boolean} true si el comentario fue encontrado y actualizado
   */
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

  /**
   * Edita un comentario existente
   * @async
   * @param {string} commentId - ID del comentario a editar
   * @param {string} newText - Nuevo contenido del comentario
   * @returns {Promise<void>}
   */
  const handleEditComment = async (commentId: string, newText: string) => {
    if (!newText.trim()) {
      toast.error("El comentario no puede estar vacío");
      return;
    }

    const rawToken = localStorage.getItem('meteomap_token');
    if (!rawToken) {
      toast.error("Sesión expirada. Por favor, inicia sesión de nuevo.");
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
        toast.error(data.message || "Error al actualizar el comentario");
      }
    } catch (error) {
      console.error("Error en la petición PUT:", error);
      toast.error("Error al actualizar el comentario");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const comments = dynamicComments.length > 0 ? dynamicComments : [];

  /**
   * Añade una respuesta a un comentario existente
   * @async
   * @param {string} commentId - ID del comentario al que responder
   * @returns {Promise<void>}
   */
  const handleAddReply = async (commentId: string) => {
    if (!replyText.trim()) return;

    const rawToken = localStorage.getItem('meteomap_token');
    if (!rawToken) {
      toast.error("No se encontró el token. Por favor, inicia sesión de nuevo.");
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
        toast.error(data.message || "Error al agregar respuesta");
      }
    } catch (error) {
      console.error("Error al agregar respuesta:", error);
      toast.error("Error de red al enviar la respuesta");
    } finally {
      setIsSubmittingReply(false);
    }
  };
  if (!zone) return null;
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
          {/* Header with Image Integration */}
{/* Header with Image Integration */}
{zoneImageUrl && (
  <div className="relative -mx-4 -mt-4 mb-4 group">
    {/* Image Container */}
    <div className="h-40 relative overflow-hidden bg-gradient-to-b from-gray-300 to-gray-400">
      <img
        src={zoneImageUrl}
        alt={zone.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        style={{ width: 'calc(100vw - 1rem)' }}
      />

            {/* Subtle overlay gradient to ensure button contrast against bright images */}
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/30 to-transparent" />

               {/* Header Content Overlay (Buttons) */}
               <div className="absolute top-4 right-4 p-4 flex items-center gap-2">
               <Button
                  size="icon"
                  variant="ghost"
                  className="text-white bg-black/30 hover:bg-white/20 backdrop-blur-sm border border-white/10 shadow-md"
                  onClick={() => onToggleFavorite(zone.id)}
                  aria-label="Añadir a favoritos"
               >
                  <Star
                     className={`h-5 w-5 ${
                     zone.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''
                     }`}
                  />
               </Button>
               <Button
                  size="icon"
                  variant="ghost"
                  className="text-white bg-black/30 hover:bg-white/20 backdrop-blur-sm border border-white/10 shadow-md"
                  onClick={onClose}
                  aria-label="Cerrar"
               >
                  <X className="h-5 w-5" />
               </Button>
               </div>
            </div>

            {/* Zone Name positioned BELOW the image and shifted to the right */}
            <div className="px-4 pl-6 mt-4">
               <h2 className="text-xl font-bold text-gray-900 leading-tight line-clamp-2">
               {zone.name}
               </h2>
            </div>
         </div>
         )}

          {/* Legacy Header (shown when no image) */}
          {!zoneImageUrl && (
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex-shrink-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{zone.name}</h2>
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
          )}

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

                <div className="mt-3">
                  {isMetricsExpanded && (
                    <Card className="mb-3 p-2 bg-gray-50/80 border-gray-200">
                      {advancedMetricsLoading ? (
                        <div className="h-24 flex items-center justify-center text-gray-500 text-sm">
                          Cargando métricas...
                        </div>
                      ) : advancedMetricEntries.length > 0 ? (
                        <ScrollArea className="max-h-52 pr-2 overflow-y-auto">
                          <div className="grid grid-cols-1 gap-2">
                            {advancedMetricEntries.map(([key, value]) => (
                              <div key={key} className="flex items-center justify-between rounded-md bg-white border border-gray-100 px-3 py-2">
                                <span className="text-xs font-medium text-gray-600">
                                  {metricLabels[key] || key.replace(/_/g, " ")}
                                </span>
                                <span className="text-sm font-semibold text-gray-900">
                                  {formatMetricValue(key, value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="h-24 flex items-center justify-center text-gray-500 text-sm text-center px-2">
                          No hay métricas adicionales disponibles para esta zona.
                        </div>
                      )}
                    </Card>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsMetricsExpanded((prev) => !prev)}
                    className="w-full flex items-center gap-3 text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label={isMetricsExpanded ? "Ocultar métricas nuevas" : "Mostrar métricas nuevas"}
                  >
                    <div className="h-px flex-1 bg-gray-200" />
                    <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isMetricsExpanded ? "rotate-180" : "rotate-0"}`} />
                    <div className="h-px flex-1 bg-gray-200" />
                  </button>
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
              data-cy="create-report-button"
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
      {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent className="border-l-4 border-red-600 bg-gradient-to-br from-red-50 to-white shadow-xl">
              <AlertDialogHeader className="border-b border-red-200 pb-4">
                <AlertDialogTitle className="flex items-center gap-3 text-red-700">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                  Confirmar eliminación
                </AlertDialogTitle>
                <AlertDialogDescription className="mt-2 text-gray-700">
                  {deleteDialogData?.type === 'comment'
                    ? '¿Estás seguro de que quieres eliminar este comentario? Esta acción no se puede deshacer.'
                    : '¿Estás seguro de que quieres eliminar esta respuesta? Esta acción no se puede deshacer.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="border-t border-red-200 pt-4">
                <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 text-gray-800">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
    </>
  );
}