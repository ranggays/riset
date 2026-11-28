"use client";

import { useEffect, useState } from "react";
import type { ExtendedEdge } from "../../types";
import { IconArrowRight, IconNetwork, IconArticle, IconEye } from "@tabler/icons-react";
import styles from "../../Dashboard.module.css";

interface EdgeDetailProps { edge: ExtendedEdge | null; onClose: () => void; onOpenNodeDetail?: (nodeId: string) => void; }
interface PopulatedEdge {
  id: string; label: string | null; relation: string | null;
  from: { id: string; title: string }; to: { id: string; title: string };
}

const names: Record<string, string> = { background: "Latar Belakang", method: "Metodologi", goal: "Tujuan", future: "Arahan Masa Depan", gap: "Kesenjangan" };
const relations: Record<string, string> = { same_background: "background", extended_method: "method", shares_goal: "goal", follows_future_work: "future", addresses_same_gap: "gap" };
const getDisplayRelation = (value?: string | null) => value ? names[relations[value] || value] || value : "-";

export default function EdgeDetail({ edge, onOpenNodeDetail }: EdgeDetailProps) {
  const [edgeNode, setEdgeNode] = useState<PopulatedEdge>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!edge) return;
    if (edge.fromTitle && edge.toTitle) return;
    if (!edge.id) return;
    const controller = new AbortController();
    const url = `/api/edges/${edge.id}`;
    const loadingFrame = window.requestAnimationFrame(() => setLoading(true));
    fetch(url, { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error(`GET ${url} failed: ${response.status} ${response.statusText}`);
      return response.json();
    }).then((data) => setEdgeNode(data)).catch((error) => {
      if (error.name !== "AbortError") console.error("Failed to fetch edge details:", error);
    }).finally(() => setLoading(false));
    return () => { window.cancelAnimationFrame(loadingFrame); controller.abort(); };
  }, [edge]);

  if (!edge) return null;
  const directEdgeNode: PopulatedEdge | undefined = edge.fromTitle && edge.toTitle ? {
    id: edge.id?.toString() ?? "", relation: edge.relation || null,
    from: { id: edge.from?.toString() ?? "", title: edge.fromTitle },
    to: { id: edge.to?.toString() ?? "", title: edge.toTitle }, label: edge.label || "",
  } : undefined;
  const detail = directEdgeNode || edgeNode;
  const endpoint = (title: string, node?: PopulatedEdge["from"]) => <section className={styles.edgeEndpoint}>
    <span className={styles.detailIcon}><IconArticle size={16} /></span><div className={styles.edgeEndpointBody}><h3>{title}</h3>
      {loading ? <span className={styles.skeletonLine} /> : <div className={styles.edgeEndpointTitle}><p>{node?.title || "Artikel tidak ditemukan"}</p>{node?.id && onOpenNodeDetail && <button className={styles.iconButton} onClick={() => onOpenNodeDetail(node.id)} type="button" aria-label="Lihat detail artikel"><IconEye size={17} /></button>}</div>}
    </div>
  </section>;
  return <div className={styles.edgeDetail}>
    <section className={`${styles.detailIntro} ${styles.edgeIntro}`}>
      <span className={styles.detailType}><IconNetwork size={16} /> Jenis hubungan</span>
      <h3 className={styles.edgeRelation}>{getDisplayRelation(edge.relation)}</h3>
      <div className={styles.edgeFlow} aria-label="Arah hubungan antarartikel">
        {endpoint("Dari artikel", detail?.from)}
        <div className={styles.edgeArrow} aria-hidden="true"><IconArrowRight size={19} /></div>
        {endpoint("Ke artikel", detail?.to)}
      </div>
    </section>
    {(edge.label || edge.displayDescription) && <section className={styles.edgeDescription}><h3>Deskripsi hubungan</h3><p>{edge.label || edge.displayDescription}</p></section>}
  </div>;
}
