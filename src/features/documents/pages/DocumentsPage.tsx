import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/components/shared/PageTransition";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/utils/date";
import { DOCUMENT_TYPE_LABELS } from "@/types";
import type { DocumentType } from "@/types/enums";
import { useProjects } from "@/features/projects/api/useProjects";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  useDocuments,
  useUploadDocument,
  useDeleteDocument,
} from "@/features/documents/api/useDocuments";
import { getDocumentSignedUrl } from "@/features/documents/api/documents";
import { DocumentForm } from "@/features/documents/components/DocumentForm";
import type { DocumentWithProject } from "@/features/documents/api/documents";
import {
  FileText,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  Download,
  FolderOpen,
  FileImage,
  Receipt,
  FileSignature,
  Map,
  Layers,
} from "lucide-react";

const TYPE_ICONS: Record<DocumentType, typeof FileText> = {
  factura: Receipt,
  recibo: FileSignature,
  contrato: FileText,
  foto: FileImage,
  plano: Map,
  otro: Layers,
};

function fileSizeLabel(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DocumentWithProject | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { user } = useAuth();
  const { data: projects = [] } = useProjects({});
  const {
    data: documents = [],
    isLoading,
    isError,
    refetch,
  } = useDocuments(projectFilter !== "all" ? projectFilter : undefined);
  const uploadMutation = useUploadDocument(user?.id);
  const deleteMutation = useDeleteDocument();

  const openCreate = () => {
    setFormOpen(true);
  };

  const handleDownload = async (doc: DocumentWithProject) => {
    try {
      setDownloadingId(doc.id);
      const url = await getDocumentSignedUrl(doc.file_url);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.click();
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Documentos</h1>
            <p className="text-muted-foreground">
              Facturas, contratos, fotografías y planos de tus obras
            </p>
          </div>
          <Button variant="glow" size="lg" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Subir documento
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Filtrar por obra</span>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las obras</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading && (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {isError && (
          <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="font-semibold">No se pudieron cargar los documentos</p>
            <Button variant="outline" onClick={() => refetch()}>
              Reintentar
            </Button>
          </Card>
        )}

        {!isLoading && !isError && documents.length === 0 && (
          <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <FolderOpen className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold">No hay documentos</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Sube facturas, contratos, fotos o planos para tener todo el papeleo de tus
                obras en un solo lugar.
              </p>
            </div>
            <Button variant="glow" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Subir documento
            </Button>
          </Card>
        )}

        {!isLoading && !isError && documents.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => {
              const Icon = TYPE_ICONS[doc.file_type];
              return (
                <Card key={doc.id} className="group">
                  <CardContent className="flex flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {DOCUMENT_TYPE_LABELS[doc.file_type]}
                      </Badge>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium" title={doc.name}>
                        {doc.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {doc.project?.name ?? "Sin obra"}
                        {doc.file_size ? ` · ${fileSizeLabel(doc.file_size)}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(doc.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center justify-end gap-1 border-t border-border/60 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={downloadingId === doc.id}
                        onClick={() => handleDownload(doc)}
                      >
                        {downloadingId === doc.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        Ver
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(doc)}
                        aria-label="Eliminar documento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <DocumentForm
          open={formOpen}
          onOpenChange={setFormOpen}
          projects={projects}
          fixedProjectId={projectFilter !== "all" ? projectFilter : undefined}
          isSubmitting={uploadMutation.isPending}
          onSave={(file, name, file_type, project_id) => {
            uploadMutation.mutate(
              {
                file,
                input: {
                  name,
                  file_type,
                  project_id: project_id || null,
                },
              },
              {
                onSuccess: () => {
                  setFormOpen(false);
                  toast.success("Documento subido");
                },
                onError: () =>
                  toast.error("No se pudo subir el documento", {
                    description: "Revisa el archivo e inténtalo de nuevo.",
                  }),
              }
            );
          }}
        />

        <ConfirmDeleteDialog
          open={!!deleteTarget}
          title="Eliminar documento"
          name={deleteTarget?.name ?? ""}
          prefix="¿Eliminar "
          suffix="? El archivo se borrará del almacenamiento."
          isPending={deleteMutation.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (!deleteTarget) return;
            deleteMutation.mutate(deleteTarget.id, {
              onSuccess: () => {
                setDeleteTarget(null);
                toast.success("Documento eliminado");
              },
              onError: () => toast.error("No se pudo eliminar el documento"),
            });
          }}
        />
      </div>
    </PageTransition>
  );
}