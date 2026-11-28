"use client";

import { useState, useRef } from "react";
import { IconSend, IconPaperclip, IconX, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import type { ExtendedNode } from "../../types";
import styles from "../../Dashboard.module.css";

interface ChatInputAreaProps {
  isLoading: boolean; contextNodes: ExtendedNode[]; suggestions: string[];
  showLeftScroll: boolean; showRightScroll: boolean; suggestionContainerRef: React.RefObject<HTMLDivElement | null>;
  onSendMessage: (message: string) => void; onRemoveContextNode: (node: ExtendedNode) => void;
  onScrollSuggestions: (direction: "left" | "right") => void;
}

const ChatInputArea = ({ isLoading, contextNodes, suggestions, showLeftScroll, showRightScroll, suggestionContainerRef, onSendMessage, onRemoveContextNode, onScrollSuggestions }: ChatInputAreaProps) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input); setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); handleSend(); }
  };
  const handleTextAreaInput = (event: React.FormEvent<HTMLTextAreaElement>) => {
    const target = event.target as HTMLTextAreaElement; target.style.height = "auto"; target.style.height = `${target.scrollHeight}px`;
  };

  return <div className={styles.chatComposer}>
    {contextNodes.length > 0 && <div className={styles.chatContextList} aria-label="Konteks artikel">{contextNodes.map((node) => { const label = node.title || node.label || "Artikel"; return <span className={styles.chatContextChip} key={`context-node-${node.id}`}><IconPaperclip size={12} /><span>{label.length > 34 ? `${label.substring(0, 34)}…` : label}</span><button onClick={() => onRemoveContextNode(node)} type="button" aria-label={`Hapus ${label} dari konteks`}><IconX size={12} /></button></span>; })}</div>}
    <div className={styles.chatInputBox}>
      <textarea ref={textareaRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={handleKeyDown} onInput={handleTextAreaInput} placeholder={isLoading ? "Menunggu respons AI…" : "Tulis pesan…"} rows={1} aria-label="Pesan untuk AI" />
      <button className={styles.chatSendButton} onClick={handleSend} disabled={!input.trim() || isLoading} type="button" aria-label="Kirim pesan"><IconSend size={18} /></button>
    </div>
    {suggestions.length > 0 && <div className={styles.suggestionRow}>
      {showLeftScroll && <button className={styles.suggestionScroll} onClick={() => onScrollSuggestions("left")} type="button" aria-label="Saran sebelumnya"><IconChevronLeft size={15} /></button>}
      <div className={styles.suggestionViewport} ref={suggestionContainerRef}>{suggestions.map((suggestion, index) => <button className={styles.suggestion} key={`${index}-${suggestion}`} onClick={() => { setInput(suggestion); textareaRef.current?.focus(); }} type="button">{suggestion.length > 48 ? `${suggestion.substring(0, 48)}…` : suggestion}</button>)}</div>
      {showRightScroll && <button className={styles.suggestionScroll} onClick={() => onScrollSuggestions("right")} type="button" aria-label="Saran berikutnya"><IconChevronRight size={15} /></button>}
      <span className={styles.suggestionCount}>{suggestions.length}</span>
    </div>}
  </div>;
};

export default ChatInputArea;
