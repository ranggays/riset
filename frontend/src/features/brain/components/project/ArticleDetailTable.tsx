"use client";

import { useState } from "react";
import type { ExtendedNode } from "../../types";
import { IconArticle, IconTarget, IconMath, IconHistory, IconArrowForward, IconFileAlert, IconEye, IconExternalLink } from "@tabler/icons-react";
import WebViewer from "./WebViewer";
import { NativeDialog } from "../NativeDialog";
import styles from "../../Dashboard.module.css";

interface ArticleDetailTableProps { nodes: ExtendedNode[]; activeArticles: string[]; }

const attributes = [
  { key: "att_goal", title: "Tujuan", icon: IconTarget },
  { key: "att_method", title: "Metodologi", icon: IconMath },
  { key: "att_background", title: "Latar belakang", icon: IconHistory },
  { key: "att_future", title: "Penelitian lanjut", icon: IconArrowForward },
  { key: "att_gaps", title: "Kesenjangan", icon: IconFileAlert },
] as const;

const handleAnalytics = async (analyticsData: Record<string, unknown>) => {
  try {
    await fetch("/api/annotation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...analyticsData, userId: "current_user_id", sessionId: "uniqueSessionId" }) });
  } catch (error) { console.error(error); }
};

export default function ArticleDetailTable({ nodes, activeArticles }: ArticleDetailTableProps) {
  const [opened, setOpened] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState<string | null>(null);
  const filteredNodes = activeArticles.length === 0 ? nodes : nodes.filter((node) => activeArticles.includes(String(node.id)));
  const closePdf = () => { setOpened(false); setSelectedPDF(null); };

  if (filteredNodes.length === 0) return <div className={styles.tableEmpty}><IconArticle size={28} /><strong>Tidak ada artikel yang dipilih</strong><span>Pilih artikel dari filter di atas untuk melihat detail.</span></div>;

  return <div className={styles.tableViewport}>
    <table className={styles.articleTable}>
      <thead><tr><th><IconArticle size={15} /> Artikel</th>{attributes.map(({ key, title, icon: Icon }) => <th key={key}><Icon size={15} /> {title}</th>)}<th><IconEye size={15} /> Dokumen</th></tr></thead>
      <tbody>{filteredNodes.map((node) => <tr key={node.id}>
        <th scope="row"><span className={styles.articleId}>ID {node.id}</span><strong>{node.title || node.label || `Artikel ${node.id}`}</strong></th>
        {attributes.map(({ key, title }) => <td key={key}><span className={styles.tableMobileLabel}>{title}</span><p title={node[key] || "-"}>{node[key] || "-"}</p></td>)}
        <td><span className={styles.tableMobileLabel}>Dokumen</span>{node.att_url ? <button className={styles.pdfButton} type="button" onClick={() => { setSelectedPDF(node.att_url ?? null); setOpened(true); }}><IconExternalLink size={15} /> Buka PDF</button> : <span className={styles.muted}>Tidak ada PDF</span>}</td>
      </tr>)}</tbody>
    </table>
    <NativeDialog open={opened} onClose={closePdf} labelledBy="article-pdf-title" className={styles.pdfDialog}>
      <header className={styles.dialogHeader}><h2 className={styles.dialogTitle} id="article-pdf-title">Lihat artikel</h2><button className={styles.dialogClose} onClick={closePdf} type="button" aria-label="Tutup PDF">×</button></header>
      {selectedPDF ? (
        <div className={styles.pdfViewer}>
          <WebViewer fileUrl={selectedPDF} onAnalytics={handleAnalytics} />
        </div>
      ) : null}
    </NativeDialog>
  </div>;
}
