import { X, Star, AlertTriangle, Thermometer, Wind, TrendingUp, Clock, User } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { ReportDetailModal } from "./ReportDetailModal";
import { useState } from "react";

interface UserReport {
  id: number;
  userName: string;
  avatar: string;
  condition: string;
  timestamp: string;
  photo?: string;
}

interface ZoneData {
  id: number;
  name: string;
  elevation: string;
  temperature: number;
  wind: number;
  avalancheLevel: number;
  isFavorite: boolean;
  reports: UserReport[];
}

interface ZoneSidebarProps {
  zone: ZoneData | null;
  onClose: () => void;
  onToggleFavorite: (zoneId: number) => void;
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

  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleReportClick = (report: UserReport) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

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