import { Card } from "../../components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

const weeklyData = [
  { id: "lun", day: "Lun", consultas: 320 },
  { id: "mar", day: "Mar", consultas: 450 },
  { id: "mie", day: "Mié", consultas: 380 },
  { id: "jue", day: "Jue", consultas: 520 },
  { id: "vie", day: "Vie", consultas: 470 },
  { id: "sab", day: "Sáb", consultas: 390 },
  { id: "dom", day: "Dom", consultas: 280 },
];

const apiStatus = [
  { name: "AEMET API", status: "online" },
  { name: "Open-Meteo API", status: "online" },
  { name: "Chatbot API", status: "online" },
  { name: "Mapbox API", status: "warning" },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Dashboard del Sistema</h1>
        <p className="text-gray-500 mt-2">Monitoreo en tiempo real</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="p-5 md:p-7 bg-gradient-to-br from-blue-600 to-blue-700 border-0 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105">
          <p className="text-xs md:text-sm text-blue-100 mb-2 md:mb-3 font-medium">Usuarios Activos</p>
          <p className="text-3xl md:text-5xl font-bold">1,234</p>
        </Card>

        <Card className="p-5 md:p-7 bg-gradient-to-br from-purple-600 to-purple-700 border-0 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105">
          <p className="text-xs md:text-sm text-purple-100 mb-2 md:mb-3 font-medium">Cuota API Chatbot</p>
          <p className="text-3xl md:text-5xl font-bold">78%</p>
        </Card>

        <Card className="p-5 md:p-7 bg-gradient-to-br from-emerald-600 to-emerald-700 border-0 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 sm:col-span-2 lg:col-span-1">
          <p className="text-xs md:text-sm text-emerald-100 mb-2 md:mb-3 font-medium">Latencia APIs</p>
          <p className="text-3xl md:text-5xl font-bold">120ms</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="lg:col-span-2 p-5 md:p-7 bg-gradient-to-br from-slate-800 to-slate-900 border-0 text-white shadow-xl">
          <h3 className="mb-4 md:mb-6 text-lg md:text-xl font-semibold">Consultas IA - Última Semana</h3>
          <div className="h-48 md:h-72 w-full">
            <ChartContainer
              config={{
                consultas: {
                  label: "Consultas",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-full w-full"
            >
              <LineChart data={weeklyData} width={500} height={250}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" key="grid" />
                <XAxis dataKey="day" stroke="#94a3b8" key="xaxis" />
                <YAxis stroke="#94a3b8" key="yaxis" />
                <ChartTooltip content={<ChartTooltipContent />} key="tooltip" />
                <Line
                  key="line-consultas"
                  type="monotone"
                  dataKey="consultas"
                  stroke="#60a5fa"
                  strokeWidth={3}
                  dot={{ fill: "#60a5fa", r: 5 }}
                />
              </LineChart>
            </ChartContainer>
          </div>
        </Card>

        <Card className="p-5 md:p-7 bg-gradient-to-br from-slate-800 to-slate-900 border-0 text-white shadow-xl">
          <h3 className="mb-4 md:mb-6 text-lg md:text-xl font-semibold">Estado APIs</h3>
          <div className="space-y-3 md:space-y-4">
            {apiStatus.map((api) => (
              <div key={api.name} className="flex items-center justify-between p-3 md:p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors">
                <span className="text-xs md:text-sm font-medium truncate pr-2">{api.name}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div
                    className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full shadow-lg ${
                      api.status === "online"
                        ? "bg-green-500 shadow-green-500/50 animate-pulse"
                        : api.status === "warning"
                        ? "bg-yellow-500 shadow-yellow-500/50"
                        : "bg-red-500 shadow-red-500/50"
                    }`}
                  />
                  <span className="text-xs text-slate-300 hidden md:inline">
                    {api.status === "online" ? "Online" : api.status === "warning" ? "Warn" : "Off"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
