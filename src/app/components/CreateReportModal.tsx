import { useState, useEffect } from "react";
import { toast } from "sonner";
import { X, MapPin, AlertTriangle, } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface CreateReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zoneId?: string;
  zoneName: string;
}

export function CreateReportModal({ open, onOpenChange, zoneId, zoneName }: CreateReportModalProps) {
  const [riskType, setRiskType] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<{ value: string; label: string; icon: string }[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open]);

  const loadCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/categories`);
      if (response.ok) {
        const data = await response.json();
        const mappedCategories = data.map((cat: any) => ({
          value: cat._id,
          label: cat.nombre,
          icon: cat.icono_marcador || "⚠️"
        }));
        setCategories(mappedCategories);
      } else {
        toast.error("Error al cargar las categorías");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Error de conexión al cargar categorías");
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneId) {
      toast.error("Error: Faltan datos de la zona seleccionada.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("meteomap_token");
      if (!token) {
        toast.error("Debes iniciar sesión para crear un reporte.");
        onOpenChange(false);
        setIsSubmitting(false);
        return;
      }

      const requestBody = {
        zona_id: zoneId,
        categoria_id: riskType,
        descripcion: description,
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errMessage = "Error al crear el reporte.";
        try {
          const errData = await response.json();
          errMessage = errData.message || errData.error || errMessage;
          
          // Si hay errores de validación específicos, podemos ser más detallistas
          if (errData.errors && Array.isArray(errData.errors) && errData.errors.length > 0) {
            errMessage = `${errMessage}: ${errData.errors[0].message}`;
          }
        } catch { }
        throw new Error(errMessage);
      }

      // Resetear formulario
      setRiskType("");
      setDescription("");

      // Cerrar modal
      onOpenChange(false);

      // Mostrar mensaje de éxito
      toast.success("¡Reporte publicado con éxito! Gracias por contribuir a la seguridad en la montaña.");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al publicar el reporte");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Crear Nuevo Reporte
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Ubicación Detectada */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-700">Ubicación</p>
              <p className="text-sm text-gray-900 font-semibold">{zoneName}</p>
            </div>
          </div>

          {/* Tipo de Riesgo */}
          <div className="space-y-2">
            <Label htmlFor="risk-type" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Tipo de Riesgo *
            </Label>
            <Select value={riskType} onValueChange={setRiskType} required disabled={isLoadingCategories}>
              <SelectTrigger id="risk-type">
                <SelectValue placeholder={isLoadingCategories ? "Cargando categorías..." : "Selecciona el tipo de condición..."} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      {type.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descripción Detallada */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Descripción detallada *
            </Label>
            <Textarea
              id="description"
              placeholder="Describe las condiciones que encontraste: tipo de nieve, visibilidad, temperatura percibida, recomendaciones..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              Mínimo 20 caracteres. Sé específico para ayudar a otros montañeros.
            </p>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={!riskType || description.length < 20 || isSubmitting}
            >
              {isSubmitting ? "Publicando..." : "Publicar Reporte"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
