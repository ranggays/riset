"use client";

import { useState, useEffect } from "react";
import { IconNote, IconCheck } from "@tabler/icons-react";
import { notifyDashboard } from "../DashboardFeedback";
import { NativeDialog } from "../NativeDialog";
import styles from "../../Dashboard.module.css";

interface AnnotationModalProps { opened: boolean; onClose: () => void; highlightedText: string; targetUrl: string | null; isDark: boolean; }

const AnnotationModal = ({ opened, onClose, highlightedText, targetUrl }: AnnotationModalProps) => {
  const [comment, setComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    if (!opened) return;
    const timer = window.setTimeout(() => setComment(""), 0);
    return () => window.clearTimeout(timer);
  }, [opened, highlightedText]);

  const handleSave = async () => {
    if (!comment.trim() || !targetUrl) { notifyDashboard("Tidak dapat menyimpan", "Komentar tidak boleh kosong.", true); return; }
    setIsSaving(true);
    try {
      const response = await fetch("/api/annotation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ document: targetUrl, metadata: { pageNumber: 1, highlightedText, contents: comment } }) });
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || "Gagal menyimpan anotasi."); }
      notifyDashboard("Berhasil", "Anotasi berhasil disimpan.");
      onClose();
    } catch (error: unknown) { notifyDashboard("Gagal", error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan.", true); }
    finally { setIsSaving(false); }
  };

  return <NativeDialog open={opened} onClose={onClose} labelledBy="annotation-dialog-title" className={styles.annotationDialog}>
    <header className={styles.dialogHeader}><div><span className={styles.detailType}><IconNote size={15} /> Anotasi dokumen</span><h2 className={styles.dialogTitle} id="annotation-dialog-title">Buat anotasi</h2></div><button className={styles.dialogClose} onClick={onClose} type="button" aria-label="Tutup dialog">×</button></header>
    <div className={styles.annotationForm}>
      <section className={styles.selectedQuote}><h3>Teks yang dipilih</h3><blockquote>{highlightedText.length > 150 ? `${highlightedText.substring(0, 150)}…` : highlightedText}</blockquote></section>
      <label className={styles.formField}><span className={styles.fieldLabel}>Komentar Anda</span><textarea autoFocus className={styles.fieldTextarea} placeholder="Tambahkan catatan untuk kutipan ini…" value={comment} onChange={(event) => setComment(event.currentTarget.value)} /></label>
      <footer className={styles.dialogActions}><button className={styles.quietButton} onClick={onClose} type="button">Batal</button><button className={styles.primaryButton} onClick={() => void handleSave()} disabled={!comment.trim() || isSaving} type="button"><IconCheck size={16} /> {isSaving ? "Menyimpan…" : "Simpan anotasi"}</button></footer>
    </div>
  </NativeDialog>;
};

export default AnnotationModal;
