"use client";

import { useState, useEffect } from "react";
import type { FC } from "react";
import { IconUpload, IconFileText, IconNetwork, IconDatabase, IconBolt, IconCheck } from "@tabler/icons-react";
import styles from "../../Dashboard.module.css";

interface RealUploadProgressProps { uploadId: string | null; uploading: boolean; onComplete?: () => void; hasSessionId?: boolean; }
const UPLOAD_STAGES = [
  { key: "uploading_file", title: "Upload file", description: "Mengirim file ke cloud storage…", icon: IconUpload },
  { key: "saving_database", title: "Simpan ke database", description: "Membuat catatan artikel baru…", icon: IconDatabase },
  { key: "ai_processing", title: "Analisis AI", description: "AI sedang membaca dan menganalisis dokumen…", icon: IconFileText },
  { key: "generating_nodes", title: "Membuat node", description: "Menghasilkan representasi dokumen…", icon: IconBolt },
  { key: "generating_edges", title: "Mencari koneksi", description: "Menganalisis hubungan dengan dokumen lain…", icon: IconNetwork },
  { key: "completed", title: "Selesai", description: "Proses upload berhasil.", icon: IconCheck },
];

export const RealUploadProgress: FC<RealUploadProgressProps> = ({ uploadId, uploading, onComplete, hasSessionId = true }) => {
  const [currentStage, setCurrentStage] = useState("");
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const activeStages = hasSessionId ? UPLOAD_STAGES : UPLOAD_STAGES.filter((stage) => stage.key !== "generating_edges");
  const currentStageInfo = activeStages.find((stage) => stage.key === currentStage) || activeStages[0];
  const currentStageIndex = activeStages.findIndex((stage) => stage.key === (isComplete || progress === 100 ? "completed" : currentStageInfo.key));

  useEffect(() => {
    if (!uploading || !uploadId) return;
    const eventSource = new EventSource(`/api/upload-progress?uploadId=${uploadId}`);
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "progress") { setCurrentStage(data.stage || data.message || ""); setProgress(data.progress || data.percentage || 0); }
        if (data.type === "complete") {
          setIsComplete(true); setProgress(100); setCurrentStage("completed");
          window.setTimeout(() => onComplete?.(), 1000);
        }
        if (data.type === "error") console.error("Upload error:", data.message);
      } catch (error) { console.error("Error parsing progress data:", error); }
    };
    eventSource.onerror = (error) => console.error("EventSource error:", error);
    return () => eventSource.close();
  }, [uploadId, uploading, onComplete]);

  if (!uploading) return null;
  const Icon = isComplete ? IconCheck : currentStageInfo.icon;
  return <div className={styles.uploadProgressOverlay} role="dialog" aria-modal="true" aria-labelledby="upload-progress-title">
    <section className={styles.uploadProgressCard}>
      <span className={`${styles.uploadProgressIcon} ${isComplete ? styles.uploadComplete : ""}`}><Icon size={25} /></span>
      <div className={styles.uploadProgressHeading}><h2 id="upload-progress-title">{isComplete ? "Upload berhasil" : currentStageInfo.title}</h2><p>{isComplete ? "Artikel telah ditambahkan ke ruang kerja." : currentStageInfo.description}</p></div>
      <div className={styles.progressSummary}><div><span>Progress keseluruhan</span><strong>{Math.round(progress)}%</strong></div><progress max="100" value={progress}>{progress}%</progress></div>
      {!isComplete && <div className={styles.stageProgress} aria-label="Tahap sedang berlangsung"><span /></div>}
      <ol className={styles.uploadStageList} aria-label="Tahapan proses">
        {activeStages.slice(0, -1).map((stage, index) => {
          const StageIcon = stage.icon;
          const done = index < currentStageIndex || (isComplete && index <= currentStageIndex);
          const active = index === currentStageIndex && !isComplete;
          return <li className={`${styles.uploadStage} ${done ? styles.stageDone : ""} ${active ? styles.stageActive : ""}`} key={stage.key}><span>{done ? <IconCheck size={14} /> : <StageIcon size={14} />}</span><span>{stage.title}</span></li>;
        })}
      </ol>
    </section>
  </div>;
};
