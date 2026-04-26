import { useState } from "react";
import { Card } from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Trash2 } from "lucide-react";

const mockReports = [
  {
    id: 1,
    date: "2023-10-26",
    user: "JuanPerez",
    type: "Nieve Inestable",
    location: "Pico Anaijo",
    status: "Pendiente",
  },
  {
    id: 2,
    date: "2023-10-25",
    user: "MonGu",
    type: "Placas de hielo",
    location: "Sierra Nevada",
    status: "Pendiente",
  },
  {
    id: 3,
    date: "2023-10-24",
    user: "SantiagoMsk",
    type: "Alud reciente",
    location: "Picos de Europa",
    status: "Pendiente",
  },
];

export default function AdminModeration() {
  const [reports, setReports] = useState(mockReports);

  const handleDelete = (id: number) => {
    setReports(reports.filter((report) => report.id !== id));
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Moderación Reportes</h1>
        <p className="text-gray-500 mt-2">Revisión y moderación de reportes</p>
      </div>

      {/* Desktop Table */}
      <Card className="overflow-hidden border-0 shadow-lg hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-700 hover:to-slate-800">
              <TableHead className="text-white font-semibold">Fecha</TableHead>
              <TableHead className="text-white font-semibold">Usuario</TableHead>
              <TableHead className="text-white font-semibold">Tipo de Riesgo</TableHead>
              <TableHead className="text-white font-semibold">Ubicación</TableHead>
              <TableHead className="text-white font-semibold">Estado</TableHead>
              <TableHead className="w-32 text-white font-semibold text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id} className="hover:bg-red-50/30 transition-colors border-b border-gray-100">
                <TableCell className="py-5 font-medium text-gray-900">{report.date}</TableCell>
                <TableCell className="py-5 text-gray-700">{report.user}</TableCell>
                <TableCell className="py-5">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    {report.type}
                  </span>
                </TableCell>
                <TableCell className="py-5 text-gray-700">{report.location}</TableCell>
                <TableCell className="py-5">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {report.status}
                  </span>
                </TableCell>
                <TableCell className="py-5">
                  <div className="flex justify-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 rounded-lg bg-red-500 hover:bg-red-600 transition-colors"
                      onClick={() => handleDelete(report.id)}
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {reports.map((report) => (
          <Card key={report.id} className="p-4 border-0 shadow-md border-l-4 border-l-orange-500">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      {report.type}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {report.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{report.location}</h3>
                  <p className="text-sm text-gray-600 mt-1">Por: {report.user}</p>
                  <p className="text-xs text-gray-500 mt-1">{report.date}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-red-500 hover:bg-red-600 text-white border-0"
                onClick={() => handleDelete(report.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Reporte
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
