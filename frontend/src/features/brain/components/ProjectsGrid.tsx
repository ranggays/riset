import { Button, Card, Center, Grid, Group, Skeleton, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconFileText, IconFolder, IconFolderOpen } from "@tabler/icons-react";
import type { BrainstormingProject } from "../types";
import { CreateProjectCard } from "./CreateProjectCard";
import { ProjectCard } from "./ProjectCard";

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
      <Grid>
        {[...Array(6)].map((_, index) => (
          <Grid.Col key={index} span={{ base: 12, sm: 6, lg: 4 }}>
            <Card withBorder h={280}>
              <Stack gap="md">
                <Skeleton height={6} />
                <Skeleton height={20} width="80%" />
                <Skeleton height={40} />
                <Skeleton height={15} width="60%" />
                <Skeleton height={15} width="40%" />
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    );
  }

  return (
    <>
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
          <CreateProjectCard onClick={onCreateProject} />
        </Grid.Col>

        {filteredProjects.map((project) => (
          <Grid.Col key={project.id} span={{ base: 12, sm: 6, lg: 4 }}>
            <Card withBorder h={320} p="md">
              <Stack gap="sm" h="100%">
                <div
                  onClick={() => onOpenProject(project.id)}
                  style={{
                    cursor: "pointer",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                  }}
                >
                  <ProjectCard
                    project={project}
                    isLoading={loadingStates[`project-${project.id}`]}
                    onEdit={onEditProject}
                    onDuplicate={onDuplicateProject}
                    onDelete={onDeleteProject}
                  />
                </div>

                <Group gap="xs" style={{ borderTop: "1px solid #e9ecef", paddingTop: 8 }}>
                  <Button
                    variant="light"
                    size="xs"
                    flex={1}
                    leftSection={<IconFolderOpen size={14} />}
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenProject(project.id);
                    }}
                    loading={loadingStates[`project-${project.id}`]}
                    disabled={
                      loadingStates[`project-${project.id}`] ||
                      loadingStates[`draft-${project.id}`]
                    }
                  >
                    Buka Project
                  </Button>
                  <Button
                    variant="subtle"
                    size="xs"
                    flex={1}
                    leftSection={<IconFileText size={14} />}
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenDraft(project.id);
                    }}
                    loading={loadingStates[`draft-${project.id}`]}
                    disabled={
                      loadingStates[`project-${project.id}`] ||
                      loadingStates[`draft-${project.id}`]
                    }
                  >
                    Draft
                  </Button>
                </Group>
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      {filteredProjects.length === 0 && searchQuery && (
        <Center py="xl">
          <Stack align="center" gap="md">
            <ThemeIcon size={64} variant="light" color="gray" radius="xl">
              <IconFolder size={32} />
            </ThemeIcon>
            <Text size="lg" c="dimmed">Tidak ada proyek yang ditemukan</Text>
            <Text size="sm" c="dimmed">Coba kata kunci lain atau buat proyek baru</Text>
          </Stack>
        </Center>
      )}
    </>
  );
}
