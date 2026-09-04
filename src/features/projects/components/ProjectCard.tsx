import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/utils/date";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS, type ProjectWithDetails } from "@/types";
import { MapPin, CalendarDays, Building2, ArrowRight, FolderKanban } from "lucide-react";
import { useProjectCover } from "@/features/projects/api/useProjectCover";
import { ProjectStatusSelect } from "@/features/projects/components/ProjectStatusSelect";

interface ProjectCardProps {
  project: ProjectWithDetails;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const statusLabel = PROJECT_STATUS_LABELS[project.status];
  const statusColor = PROJECT_STATUS_COLORS[project.status];
  const coverUrl = useProjectCover(project.cover_image_url ?? null);

  return (
    <Link to={`/projects/${project.id}`} className="block group">
      <Card className="h-full overflow-hidden transition-all duration-200 group-hover:border-primary/40 group-hover:shadow-md">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary to-purple-500 opacity-80" />
        {coverUrl ? (
          <div className="relative h-32 overflow-hidden bg-secondary">
            <img
              src={coverUrl}
              alt={`Portada de ${project.name}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute right-3 top-3">
              <ProjectStatusSelect projectId={project.id} status={project.status} />
            </div>
          </div>
        ) : (
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <FolderKanban className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
                    {project.name}
                  </h3>
                  {project.location && (
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground mt-0.5">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {project.location}
                    </p>
                  )}
                </div>
              </div>
              <ProjectStatusSelect projectId={project.id} status={project.status} />
            </div>

            {(project.client || project.project_type) && (
              <div className="mt-4 flex items-center gap-4 text-sm">
                {project.client && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    {project.client.name}
                  </span>
                )}
                {project.project_type && (
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground capitalize">
                    {project.project_type}
                  </span>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                {project.start_date ? formatDate(project.start_date) : "Sin fecha inicio"}
              </span>
              <span className={`flex items-center gap-1 text-xs font-medium ${statusColor}`}>
                {statusLabel}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </CardContent>
        )}
        {coverUrl && (
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
                  {project.name}
                </h3>
                {project.client && (
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    {project.client.name}
                  </p>
                )}
              </div>
              <span className={`flex shrink-0 items-center gap-1 text-xs font-medium ${statusColor}`}>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
            {project.location && (
              <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                {project.location}
              </p>
            )}
            <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {project.start_date ? formatDate(project.start_date) : "Sin fecha inicio"}
              </span>
              {project.project_type && (
                <span className="rounded bg-secondary px-2 py-0.5 capitalize">
                  {project.project_type}
                </span>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}
