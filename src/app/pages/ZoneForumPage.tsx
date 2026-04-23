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
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Comment {
  id: number;
  userId: number;
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
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyText, setReplyText] = useState("");
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [reports, setReports] = useState<Report[]>([]);

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

  const handleLike = (commentId: number, isReply: boolean = false, parentId?: number) => {
    if (!isReply) {
      setComments(
        comments.map((comment) => {
          if (comment.id === commentId) {
            return {
              ...comment,
              likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
              isLiked: !comment.isLiked,
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
                    likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1,
                    isLiked: !reply.isLiked,
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
  };

  const handlePostComment = () => {
    if (newComment.trim().length < 10) return;

    const newCommentObj: Comment = {
      id: Date.now(),
      userId: user?.id ? Number(user.id) : 999,
      userName: user?.name || user?.nombre || "Usuario_Actual",
      avatar: user?.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user?.avatar_seed || 'me'}`,
      message: newComment,
      timestamp: "justo ahora",
      likes: 0,
      isLiked: false,
    };

    setComments([newCommentObj, ...comments]);
    setNewComment("");
  };

  const handlePostReply = (parentId: number) => {
    if (replyText.trim().length < 10) return;

    const newReply: Comment = {
      id: Date.now(),
      userId: user?.id ? Number(user.id) : 999,
      userName: user?.name || user?.nombre || "Usuario_Actual",
      avatar: user?.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user?.avatar_seed || 'me'}`,
      message: replyText,
      timestamp: "justo ahora",
      likes: 0,
      isLiked: false,
    };

    setComments(
      comments.map((comment) => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newReply],
          };
        }
        return comment;
      })
    );

    setReplyText("");
    setReplyingTo(null);
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

                          <p className="text-sm text-gray-700 leading-relaxed mb-3">
                            {comment.message}
                          </p>

                          <div className="flex items-center gap-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 gap-1 ${
                                comment.isLiked ? "text-blue-600" : "text-gray-600"
                              }`}
                              onClick={() => handleLike(comment.id)}
                            >
                              <ThumbsUp className="h-4 w-4" />
                              <span className="text-xs font-medium">{comment.likes}</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1 text-gray-600"
                              onClick={() => {
                                setReplyingTo(replyingTo === comment.id ? null : comment.id);
                                setReplyText("");
                              }}
                            >
                              <MessageCircle className="h-4 w-4" />
                              <span className="text-xs">Responder</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-12 space-y-3">
                        {comment.replies.map((reply) => (
                          <div
                            key={reply.id}
                            className="bg-blue-50 rounded-lg p-3 hover:bg-blue-100 transition-colors border-l-2 border-blue-400"
                          >
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

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`h-7 gap-1 ${
                                    reply.isLiked ? "text-blue-600" : "text-gray-600"
                                  }`}
                                  onClick={() => handleLike(reply.id, true, comment.id)}
                                >
                                  <ThumbsUp className="h-3 w-3" />
                                  <span className="text-xs">{reply.likes}</span>
                                </Button>
                              </div>
                            </div>
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
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => handlePostReply(comment.id)}
                            disabled={replyText.trim().length < 10}
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