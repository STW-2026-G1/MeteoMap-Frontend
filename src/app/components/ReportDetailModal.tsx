import { X, Check, XCircle, TrendingUp, MapPin, Clock, User, AlertTriangle, Shield, ThumbsUp, MessageCircle, Send, Trash2, Edit2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useState, useEffect } from "react";

interface ReportData {
  id: string | number;
  userName: string;
  avatar: string;
  condition: string;
  timestamp: string;
  riskType?: string;
  location?: string;
  description?: string;
  confirmations?: number;
  denials?: number;
  totalVotes?: number;
}

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

interface ReportDetailModalProps {
  report: ReportData | null;
  zoneName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportDetailModal({ report, zoneName, open, onOpenChange }: ReportDetailModalProps) {
  const [userVote, setUserVote] = useState<'confirm' | 'deny' | null>(null);
  const [localConfirmations, setLocalConfirmations] = useState(0);
  const [localDenials, setLocalDenials] = useState(0);
  
  // Comment states
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Get current user ID from localStorage
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

  // Load comments for the report
  useEffect(() => {
    if (!report || !open) return;

    const fetchComments = async () => {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const rawToken = localStorage.getItem('meteomap_token');
      
      try {
        const response = await fetch(`${API_BASE_URL}/comments/report/${report.id}`, {
          headers: rawToken ? { 'Authorization': `Bearer ${rawToken}` } : {}
        });
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

          // Load replies for each comment
          for (const comment of mappedComments) {
            try {
              const repliesResponse = await fetch(`${API_BASE_URL}/comments/${comment.id}/replies`, {
                headers: rawToken ? { 'Authorization': `Bearer ${rawToken}` } : {}
              });
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
              console.error(`Error loading replies for comment ${comment.id}:`, error);
            }
          }
        }
      } catch (error) {
        console.error("Error loading comments:", error);
      }
    };

    fetchComments();
  }, [report?.id, open, currentUserId]);

  if (!report) return null;

  // Initialize vote counts
  const confirmations = report.confirmations ?? 0;
  const denials = report.denials ?? 0;
  const totalVotes = confirmations + denials + localConfirmations + localDenials;
  const confidenceLevel = totalVotes > 0 ? ((confirmations + localConfirmations) / totalVotes) * 100 : 0;

  // Determine confidence badge
  const getConfidenceBadge = (level: number) => {
    if (level >= 80) return { text: "Alta Confianza", color: "bg-green-500", icon: Shield };
    if (level >= 60) return { text: "Confianza Moderada", color: "bg-yellow-500", icon: Shield };
    if (level >= 40) return { text: "Confianza Baja", color: "bg-orange-500", icon: AlertTriangle };
    return { text: "No Confiable", color: "bg-red-500", icon: AlertTriangle };
  };

  const confidenceBadge = getConfidenceBadge(confidenceLevel);
  const ConfidenceIcon = confidenceBadge.icon;

