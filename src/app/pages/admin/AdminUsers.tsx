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
import { Pencil, Trash2 } from "lucide-react";

const mockUsers = [
  { id: 1, name: "Jhon Doe", email: "JhxDoe@gmail.com", status: "Activo" },
  { id: 2, name: "Emiliano Iaciancie", email: "emilianoFiaciancie@gmail.com", status: "Activo" },
  { id: 3, name: "Jose Perez", email: "JosePerez@yahoo.es", status: "Activo" },
];

export default function AdminUsers() {
  const [users, setUsers] = useState(mockUsers);

  const handleDelete = (id: number) => {
    setUsers(users.filter((user) => user.id !== id));
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Usuarios</h1>
        <p className="text-gray-500 mt-2">Gestión de usuarios registrados</p>
      </div>

      {/* Desktop Table */}
      <Card className="overflow-hidden border-0 shadow-lg hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-700 hover:to-slate-800">
              <TableHead className="text-white font-semibold">Nombre</TableHead>
              <TableHead className="text-white font-semibold">Correo electrónico</TableHead>
              <TableHead className="text-white font-semibold">Estado</TableHead>
              <TableHead className="w-32 text-white font-semibold text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="hover:bg-blue-50/50 transition-colors border-b border-gray-100">
                <TableCell className="py-5 font-medium text-gray-900">{user.name}</TableCell>
                <TableCell className="py-5 text-gray-600">{user.email}</TableCell>
                <TableCell className="py-5">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {user.status}
                  </span>
                </TableCell>
                <TableCell className="py-5">
                  <div className="flex gap-2 justify-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <Pencil className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                      onClick={() => handleDelete(user.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
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
        {users.map((user) => (
          <Card key={user.id} className="p-4 border-0 shadow-md">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {user.status}
                </span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                  onClick={() => handleDelete(user.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
