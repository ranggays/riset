import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { BrainstormingProject } from "../types";
import { CoverColorPicker } from "./CoverColorPicker";
import { NativeDialog } from "./NativeDialog";
import styles from "../Dashboards.module.css";

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
  const handleCreateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onCreateProject();
  };

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSaveProject();
  };

  return (
    <>
      <NativeDialog open={createModalOpen} onClose={onCloseCreateModal} labelledBy="create-project-title">
        <div className={styles.dialogHeader}>
          <div>
            <h2 className={styles.dialogTitle} id="create-project-title">Buat Proyek Brainstorming Baru</h2>
            <p className={styles.muted}>Mulai proyek penelitian baru dengan AI assistant.</p>
          </div>
          <button className={styles.dialogClose} onClick={onCloseCreateModal} type="button" aria-label="Tutup dialog">×</button>
        </div>
        <form className={styles.dialogForm} onSubmit={handleCreateSubmit}>
          <label className={styles.formField}>
            <span className={styles.fieldLabel}>Judul Proyek</span>
            <input
              autoFocus
              className={styles.fieldInput}
              onChange={(event) => setNewProject((current) => ({ ...current, title: event.currentTarget.value }))}
              placeholder="Masukkan judul proyek"
              required
              value={newProject.title}
            />
          </label>
          <label className={styles.formField}>
            <span className={styles.fieldLabel}>Deskripsi (Opsional)</span>
            <textarea
              className={styles.fieldTextarea}
              onChange={(event) => setNewProject((current) => ({ ...current, description: event.currentTarget.value }))}
              placeholder="Jelaskan tujuan proyek penelitian Anda"
              value={newProject.description}
            />
          </label>
          <CoverColorPicker
            onChange={(coverColor) => setNewProject((current) => ({ ...current, coverColor }))}
            value={newProject.coverColor}
          />
          <div className={styles.dialogActions}>
            <button className={styles.quietButton} onClick={onCloseCreateModal} type="button">Batal</button>
            <button className={styles.primaryButton} disabled={!newProject.title.trim()} type="submit">Buat Proyek</button>
          </div>
        </form>
      </NativeDialog>

      <NativeDialog
        open={!!editingProject}
        onClose={() => setEditingProject(null)}
        labelledBy="edit-project-title"
      >
        {editingProject && (
          <>
            <div className={styles.dialogHeader}>
              <div>
                <h2 className={styles.dialogTitle} id="edit-project-title">Edit Proyek Brainstorming</h2>
                <p className={styles.muted}>Perbarui judul, deskripsi, atau warna cover.</p>
              </div>
              <button className={styles.dialogClose} onClick={() => setEditingProject(null)} type="button" aria-label="Tutup dialog">×</button>
            </div>
            <form className={styles.dialogForm} onSubmit={handleEditSubmit}>
              <label className={styles.formField}>
                <span className={styles.fieldLabel}>Judul Proyek</span>
                <input
                  autoFocus
                  className={styles.fieldInput}
                  onChange={(event) => setEditingProject({ ...editingProject, title: event.currentTarget.value })}
                  placeholder="Masukkan judul proyek"
                  required
                  value={editingProject.title}
                />
              </label>
              <label className={styles.formField}>
                <span className={styles.fieldLabel}>Deskripsi (Opsional)</span>
                <textarea
                  className={styles.fieldTextarea}
                  onChange={(event) => setEditingProject({ ...editingProject, description: event.currentTarget.value })}
                  placeholder="Jelaskan tujuan proyek penelitian Anda"
                  value={editingProject.description ?? ""}
                />
              </label>
              <CoverColorPicker
                onChange={(coverColor) => setEditingProject({ ...editingProject, coverColor })}
                value={editingProject.coverColor}
              />
              <div className={styles.dialogActions}>
                <button className={styles.quietButton} onClick={() => setEditingProject(null)} type="button">Batal</button>
                <button className={styles.primaryButton} type="submit">Simpan Perubahan</button>
              </div>
            </form>
          </>
        )}
      </NativeDialog>
    </>
  );
}