  const handleVote = async (accion: 'confirmar' | 'desmentir') => {
    const token = localStorage.getItem("meteomap_token");
    if (!token) {
      alert("Debes iniciar sesión para validar un reporte.");
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/reports/${report.id}/validate`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ accion }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || resData.message || "Error al validar el reporte.");
      }

      // Success
      if (resData.report && resData.report.validaciones) {
        // Backend returns the exact validations count from arrays, we update our local offset to match it exactly.
        const newConfirmations = resData.report.validaciones.usuarios_confirmaron?.length || 0;
        const newDenials = resData.report.validaciones.usuarios_desmintieron?.length || 0;
        
        setLocalConfirmations(newConfirmations - (report.confirmations ?? 0));
        setLocalDenials(newDenials - (report.denials ?? 0));
      }

      if (accion === 'confirmar') {
        if (userVote === 'confirm') {
          setUserVote(null);
        } else {
          setUserVote('confirm');
        }
      } else {
        if (userVote === 'deny') {
          setUserVote(null);
        } else {
          setUserVote('deny');
        }
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    }
  };

  const handleConfirm = () => handleVote('confirmar');
  const handleDeny = () => handleVote('desmentir');

  // Handle like/unlike comment
  const handleLike = async (commentId: string, isReply: boolean = false, parentId?: string) => {
    const rawToken = localStorage.getItem('meteomap_token');
    if (!rawToken) {
      alert("Por favor inicia sesión para dar like a un comentario.");
      return;
    }

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    const isAlreadyLiked = !isReply 
      ? comments.find(c => c.id === commentId)?.isLiked 
      : comments.find(c => c.id === parentId)?.replies?.find(r => r.id === commentId)?.isLiked;

    const endpoint = isAlreadyLiked ? 'unlike' : 'like';
    const method = isAlreadyLiked ? 'DELETE' : 'POST';
    const url = `${API_BASE_URL}/comments/${commentId}/${endpoint}`;

    // Optimistic update
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

    // Call backend
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

  // Handle delete comment
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
        alert(data.message || "Error deleting comment");
      }
    } catch (error) {
      console.error("Error on DELETE request:", error);
    }
  };

  // Handle delete reply
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
        alert(data.message || "Error deleting reply");
      }
    } catch (error) {
      console.error("Error on DELETE request:", error);
    }
  };

  // Handle edit comment
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
        alert(data.message || "Error updating comment");
      }
    } catch (error) {
      console.error("Error on PUT request:", error);
      alert("Error updating comment");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Handle add comment
  const handleAddComment = async () => {
    if (newComment.trim().length < 10) return;

    const rawToken = localStorage.getItem('meteomap_token');
    if (!rawToken) {
      alert("No se encontró el token. Por favor, inicia sesión de nuevo.");
      return;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/comments/report/${report.id}`, {
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
        
        // Reload comments from backend
        const commentsResponse = await fetch(`${API_BASE_URL}/comments/report/${report.id}`, {
          headers: rawToken ? { 'Authorization': `Bearer ${rawToken}` } : {}
        });
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

          // Load replies for each comment
          for (const comment of mappedComments) {
            try {
              const repliesResponse = await fetch(`${API_BASE_URL}/comments/${comment.id}/replies`, {
                headers: rawToken ? { 'Authorization': `Bearer ${rawToken}` } : {}
              });
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
              console.error(`Error loading replies for comment ${comment.id}:`, error);
            }
          }
        }
      } else {
        alert(data.message || "Error publishing comment");
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error sending comment");
    }
  };

