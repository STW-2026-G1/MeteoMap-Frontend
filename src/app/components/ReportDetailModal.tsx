import { X, Check, XCircle, TrendingUp, MapPin, Clock, User, AlertTriangle, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useState } from "react";

interface ReportData {
  id: number;
  userName: string;
  avatar: string;
  condition: string;
  timestamp: string;
  photo?: string;
  riskType?: string;
  location?: string;
  description?: string;
  confirmations?: number;
  denials?: number;
  totalVotes?: number;
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

  if (!report) return null;

  // Initialize vote counts
  const confirmations = report.confirmations || 5;
  const denials = report.denials || 1;
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

  const handleConfirm = () => {
    if (userVote === 'confirm') {
      // Unvote
      setUserVote(null);
      setLocalConfirmations(prev => prev - 1);
    } else {
      // Vote confirm (remove deny if exists)
      if (userVote === 'deny') {
        setLocalDenials(prev => prev - 1);
      }
      setUserVote('confirm');
      setLocalConfirmations(prev => prev + 1);
    }
  };

  const handleDeny = () => {
    if (userVote === 'deny') {
      // Unvote
      setUserVote(null);
      setLocalDenials(prev => prev - 1);
    } else {
      // Vote deny (remove confirm if exists)
      if (userVote === 'confirm') {
        setLocalConfirmations(prev => prev - 1);
      }
      setUserVote('deny');
      setLocalDenials(prev => prev + 1);
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

        <div className="px-6 pb-6 space-y-6">
          {/* Photo */}
          {report.photo ? (
            <div className="relative w-full h-80 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={report.photo}
                alt={riskType}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="relative w-full h-80 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <AlertTriangle className="h-16 w-16 text-gray-400" />
            </div>
          )}

          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
              {report.userName.charAt(0).toUpperCase()}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
