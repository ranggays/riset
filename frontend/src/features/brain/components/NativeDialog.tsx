"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import styles from "../Dashboards.module.css";

interface NativeDialogProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  className?: string;
  children: ReactNode;
}

export function NativeDialog({ open, onClose, labelledBy, className, children }: NativeDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className={`${styles.dialog} ${className ?? ""}`.trim()}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      {children}
    </dialog>
  );
}
