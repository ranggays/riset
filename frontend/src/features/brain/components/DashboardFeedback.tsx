"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import styles from "../Dashboards.module.css";

interface DashboardNotice {
  id: number;
  title: string;
  message: string;
  isError: boolean;
}

interface DashboardFeedbackValue {
  notify: (title: string, message: string, isError?: boolean) => void;
}

const DashboardFeedbackContext = createContext<DashboardFeedbackValue | null>(null);

export function notifyDashboard(title: string, message: string, isError = false) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("dashboard:notice", { detail: { title, message, isError } }));
  }
}

export function useDashboardFeedback() {
  const context = useContext(DashboardFeedbackContext);
  if (!context) throw new Error("useDashboardFeedback must be used inside DashboardFeedbackProvider");
  return context;
}

export function DashboardFeedbackProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<DashboardNotice[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setNotices((current) => current.filter((notice) => notice.id !== id));
  }, []);

  const notify = useCallback((title: string, message: string, isError = false) => {
    const id = Date.now() + Math.random();
    setNotices((current) => [...current.slice(-2), { id, title, message, isError }]);
    timers.current.set(id, setTimeout(() => dismiss(id), 4500));
  }, [dismiss]);

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
  }, []);

  useEffect(() => {
    const handleNotice = (event: Event) => {
      const detail = (event as CustomEvent<{ title: string; message: string; isError?: boolean }>).detail;
      if (detail) notify(detail.title, detail.message, detail.isError);
    };
    window.addEventListener("dashboard:notice", handleNotice);
    return () => window.removeEventListener("dashboard:notice", handleNotice);
  }, [notify]);

  return (
    <DashboardFeedbackContext.Provider value={{ notify }}>
      {children}
      <div className={styles.toastRegion} aria-label="Notifikasi" aria-live="polite">
        {notices.map((notice) => (
          <div
            className={`${styles.toast} ${notice.isError ? styles.toastError : ""}`}
            key={notice.id}
            role={notice.isError ? "alert" : "status"}
          >
            <div>
              <strong>{notice.title}</strong>
              <span>{notice.message}</span>
            </div>
            <button
              aria-label="Tutup notifikasi"
              className={styles.dialogClose}
              onClick={() => dismiss(notice.id)}
              type="button"
            >×</button>
          </div>
        ))}
      </div>
    </DashboardFeedbackContext.Provider>
  );
}