  // Handle add reply
  const handleAddReply = async (parentId: string) => {
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
        setReplyText("");
        setReplyingTo(null);
        
        // Load updated replies from backend
        try {
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
          const repliesResponse = await fetch(`${API_BASE_URL}/comments/${parentId}/replies`, {
            headers: rawToken ? { 'Authorization': `Bearer ${rawToken}` } : {}
          });
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

            // Update parent comment with new replies
            setComments(prev => prev.map(c => 
              c.id === parentId ? { ...c, replies: mappedReplies } : c
            ));

            // Mark as expanded to see the new reply
            setExpandedReplies(prev => new Set(prev).add(parentId));
          }
        } catch (error) {
          console.error("Error loading updated replies:", error);
        }
      } else {
        alert(data.message || "Error adding reply");
      }
    } catch (error) {
      console.error("Error adding reply:", error);
      alert("Network error sending reply");
    }
  };

  // Fetch replies on demand
  const fetchReplies = async (commentId: string) => {
    // If already expanded, close them
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
      const rawToken = localStorage.getItem('meteomap_token');
      const response = await fetch(`${API_BASE_URL}/comments/${commentId}/replies`, {
        headers: rawToken ? { 'Authorization': `Bearer ${rawToken}` } : {}
      });
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

        // Update parent comment with replies
        setComments(prev => prev.map(c => 
          c.id === commentId ? { ...c, replies: mappedReplies } : c
        ));

        // Mark as expanded
        setExpandedReplies(prev => new Set(prev).add(commentId));
      }
    } catch (error) {
      console.error("Error loading replies:", error);
    }
  };

  const riskType = report.riskType || "Placas de hielo";
  const description = report.description || report.condition;
  const location = report.location || zoneName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header with close button */}
        <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-center justify-between">
          <DialogTitle className="text-xl font-bold text-gray-900">Detalle del Reporte</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="px-6 pb-6 space-y-6 pt-4">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
              <img
                  src={report.avatar}
                  alt={report.userName}
                  className="w-12 h-12 rounded-full object-cover shadow-sm"
                  onError={(e) => {
                     // Opcional: Oculta la imagen si falla al cargar y muestra el respaldo
                     e.currentTarget.style.display = 'none';
                  }}
               />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{report.userName}</p>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{report.timestamp}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{location}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Type */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Tipo de Riesgo</h3>
            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 px-4 py-2 text-base">
              <AlertTriangle className="h-4 w-4 mr-2" />
              {riskType}
            </Badge>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Descripción</h3>
            <Card className="p-4">
              <p className="text-gray-700 leading-relaxed">{description}</p>
            </Card>
          </div>

          {/* Community Validation Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Validación Comunitaria
            </h3>

            {/* Confidence Level Indicator */}
            <Card className="p-4 mb-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ConfidenceIcon className={`h-5 w-5 text-white p-1 rounded ${confidenceBadge.color}`} />
                  <span className="font-semibold text-gray-900">{confidenceBadge.text}</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">{Math.round(confidenceLevel)}%</span>
              </div>
              <Progress value={confidenceLevel} className="h-3 mb-2" />
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{confirmations + localConfirmations} confirmaciones</span>
                <span>{denials + localDenials} desmentidos</span>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              {/* Confirm Button */}
              <Button
                size="lg"
                onClick={handleConfirm}
                className={`h-auto py-4 flex flex-col gap-2 transition-all ${
                  userVote === 'confirm'
                    ? 'bg-green-600 hover:bg-green-700 text-white ring-4 ring-green-200'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                <Check className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">Confirmar</div>
                  <div className="text-xs opacity-90">Yo también lo veo</div>
                </div>
              </Button>

              {/* Deny Button */}
              <Button
                size="lg"
                onClick={handleDeny}
                className={`h-auto py-4 flex flex-col gap-2 transition-all ${
                  userVote === 'deny'
                    ? 'bg-red-600 hover:bg-red-700 text-white ring-4 ring-red-200'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                <XCircle className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">Desmentir</div>
                  <div className="text-xs opacity-90">Es falso / Ya no está</div>
                </div>
              </Button>
            </div>

            {/* User Vote Feedback */}
            {userVote && (
              <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-center">
                <p className="text-sm text-blue-800">
                  {userVote === 'confirm' 
                    ? '✓ Has confirmado este reporte. Gracias por ayudar a la comunidad.'
                    : '✗ Has desmentido este reporte. Tu feedback ayuda a mantener la información precisa.'}
                </p>
              </div>
            )}

            {/* Info Text */}
            <p className="text-xs text-gray-500 text-center mt-4">
              Tu voto ayuda a determinar la fiabilidad de este reporte. Los reportes con baja confianza se ocultan automáticamente.
            </p>
          </div>

          {/* Comments Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              Comentarios ({comments.length})
            </h3>

            {/* Comments List */}
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
                                className={`h-8 gap-1 transition-colors ${
                                  comment.isLiked ? "text-blue-600 hover:text-blue-700" : "text-gray-600 hover:text-blue-600"
                                }`}
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

                              {currentUserId === comment.userId && (
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
                                    className={`h-8 gap-1 transition-colors ${
                                      reply.isLiked ? "text-blue-600 hover:text-blue-700" : "text-gray-600 hover:text-blue-600"
                                    }`}
                                    onClick={() => handleLike(reply.id, true, comment.id)}
                                    title="Me gusta"
                                  >
                                    <ThumbsUp className="h-3 w-3" />
                                    <span className="text-xs">{reply.likes}</span>
                                  </Button>

                                  {currentUserId === reply.userId && (
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
                          onClick={() => handleAddReply(comment.id)}
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
            <div className="border-t border-gray-200 pt-4">
              <Textarea
                placeholder="Añadir comentario..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="mb-3 resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {newComment.length < 10
                    ? `Mínimo 10 caracteres (${newComment.length}/10)`
                    : `${newComment.length} caracteres`}
                </span>
                <Button
                  onClick={handleAddComment}
                  disabled={newComment.trim().length < 10}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Añadir comentario
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

