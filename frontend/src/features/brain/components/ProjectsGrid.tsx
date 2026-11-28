import { IconFolder } from "@tabler/icons-react";
import type { BrainstormingProject } from "../types";
import { CreateProjectCard } from "./CreateProjectCard";
import { ProjectCard } from "./ProjectCard";
import styles from "../Dashboards.module.css";

interface ProjectsGridProps {
  loading: boolean;
  filteredProjects: BrainstormingProject[];
  searchQuery: string;
  loadingStates: Record<string, boolean>;
  onCreateProject: () => void;
  onOpenProject: (projectId: string) => void;
  onOpenDraft: (projectId: string) => void;
  onEditProject: (project: BrainstormingProject) => void;
  onDuplicateProject: (project: BrainstormingProject) => void;
  onDeleteProject: (project: BrainstormingProject) => void;
}

function LoadingCard() {
  return (
    <div className={styles.skeletonCard} aria-hidden="true">
      <span className={`${styles.skeletonLine} ${styles.skeletonBand}`} />
      <span className={`${styles.skeletonLine} ${styles.skeletonLong}`} />
      <span className={`${styles.skeletonLine} ${styles.skeletonMedium}`} />
      <span className={styles.skeletonBlock} />
      <span className={`${styles.skeletonLine} ${styles.skeletonShort}`} />
      <span className={`${styles.skeletonLine} ${styles.skeletonMedium}`} />
    </div>
  );
}

export function ProjectsGrid({
  loading,
  filteredProjects,
  searchQuery,
  loadingStates,
  onCreateProject,
  onOpenProject,
  onOpenDraft,
  onEditProject,
  onDuplicateProject,
  onDeleteProject,
}: ProjectsGridProps) {
  if (loading) {
    return (
      <div className={styles.projectGrid} role="status" aria-label="Memuat proyek">
        {Array.from({ length: 6 }, (_, index) => <LoadingCard key={index} />)}
      </div>
    );
  }

  const projectCount = filteredProjects.length;
  const resultsMessage = searchQuery
    ? `${projectCount} proyek ditemukan`
    : `${projectCount} proyek tersedia`;

  return (
    <section aria-label="Daftar proyek">
      <p className={styles.resultsStatus} aria-live="polite">{resultsMessage}</p>
      <div className={styles.projectGrid}>
        <CreateProjectCard onClick={onCreateProject} />
        {filteredProjects.map((project) => (
          <ProjectCard
            draftIsLoading={loadingStates[`draft-${project.id}`] ?? false}
            isLoading={loadingStates[`project-${project.id}`] ?? false}
            key={project.id}
            onDelete={onDeleteProject}
            onDuplicate={onDuplicateProject}
            onEdit={onEditProject}
            onOpen={onOpenProject}
            onOpenDraft={onOpenDraft}
            project={project}
          />
        ))}
      </div>

      {projectCount === 0 && searchQuery && (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon} aria-hidden="true"><IconFolder size={28} /></span>
          <h2>Tidak ada proyek yang ditemukan</h2>
          <p>Coba kata kunci lain atau buat proyek baru.</p>
        </div>
      )}
    </section>
  );
}
