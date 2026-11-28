import {
  IconArticle,
  IconCopy,
  IconDots,
  IconEdit,
  IconFileText,
  IconFolderOpen,
  IconMessageCircle,
  IconShare,
  IconTrash,
} from "@tabler/icons-react";
import type { KeyboardEvent } from "react";
import type { BrainstormingProject } from "../types";
import styles from "../Dashboards.module.css";

interface ProjectCardProps {
  project: BrainstormingProject;
  isLoading: boolean;
  draftIsLoading: boolean;
  onOpen: (projectId: string) => void;
  onOpenDraft: (projectId: string) => void;
  onEdit: (project: BrainstormingProject) => void;
  onDuplicate: (project: BrainstormingProject) => void;
  onDelete: (project: BrainstormingProject) => void;
}

export function ProjectCard({
  project,
  isLoading,
  draftIsLoading,
  onOpen,
  onOpenDraft,
  onEdit,
  onDuplicate,
  onDelete,
}: ProjectCardProps) {
  const disabled = isLoading || draftIsLoading;
  const handleOpenKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.key === "Enter" || event.key === " ") && !disabled) {
      event.preventDefault();
      onOpen(project.id);
    }
  };

  return (
    <article aria-busy={isLoading} className={styles.projectCard}>
      <div className={styles.projectColorBand} style={{ backgroundColor: project.coverColor }} />
      <div
        aria-disabled={disabled}
        className={styles.projectOpen}
        onKeyDown={handleOpenKeyDown}
        onClick={() => { if (!disabled) onOpen(project.id); }}
        role="button"
        tabIndex={disabled ? -1 : 0}
      >
        <div className={styles.projectCardContent}>
          <h2 className={styles.projectTitle}>{project.title}</h2>
          {project.description && (
            <p
              className={styles.projectDescription}
              title={project.description.length > 100 ? project.description : undefined}
            >
              {project.description.length > 100 ? `${project.description.substring(0, 100)}...` : project.description}
            </p>
          )}
          <div className={styles.projectMetrics}>
            <span className={styles.metric}>
              <span className={styles.metricIcon}><IconArticle size={13} aria-hidden="true" /></span>
              {project.articleCount} artikel
            </span>
            <span className={styles.metric}>
              <span className={styles.metricIcon}><IconMessageCircle size={13} aria-hidden="true" /></span>
              {project.chatCount} chat
            </span>
          </div>
          <div className={styles.projectMeta}>
            <span>Aktivitas {project.lastActivity}</span>
            <time className={styles.dateBadge} dateTime={project.createdAt}>{project.createdAt}</time>
          </div>
        </div>
      </div>

      <details className={styles.cardMenuWrap}>
        <summary className={styles.cardMenuTrigger} aria-label={`Aksi untuk ${project.title}`}>
          <IconDots size={18} aria-hidden="true" />
        </summary>
        <div className={styles.cardMenu}>
          <button className={styles.menuButton} onClick={(event) => {
            event.currentTarget.closest("details")?.removeAttribute("open");
            onEdit(project);
          }} type="button">
            <IconEdit size={15} aria-hidden="true" /> Edit
          </button>
          <button className={styles.menuButton} onClick={(event) => {
            event.currentTarget.closest("details")?.removeAttribute("open");
            onDuplicate(project);
          }} type="button">
            <IconCopy size={15} aria-hidden="true" /> Duplicate
          </button>
          <button className={styles.menuButton} type="button" disabled>
            <IconShare size={15} aria-hidden="true" /> Share
          </button>
          <button className={`${styles.menuButton} ${styles.menuDanger}`} onClick={(event) => {
            event.currentTarget.closest("details")?.removeAttribute("open");
            onDelete(project);
          }} type="button">
            <IconTrash size={15} aria-hidden="true" /> Delete
          </button>
        </div>
      </details>

      <div className={styles.projectActions}>
        <button
          className={styles.actionButton}
          disabled={disabled}
          onClick={() => onOpen(project.id)}
          type="button"
        >
          <IconFolderOpen size={14} aria-hidden="true" />
          {isLoading ? "Membuka..." : "Buka Project"}
        </button>
        <button
          className={styles.quietButton}
          disabled={disabled}
          onClick={() => onOpenDraft(project.id)}
          type="button"
        >
          <IconFileText size={14} aria-hidden="true" />
          {draftIsLoading ? "Membuka..." : "Draft"}
        </button>
      </div>

      {isLoading && (
        <div className={styles.loadingCover} role="status" aria-label="Membuka proyek">
          <span className={styles.spinner} aria-hidden="true" />
        </div>
      )}
    </article>
  );
}
