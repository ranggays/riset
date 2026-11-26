import {
  ActionIcon,
  Badge,
  Box,
  Card,
  Center,
  Group,
  Loader,
  Menu,
  Overlay,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconArticle,
  IconCopy,
  IconDots,
  IconEdit,
  IconMessageCircle,
  IconShare,
  IconTrash,
} from "@tabler/icons-react";
import type { BrainstormingProject } from "../types";

interface ProjectCardProps {
  project: BrainstormingProject;
  isLoading: boolean;
  onEdit: (project: BrainstormingProject) => void;
  onDuplicate: (project: BrainstormingProject) => void;
  onDelete: (project: BrainstormingProject) => void;
}

export function ProjectCard({ project, isLoading, onEdit, onDuplicate, onDelete }: ProjectCardProps) {
  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="lg"
      withBorder
      style={{ cursor: "pointer", transition: "all 0.2s ease", height: "100%" }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-2px)";
        event.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
        event.currentTarget.style.boxShadow = "";
      }}
    >
      {isLoading && (
        <Overlay color="#fff" opacity={0.8} style={{ borderRadius: "var(--mantine-radius-lg)" }}>
          <Center h="100%">
            <Stack align="center" gap="xs">
              <Loader size="md" />
            </Stack>
          </Center>
        </Overlay>
      )}

      <Stack gap="md" h="100%">
        <Box
          style={{
            width: "100%",
            height: 6,
            borderRadius: 4,
            backgroundColor: project.coverColor,
            marginBottom: 4,
            flexShrink: 0,
          }}
        />

        <Group justify="space-between" align="flex-start" mb="xs" style={{ flexShrink: 0 }}>
          <Text size="lg" fw={600} lineClamp={2} style={{ flex: 1, paddingRight: 8 }}>
            {project.title}
          </Text>
          <Menu shadow="lg" width={180} position="bottom-end">
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={(event) => event.stopPropagation()}
                style={{ flexShrink: 0 }}
              >
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconEdit size={14} />}
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit(project);
                }}
              >
                Edit
              </Menu.Item>
              <Menu.Item
                leftSection={<IconCopy size={14} />}
                onClick={(event) => {
                  event.stopPropagation();
                  onDuplicate(project);
                }}
              >
                Duplicate
              </Menu.Item>
              <Menu.Item leftSection={<IconShare size={14} />}>Share</Menu.Item>
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconTrash size={14} />}
                color="red"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(project);
                }}
              >
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        <Box style={{ flex: 1, minHeight: 0 }}>
          {project.description && (
            <Tooltip
              label={project.description}
              multiline
              w={300}
              withArrow
              position="bottom"
              disabled={project.description.length <= 10}
              style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            >
              <Text
                size="sm"
                c="dimmed"
                lineClamp={1}
                style={{
                  cursor: project.description.length > 100 ? "help" : "default",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(event) => {
                  if (project.description!.length > 100) {
                    event.currentTarget.style.color = "var(--mantine-color-blue-6)";
                  }
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.color = "";
                }}
              >
                {project.description.length > 100
                  ? `${project.description.substring(0, 100)}...`
                  : project.description}
              </Text>
            </Tooltip>
          )}
        </Box>

        <Group gap="lg" mb="md" style={{ flexShrink: 0 }}>
          <Group gap="xs">
            <ThemeIcon size="sm" variant="light" color="blue">
              <IconArticle size={12} />
            </ThemeIcon>
            <Text size="sm" c="dimmed">{project.articleCount} artikel</Text>
          </Group>
          <Group gap="xs">
            <ThemeIcon size="sm" variant="light" color="green">
              <IconMessageCircle size={12} />
            </ThemeIcon>
            <Text size="sm" c="dimmed">{project.chatCount} chat</Text>
          </Group>
        </Group>

        <Group justify="space-between" align="center" style={{ flexShrink: 0 }}>
          <Text size="xs" c="dimmed">{project.lastActivity}</Text>
          <Badge variant="light" size="sm">{project.createdAt}</Badge>
        </Group>
      </Stack>
    </Card>
  );
}
