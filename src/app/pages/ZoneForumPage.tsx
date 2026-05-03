import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { Header } from "../components/Header";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { ScrollArea } from "../components/ui/scroll-area";
import { ReportDetailModal } from "../components/ReportDetailModal";
import {
  MapPin,
  ThumbsUp,
  MessageCircle,
  Send,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Thermometer,
  Wind,
  Trash2,
  Edit2,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Comment {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  message: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
}

interface Report {
    id: number | string;
    userId: string; // ID del usuario propietario del reporte
    userName: string;
    avatar: string;
    condition: string;
    timestamp: string;
    updatedAt: string;
    isEdited: boolean;
    categoryName: string;
    categoryIcon: string;
    riskType?: string;
    description?: string;
    confirmations?: number;
    denials?: number;
    location?: string;
  }

  export default function ZoneForumPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth(); // Obtener usuario autenticado
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);

    const zoneName = searchParams.get("zone") || "Zona Desconocida";
    const zoneId = searchParams.get("id") || "1";
    const zoneElevation = searchParams.get("elevation") || "N/A";
    const zoneTemp = searchParams.get("temp") || "-2";
    const zoneWind = searchParams.get("wind") || "18";
    const zoneAvalanche = searchParams.get("avalanche") || "2";
    const commentsParam = searchParams.get("comments");

   const [newComment, setNewComment] = useState("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState("");
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
    
    const [reports, setReports] = useState<Report[]>([]);

    // Obtener el ID del usuario actual del localStorage
    useEffect(() => {
      const userData = localStorage.getItem('meteomap_user');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setCurrentUserId(parsedUser.id);
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }
    }, []);

    // Fetch reports from Backend
    useEffect(() => {
      const fetchReports = async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/reports?zonaId=${zoneId}`);
          const data = await response.json();
          if (response.ok && data.reports) {
            const mappedReports = data.reports.map((r: any) => {
              const createdAt = new Date(r.createdAt);
              const updatedAt = new Date(r.updatedAt);
              const isEdited = Math.abs(updatedAt.getTime() - createdAt.getTime()) > 1000;
              
              const categoryName = r.categoria_id?.nombre || "Categoría desconocida";
              const categoryIcon = r.categoria_id?.icono_marcador || "⚠️";

              return {
                id: r._id,
                userId: r.usuario_id?._id,
                userName: r.usuario_id?.perfil?.nombre || "Usuario",
                avatar: r.usuario_id?.perfil?.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${r.usuario_id?.avatar_seed || r.usuario_id?._id || "usuario"}`,
                condition: r.contenido?.descripcion?.slice(0, 50) + (r.contenido?.descripcion?.length > 50 ? "..." : ""),
                timestamp: createdAt.toLocaleString(),
                updatedAt: updatedAt.toLocaleString(),
                isEdited,
                categoryName,
                categoryIcon,
                riskType: categoryName,
                description: r.contenido?.descripcion,
                confirmations: r.validaciones?.usuarios_confirmaron?.length ?? 0,
                denials: r.validaciones?.usuarios_desmintieron?.length ?? 0,
                location: zoneName,
              };
            });
            setReports(mappedReports);
          }
        } catch (error) {
          console.error("Error fetching reports in forum:", error);
        }
      };

      fetchReports();
    }, [zoneId, zoneName]);
  // Obtener comentarios dinámicos del parámetro o usar mock
  const getInitialComments = (): Comment[] => {
    if (commentsParam) {
      try {
        const dynamicComments = JSON.parse(decodeURIComponent(commentsParam));
        console.log("Usando comentarios dinámicos del backend:", dynamicComments);
        return dynamicComments;
      } catch (error) {
        console.error("Error parsing dynamic comments:", error);
      }
    }
    // Retornar comentarios mock si no hay dinámicos
    return [];
  };

  const [comments, setComments] = useState<Comment[]>(getInitialComments());

  // Cargar comentarios desde el backend
  useEffect(() => {
    const fetchComments = async () => {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      
      try {
        const response = await fetch(`${API_BASE_URL}/comments/zone/${zoneId}`);
        const data = await response.json();

        if (response.ok && data.comments) {
          const mappedComments: Comment[] = data.comments.map((c: any) => ({
            id: c._id,
            userId: c.usuario_id?._id || c.usuario_id,
            userName: c.usuario_id?.perfil?.nombre || "Usuario Anónimo",
            avatar: c.usuario_id?.perfil?.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${c.usuario_id?._id}`,
            message: c.contenido,
            timestamp: new Date(c.createdAt).toLocaleString(),
            likes: c.likes?.length || 0,
            isLiked: currentUserId ? c.likes?.some((id: any) => String(id) === String(currentUserId)) : false,
            replies: []
          }));

          setComments(mappedComments);

          // Cargar respuestas para cada comentario
          for (const comment of mappedComments) {
            try {
              const repliesResponse = await fetch(`${API_BASE_URL}/comments/${comment.id}/replies`);
              const repliesData = await repliesResponse.json();
              
              if (repliesResponse.ok && repliesData.replies) {
                const mappedReplies: Comment[] = repliesData.replies.map((r: any) => ({
                  id: r._id || r.id,
                  userId: r.usuario_id?._id || r.usuario_id,
                  userName: r.usuario_id?.perfil?.nombre || "Usuario",
                  avatar: r.usuario_id?.perfil?.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${r.usuario_id?._id}`,
                  message: r.contenido,
                  timestamp: new Date(r.createdAt).toLocaleString(),
                  likes: r.likes?.length || 0,
                  isLiked: currentUserId ? r.likes?.some((id: any) => String(id) === String(currentUserId)) : false,
                }));
                
                setComments(prev => prev.map(c =>
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
      }
    };

    fetchComments();
  }, [zoneId, currentUserId]);

  const handleLike = async (commentId: string, isReply: boolean = false, parentId?: string) => {
      const rawToken = localStorage.getItem('meteomap_token');
      if (!rawToken) {
         alert("No se encontró el token. Por favor, inicia sesión de nuevo.");
         return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      
      // 1. Encontrar el estado actual del like
      const isAlreadyLiked = !isReply 
         ? comments.find(c => c.id === commentId)?.isLiked 
         : comments.find(c => c.id === parentId)?.replies?.find(r => r.id === commentId)?.isLiked;

      // 2. Determinar Método y URL
      // Si ya tiene like, llamamos a /unlike con DELETE. Si no, a /like con POST.
      const endpoint = isAlreadyLiked ? 'unlike' : 'like';
      const method = isAlreadyLiked ? 'DELETE' : 'POST';
      const url = `${API_BASE_URL}/comments/${commentId}/${endpoint}`;

      // 3. Actualización Optimista (UI)
      if (!isReply) {
         setComments(
            comments.map((comment) => {
            if (comment.id === commentId) {
               return {
                  ...comment,
                  likes: isAlreadyLiked ? Math.max(0, comment.likes - 1) : comment.likes + 1,
                  isLiked: !isAlreadyLiked,
               };
            }
            return comment;
            })
         );
      } else if (parentId) {
         setComments(
            comments.map((comment) => {
            if (comment.id === parentId && comment.replies) {
               return {
                  ...comment,
                  replies: comment.replies.map((reply) => {
                  if (reply.id === commentId) {
                     return {
                        ...reply,
                        likes: isAlreadyLiked ? Math.max(0, reply.likes - 1) : reply.likes + 1,
                        isLiked: !isAlreadyLiked,
                     };
                  }
                  return reply;
                  }),
               };
            }
            return comment;
            })
         );
      }

      // 4. Petición real a la API
      try {
         const response = await fetch(url, {
            method: method,
            headers: {
            'Authorization': `Bearer ${rawToken}`,
            'Content-Type': 'application/json'
            },
         });

         if (!response.ok) {
            throw new Error("Error al procesar el like");
         }
      } catch (error) {
         console.error("Error en la API de Like/Unlike:", error);
         // Opcional: Revertir la actualización optimista aquí si la petición falla
         alert("No se pudo guardar tu interacción. Por favor, intenta de nuevo.");
      }
   };

  const handleDeleteComment = async (commentId: string) => {
    const confirmDelete = window.confirm("¿Estás seguro de que quieres eliminar este comentario?");
    if (!confirmDelete) return;

    const rawToken = localStorage.getItem('meteomap_token');
    if (!rawToken) {
      alert("Sesión expirada. Por favor, inicia sesión de nuevo.");
      return;
    }

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

    try {
      const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${rawToken}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        setComments(comments.filter((comment) => comment.id !== commentId));
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

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

    try {
      const response = await fetch(`${API_BASE_URL}/comments/${replyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${rawToken}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        setComments(comments.map(comment => {
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
    
    setComments(prev => {
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
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

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

  const handlePostComment = async () => {
    if (newComment.trim().length < 10) return;

    const rawToken = localStorage.getItem('meteomap_token');
    if (!rawToken) {
      alert("No se encontró el token. Por favor, inicia sesión de nuevo.");
      return;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/comments/zone/${zoneId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${rawToken}`,
        },
        body: JSON.stringify({ contenido: newComment }),
      });

      const data = await response.json();

      if (response.status === 201) {
        setNewComment("");
        
        // Recargar comentarios desde el backend
        const commentsResponse = await fetch(`${API_BASE_URL}/comments/zone/${zoneId}`);
        const commentsData = await commentsResponse.json();

        if (commentsResponse.ok && commentsData.comments) {
          const mappedComments: Comment[] = commentsData.comments.map((c: any) => ({
            id: c._id,
            userId: c.usuario_id?._id || c.usuario_id,
            userName: c.usuario_id?.perfil?.nombre || "Usuario Anónimo",
            avatar: c.usuario_id?.perfil?.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${c.usuario_id?._id}`,
            message: c.contenido,
            timestamp: new Date(c.createdAt).toLocaleString(),
            likes: c.likes?.length || 0,
            isLiked: currentUserId ? c.likes?.some((id: any) => String(id) === String(currentUserId)) : false,
            replies: []
          }));

          setComments(mappedComments);

          // Cargar respuestas para cada comentario
          for (const comment of mappedComments) {
            try {
              const repliesResponse = await fetch(`${API_BASE_URL}/comments/${comment.id}/replies`);
              const repliesData = await repliesResponse.json();
              
              if (repliesResponse.ok && repliesData.replies) {
                const mappedReplies: Comment[] = repliesData.replies.map((r: any) => ({
                  id: r._id || r.id,
                  userId: r.usuario_id?._id || r.usuario_id,
                  userName: r.usuario_id?.perfil?.nombre || "Usuario",
                  avatar: r.usuario_id?.perfil?.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${r.usuario_id?._id}`,
                  message: r.contenido,
                  timestamp: new Date(r.createdAt).toLocaleString(),
                  likes: r.likes?.length || 0,
                  isLiked: currentUserId ? r.likes?.some((id: any) => String(id) === String(currentUserId)) : false,
                }));
                
                setComments(prev => prev.map(c =>
                  c.id === comment.id ? { ...c, replies: mappedReplies } : c
                ));
              }
            } catch (error) {
              console.error(`Error cargando respuestas para comentario ${comment.id}:`, error);
            }
          }
        }
      } else {
        alert(data.message || "Error al publicar comentario");
      }
    } catch (error) {
      console.error("Error de red:", error);
      alert("Error de red al enviar comentario");
    }
  };

  const handlePostReply = async (parentId: string) => {
    if (!replyText.trim()) return;

    const rawToken = localStorage.getItem('meteomap_token');
    if (!rawToken) {
      alert("No se encontró el token. Por favor, inicia sesión de nuevo.");
      return;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/comments/${parentId}/reply`, {
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
          const repliesResponse = await fetch(`${API_BASE_URL}/comments/${parentId}/replies`);
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
              isLiked: currentUserId ? r.likes?.some((id: any) => String(id) === String(currentUserId)) : false,
            }));

            // Actualizamos el comentario padre con sus respuestas
            setComments(prev => prev.map(c => 
              c.id === parentId ? { ...c, replies: mappedReplies } : c
            ));

            // Marcamos como expandido para ver la respuesta que acabamos de agregar
            setExpandedReplies(prev => new Set(prev).add(parentId));
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
    }
  };

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
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
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
        setComments(prev => prev.map(c => 
          c.id === commentId ? { ...c, replies: mappedReplies } : c
        ));

        // Marcamos como expandido
        setExpandedReplies(prev => new Set(prev).add(commentId));
      }
    } catch (error) {
      console.error("Error cargando respuestas:", error);
    }
  };

  const handleReportClick = (report: Report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  // Initialize contextual map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Coordinates for different zones
    const zoneCoordinates: { [key: string]: [number, number] } = {
      "1": [42.65, 0.85],
      "2": [42.75, 0.65],
      "3": [42.55, 0.75],
      "4": [42.85, 0.95],
      "5": [42.45, 0.55],
      "6": [42.7, 1.05],
    };

    const coords = zoneCoordinates[zoneId] || [42.65, 0.75];

    const map = L.map(mapRef.current, {
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
    }).setView(coords, 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    // Add marker
    const icon = L.divIcon({
      className: "custom-marker",
      html: `<div style="background-color: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    L.marker(coords, { icon }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [zoneId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="mt-16 container mx-auto px-4 py-8 max-w-[1400px]">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 hover:bg-gray-100"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al mapa
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Forum */}
          <div className="lg:col-span-2 space-y-6">
            {/* Forum Header */}
            <Card className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Foro: {zoneName}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{zoneElevation}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{comments.length} comentarios</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contextual Map */}
              <div className="bg-gray-100 rounded-lg overflow-hidden h-[200px] border border-gray-200">
                <div ref={mapRef} className="w-full h-full" />
              </div>
            </Card>

            {/* Comments Section */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-gray-900">
                Comentarios de la comunidad
              </h2>

              <div className="space-y-4 mb-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="space-y-3">
                    {/* Main Comment */}
                    <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex gap-3">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={comment.avatar} alt={comment.userName} />
                          <AvatarFallback>
                            {comment.userName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">
                              {comment.userName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {comment.timestamp}
                            </span>
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
                              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                                {comment.message}
                              </p>

                              <div className="flex items-center gap-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`h-8 gap-1 transition-colors ${comment.isLiked ? "text-blue-600 hover:text-blue-700" : "text-gray-600 hover:text-blue-600"}`}
                                  onClick={() => handleLike(comment.id)}
                                  title="Me gusta"
                                >
                                  <ThumbsUp className="h-4 w-4" />
                                  <span className="text-xs font-medium">{comment.likes}</span>
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
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

                                {user?.id === String(comment.userId) && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 gap-1 text-gray-600 hover:text-blue-600 transition-colors"
                                      onClick={() => {
                                        setEditingCommentId(comment.id);
                                        setEditingText(comment.message);
                                      }}
                                      title="Editar comentario"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 gap-1 text-gray-600 hover:text-red-600 transition-colors"
                                      onClick={() => handleDeleteComment(comment.id)}
                                      title="Eliminar comentario"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Replies Button */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-3 ml-12">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 gap-1 text-xs text-blue-600 hover:text-blue-700"
                          onClick={() => fetchReplies(comment.id)}
                        >
                          {expandedReplies.has(comment.id) ? '▼' : '▶'} Ver respuestas ({comment.replies.length})
                        </Button>
                      </div>
                    )}

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && expandedReplies.has(comment.id) && (
                      <div className="ml-12 space-y-3 mt-3">
                        {comment.replies.map((reply) => (
                          <div
                            key={reply.id}
                            className="bg-blue-50 rounded-lg p-3 hover:bg-blue-100 transition-colors border-l-2 border-blue-400"
                          >
                            {editingCommentId === reply.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className="min-h-12 resize-none text-sm"
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
                              <div className="flex gap-3">
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                  <AvatarImage src={reply.avatar} alt={reply.userName} />
                                  <AvatarFallback>
                                    {reply.userName.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-sm text-gray-900">
                                      {reply.userName}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {reply.timestamp}
                                    </span>
                                  </div>

                                  <p className="text-sm text-gray-700 leading-relaxed mb-2">
                                    {reply.message}
                                  </p>

                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className={`h-7 gap-1 transition-colors ${reply.isLiked ? "text-blue-600 hover:text-blue-700" : "text-gray-600 hover:text-blue-600"}`}
                                      onClick={() => handleLike(reply.id, true, comment.id)}
                                      title="Me gusta"
                                    >
                                      <ThumbsUp className="h-3 w-3" />
                                      <span className="text-xs">{reply.likes}</span>
                                    </Button>

                                    {user?.id === String(reply.userId) && (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 gap-1 text-gray-600 hover:text-blue-600 transition-colors"
                                          onClick={() => {
                                            setEditingCommentId(reply.id);
                                            setEditingText(reply.message);
                                          }}
                                          title="Editar respuesta"
                                        >
                                          <Edit2 className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 gap-1 text-gray-600 hover:text-red-600 transition-colors"
                                          onClick={() => handleDeleteReply(reply.id, comment.id)}
                                          title="Eliminar respuesta"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply Input */}
                    {replyingTo === comment.id && (
                      <div className="ml-12 bg-white border border-blue-200 rounded-lg p-3">
                        <Textarea
                          placeholder="Escribe tu respuesta..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={2}
                          className="mb-2 resize-none text-sm"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
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
                            onClick={() => handlePostReply(comment.id)}
                            disabled={!replyText.trim()}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Responder
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Comment Section */}
              <div className="border-t border-gray-200 pt-6">
                <Textarea
                  placeholder="Añadir comentario..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={4}
                  className="mb-3 resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {newComment.length < 10
                      ? `Mínimo 10 caracteres (${newComment.length}/10)`
                      : `${newComment.length} caracteres`}
                  </span>
                  <Button
                    onClick={handlePostComment}
                    disabled={newComment.trim().length < 10}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Añadir comentario
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Reports Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Reportes: {zoneName}
                </h2>
                <Badge variant="secondary">{reports.length}</Badge>
              </div>

              {/* Zone Stats */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-5 w-5 text-orange-600" />
                    <div>
                      <div className="text-xs text-gray-600">Temperatura</div>
                      <div className="font-bold text-gray-900">{zoneTemp}°C</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wind className="h-5 w-5 text-teal-600" />
                    <div>
                      <div className="text-xs text-gray-600">Viento</div>
                      <div className="font-bold text-gray-900">{zoneWind} km/h</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div>
                      <div className="text-xs text-gray-600">Riesgo Alud</div>
                      <div className="font-bold text-gray-900">{zoneAvalanche}/5</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="text-xs text-gray-600">Elevación</div>
                      <div className="font-bold text-gray-900 text-sm">{zoneElevation}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reports List */}
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={report.avatar} alt={report.userName} />
                          <AvatarFallback>
                            {report.userName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-gray-900">
                            {report.userName}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {report.isEdited ? report.updatedAt : report.timestamp}
                            </div>
                            {report.isEdited && (
                              <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-tight">
                                Editado
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                          <span>{report.categoryIcon}</span>
                          <span className="hidden sm:inline">{report.categoryName}</span>
                        </div>
                      </div>

                      <p 
                        className="text-sm text-gray-700 mb-3 cursor-pointer hover:text-gray-900"
                        onClick={() => handleReportClick(report)}
                      >
                        {report.condition}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </div>
      </div>

      {/* Report Detail Modal */}
      <ReportDetailModal
        report={selectedReport}
        zoneName={zoneName}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}