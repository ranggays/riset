"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { BrainstormingSessionApiResponse, BrainstormingSessionItem } from "../types";
import { eventBus } from "@/lib/utils/eventBus";
import { createBrainstormingSession } from "../api/brainstormingSessions";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardNavbar } from "./DashboardNavbar";
import { CoverColorPicker, COVER_COLORS } from "./CoverColorPicker";
import { NativeDialog } from "./NativeDialog";
import { DashboardFeedbackProvider } from "./DashboardFeedback";
import styles from "../Dashboards.module.css";

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebarOpened: boolean;
  onToggleSidebar: () => void;
  mounted: boolean;
  fullBleed?: boolean;
  onSessionCreated?: () => void;
}

const EMPTY_SESSION = { title: "", description: "", coverColor: COVER_COLORS[0] };
type ColorScheme = "light" | "dark";
const COLOR_SCHEME_KEY = "my-sre-color-scheme";

export function DashboardLayout({
  children,
  sidebarOpened,
  onToggleSidebar,
  mounted,
  fullBleed = false,
  onSessionCreated,
}: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [colorScheme, setColorScheme] = useState<ColorScheme>("light");
  const [brainstormingSessions, setBrainstormingSessions] = useState<BrainstormingSessionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newSession, setNewSession] = useState(EMPTY_SESSION);

  useEffect(() => {
    if (!mounted) return;
    const frame = window.requestAnimationFrame(() => {
      const saved = window.localStorage.getItem(COLOR_SCHEME_KEY)
        ?? window.localStorage.getItem("mantine-color-scheme-value");
      if (saved === "light" || saved === "dark") setColorScheme(saved);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [mounted]);

  const toggleColorScheme = () => {
    setColorScheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      window.localStorage.setItem(COLOR_SCHEME_KEY, next);
      return next;
    });
  };

  const fetchBrainstormingSessions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/brainstorming-sessions");
      if (!response.ok) throw new Error("Gagal memuat sesi brainstorming.");

      const sessions = await response.json() as BrainstormingSessionApiResponse[];
      setBrainstormingSessions(sessions.map((session) => ({
        id: session.id,
        title: session.title,
        description: session.description || "",
        coverColor: session.coverColor || COVER_COLORS[0],
        lastActivity: new Date(session.lastActivity || session.updatedAt || session.createdAt).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        }),
        active: pathname.includes(`/projects/${session.id}`),
      })));
    } catch (error) {
      console.error("Gagal memuat sesi brainstorming:", error);
    } finally {
      setLoading(false);
    }
  }, [pathname]);

  useEffect(() => {
    const handleUpdate = () => { void fetchBrainstormingSessions(); };
    eventBus.on("sessionCreated", handleUpdate);
    eventBus.on("sessionDeleted", handleUpdate);
    eventBus.on("sessionUpdated", handleUpdate);

    return () => {
      eventBus.off("sessionCreated", handleUpdate);
      eventBus.off("sessionDeleted", handleUpdate);
      eventBus.off("sessionUpdated", handleUpdate);
    };
  }, [fetchBrainstormingSessions]);

  useEffect(() => {
    if (!mounted) return;
    const timer = setTimeout(() => { void fetchBrainstormingSessions(); }, 0);
    return () => clearTimeout(timer);
  }, [mounted, fetchBrainstormingSessions]);

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setCreateError("");
    setNewSession(EMPTY_SESSION);
  };

  const handleSessionSelect = useCallback((sessionId: string) => {
    router.push(`/projects/${sessionId}`);
    if (window.matchMedia("(max-width: 768px)").matches && sidebarOpened) onToggleSidebar();
  }, [onToggleSidebar, router, sidebarOpened]);

  const handleCreateSession = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newSession.title.trim()) return;

    setLoading(true);
    setCreateError("");
    try {
      await createBrainstormingSession(newSession);
      await fetchBrainstormingSessions();
      closeCreateModal();
      onSessionCreated?.();
    } catch (error) {
      console.error("Error creating session", error);
      setCreateError("Gagal membuat sesi brainstorming. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.workspace} data-color-scheme={colorScheme}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <DashboardHeader
            sidebarOpened={sidebarOpened}
            onToggleSidebar={onToggleSidebar}
            mounted={mounted}
            colorScheme={colorScheme}
            onToggleColorScheme={toggleColorScheme}
          />
        </header>

        <div className={styles.body}>
          {sidebarOpened && (
            <button
              aria-label="Tutup navigasi"
              className={styles.mobileScrim}
              onClick={onToggleSidebar}
              type="button"
            />
          )}
          <aside id="primary-sidebar" className={`${styles.sidebar} ${sidebarOpened ? styles.sidebarOpen : styles.sidebarCollapsed}`} aria-label="Navigasi utama">
            <DashboardNavbar
              brainstormingSessions={brainstormingSessions}
              loading={loading}
              mounted={mounted}
              isCollapsed={!sidebarOpened}
              onSessionSelect={handleSessionSelect}
              onNewSession={() => {
                setCreateError("");
                setCreateModalOpen(true);
              }}
            />
          </aside>

          <main className={`${styles.main} ${fullBleed ? styles.mainFullBleed : ""}`}><DashboardFeedbackProvider>{children}</DashboardFeedbackProvider></main>
        </div>
      </div>

      <NativeDialog open={createModalOpen} onClose={closeCreateModal} labelledBy="new-session-title">
        <div className={styles.dialogHeader}>
          <div>
            <h2 className={styles.dialogTitle} id="new-session-title">Buat Sesi Brainstorming Baru</h2>
            <p className={styles.muted}>Mulai ruang kerja baru untuk ide dan riset Anda.</p>
          </div>
          <button className={styles.dialogClose} type="button" onClick={closeCreateModal} aria-label="Tutup dialog">×</button>
        </div>
        <form className={styles.dialogForm} onSubmit={handleCreateSession}>
          <label className={styles.formField}>
            <span className={styles.fieldLabel}>Judul Sesi</span>
            <input
              autoFocus
              className={styles.fieldInput}
              onChange={(event) => setNewSession((current) => ({ ...current, title: event.currentTarget.value }))}
              placeholder="Masukkan judul sesi brainstorming"
              required
              value={newSession.title}
            />
          </label>
          <label className={styles.formField}>
            <span className={styles.fieldLabel}>Deskripsi (Opsional)</span>
            <textarea
              className={styles.fieldTextarea}
              onChange={(event) => setNewSession((current) => ({ ...current, description: event.currentTarget.value }))}
              placeholder="Jelaskan tujuan sesi brainstorming Anda"
              value={newSession.description}
            />
          </label>
          <CoverColorPicker
            label="Warna Cover"
            onChange={(coverColor) => setNewSession((current) => ({ ...current, coverColor }))}
            value={newSession.coverColor}
          />
          {createError && <p className={styles.formError} role="alert">{createError}</p>}
          <div className={styles.dialogActions}>
            <button className={styles.quietButton} onClick={closeCreateModal} type="button">Batal</button>
            <button className={styles.primaryButton} disabled={!newSession.title.trim() || loading} type="submit">
              {loading ? "Membuat..." : "Buat Sesi"}
            </button>
          </div>
        </form>
      </NativeDialog>
    </div>
  );
}
