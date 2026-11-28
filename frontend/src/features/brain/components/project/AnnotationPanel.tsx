"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { IconBookmark, IconNotes, IconQuote, IconNotebook, IconDots, IconEye, IconExternalLink, IconTrash } from "@tabler/icons-react";
import { notifyDashboard } from "../DashboardFeedback";
import { NativeDialog } from "../NativeDialog";
import WebViewer from "./WebViewer";
import styles from "../../Dashboard.module.css";

interface Annotation {
  id: string; articleId: string; page: number; highlightedText: string; comment: string; semanticTag?: string; createdAt: string;
  article: { id: string; title: string; filePath: string };
}

export default function AnnotationPanel({ sessionId, session }: { sessionId?: string; session?: Record<string, unknown> | null }) {
  const params = useParams<{ id?: string | string[] }>();
  const paramId = params?.id;
  const effectiveSessionId = sessionId || (Array.isArray(paramId) ? paramId[0] : paramId);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState<string | null>(null);
  const [pdfOpened, setPdfOpened] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Annotation | null>(null);

  const fetchAnnotations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/annotation?sessionId=${effectiveSessionId}`);
      if (response.ok) setAnnotations(await response.json());
    } catch (error) { console.error("Error fetching annotations:", error); notifyDashboard("Gagal memuat anotasi", "Coba muat ulang panel anotasi.", true); }
    finally { setLoading(false); }
  }, [effectiveSessionId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchAnnotations(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchAnnotations]);

  const handleDeleteAnnotation = async () => {
    if (!pendingDelete) return;
    const { id } = pendingDelete;
    setDeletingId(id);
    try {
      const response = await fetch(`/api/annotation/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" } });
      if (!response.ok) throw new Error("Gagal menghapus anotasi");
      notifyDashboard("Berhasil", "Anotasi berhasil dihapus.");
      setPendingDelete(null);
      await fetchAnnotations();
    } catch (error) { console.error("Delete error:", error); notifyDashboard("Gagal", "Gagal menghapus anotasi.", true); }
    finally { setDeletingId(null); }
  };

  const openPdf = (url?: string) => { if (!url) return; setSelectedPDF(url); setPdfOpened(true); };
  const closePdf = () => { setPdfOpened(false); setSelectedPDF(null); };

  return <section className={styles.annotationPanel} aria-labelledby="annotations-title">
    <header className={styles.annotationHeader}><span className={styles.iconTile}><IconBookmark size={18} /></span><div><h2 id="annotations-title">Catatan</h2><p>{annotations.length} anotasi tersimpan</p></div></header>
    <div className={styles.annotationList} aria-busy={loading}>
      {loading && <div className={styles.annotationLoading} role="status"><span className={styles.spinner} />Memuat anotasi…</div>}
      {!loading && annotations.length === 0 && <div className={styles.annotationEmpty}><span className={styles.iconTile}><IconNotes size={24} /></span><h3>Belum ada catatan</h3><p>Sorot bagian penting pada artikel untuk menyimpan kutipan dan catatan di sini.</p></div>}
      {!loading && annotations.map((annotation) => {
        const expanded = expandedCard === annotation.id;
        return <article className={styles.noteCard} key={annotation.id}>
          <div className={styles.noteCardMenu}>
            <details><summary aria-label="Tindakan anotasi"><IconDots size={17} /></summary><div className={styles.noteMenuItems}>
              <button type="button" onClick={() => openPdf(annotation.article?.filePath)}><IconEye size={15} /> Buka artikel</button>
              <button type="button" onClick={() => setExpandedCard(expanded ? null : annotation.id)}><IconExternalLink size={15} /> {expanded ? "Tutup detail" : "Lihat detail"}</button>
              <button className={styles.dangerText} type="button" onClick={() => setPendingDelete(annotation)}><IconTrash size={15} /> Hapus anotasi</button>
            </div></details>
          </div>
          <div className={styles.noteBlock}><span className={styles.noteLabel}><IconQuote size={13} /> Kutipan</span><p className={`${styles.noteText} ${expanded ? styles.noteExpanded : ""}`}>{annotation.highlightedText}</p></div>
          {annotation.comment && <div className={styles.noteBlock}><span className={styles.noteLabel}><IconNotebook size={13} /> Catatan</span><p className={`${styles.noteText} ${expanded ? styles.noteExpanded : ""}`}>{annotation.comment}</p></div>}
          <footer className={styles.noteFooter}><span title={annotation.article?.title}>{annotation.article?.title}</span><span>Hal. {annotation.page}</span><span>{new Date(annotation.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>{annotation.semanticTag && <span className={styles.contextBadge}>{annotation.semanticTag}</span>}</footer>
          {expanded && <div className={styles.noteExpandedDetails}><strong>{annotation.article?.title}</strong><span>Dibuat {new Date(annotation.createdAt).toLocaleString("id-ID")}</span><div><button className={styles.secondaryButton} onClick={() => openPdf(annotation.article?.filePath)} type="button"><IconEye size={14} /> Buka artikel</button><button className={styles.dangerButton} onClick={() => setPendingDelete(annotation)} disabled={deletingId === annotation.id} type="button"><IconTrash size={14} /> Hapus</button></div></div>}
        </article>;
      })}
    </div>

    <NativeDialog open={!!pendingDelete} onClose={() => setPendingDelete(null)} labelledBy="delete-annotation-title" className={styles.annotationDialog}>
      <header className={styles.dialogHeader}><div><p className={styles.eyebrow}>KONFIRMASI</p><h2 className={styles.dialogTitle} id="delete-annotation-title">Hapus anotasi?</h2></div><button className={styles.dialogClose} onClick={() => setPendingDelete(null)} type="button" aria-label="Tutup dialog">×</button></header>
      <p className={styles.deletePrompt}>Anotasi ini akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.</p>
      <footer className={styles.dialogActions}><button className={styles.quietButton} onClick={() => setPendingDelete(null)} type="button">Batal</button><button className={styles.dangerButton} onClick={() => void handleDeleteAnnotation()} disabled={!!deletingId} type="button">{deletingId ? "Menghapus…" : "Hapus anotasi"}</button></footer>
    </NativeDialog>
    <NativeDialog open={pdfOpened} onClose={closePdf} labelledBy="annotation-pdf-title" className={styles.pdfDialog}>
      <header className={styles.dialogHeader}><h2 className={styles.dialogTitle} id="annotation-pdf-title">Lihat artikel</h2><button className={styles.dialogClose} onClick={closePdf} type="button" aria-label="Tutup PDF">×</button></header>
      {selectedPDF && <div className={styles.pdfViewer}><WebViewer fileUrl={selectedPDF} session={session} /></div>}
    </NativeDialog>
  </section>;
}
