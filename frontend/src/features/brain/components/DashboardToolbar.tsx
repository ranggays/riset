import { IconSearch } from "@tabler/icons-react";
import styles from "../Dashboards.module.css";

interface DashboardToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function DashboardToolbar({ searchQuery, onSearchChange }: DashboardToolbarProps) {
  return (
    <section className={styles.toolbar} aria-labelledby="dashboard-page-title">
      <div>
        <h1 className={styles.pageHeading} id="dashboard-page-title">Sesi Brainstorming</h1>
        <p className={styles.pageIntro}>Kelola proyek penelitian dan diskusi dengan AI assistant.</p>
      </div>

      <form className={styles.toolbarActions} role="search" onSubmit={(event) => event.preventDefault()}>
        <div className={styles.searchForm}>
          <IconSearch size={17} aria-hidden="true" />
          <input
            aria-label="Cari proyek"
            className={styles.searchInput}
            onChange={(event) => onSearchChange(event.currentTarget.value)}
            placeholder="Cari proyek..."
            type="search"
            value={searchQuery}
          />
          {searchQuery && (
            <button
              aria-label="Hapus pencarian"
              className={styles.searchClear}
              onClick={() => onSearchChange("")}
              type="button"
            >
              ×
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
