import { Box, Button, ColorPicker, Group, Modal, Stack, Text, Textarea, TextInput } from "@mantine/core";
import type { Dispatch, SetStateAction } from "react";
import type { BrainstormingProject } from "../types";

export interface NewProjectForm {
  title: string;
  description: string;
  coverColor: string;
}

interface ProjectModalsProps {
  createModalOpen: boolean;
  onCloseCreateModal: () => void;
  newProject: NewProjectForm;
  setNewProject: Dispatch<SetStateAction<NewProjectForm>>;
  onCreateProject: () => void;
  editingProject: BrainstormingProject | null;
  setEditingProject: Dispatch<SetStateAction<BrainstormingProject | null>>;
  onSaveProject: () => void;
}

const COLOR_SWATCHES = [
  "#4c6ef5", "#51cf66", "#ff6b6b", "#ffd43b", "#9775fa", "#40c057",
  "#fd7e14", "#15aabf", "#748ffc", "#69db7c", "#ffa8a8", "#ffe066",
];

function ColorField({ color, onChange, showPreview = false, swatchesPerRow }: {
  color: string;
  onChange: (color: string) => void;
  showPreview?: boolean;
  swatchesPerRow?: number;
}) {
  return (
    <Box>
      <Text size="sm" fw={500} mb="xs">Warna Cover</Text>
      <ColorPicker
        value={color}
        onChange={onChange}
        withPicker={false}
        swatches={COLOR_SWATCHES}
        {...(swatchesPerRow ? { swatchesPerRow } : {})}
      />
      {showPreview && (
        <Group mt="xs" gap="xs" align="center">
          <Text size="xs" c="dimmed">Warna terpilih:</Text>
          <Box
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              backgroundColor: color,
              border: "2px solid #e9ecef",
            }}
          />
          <Text size="xs" c="dimmed">{color}</Text>
        </Group>
      )}
    </Box>
  );
}

export function ProjectModals({
  createModalOpen,
  onCloseCreateModal,
  newProject,
  setNewProject,
  onCreateProject,
  editingProject,
  setEditingProject,
  onSaveProject,
}: ProjectModalsProps) {
  return (
    <>
      <Modal
        opened={createModalOpen}
        onClose={onCloseCreateModal}
        title="Buat Proyek Brainstorming Baru"
        size="md"
      >
        <Stack gap="md">
          <TextInput
            label="Judul Proyek"
            placeholder="Masukkan judul proyek"
            value={newProject.title}
            onChange={(event) => setNewProject({ ...newProject, title: event.currentTarget.value })}
            required
          />
          <Textarea
            label="Deskripsi (Opsional)"
            placeholder="Jelaskan tujuan proyek penelitian Anda"
            value={newProject.description}
            onChange={(event) => setNewProject({ ...newProject, description: event.currentTarget.value })}
            minRows={3}
          />
          <ColorField
            color={newProject.coverColor}
            onChange={(coverColor) => setNewProject({ ...newProject, coverColor })}
            showPreview
            swatchesPerRow={6}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={onCloseCreateModal}>Batal</Button>
            <Button onClick={onCreateProject} disabled={!newProject.title.trim()}>
              Buat Proyek
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={!!editingProject}
        onClose={() => setEditingProject(null)}
        title="Edit Proyek Brainstorming"
        size="md"
      >
        {editingProject && (
          <Stack gap="md">
            <TextInput
              label="Judul Proyek"
              placeholder="Masukkan judul proyek"
              value={editingProject.title}
              onChange={(event) =>
                setEditingProject({ ...editingProject, title: event.currentTarget.value })
              }
              required
            />
            <Textarea
              label="Deskripsi (Opsional)"
              placeholder="Jelaskan tujuan proyek penelitian Anda"
              value={editingProject.description}
              onChange={(event) =>
                setEditingProject({ ...editingProject, description: event.currentTarget.value })
              }
              minRows={3}
            />
            <ColorField
              color={editingProject.coverColor}
              onChange={(coverColor) => setEditingProject({ ...editingProject, coverColor })}
              showPreview
            />
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={() => setEditingProject(null)}>
                Batal
              </Button>
              <Button onClick={onSaveProject}>Simpan Perubahan</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}
