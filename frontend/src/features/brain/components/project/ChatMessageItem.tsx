"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { IconUser, IconBrain, IconCopy, IconCheck, IconPaperclip, IconCircleDot, IconHelp } from "@tabler/icons-react";
import React from "react";
import styles from "../../Dashboard.module.css";

type Reference = { url: string; text: string; preview: string; ref_mark: string; type?: string; index?: number };
export type ChatMessage = { sender: "user" | "ai"; text: string; contextNodeIds?: string[]; contextEdgeIds?: string[]; references?: Reference[]; showHelpButton?: boolean };
interface ChatMessageItemProps {
  msg: ChatMessage;
  onTextSelect: (e: React.MouseEvent<HTMLElement>, message: ChatMessage) => void;
  onOpenHelp: () => void; handlerOpenPdf: (url: string) => void;
}

function Citation({ reference, handlerOpenPdf }: { reference: Reference; handlerOpenPdf: (url: string) => void }) {
  const [open, setOpen] = useState(false);
  return <span className={styles.inlineCitation}>
    <button
      aria-expanded={open}
      aria-label={`Citation ${reference.ref_mark}: ${reference.text}`}
      className={styles.citationTrigger}
      onClick={() => setOpen((value) => !value)}
      type="button"
    >{reference.ref_mark}</button>
    {open && <span className={styles.citationPreview}>
      <span>{reference.preview || reference.text}</span>
      <button onClick={() => handlerOpenPdf(reference.url)} type="button"><IconCircleDot size={13} /> Open source</button>
    </span>}
  </span>;
}

function withCitations(text: string, references: Reference[], handlerOpenPdf: (url: string) => void): React.ReactNode[] {
  if (!references.length) return [text];
  const referenceMap = new Map(references.map((reference) => [reference.ref_mark, reference]));
  const parts: React.ReactNode[] = [];
  const pattern = /\[[^\]]+\]/g;
  let lastIndex = 0;
  for (const match of text.matchAll(pattern)) {
    const mark = match[0];
    const index = match.index ?? 0;
    if (index > lastIndex) parts.push(text.slice(lastIndex, index));
    const reference = referenceMap.get(mark);
    parts.push(reference ? <Citation key={`${reference.url}-${index}`} reference={reference} handlerOpenPdf={handlerOpenPdf} /> : mark);
    lastIndex = index + mark.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function renderInlineCitations(value: React.ReactNode, references: Reference[], handlerOpenPdf: (url: string) => void): React.ReactNode {
  if (typeof value === "string") return withCitations(value, references, handlerOpenPdf);
  if (Array.isArray(value)) {
    return value.map((child, index) => <React.Fragment key={index}>{renderInlineCitations(child, references, handlerOpenPdf)}</React.Fragment>);
  }
  if (React.isValidElement<{ children?: React.ReactNode }>(value) && value.props.children !== undefined) {
    return React.cloneElement(value, undefined, renderInlineCitations(value.props.children, references, handlerOpenPdf));
  }
  return value;
}

const ChatMessageItemComponent = ({ msg, onTextSelect, onOpenHelp, handlerOpenPdf }: ChatMessageItemProps) => {
  const [copied, setCopied] = useState(false);
  const copyAnswer = async () => {
    try { await navigator.clipboard.writeText(msg.text); setCopied(true); window.setTimeout(() => setCopied(false), 1600); }
    catch (error) { console.error("Could not copy response", error); }
  };
  const references = [...(msg.references ?? [])].sort((a, b) => (a.index ?? 999) - (b.index ?? 999));
  const uniqueReferences = Array.from(new Map(references.map((reference) => [`${reference.url}-${reference.ref_mark}`, reference])).values());

  return <article className={`${styles.chatMessage} ${msg.sender === "user" ? styles.userMessage : styles.aiMessage}`} onMouseUp={msg.sender === "ai" ? (event) => onTextSelect(event, msg) : undefined}>
    <header className={styles.chatMessageHeader}><span className={`${styles.chatAvatar} ${msg.sender === "user" ? styles.userAvatar : ""}`}>{msg.sender === "user" ? <IconUser size={15} /> : <IconBrain size={15} />}</span><strong>{msg.sender === "user" ? "Anda" : "AI Assistant"}</strong>{msg.sender === "ai" && <button className={styles.copyButton} onClick={() => void copyAnswer()} type="button" aria-label="Salin jawaban">{copied ? <IconCheck size={15} /> : <IconCopy size={15} />}</button>}</header>
    {msg.sender === "user" && !!msg.contextNodeIds?.length && <div className={styles.messageAttachments}><IconPaperclip size={13} /> {msg.contextNodeIds.length} artikel dilampirkan</div>}
    {msg.sender === "user" ? <p className={styles.userMessageText}>{msg.text}</p> : <div className={styles.markdownContent}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
        p: ({ children }) => <p>{msg.references?.length ? renderInlineCitations(children, uniqueReferences, handlerOpenPdf) : children}</p>,
        h1: ({ children }) => <h2>{children}</h2>, h3: ({ children }) => <h3>{children}</h3>,
        code: ({ children, className }) => className ? <pre><code>{children}</code></pre> : <code>{children}</code>,
      }}>{msg.text}</ReactMarkdown>
      {msg.showHelpButton && <button className={styles.helpButton} onClick={onOpenHelp} type="button"><IconHelp size={15} /> Buka panduan penggunaan</button>}
      {uniqueReferences.length > 0 ? (
        <section className={styles.messageReferences}>
          <h4><IconCircleDot size={14} /> Referensi</h4>
          <ol>{uniqueReferences.map((reference) => <li key={reference.url}><span>{reference.ref_mark}</span><button onClick={() => handlerOpenPdf(reference.url)} type="button">{reference.text}</button></li>)}</ol>
        </section>
      ) : null}
    </div>}
  </article>;
};

export default React.memo(ChatMessageItemComponent);
