"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { BrainstormingProject, BrainstormingSessionApiResponse } from "./types";
import {
  createBrainstormingSession,
  deleteBrainstormingSession,
  getBrainstormingSessions,
  getSessionContext,
  updateBrainstormingSession,
} from "./api/brainstormingSessions";
import { DashboardLayout } from "./components/DashboardLayout";
import { DashboardToolbar } from "./components/DashboardToolbar";
import { NativeDialog } from "./components/NativeDialog";
import { ProjectModals, type NewProjectForm } from "./components/ProjectModals";
import { ProjectsGrid } from "./components/ProjectsGrid";
import styles from "./Dashboards.module.css";

const EMPTY_PROJECT_FORM: NewProjectForm = {
  title: "",
  description: "",
  coverColor: "#4c6ef5",
};

interface ToastNotice {
  title: string;
  message: string;
  isError: boolean;
}

export default function ProjectDashboard() {
  const [projects, setProjects] = useState<BrainstormingProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<BrainstormingProject | null>(null);
  const [deleteProject, setDeleteProject] = useState<BrainstormingProject | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpened, setSidebarOpened] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [newProject, setNewProject] = useState<NewProjectForm>(EMPTY_PROJECT_FORM);
  const [notice, setNotice] = useState<ToastNotice | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const showNotice = useCallback((title: string, message: string, isError = false) => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice({ title, message, isError });
    noticeTimer.current = setTimeout(() => setNotice(null), 4500);
  }, []);

  useEffect(() => {
    const mountTimer = setTimeout(() => setMounted(true), 0);
    return () => {
      clearTimeout(mountTimer);
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const data = await getBrainstormingSessions();
      const formatted: BrainstormingProject[] = data.map((project: BrainstormingSessionApiResponse) => ({
        id: project.id,
        title: project.title,
        description: project.description || "",
        coverColor: project.coverColor || "#4c6ef5",
        articleCount: project._count?.Article || 0,
        chatCount: project._count?.ChatMessage || 0,
        lastActivity: new Date(
          project.lastActivity || project.updatedAt || project.createdAt
        ).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
        createdAt: new Date(project.createdAt).toISOString().split("T")[0],
      }));
      setProjects(formatted);
    } catch (error) {
      console.error("Gagal memuat proyek", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const getSessionId = async () => {
      try {
        const data = await getSessionContext();
        setSessionId(data.sessionId || null);
      } catch {
        setSessionId(null);
      }
    };
    void getSessionId();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { void fetchProjects(); }, 0);
    return () => clearTimeout(timer);
  }, [fetchProjects]);

  useEffect(() => {
    if (pathname !== "/projects") return;
    const timer = setTimeout(() => setLoadingStates({}), 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  const filteredProjects = projects.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSessionCreatedFromSidebar = useCallback(() => fetchProjects(), [fetchProjects]);

  const handleCreateProject = async () => {
    if (!newProject.title.trim()) return;
    try {
      await createBrainstormingSession(newProject);
      await fetchProjects();
      setCreateModalOpen(false);
      setNewProject(EMPTY_PROJECT_FORM);
      showNotice("Success", "Berhasil membuat sesi");
    } catch (error) {
      console.error("Error", error);
      showNotice("Gagal", "Gagal membuat sesi", true);
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteProject) return;
    setDeleteLoading(true);
    try {
      await deleteBrainstormingSession(deleteProject.id);
      await fetchProjects();
      showNotice("Success", "Berhasil hapus sesi");
      setDeleteProject(null);
    } catch (error) {
      console.error(error);
      showNotice("Gagal", "Gagal hapus sesi", true);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditProject = async () => {
    if (!editingProject) return;
    try {
      await updateBrainstormingSession(editingProject.id, {
        title: editingProject.title,
        description: editingProject.description,
        coverColor: editingProject.coverColor,
      });
      await fetchProjects();
      setEditingProject(null);
      showNotice("Success", "Berhasil update sesi");
    } catch (error) {
      console.error("Edit error:", error);
      showNotice("Gagal", "Gagal update sesi", true);
    }
  };

  const handleDuplicateProject = (project: BrainstormingProject) => {
    const duplicated: BrainstormingProject = {
      ...project,
      id: Date.now().toString(),
      title: `${project.title} (Copy)`,
      lastActivity: "Baru dibuat",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setProjects((current) => [duplicated, ...current]);
  };

  const handleOpenProject = (projectId: string) => {
    setLoadingStates((current) => ({ ...current, [`project-${projectId}`]: true }));
    router.push(`/projects/${projectId}`);
  };

  const handleOpenDraft = (projectId: string) => {
    setLoadingStates((current) => ({ ...current, [`draft-${projectId}`]: true }));
    if (!sessionId) {
      console.error("SessionId not available");
      setLoadingStates((current) => ({ ...current, [`draft-${projectId}`]: false }));
      return;
    }

    const writerUrl = `${process.env.NEXT_PUBLIC_WRITER_APP_URL}/project/${projectId}/draft?sessionId=${sessionId}`;
    window.open(writerUrl, "_blank");
    setLoadingStates((current) => ({ ...current, [`draft-${projectId}`]: false }));
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setNewProject(EMPTY_PROJECT_FORM);
  };

  return (
    <DashboardLayout
      mounted={mounted}
      onSessionCreated={handleSessionCreatedFromSidebar}
      onToggleSidebar={() => setSidebarOpened((opened) => !opened)}
      sidebarOpened={sidebarOpened}
    >
      <div className={styles.content}>
        <DashboardToolbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <ProjectsGrid
          filteredProjects={filteredProjects}
          loading={loading}
          loadingStates={loadingStates}
          onCreateProject={() => setCreateModalOpen(true)}
          onDeleteProject={setDeleteProject}
          onDuplicateProject={handleDuplicateProject}
          onEditProject={setEditingProject}
          onOpenDraft={handleOpenDraft}
          onOpenProject={handleOpenProject}
          searchQuery={searchQuery}
        />
      </div>

      <ProjectModals
        createModalOpen={createModalOpen}
        editingProject={editingProject}
        newProject={newProject}
        onCloseCreateModal={closeCreateModal}
        onCreateProject={handleCreateProject}
        onSaveProject={handleEditProject}
        setEditingProject={setEditingProject}
        setNewProject={setNewProject}
      />

      <NativeDialog
        open={!!deleteProject}
        onClose={() => { if (!deleteLoading) setDeleteProject(null); }}
        labelledBy="delete-project-title"
      >
        <div className={styles.dialogHeader}>
          <div>
            <h2 className={styles.dialogTitle} id="delete-project-title">Konfirmasi Hapus Sesi</h2>
            <p className={styles.muted}>Apakah Anda yakin ingin menghapus sesi berikut?</p>
          </div>
          <button
            aria-label="Tutup dialog"
            className={styles.dialogClose}
            disabled={deleteLoading}
            onClick={() => setDeleteProject(null)}
            type="button"
          >×</button>
        </div>
        {deleteProject && (
          <div className={styles.dialogBody}>
            <div className={styles.deleteProjectPreview}>
              <strong>{deleteProject.title}</strong>
              <span>ID: {deleteProject.id}</span>
            </div>
            <p className={styles.warningText}>Tindakan ini tidak dapat dibatalkan.</p>
            <div className={styles.dialogActions}>
              <button className={styles.quietButton} disabled={deleteLoading} onClick={() => setDeleteProject(null)} type="button">Batal</button>
              <button className={styles.dangerButton} disabled={deleteLoading} onClick={handleDeleteProject} type="button">
                {deleteLoading ? "Menghapus..." : "Ya, Hapus Sesi"}
              </button>
            </div>
          </div>
        )}
      </NativeDialog>

      {notice && (
        <div className={styles.toastRegion}>
          <div className={`${styles.toast} ${notice.isError ? styles.toastError : ""}`} role={notice.isError ? "alert" : "status"} aria-live={notice.isError ? "assertive" : "polite"}>
            <div>
              <strong>{notice.title}</strong>
              <span>{notice.message}</span>
            </div>
            <button aria-label="Tutup notifikasi" className={styles.dialogClose} onClick={() => setNotice(null)} type="button">×</button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
