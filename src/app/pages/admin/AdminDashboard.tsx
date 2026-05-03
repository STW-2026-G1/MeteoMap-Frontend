import { Card } from "../../components/ui/card";
import { ChartContainer, ChartTooltip } from "../../components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useEffect, useState } from "react";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3000/api";

type UsageByUser = {
  id: string;
  nombre: string;
  email: string;
  peticionesHoy: number;
  estado: string;
};

type ApiStatus = {
  name: string;
  status: "online" | "warning" | "offline";
  source: string;
  details: string;
};

type IaChartDatum = {
  usuario: string;
  consultas: number;
  fullName?: string;
  email?: string;
  estado?: string;
  isAggregate?: boolean;
  usersCount?: number;
};

export default function AdminDashboard() {
  const MAX_USERS_IN_CHART = 8;
  const [usageByUser, setUsageByUser] = useState<UsageByUser[]>([]);
  const [apiStatus, setApiStatus] = useState<ApiStatus[]>([]);
  const [usersActive, setUsersActive] = useState<number | null>(null);
  const [iaTotalToday, setIaTotalToday] = useState<number | null>(null);
  const [latestLatency, setLatestLatency] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("meteomap_token");

    async function fetchDashboard() {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/dashboard`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const data = await res.json();

        setUsersActive(data?.users?.activosNoAdmin ?? null);
        setIaTotalToday(data?.ia?.totalPeticionesHoy ?? null);
        setLatestLatency(data?.weatherSync?.latestLatencyMs ?? null);
        setApiStatus(Array.isArray(data?.apiStatus) ? data.apiStatus : []);

        const usage = Array.isArray(data?.ia?.usageByUser) ? data.ia.usageByUser : [];
        setUsageByUser(usage);
      } catch (err) {
        console.error("Error fetching admin dashboard:", err);
      }
    }

    fetchDashboard();
  }, []);

  const sortedUsage = [...usageByUser].sort((a, b) => b.peticionesHoy - a.peticionesHoy);
  const usersWithIaUsage = sortedUsage.filter((u) => u.peticionesHoy > 0);
  const chartUsers = sortedUsage.slice(0, MAX_USERS_IN_CHART);
  const remainingUsers = sortedUsage.slice(MAX_USERS_IN_CHART);
  const remainingQueries = remainingUsers.reduce((sum, user) => sum + user.peticionesHoy, 0);
  const totalUsersWithUsage = usersWithIaUsage.length;
  const avgByActiveUser =
    totalUsersWithUsage > 0 && iaTotalToday !== null
      ? (iaTotalToday / totalUsersWithUsage).toFixed(1)
      : "0.0";

  const iaChartData: IaChartDatum[] = chartUsers.map((u) => ({
    usuario: u.nombre.length > 14 ? `${u.nombre.slice(0, 14)}...` : u.nombre,
    consultas: u.peticionesHoy,
    fullName: u.nombre,
    email: u.email,
    estado: u.estado,
    isAggregate: false,
  }));

  if (remainingUsers.length > 0) {
    iaChartData.push({
      usuario: `Resto (${remainingUsers.length})`,
      consultas: remainingQueries,
      isAggregate: true,
      usersCount: remainingUsers.length,
    });
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Dashboard del Sistema</h1>
        <p className="text-gray-500 mt-2">Datos reales agregados desde backend</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="p-5 md:p-7 bg-gradient-to-br from-blue-600 to-blue-700 border-0 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105">
          <p className="text-xs md:text-sm text-blue-100 mb-2 md:mb-3 font-medium">Usuarios Activos</p>
          <p className="text-3xl md:text-5xl font-bold">{usersActive !== null ? usersActive : "—"}</p>
        </Card>

        <Card className="p-5 md:p-7 bg-gradient-to-br from-purple-600 to-purple-700 border-0 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105">
          <p className="text-xs md:text-sm text-purple-100 mb-2 md:mb-3 font-medium">Consultas IA hoy</p>
          <p className="text-3xl md:text-5xl font-bold">{iaTotalToday !== null ? iaTotalToday : "—"}</p>
          <p className="text-xs text-purple-100 mt-2">
            {totalUsersWithUsage} usuarios con actividad IA
          </p>
        </Card>

        <Card className="p-5 md:p-7 bg-gradient-to-br from-emerald-600 to-emerald-700 border-0 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 sm:col-span-2 lg:col-span-1">
          <p className="text-xs md:text-sm text-emerald-100 mb-2 md:mb-3 font-medium">Latencia Open-Meteo (última sync)</p>
          <p className="text-3xl md:text-5xl font-bold">{latestLatency !== null ? `${latestLatency}ms` : "—"}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="lg:col-span-2 p-5 md:p-7 bg-gradient-to-br from-slate-800 to-slate-900 border-0 text-white shadow-xl">
          <h3 className="mb-4 md:mb-6 text-lg md:text-xl font-semibold">Uso IA por usuario (hoy)</h3>
          <p className="text-xs text-slate-300 mb-3">
            Visualizando Top {MAX_USERS_IN_CHART}
            {remainingUsers.length > 0 ? ` + Resto (${remainingUsers.length} usuarios)` : ""}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div className="rounded-md bg-slate-700/50 p-3">
              <p className="text-[11px] text-slate-300">Usuarios con uso IA hoy</p>
              <p className="text-xl font-semibold">{totalUsersWithUsage}</p>
            </div>
            <div className="rounded-md bg-slate-700/50 p-3">
              <p className="text-[11px] text-slate-300">Media por usuario activo IA</p>
              <p className="text-xl font-semibold">{avgByActiveUser}</p>
            </div>
          </div>
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
              <BarChart data={iaChartData} width={500} height={250}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" key="grid" />
                <XAxis dataKey="usuario" stroke="#94a3b8" key="xaxis" />
                <YAxis stroke="#94a3b8" key="yaxis" />
                <ChartTooltip
                  key="tooltip"
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;

                    const datum = payload[0].payload as IaChartDatum;
                    if (datum.isAggregate) {
                      return (
                        <div className="rounded-md border border-slate-200 bg-white p-2 text-xs shadow-md">
                          <p className="font-semibold text-slate-900">{datum.usuario}</p>
                          <p className="text-slate-700">Consultas: {datum.consultas}</p>
                          <p className="text-slate-500">Incluye {datum.usersCount} usuarios</p>
                        </div>
                      );
                    }

                    return (
                      <div className="rounded-md border border-slate-200 bg-white p-2 text-xs shadow-md">
                        <p className="font-semibold text-slate-900">{datum.fullName}</p>
                        <p className="text-slate-700">{datum.email}</p>
                        <p className="text-slate-700">Consultas: {datum.consultas}</p>
                        <p className="text-slate-500">Estado: {datum.estado}</p>
                      </div>
                    );
                  }}
                />
                <Bar
                  key="bar-consultas"
                  dataKey="consultas"
                  fill="#60a5fa"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>

          <div className="mt-4 max-h-44 overflow-y-auto rounded-md border border-slate-700/60">
            <div className="sticky top-0 bg-slate-800/95 px-3 py-2 text-[11px] text-slate-300 border-b border-slate-700/60">
              Top usuarios IA (detalle)
            </div>
            <div className="divide-y divide-slate-700/60">
              {sortedUsage.slice(0, 20).map((user, index) => (
                <div key={user.id} className="px-3 py-2 text-xs flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-slate-100 truncate">#{index + 1} {user.nombre}</p>
                    <p className="text-slate-400 truncate">{user.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-slate-100 font-semibold">{user.peticionesHoy}</p>
                    <p className="text-slate-400">{user.estado}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-5 md:p-7 bg-gradient-to-br from-slate-800 to-slate-900 border-0 text-white shadow-xl">
          <h3 className="mb-4 md:mb-6 text-lg md:text-xl font-semibold">Estado APIs</h3>
          <div className="space-y-3 md:space-y-4">
            {apiStatus.map((api) => (
              <div key={api.name} className="flex items-center justify-between p-3 md:p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors">
                <div className="min-w-0 pr-2">
                  <span className="block text-xs md:text-sm font-medium truncate">{api.name}</span>
                  <span className="block text-[10px] md:text-xs text-slate-400 truncate">Fuente: {api.source}</span>
                  <span className="block text-[10px] md:text-xs text-slate-300 truncate">{api.details}</span>
                </div>
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
