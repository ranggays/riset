"use client"

import { IconSparkles, IconBrain, IconMessageCircle } from "@tabler/icons-react";
import { useEffect, useState, useRef, useCallback } from "react";
import type { ExtendedNode, ExtendedEdge } from "../../types";
import { notifyDashboard } from "../DashboardFeedback";
import { NativeDialog } from "../NativeDialog";
import styles from "../../Dashboard.module.css";
import WebViewer from "./WebViewer";
import NodeDetail from "./NodeDetail";
import { HelpGuideModal } from "../HelpGuideModal";
import ChatMessageItem from "./ChatMessageItem";
import ChatInputArea from "./ChatInputArea";
import AnnotationModal from "./AnnotationModal";

interface ChatPanelProps {
  sessionId?: string
  selectedNode: ExtendedNode | null
  selectedEdge: ExtendedEdge | null
  resetContext?: boolean
  onContextReset?: () => void
}

type Reference = {
  url: string
  text: string
  preview: string
  ref_mark: string
  type?: string
  index?: number
}

type ChatMessage = {
  sender: "user" | "ai"
  text: string
  contextNodeIds?: string[]
  contextEdgeIds?: string[]
  references?: Reference[]
}

export default function ChatPanel({
  selectedNode,
  selectedEdge,
  sessionId,
  resetContext,
  onContextReset,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [debouncedInput, setDebouncedInput] = useState("")
  const [contextNodes, setContextNodes] = useState<ExtendedNode[]>([])
  const [contextEdges, setContextEdges] = useState<ExtendedEdge[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messageEndRef = useRef<HTMLDivElement>(null)

  // State for suggestion
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionContext, setSuggestionContext] = useState<"input" | "response" | null>(null)
  const [selectedPDF, setSelectedPDF] = useState<string | null>(null)
  const [modalOpened, setModalOpened] = useState(false)
  const [detailModalNode, setDetailModalNode] = useState<ExtendedNode | null>(null)

  // For forceWeb
  const [forceWeb, setForceWeb] = useState(false)

  // For suggest
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0)
  const [suggestionScrollPosition, setSuggestionScrollPosition] = useState(0)
  const suggestionContainerRef = useRef<HTMLDivElement>(null)

  // For fetch chat - FIXED STATES
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalMessages, setTotalMessages] = useState(0)
  const MESSAGES_PER_PAGE = 3
  const isFetchingHistory = useRef(false)
  const isInitialLoad = useRef(true)

  // NEW: For scroll position tracking
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 })
  const lastScrollHeight = useRef(0)

  // Add after other state declarations
  const lastFetchTime = useRef(0)
  const FETCH_COOLDOWN = 2000 // 2 seconds cooldown
  const [isScrolling, setIsScrolling] = useState(false)
  // const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Add after other state declarations
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true)
  const [isInitialMount, setIsInitialMount] = useState(true)

  // NEW: States for Annotation feature
  const [showAnnotationModal, setShowAnnotationModal] = useState(false)
  const [highlightedText, setHighlightedText] = useState<string>("")
  const [annotationTargetUrl, setAnnotationTargetUrl] = useState<string | null>(null)
  const [annotationCommentInput, setAnnotationCommentInput] = useState("")
  const [isSavingAnnotation, setIsSavingAnnotation] = useState(false)

  //state for infiniteloop
  const isHandlingScroll = useRef(false);
  const lastScrollUpdateTime = useRef(0)
  const SCROLL_UPDATE_THROTTLE = 100

  //for help modal
  const [helpModalOpened, setHelpModalOpened] = useState(false);

  //refactored
  const scrollPositionRef = useRef({x:0, y: 0});
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // xapi
  const [session, setSession] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedInput(input), 500);
    return () => window.clearTimeout(timer);
  }, [input]);

  useEffect(() => {
      const getSessionFromAPI = async () => {
        try {
          const response = await fetch('/api/session');
          const data = await response.json();
          
          if (data.user) {
            console.log("âœ… Got session from API:", data.user.email);
            setSession({
              user: data.user,
              expires_at: data.expires_at
            });
          } else {
            console.log("âŒ No session from API");
          }
        } catch (error) {
          console.error("API session fetch error:", error);
        }
      };
      
      getSessionFromAPI();
    }, []);

  const scrollSuggestions = (direction: "left" | "right") => {
    if (!suggestionContainerRef.current) return
    const container = suggestionContainerRef.current
    const scrollAmount = 200
    if (direction === "left") {
      container.scrollLeft -= scrollAmount
    } else {
      container.scrollLeft += scrollAmount
    }
    setSuggestionScrollPosition(container.scrollLeft)
  }

  // For nav
  const [showLeftScroll, setShowLeftScroll] = useState(false)
  const [showRightScroll, setShowRightScroll] = useState(false)

  const checkScrollButtons = () => {
    if (!suggestionContainerRef.current) return
    const container = suggestionContainerRef.current
    setShowLeftScroll(container.scrollLeft > 0)
    setShowRightScroll(container.scrollLeft < container.scrollWidth - container.clientWidth)
  }

  // Update scroll buttons when suggestions change
  useEffect(() => {
    checkScrollButtons()
    if (suggestionContainerRef.current) {
      const container = suggestionContainerRef.current
      container.addEventListener("scroll", checkScrollButtons)
      return () => {
        container.removeEventListener("scroll", checkScrollButtons)
      }
    }
  }, [suggestions])

  const fetchChatMessages = useCallback(
    async (pageNumber = 1, append = false) => {
      if (loadingMore && pageNumber > 1) return // Prevent duplicate requests
      try {
        if (pageNumber > 1) {
          setLoadingMore(true)
        }
        const res = await fetch(`/api/chat?sessionId=${sessionId}&page=${pageNumber}&limit=${MESSAGES_PER_PAGE}`)
        const data = await res.json() as { messages: Array<{ role: string; content: string; contextNodeIds?: string[]; contextEdgeIds?: string[]; references?: Reference[] }>; total?: number; hasMore?: boolean }

        const formatted = data.messages.map((msg) => ({
          sender: (msg.role === "assistant" ? "ai" : "user") as ChatMessage["sender"],
          text: msg.content,
          contextNodeIds: msg.contextNodeIds || [],
          contextEdgeIds: msg.contextEdgeIds || [],
          references: msg.references || [],
        }))

        if (append) {
          setMessages((prev) => {
            const newMessages = [...formatted, ...prev]
            return newMessages
          })
        } else {
          setMessages(formatted)
          setShouldScrollToBottom(true) // Only for initial load
        }

        setTotalMessages(data.total ?? 0)
        setHasMore(data.hasMore ?? false)
      } catch (error) {
        console.error("Gagal memuat chat:", error)
      } finally {
        setLoadingMore(false)
      }
    },
    [sessionId, loadingMore],
  )

  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMore || isFetchingHistory.current) {
      return
    }

    isFetchingHistory.current = true
    const nextPage = page + 1

    try {
      await fetchChatMessages(nextPage, true)
      setPage(nextPage)
    } catch (error) {
      console.error("Error in loadMoreMessages:", error)
    } finally {
      isFetchingHistory.current = false
    }
  }, [loadingMore, hasMore, page, fetchChatMessages])

  useEffect(() => {
    if (sessionId && isInitialLoad.current) {
      isInitialLoad.current = false
      setPage(1)
      setHasMore(true)
      fetchChatMessages(1, false)
    }
  }, [sessionId, fetchChatMessages])

  const handleScrollPositionChange = useCallback(
      ({ x, y }: { x: number; y: number }) => {
          if (isHandlingScroll.current) {
              return;
          }

          if (typeof y !== 'number' || isNaN(y) || y < 0) {
              return;
          }

          const now = Date.now();
          if (now - lastScrollUpdateTime.current < SCROLL_UPDATE_THROTTLE) {
              return; // Skip this update
          }
          lastScrollUpdateTime.current = now;

          scrollPositionRef.current = { x, y };
          isScrollingRef.current = true;

          if (scrollTimeoutRef.current) {
              clearTimeout(scrollTimeoutRef.current);
          }

          scrollTimeoutRef.current = setTimeout(() => {
              isScrollingRef.current = false;
              
              if (isHandlingScroll.current) return;

              const scrollThreshold = 100;
              const isNearTop = scrollPositionRef.current.y <= scrollThreshold;
              const canLoadMore = hasMore && !loadingMore && !isFetchingHistory.current;

              const timeSinceLastFetch = Date.now() - lastFetchTime.current;
              const cooldownPassed = timeSinceLastFetch > FETCH_COOLDOWN;

              if (isNearTop && canLoadMore && cooldownPassed) {
                  lastFetchTime.current = Date.now();
                  isHandlingScroll.current = true; // Set flag before async call
                  loadMoreMessages().finally(() => {
                      setTimeout(() => {
                          isHandlingScroll.current = false;
                      }, 500); // Cooldown before allowing next handle
                  });
              }
          }, 300); // 300ms debounce
      },
      [hasMore, loadingMore, loadMoreMessages] // Dependencies tetap sama
  );

  useEffect(() => {
    if (isFetchingHistory.current) {
      const scrollContainer = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement
      if (scrollContainer) {
        lastScrollHeight.current = scrollContainer.scrollHeight
      }
    }
  }, [loadingMore])

  useEffect(() => {
    if (!isFetchingHistory.current && loadingMore === false && messages.length > 0) {
      const scrollContainer = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement
      if (scrollContainer && lastScrollHeight.current > 0) {
        const newScrollHeight = scrollContainer.scrollHeight
        const heightDifference = newScrollHeight - lastScrollHeight.current

        if (heightDifference > 0) {
          console.log(`ðŸ“ Restoring scroll position - Height diff: ${heightDifference}`)
          const offset = 200 // 200px offset from top
          const newScrollTop = Math.max(scrollPositionRef.current.y + heightDifference + offset, offset)

          setTimeout(() => {
            scrollContainer.scrollTop = newScrollTop
            lastScrollHeight.current = 0 // Reset
          }, 100)
        }
      }
    }
  }, [messages.length, loadingMore])

  const addContextNode = useCallback((node: ExtendedNode) => {
    if (!node?.id) return;
    setContextNodes((current) => current.some((item) => item.id === node.id) ? current : [...current, node]);
  }, []);

  useEffect(() => {
    if (!selectedNode) return;
    const timer = window.setTimeout(() => addContextNode(selectedNode), 0);
    return () => window.clearTimeout(timer);
  }, [selectedNode, addContextNode]);

  useEffect(() => {
    const shouldScroll =
      (isInitialMount && messages.length > 0) || (shouldScrollToBottom && !isFetchingHistory.current) || isLoading

    if (shouldScroll) {
      const scrollToBottom = () => {
        if (scrollAreaRef.current) {
          const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
          if (scrollContainer) {
            setTimeout(() => {
              scrollContainer.scrollTo({
                top: scrollContainer.scrollHeight,
                behavior: shouldScrollToBottom ? "smooth" : "auto", // Smooth for new messages
              })
            }, 100)
          }
        }

        if (messageEndRef.current && (shouldScrollToBottom || isLoading)) {
          setTimeout(() => {
            messageEndRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "end",
            })
          }, 150)
        }
      }

      scrollToBottom()

      // Reset flags after scrolling
      window.requestAnimationFrame(() => {
        if (isInitialMount) setIsInitialMount(false);
        if (shouldScrollToBottom) setShouldScrollToBottom(false);
      });
    }
  }, [messages.length, isLoading])

  const fetchInitialSuggestions = async () => {
    let mode: "general" | "single node" | "multiple node" = "general"
    if (contextNodes.length === 1) mode = "single node"
    else if (contextNodes.length > 1) mode = "multiple node"

    try {
    //   const res = await fetch("/api/suggestions/input", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       query: "",
    //       context: {
    //         nodeIds: contextNodes.map((n) => n.id),
    //         edgeIds: contextEdges.map((e) => e.id),
    //       },
    //       suggestion_type: "input",
    //       mode,
    //     }),
    //   })

    //   const data = await res.json()
      setSuggestions([])
      setShowSuggestions(true)
      setSuggestionContext("input")
    } catch (err) {
      console.error("Failed to fetch initial suggestions:", err)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchInitialSuggestions(); }, 0);
    return () => window.clearTimeout(timer);
  }, [contextNodes.length, contextEdges.length])

  const fetchFollowupSuggestions = async (lastMessage: string) => {
    try {
      const res = await fetch("/api/suggestions/followup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lastMessage: lastMessage,
          conversationHistory: messages.slice(-1),
          context: {
            nodeIds: contextNodes.map((n) => n.id),
            edgeIds: contextEdges.map((e) => e.id),
          },
        }),
      })

      const data = await res.json()
      setSuggestions(data.suggestions || [])
      setSuggestionContext("response")
      setShowSuggestions(true)
    } catch (error) {
      console.error("Failed to fetch followup suggestions:", error)
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSend = useCallback (async (messageText: string) => {
    if (!messageText.trim() || isLoading) return

    if (contextNodes.length === 0) {
      const helpMessage = {
        sender: "ai" as const,
        text: `Saya melihat Anda belum memilih dokumen untuk dianalisis. Untuk mendapatkan hasil yang optimal, silakan:

1. **Pilih dokumen** dari graph view dengan mengklik node dokumen
2. **Upload PDF baru** menggunakan tombol upload
3. **Baca panduan lengkap** untuk memahami cara menggunakan platform ini

Apakah Anda ingin membuka panduan penggunaan?`,
        showHelpButton: true, // Custom property to show help button
        contextNodeIds: [],
      }

      setMessages((prev) => [
        ...prev, 
        { sender: "user", text: messageText, contextNodeIds: [] },
        helpMessage
      ])
      
      setInput("")
      setShouldScrollToBottom(true)
      return
    }

    setSuggestions([])
    setShowSuggestions(false)
    setSuggestionContext(null)

    const contextNodeIds = contextNodes.filter((node) => node && node.id).map((node) => String(node.id));

    const contextEdgeIds = contextEdges.filter((edge) => edge && edge.id).map((edge) => String(edge.id));

    setMessages((prev) => [...prev, { sender: "user", text: messageText, contextNodeIds: contextNodeIds }])
    setShouldScrollToBottom(true) // Ensure scroll to bottom for new messages

    const currentInput = messageText
    setInput("")
    setIsLoading(true)

    // Reset pagination for new conversation
    setPage(1)
    setHasMore(true)

    // Scroll to bottom for new message
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight
        }
      }
    }, 50)

    let payloadd = {}
    if (contextNodes.length === 0) {
      payloadd = {
        sessionId,
        question: currentInput,
        contextNodeIds: contextNodes.map((n) => n.id),
        contextEdgeIds: contextEdges.map((e) => e.id),
        forceWeb,
        mode: "general",
      }
    } else if (contextNodes.length === 1) {
      payloadd = {
        sessionId,
        question: currentInput,
        contextNodeIds: contextNodes.map((n) => n.id),
        contextEdgeIds: contextEdges.map((e) => e.id),
        forceWeb,
        mode: "single node",
        nodeId: contextNodes[0].id,
      }
    } else {
      payloadd = {
        sessionId,
        question: currentInput,
        contextNodeIds: contextNodes.map((n) => n.id),
        contextEdgeIds: contextEdges.map((e) => e.id),
        forceWeb,
        mode: "multiple node",
        nodeIds: contextNodes.map((n) => n.id),
      }
    }

    try {
      const result = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payloadd),
      })

      const data = await result.json() as { answer: string; references?: Array<Partial<Reference> & { source_url?: string; link?: string; document_preview?: string; title?: string }> }

      let processedReferences: Reference[] = []
      if (data.references && Array.isArray(data.references)) {
        processedReferences = data.references.map((ref, idx) => {
          const processedRef = {
            url: ref.url || ref.source_url || ref.link || "#",
            text: ref.text || ref.title || ref.document_preview || `Reference ${idx + 1}`,
            preview: ref.preview || ref.document_preview || ref.text || "No preview available",
            ref_mark: ref.ref_mark || `[${idx + 1}]`,
            type: ref.type || "document",
            index: idx + 1,
          }
          return processedRef
        })
      }

      setMessages((m) => [...m, { sender: "ai", text: data.answer, references: processedReferences || [], contextNodeIds: contextNodeIds, contextEdgeIds: contextEdgeIds }])

      setTimeout(async () => {
        await fetchFollowupSuggestions(data.answer)
      }, 500)
    } catch (error) {
      const errorMessage = "terjadi kesalahan dalam menjawab pertanyaan";
      setMessages((m) => [...m, { sender: "ai", text: "terjadi kesalahan dalam menjawab pertanyaan" }])
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, contextNodes, contextEdges, sessionId, forceWeb, 
    setMessages, setIsLoading, setSuggestions, setShowSuggestions, 
    setSuggestionContext, setPage, setHasMore, setShouldScrollToBottom, 
    scrollAreaRef, fetchFollowupSuggestions])

  const removeContextNode = (node: ExtendedNode) => {
    setContextNodes((prev) => prev.filter((n) => n.id !== node.id))
  }


  useEffect(() => {
    return () => {
      setSuggestions([])
      setShowSuggestions(false)
      setSuggestionContext(null)
      // Cleanup scroll timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (resetContext) {
      const timer = window.setTimeout(() => {
        setContextNodes([]);
        setContextEdges([]);
        onContextReset?.();
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [resetContext, onContextReset])

  const handlerOpenPdf = async (url: string) => {
    if (url.startsWith("graph://node/")) {
      const nodeId = url.split("graph://node/")[1]
      try {
        const res = await fetch(`/api/nodes/${nodeId}`)
        const data = await res.json()
        if (res.ok) {
          setDetailModalNode(data)
        } else {
          console.error("Node not found", data)
        }
      } catch (error) {
        console.error("Error fetching node", error)
      }
    } else {
      setSelectedPDF(url)
      setModalOpened(true)
    }
  }

  const handleTextSelectionForAnnotation = useCallback((e: React.MouseEvent<HTMLElement>, message: ChatMessage) => {
    const selection = window.getSelection()
    if (!selection || selection.toString().length === 0) {
      setShowAnnotationModal(false)
      return
    }

    const selectedText = selection.toString().trim()
    if (selectedText.length === 0) {
      setShowAnnotationModal(false)
      return
    }

    // Ensure selection is within the AI message content
    const targetElement = e.target as HTMLElement
    const messageContentElement = targetElement.closest(`.${styles.markdownContent}`)
    if (!messageContentElement || !messageContentElement.contains(selection.getRangeAt(0).commonAncestorContainer)) {
      setShowAnnotationModal(false)
      return
    }

    if (!message.contextNodeIds || message.contextNodeIds.length === 0) {
      notifyDashboard("Anotasi tidak tersedia", "Anotasi hanya tersedia untuk respons AI yang berdasarkan dokumen yang dilampirkan.")
      // Clear selection to prevent re-triggering
      selection.empty()
      return
    }

    const documentUrl = message.references?.find(
      (ref) => ref.url.startsWith("http://") || ref.url.startsWith("https://"),
    )?.url

    if (!documentUrl || documentUrl === "#") {
      notifyDashboard("Tidak ada dokumen sumber", "Respons AI ini tidak memiliki dokumen sumber yang dapat dianotasi.")
      // Clear selection to prevent re-triggering
      selection.empty()
      return
    }

    setHighlightedText(selectedText)
    setAnnotationTargetUrl(documentUrl)
    setAnnotationCommentInput("") // Clear previous comment
    setShowAnnotationModal(true)

    // Clear selection after opening modal to prevent re-triggering
    selection.empty()
  }, []);

  const closePdf = () => { setModalOpened(false); setSelectedPDF(null); };
  const closeNode = () => setDetailModalNode(null);

  return <section className={styles.chatPanel}>
    <div ref={scrollAreaRef} className={styles.chatHistory} data-radix-scroll-area-viewport onScroll={(event) => handleScrollPositionChange({ x: event.currentTarget.scrollLeft, y: event.currentTarget.scrollTop })}>
      <div className={styles.chatMessages}>
        {loadingMore && <p className={styles.chatLoadingMore} role="status"><span className={styles.spinner} />Memuat pesan sebelumnya…</p>}
        {!hasMore && messages.length > 0 && <p className={styles.chatHistoryStart}><IconMessageCircle size={15} /> Awal percakapan</p>}
        {messages.length === 0 && !loadingMore ? <div className={styles.chatEmpty}><span className={styles.iconTile}><IconSparkles size={24} /></span><h3>Mulai percakapan</h3><p>Ajukan pertanyaan atau pilih dokumen untuk memulai.</p></div> : <>
          {messages.map((msg, idx) => <ChatMessageItem key={`${idx}-${msg.sender}`} msg={msg} onTextSelect={handleTextSelectionForAnnotation} onOpenHelp={() => setHelpModalOpened(true)} handlerOpenPdf={handlerOpenPdf} />)}
          {isLoading && <div className={`${styles.chatMessage} ${styles.aiMessage}`}><header className={styles.chatMessageHeader}><span className={styles.chatAvatar}><IconBrain size={15} /></span><strong>AI Assistant</strong></header><p className={styles.thinkingStatus} role="status">Sedang berpikir<span>···</span></p></div>}
          <div ref={messageEndRef} />
        </>}
      </div>
    </div>
    <ChatInputArea isLoading={isLoading} contextNodes={contextNodes} suggestions={suggestions} showLeftScroll={showLeftScroll} showRightScroll={showRightScroll} suggestionContainerRef={suggestionContainerRef} onSendMessage={handleSend} onRemoveContextNode={removeContextNode} onScrollSuggestions={scrollSuggestions} />

    <NativeDialog open={modalOpened} onClose={closePdf} labelledBy="chat-pdf-title" className={styles.pdfDialog}>
      <header className={styles.dialogHeader}><h2 className={styles.dialogTitle} id="chat-pdf-title">Lihat artikel</h2><button className={styles.dialogClose} onClick={closePdf} type="button" aria-label="Tutup PDF">×</button></header>
      {selectedPDF && <div className={styles.pdfViewer}><WebViewer fileUrl={selectedPDF} session={session} /></div>}
    </NativeDialog>
    <NativeDialog open={!!detailModalNode} onClose={closeNode} labelledBy="chat-node-title" className={styles.detailDialog}>
      <header className={styles.dialogHeader}><div><h2 className={styles.dialogTitle} id="chat-node-title">{detailModalNode?.title || "Detail artikel"}</h2><p className={styles.muted}>Informasi lengkap artikel</p></div><button className={styles.dialogClose} onClick={closeNode} type="button" aria-label="Tutup detail">×</button></header>
      <NodeDetail node={detailModalNode} onClose={closeNode} session={session} />
    </NativeDialog>
    <AnnotationModal opened={showAnnotationModal} onClose={() => { setShowAnnotationModal(false); setHighlightedText(""); setAnnotationTargetUrl(null); }} highlightedText={highlightedText} targetUrl={annotationTargetUrl} isDark={false} />
    <HelpGuideModal opened={helpModalOpened} onClose={() => setHelpModalOpened(false)} />
  </section>;
}
