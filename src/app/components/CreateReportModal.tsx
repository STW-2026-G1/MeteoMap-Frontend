import { useState } from "react";
import { X, MapPin, Camera, AlertTriangle, Image as ImageIcon } from "lucide-react";
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
  zoneName: string;
}

const riskTypes = [
  { value: "avalanche", label: "Alud reciente", icon: "❄️" },
  { value: "unstable-snow", label: "Nieve inestable", icon: "⚠️" },
  { value: "ice-plates", label: "Placas de hielo", icon: "🧊" },
  { value: "bad-visibility", label: "Mala visibilidad", icon: "🌫️" },
  { value: "strong-wind", label: "Viento fuerte", icon: "💨" },
  { value: "rockfall", label: "Desprendimientos", icon: "🪨" },
  { value: "good-conditions", label: "Buenas condiciones", icon: "✅" },
];

export function CreateReportModal({ open, onOpenChange, zoneName }: CreateReportModalProps) {
  const [riskType, setRiskType] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Aquí iría la lógica para enviar el reporte
    console.log({
      zoneName,
      riskType,
      description,
      photo,
    });

    // Resetear formulario
    setRiskType("");
    setDescription("");
    setPhoto(null);
    setPhotoPreview("");
    
    // Cerrar modal
    onOpenChange(false);
    
    // Mostrar mensaje de éxito (podrías usar toast aquí)
    alert("¡Reporte publicado con éxito! Gracias por contribuir a la seguridad en la montaña.");
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoPreview("");
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
            <Select value={riskType} onValueChange={setRiskType} required>
              <SelectTrigger id="risk-type">
                <SelectValue placeholder="Selecciona el tipo de condición..." />
              </SelectTrigger>
              <SelectContent>
                {riskTypes.map((type) => (
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

          {/* Adjuntar Foto */}
          <div className="space-y-2">
            <Label htmlFor="photo" className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-gray-600" />
              Adjuntar Foto (opcional)
            </Label>
            
            {!photoPreview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors cursor-pointer">
                <input
                  type="file"
                  id="photo"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <label
                  htmlFor="photo"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 font-medium">
                    Click para seleccionar una foto
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG o WEBP (máx. 5MB)
                  </p>
                </label>
              </div>
            ) : (
              <div className="relative rounded-lg overflow-hidden border border-gray-300">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={handleRemovePhoto}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
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
              disabled={!riskType || description.length < 20}
            >
              Publicar Reporte
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
