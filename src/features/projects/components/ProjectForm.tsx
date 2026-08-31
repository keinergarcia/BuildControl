import { useForm, Controller } from "react-hook-form";
import { toNull } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { projectSchema, type ProjectFormData } from "@/utils/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { STATUS_OPTIONS } from "@/features/projects/constants";
import {
  uploadProjectCover,
  deleteProjectCover,
} from "@/features/projects/api/covers";
import { useProjectCover } from "@/features/projects/api/useProjectCover";
import { ImagePlus, X, Loader2 } from "lucide-react";
import type { Client, Project } from "@/types";


function toFormValue(project: Project | null): ProjectFormData {
  return {
    name: project?.name ?? "",
    description: project?.description ?? "",
    client_id: project?.client_id ?? null,
    location: project?.location ?? "",
    project_type: project?.project_type ?? "",
    status: project?.status ?? "planificacion",
    start_date: project?.start_date ?? "",
    planned_end_date: project?.planned_end_date ?? "",
    notes: project?.notes ?? "",
  };
}

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  clients: Client[];
  userId: string | null;
  isSubmitting: boolean;
  onSave: (
    input: ReturnType<typeof buildInput> & { cover_image_url?: string | null }
  ) => void;
  title: string;
  description: string;
}

export function buildInput(data: ProjectFormData) {
  return {
    name: data.name,
    description: toNull(data.description),
    client_id: toNull(data.client_id),
    location: toNull(data.location),
    project_type: toNull(data.project_type),
    status: data.status,
    start_date: toNull(data.start_date),
    planned_end_date: toNull(data.planned_end_date),
    notes: toNull(data.notes),
  };
}

export function ProjectForm({
  open,
  onOpenChange,
  project,
  clients,
  userId,
  isSubmitting,
  onSave,
  title,
  description,
}: ProjectFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: toFormValue(project),
  });

  const existingCoverUrl = useProjectCover(project?.cover_image_url ?? null);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverRemoved, setCoverRemoved] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    reset(toFormValue(project));
    setCoverFile(null);
    setCoverPreview(null);
    setCoverRemoved(false);
    setUploadingCover(false);
  }, [project, open, reset]);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return;
    }
    const previewUrl = URL.createObjectURL(coverFile);
    setCoverPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [coverFile]);

  const showCoverPreview = coverRemoved
    ? null
    : coverPreview ?? existingCoverUrl;

  const onSubmit = handleSubmit(async (data) => {
    let coverPath: string | null = null;
    const previousPath = project?.cover_image_url ?? null;

    setUploadingCover(true);
    try {
      if (coverRemoved) {
        if (previousPath) {
          await deleteProjectCover(previousPath).catch(() => {});
        }
        coverPath = null;
      } else if (coverFile && userId) {
        coverPath = await uploadProjectCover(coverFile, userId);
        if (previousPath && previousPath !== coverPath) {
          await deleteProjectCover(previousPath).catch(() => {});
        }
      } else {
        coverPath = previousPath;
      }
    } finally {
      setUploadingCover(false);
    }

    onSave({
      ...buildInput(data),
      cover_image_url: coverPath,
    });
  });

  const busy = isSubmitting || uploadingCover;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={onSubmit}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del proyecto *</Label>
            <Input
              id="name"
              placeholder="Ej. Casa Campestre Lote 12"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Imagen de portada</Label>
            {showCoverPreview ? (
              <div className="relative overflow-hidden rounded-xl border border-border">
                <img
                  src={showCoverPreview}
                  alt="Portada del proyecto"
                  className="h-40 w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-2 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={busy}
                  >
                    Cambiar
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setCoverFile(null);
                      setCoverRemoved(true);
                    }}
                    disabled={busy}
                  >
                    <X className="h-4 w-4" />
                    Quitar
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
              >
                {uploadingCover ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="h-5 w-5" />
                    <span className="text-sm">Subir imagen de portada</span>
                  </>
                )}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              aria-label="Seleccionar imagen de portada"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setCoverFile(file);
                  setCoverRemoved(false);
                }
                e.currentTarget.value = "";
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Breve descripción del proyecto"
              className="min-h-[80px]"
              {...register("description")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project_type">Tipo de obra</Label>
              <Input
                id="project_type"
                placeholder="Ej. Residencial, Remodelación"
                {...register("project_type")}
              />
            </div>

            <div className="space-y-2">
              <Label>Cliente</Label>
              <Controller
                control={control}
                name="client_id"
                render={({ field }) => (
                  <Select
                    value={field.value ?? undefined}
                    onValueChange={(v) => field.onChange(v === "__none" ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">Sin cliente</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.company ? `${c.name} — ${c.company}` : c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Ubicación / Dirección</Label>
            <Input
              id="location"
              placeholder="Ej. Cra 7 # 45-12, Bogotá"
              {...register("location")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha de inicio</Label>
              <Input
                type="date"
                {...register("start_date")}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Fecha fin planeada</Label>
              <Input
                type="date"
                {...register("planned_end_date")}
                aria-invalid={!!errors.planned_end_date}
              />
              {errors.planned_end_date && (
                <p className="text-sm text-destructive">
                  {errors.planned_end_date.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Input id="notes" placeholder="Notas internas" {...register("notes")} />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="glow" disabled={busy}>
              {busy ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
