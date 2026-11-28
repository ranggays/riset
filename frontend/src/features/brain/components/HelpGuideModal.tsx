"use client";

import { useState } from "react";
import { IconArrowLeft, IconArrowRight, IconCheck, IconInfoCircle } from "@tabler/icons-react";
import { NativeDialog } from "./NativeDialog";
import styles from "../Dashboards.module.css";

interface HelpGuideModalProps {
  opened: boolean;
  onClose: () => void;
}

const steps = [
  {
    label: "Upload Artikel",
    title: "Langkah 1: Upload Dokumen PDF",
    description: "Mulai dengan mengupload artikel penelitian dalam format PDF.",
    points: [
      "Pilih file PDF artikel penelitian.",
      "Sistem akan menganalisis dan membuat visualisasi.",
      "Nodes akan muncul di peta konsep.",
    ],
    tip: "Pastikan PDF dapat dibaca dan berisi teks, bukan hasil scan gambar.",
  },
  {
    label: "Pilih Node",
    title: "Langkah 2: Klik Node untuk Konteks",
    description: "Pilih node di visualisasi untuk memberikan konteks pada AI Assistant.",
    points: [
      "Pilihan node memberi konteks pada AI Assistant.",
      "Node terpilih akan muncul di chat input.",
      "AI dapat memberikan jawaban yang lebih relevan.",
    ],
    tip: "Tanpa memilih node, AI Assistant tidak memiliki konteks spesifik untuk menjawab pertanyaan Anda.",
  },
  {
    label: "Chat & Analisis",
    title: "Langkah 3: Mulai Bertanya",
    description: "Setelah node terpilih, Anda dapat mulai berdiskusi dengan AI Assistant.",
    points: [
      "Jelaskan konsep ini lebih detail",
      "Bagaimana hubungannya dengan konsep lain?",
      "Berikan contoh penerapan praktis",
    ],
    tip: "Semakin spesifik pertanyaan Anda, semakin detail dan relevan jawaban AI Assistant.",
  },
];

export function HelpGuideModal({ opened, onClose }: HelpGuideModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const step = steps[activeStep];

  return (
    <NativeDialog open={opened} onClose={onClose} labelledBy="help-guide-title" className={styles.helpDialog}>
      <div className={styles.dialogHeader}>
        <div>
          <h2 className={styles.dialogTitle} id="help-guide-title">Panduan Penggunaan mySRE</h2>
          <p className={styles.muted}>Pelajari cara menggunakan platform dengan efektif.</p>
        </div>
        <button className={styles.dialogClose} onClick={onClose} type="button" aria-label="Tutup panduan">×</button>
      </div>

      <nav className={styles.helpProgress} aria-label="Langkah panduan">
        {steps.map((item, index) => (
          <button
            aria-current={activeStep === index ? "step" : undefined}
            className={`${styles.helpStepButton} ${activeStep === index ? styles.helpStepActive : ""}`}
            key={item.label}
            onClick={() => setActiveStep(index)}
            type="button"
          >
            <span className={styles.helpStepNumber} aria-hidden="true">{index < activeStep ? <IconCheck size={14} /> : index + 1}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <section
        className={styles.dialogBody}
        id="help-step-content"
      >
        <div className={styles.helpStepHeader}>
          <span className={styles.metricIcon} aria-hidden="true"><IconInfoCircle size={20} /></span>
          <div>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </div>
        </div>
        {activeStep === 2 ? (
          <>
            <p className={styles.muted}>Contoh pertanyaan yang bisa Anda ajukan:</p>
            <ul className={styles.helpExamples}>
              {step.points.map((point) => <li key={point}>“{point}”</li>)}
            </ul>
          </>
        ) : (
          <ul className={styles.helpContent}>
            {step.points.map((point) => <li key={point}>{point}</li>)}
          </ul>
        )}
        <p className={styles.helpTip}><strong>Tips:</strong> {step.tip}</p>
      </section>

      <div className={styles.helpNavigation}>
        <button
          className={styles.quietButton}
          disabled={activeStep === 0}
          onClick={() => setActiveStep((current) => Math.max(0, current - 1))}
          type="button"
        >
          <IconArrowLeft size={16} aria-hidden="true" /> Sebelumnya
        </button>
        {activeStep < steps.length - 1 ? (
          <button
            className={styles.primaryButton}
            onClick={() => setActiveStep((current) => Math.min(steps.length - 1, current + 1))}
            type="button"
          >
            Selanjutnya <IconArrowRight size={16} aria-hidden="true" />
          </button>
        ) : (
          <button className={styles.primaryButton} onClick={onClose} type="button">
            <IconCheck size={16} aria-hidden="true" /> Mulai Menggunakan
          </button>
        )}
      </div>
    </NativeDialog>
  );
}
