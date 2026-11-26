"use client";

import { useCallback, useEffect, useState } from "react";
import { Box, Container, Text, useMantineColorScheme, useMantineTheme } from "@mantine/core";
import { IconSquareRoundedX } from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
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
import { ProjectModals, type NewProjectForm } from "./components/ProjectModals";
import { ProjectsGrid } from "./components/ProjectsGrid";

const EMPTY_PROJECT_FORM: NewProjectForm = {
  title: "",
  description: "",
  coverColor: "#4c6ef5",
};

export default function ProjectDashboard() {
  const [projects, setProjects] = useState<BrainstormingProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<BrainstormingProject | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpened, setSidebarOpened] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [newProject, setNewProject] = useState<NewProjectForm>(EMPTY_PROJECT_FORM);

  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const setButtonLoading = (key: string, isLoading: boolean) => {
    setLoadingStates((current) => ({ ...current, [key]: isLoading }));
  };

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
        ).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        }),
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
    setMounted(true);
  }, []);

  useEffect(() => {
    const getSessionId = async () => {
      try {
        const data = await getSessionContext();

        if (data.sessionId) {
          setSessionId(data.sessionId);
        } else {
          setSessionId(null);
        }
      } catch (error) {
        setSessionId(null);
      }
    };

    getSessionId();
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    return () => setLoadingStates({});
  }, []);

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

      setMounted(false);
      setTimeout(() => setMounted(true), 100);
      notifications.show({
        title: "Success",
        message: "Berhasil membuat sesi",
        color: "green",
        position: "top-right",
      });
    } catch (error) {
      console.error("Error", error);
      notifications.show({
        title: "Gagal",
        message: "Gagal membuat sesi",
        color: "red",
        position: "top-right",
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteBrainstormingSession(projectId);
      await fetchProjects();
      notifications.show({
        title: "Success",
        message: "Berhasil hapus sesi",
        color: "green",
        position: "top-right",
      });
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Gagal",
        message: "Gagal hapus sesi",
        color: "red",
        position: "top-right",
      });
    }
  };

  const confirmDeleteProject = (project: BrainstormingProject) => {
    modals.openConfirmModal({
      title: (
        <Text size="lg" fw={600} c="red">
          🗑️ Konfirmasi Hapus sesi
        </Text>
      ),
      children: (
        <Box>
          <Text size="sm" mb="md">Apakah Anda yakin ingin menghapus sesi berikut?</Text>
          <Box
            p="md"
            style={{
              backgroundColor: isDark ? theme.colors.dark[5] : theme.colors.gray[0],
              borderRadius: theme.radius.md,
              border: `1px solid ${isDark ? theme.colors.red[8] : theme.colors.red[2]}`,
            }}
          >
            <Text fw={600} size="sm" mb="xs">{project.title}</Text>
            <Text size="xs" c="dimmed">ID: {project.id}</Text>
          </Box>
          <Text size="sm" c="red" fw={500} mt="md">
            ⚠️ Tindakan ini tidak dapat dibatalkan!
          </Text>
        </Box>
      ),
      labels: { confirm: "Ya, Hapus Sesi", cancel: "Batal" },
      confirmProps: {
        color: "red",
        size: "md",
        leftSection: <IconSquareRoundedX size={16} />,
      },
      cancelProps: { variant: "outline", size: "md" },
      size: "md",
      centered: true,
      onConfirm: () => handleDeleteProject(project.id),
    });
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
      notifications.show({
        title: "Success",
        message: "Berhasil update sesi",
        color: "green",
        position: "top-right",
      });
    } catch (error) {
      console.error("Edit error:", error);
      notifications.show({
        title: "Gagal",
        message: "Gagal update sesi",
        color: "red",
        position: "top-right",
      });
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
    setButtonLoading(`project-${projectId}`, true);
    router.push(`/projects/${projectId}`);
  };

  const handleOpenDraft = (projectId: string) => {
    setButtonLoading(`draft-${projectId}`, true);

    if (!sessionId) {
      console.error("SessionId not available");
      setButtonLoading(`draft-${projectId}`, false);
      return;
    }

    const writerUrl = `${process.env.NEXT_PUBLIC_WRITER_APP_URL}/project/${projectId}/draft?sessionId=${sessionId}`;
    window.open(writerUrl, "_blank");
    setButtonLoading(`draft-${projectId}`, false);
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setNewProject(EMPTY_PROJECT_FORM);
  };

  return (
    <Container size="xl" py="xl" style={{ minHeight: "100vh" }}>
      <DashboardLayout
        sidebarOpened={sidebarOpened}
        onToggleSidebar={() => setSidebarOpened((opened) => !opened)}
        mounted={mounted}
        onSessionCreated={handleSessionCreatedFromSidebar}
      >
        <DashboardToolbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <ProjectsGrid
          loading={loading}
          filteredProjects={filteredProjects}
          searchQuery={searchQuery}
          loadingStates={loadingStates}
          onCreateProject={() => setCreateModalOpen(true)}
          onOpenProject={handleOpenProject}
          onOpenDraft={handleOpenDraft}
          onEditProject={setEditingProject}
          onDuplicateProject={handleDuplicateProject}
          onDeleteProject={confirmDeleteProject}
        />
        <ProjectModals
          createModalOpen={createModalOpen}
          onCloseCreateModal={closeCreateModal}
          newProject={newProject}
          setNewProject={setNewProject}
          onCreateProject={handleCreateProject}
          editingProject={editingProject}
          setEditingProject={setEditingProject}
          onSaveProject={handleEditProject}
        />
      </DashboardLayout>
    </Container>
  );
}
