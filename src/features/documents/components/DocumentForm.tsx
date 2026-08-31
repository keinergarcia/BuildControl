import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DOCUMENT_TYPE_LABELS, type Project } from "@/types";
import type { DocumentType } from "@/types/enums";
import { UploadCloud, X } from "lucide-react";

const documentFormSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  file_type: z.enum(["factura", "recibo", "contrato", "foto", "plano", "otro"]),
  project_id: z.string().uuid().optional().or(z.literal("")),
});

type DocumentFormData = z.infer<typeof documentFormSchema>;

const TYPE_OPTIONS = (Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[]).map(
  (t) => ({ value: t, label: DOCUMENT_TYPE_LABELS[t] })
);

interface DocumentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  fixedProjectId?: string;
  isSubmitting: boolean;
  onSave: (file: File, name: string, file_type: DocumentType, project_id: string) => void;
}

function toFormValue(fixedProjectId?: string): DocumentFormData {
  return {
    name: "",
    file_type: "factura",
    project_id: fixedProjectId ?? "",
  };
}

export function DocumentForm({
  open,
  onOpenChange,
  projects,
  fixedProjectId,
  isSubmitting,
  onSave,
}: DocumentFormProps) {
  const [file, setFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<DocumentFormData>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: toFormValue(fixedProjectId),
  });

  useEffect(() => {
    reset(toFormValue(fixedProjectId));
    setFile(null);
  }, [open, fixedProjectId, reset]);

  const handleFile = (f: File | undefined) => {
    if (!f) return;
    setFile(f);
    if (!getValues("name")) {
      setValue("name", f.name.replace(/\.[^.]+$/, ""));
    }
  };

  const submit = (data: DocumentFormData) => {
    if (!file) return;
    onSave(file, data.name.trim(), data.file_type, data.project_id || "");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subir documento</DialogTitle>
          <DialogDescription>
            Facturas, recibos, contratos, fotografías o planos de tus obras.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label>Archivo *</Label>
            <label
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
                file
                  ? "border-primary/50 bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <UploadCloud className="h-6 w-6 text-muted-foreground" />
              {file ? (
                <span className="text-sm font-medium">{file.name}</span>
              ) : (
                <>
                  <span className="text-sm font-medium">Selecciona un archivo</span>
                  <span className="text-xs text-muted-foreground">
                    PDF, imagen u otros (máx. 10 MB)
                  </span>
                </>
              )}
              <Input
                type="file"
                className="sr-only"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.dwg"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </label>
            {file && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => setFile(null)}
              >
                <X className="h-3.5 w-3.5" />
                Quitar archivo
              </Button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                placeholder="Ej. Factura materiales mayo"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Controller
                control={control}
                name="file_type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Proyecto</Label>
            <Controller
              control={control}
              name="project_id"
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  onValueChange={field.onChange}
                  disabled={!!fixedProjectId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="glow" disabled={isSubmitting || !file}>
              {isSubmitting ? "Subiendo..." : "Subir"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}