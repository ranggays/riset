import { IconPlus } from "@tabler/icons-react";
import styles from "../Dashboards.module.css";

interface CreateProjectCardProps {
  onClick: () => void;
}

export function CreateProjectCard({ onClick }: CreateProjectCardProps) {
  return (
    <button className={styles.createCard} onClick={onClick} type="button">
      <span className={styles.createBadge} aria-hidden="true"><IconPlus size={24} /></span>
      <span className={styles.createTitle}>Buat Sesi Brainstorming Baru</span>
      <span className={styles.createDescription}>Mulai proyek penelitian baru dengan AI assistant</span>
    </button>
  );
}
