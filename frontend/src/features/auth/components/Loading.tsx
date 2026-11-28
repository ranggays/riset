import styles from "./AuthForm.module.css";

export default function Loading() {
  return (
    <main className={styles.loadingFallback} role="status" aria-live="polite">
      <span className={styles.loadingSpinner} aria-hidden="true" />
      <span>Memuat...</span>
    </main>
  );
}
