"use client";

import { useCallback, useState } from "react";
import type { ExtendedNode } from "../../types";
import { IconArticle, IconTarget, IconMath, IconHistory, IconArrowForward, IconFileAlert, IconExternalLink } from "@tabler/icons-react";
import WebViewer from "./WebViewer";
import { NativeDialog } from "../NativeDialog";
import styles from "../../Dashboard.module.css";

interface NodeDetailProps {
  node: ExtendedNode | null;
  onClose: () => void;
  trackPdfView?: (pdfName: string, action: "open" | "close") => void;
  trackModalInteraction?: (modalType: string, action: "open" | "close") => void;
  session?: Record<string, unknown> | null;
  projectId?: string;
}

const details = [
  { key: "att_goal", title: "Tujuan", icon: IconTarget },
  { key: "att_method", title: "Metodologi", icon: IconMath },
  { key: "att_background", title: "Latar belakang", icon: IconHistory },
  { key: "att_future", title: "Penelitian lanjut", icon: IconArrowForward },
  { key: "att_gaps", title: "Kesenjangan", icon: IconFileAlert },
] as const;

export default function NodeDetail({ node, trackPdfView, session }: NodeDetailProps) {
  const [opened, setOpened] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState<string | null>(null);
  const handlePdfOpen = useCallback((pdfUrl: string, pdfName?: string) => {
    const fileName = pdfName || pdfUrl.split("/").pop() || "unknown.pdf";
    setSelectedPDF(pdfUrl);
    setOpened(true);
    trackPdfView?.(fileName, "open");
  }, [trackPdfView]);
  const handlePdfClose = useCallback(() => {
    if (selectedPDF) trackPdfView?.(selectedPDF.split("/").pop() || "unknown.pdf", "close");
    setOpened(false);
    setSelectedPDF(null);
  }, [selectedPDF, trackPdfView]);

  if (!node) return null;
  return <div className={styles.nodeDetail}>
    <section className={`${styles.detailIntro} ${styles.nodeIntro}`}>
      <span className={styles.detailType}><IconArticle size={16} /> Artikel penelitian</span>
      <h3>{node.title || node.label}</h3>
      <p className={styles.detailSummary}>Tujuan, metodologi, dan konteks penelitian.</p>
    </section>
    <div className={styles.nodeAttributes} aria-label="Informasi penelitian">{details.map(({ key, title, icon: Icon }) => <section className={styles.nodeAttribute} key={key}>
      <span className={styles.detailIcon}><Icon size={17} /></span><div className={styles.nodeAttributeBody}><h4>{title}</h4><p>{node[key] || "Belum ada informasi."}</p></div>
    </section>)}</div>
    {node.att_url && <section className={styles.pdfLink}><div><IconArticle size={17} /><strong>Dokumen PDF</strong></div><button className={styles.secondaryButton} onClick={() => handlePdfOpen(node.att_url!, node.title || node.label)} type="button"><IconExternalLink size={15} /> Buka PDF</button></section>}
    <NativeDialog open={opened} onClose={handlePdfClose} labelledBy="node-pdf-title" className={styles.pdfDialog}>
      <header className={styles.dialogHeader}><h2 className={styles.dialogTitle} id="node-pdf-title">Lihat artikel</h2><button className={styles.dialogClose} onClick={handlePdfClose} type="button" aria-label="Tutup PDF">×</button></header>
      <div className={styles.pdfViewer}>{selectedPDF && (session ? <WebViewer fileUrl={selectedPDF} session={session} /> : <p className={styles.sessionLoading} role="status">Memuat sesi…</p>)}</div>
    </NativeDialog>
  </div>;
}
