import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBrain, IconHistory, IconLayoutDashboard, IconMenu, IconPlus } from "@tabler/icons-react";
import type { BrainstormingSessionItem } from "../types";
import styles from "../Dashboards.module.css";

interface DashboardNavbarProps {
  brainstormingSessions: BrainstormingSessionItem[];
  loading: boolean;
  mounted: boolean;
  onSessionSelect?: (sessionId: string) => void;
  onNewSession?: () => void;
  isCollapsed?: boolean;
}

export function DashboardNavbar({
  brainstormingSessions,
  loading,
  mounted,
  onSessionSelect,
  onNewSession,
  isCollapsed = false,
}: DashboardNavbarProps) {
  const pathname = usePathname();
  const isDashboardsPage = pathname === "/projects";

  return (
    <nav className={styles.navContent} aria-label="Navigasi sesi">
      {!isCollapsed && (
        <div className={styles.sidebarSectionTitle}><IconMenu size={16} aria-hidden="true" /> Menu</div>
      )}
      <Link
        aria-current={isDashboardsPage ? "page" : undefined}
        className={`${styles.sidebarLink} ${isDashboardsPage ? styles.sidebarLinkActive : ""}`}
        href="/projects"
        aria-label="Dashboards"
        title={isCollapsed ? "Dashboards" : undefined}
      >
        <IconLayoutDashboard size={18} aria-hidden="true" />
        <span className={styles.sidebarText}>Dashboards</span>
      </Link>

      {!isCollapsed && (
        <div className={styles.sidebarSectionTitle}><IconBrain size={16} aria-hidden="true" /> Tambah Brainstorming</div>
      )}
      <button
        aria-label="Tambah Sesi Baru"
        className={styles.newSessionButton}
        onClick={onNewSession}
        title={isCollapsed ? "Tambah Sesi Baru" : undefined}
        type="button"
      >
        <IconPlus size={18} aria-hidden="true" />
        <span className={styles.sidebarText}>Tambah Sesi Baru</span>
      </button>

      {!isCollapsed && (
        <div className={styles.sidebarSectionTitle}><IconHistory size={16} aria-hidden="true" /> Sesi Brainstorming</div>
      )}
      <div className={styles.sessionList} aria-label="Daftar sesi" aria-busy={loading}>
        {!mounted && !brainstormingSessions.length ? (
          <span className={styles.sidebarCaption}>Memuat sesi...</span>
        ) : brainstormingSessions.length ? brainstormingSessions.map((session) => (
          <button
            aria-current={session.active ? "page" : undefined}
            aria-label={isCollapsed ? session.title : undefined}
            className={`${styles.sessionLink} ${session.active ? styles.sessionActive : ""}`}
            key={session.id}
            onClick={() => onSessionSelect?.(session.id)}
            title={isCollapsed ? session.title : undefined}
            type="button"
          >
            {!isCollapsed && <span className={styles.sessionColor} style={{ backgroundColor: session.coverColor }} aria-hidden="true" />}
            {isCollapsed ? <IconBrain size={18} aria-hidden="true" /> : (
              <span className={styles.sessionText}>
                <strong>{session.title}</strong>
                <span>{session.lastActivity}</span>
              </span>
            )}
          </button>
        )) : (
          <span className={styles.sidebarCaption}>{loading ? "Memuat sesi..." : "Belum ada sesi"}</span>
        )}
      </div>
    </nav>
  );
}
