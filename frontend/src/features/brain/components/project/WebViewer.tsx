"use client"

import { useState, useEffect, useCallback, useRef } from "react";
import { PdfLoader, PdfHighlighter, Highlight, Popup, AreaHighlight } from "react-pdf-highlighter";
import type { Content, IHighlight, NewHighlight, ScaledPosition } from "react-pdf-highlighter";
import { IconTrash, IconDownload } from "@tabler/icons-react";
import "react-pdf-highlighter/dist/style.css";
import { PDFDocument, rgb } from "pdf-lib";
import styles from "../../Dashboard.module.css";

interface WebViewerProps {
    fileUrl: string;
    onAnalytics?: (data: Record<string, unknown>) => void;
    session?: Record<string, unknown> | null;
    articleId?: string;
}

interface AnnotationFromAPI {
    id: string;
    page: number;
    highlightedText: string;
    comment: string;
    articleId: string;
    userId: string;
    createdAt: string;
    semanticTag?: string;
    article: {
        id: string;
        title: string;
        filePath: string;
        sessionId?: string;
    };
}

const WebViewer: React.FC<WebViewerProps> = ({ fileUrl, onAnalytics, session, articleId }) => {
  const [highlights, setHighlights] = useState<IHighlight[]>([])
  const [isLoadingAnnotations, setIsLoadingAnnotations] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const scrollViewerTo = useRef<(highlight: IHighlight) => void>(() => {})


  useEffect(() => {
    const loadAnnotations = async () => {
      
      const sessionId = session?.projectId || session?.sessionId || session?.id
            
      if (!session) {
        setIsLoadingAnnotations(true)
        return;
      }
      
      if (!sessionId) {
        setIsLoadingAnnotations(false)
        return
      }

      try {
        const apiUrl = `/api/annotation?sessionId=${sessionId}`
        
        const response = await fetch(apiUrl)
                
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error('Failed to load annotations')
        }

        const annotations: AnnotationFromAPI[] = await response.json()
        
        const currentDocAnnotations = annotations.filter(ann => {
          if (!ann.article?.filePath) {
            return false
          }
          
          const normalizeUrl = (url: string) => url.toLowerCase().trim()
          const normalizedFilePath = normalizeUrl(ann.article.filePath)
          const normalizedFileUrl = normalizeUrl(fileUrl)
          
          const isMatch = normalizedFilePath === normalizedFileUrl || 
                 normalizedFileUrl.includes(normalizedFilePath) ||
                 normalizedFilePath.includes(normalizedFileUrl)
                    
          return isMatch
        })

        const loadedHighlights: IHighlight[] = currentDocAnnotations
          .map(ann => {
            try {
              const position = ann.semanticTag 
                ? JSON.parse(ann.semanticTag)
                : {
                    pageNumber: ann.page,
                    boundingRect: { x1: 0, y1: 0, x2: 0, y2: 0, width: 0, height: 0 },
                    rects: [],
                  }

              const highlight: IHighlight = {
                id: ann.id,
                content: { text: ann.highlightedText || '' },
                position,
                comment: {
                  text: ann.comment || '',
                  emoji: '',
                },
              }
              
              return highlight
            } catch (error) {
              return null
            }
          })
          .filter((h): h is IHighlight => h !== null)

        setHighlights(loadedHighlights)
      } catch (error) {
      } finally {
        setIsLoadingAnnotations(false)
      }
    }

    loadAnnotations()
  }, [session, fileUrl])

  const parseIdFromHash = () => document.location.hash.replace(/^#highlight-/, "")
  const resetHash = () => {
    document.location.hash = ""
  }

  const scrollToHighlightFromHash = useCallback(() => {
    const highlight = highlights.find((h) => h.id === parseIdFromHash())
    if (highlight) {
      scrollViewerTo.current(highlight)
    }
  }, [highlights])

  useEffect(() => {
    window.addEventListener("hashchange", scrollToHighlightFromHash)
    return () => {
      window.removeEventListener("hashchange", scrollToHighlightFromHash)
    }
  }, [scrollToHighlightFromHash])

  const addHighlight = async (highlight: NewHighlight) => {
  const highlightedText = typeof highlight.content === "string" ? highlight.content : highlight.content?.text || ""
  const commentText = highlight.comment?.text || ""
  const sanitizedComment = {
    text: commentText.replace(/[\u{1F300}-\u{1F9FF}]/gu, "").trim(),
    emoji: "",
  }

  const tempId = Math.random().toString(36).slice(2)
  
  const tempHighlight: IHighlight = {
    id: tempId,
    content: highlight.content,
    position: highlight.position,
    comment: sanitizedComment,
  }
  
  setHighlights((prev) => [tempHighlight, ...prev])

  try {
    
    const response = await fetch('/api/annotation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: "annotation_add",
        document: fileUrl,
        metadata: {
          annotationType: "Highlight",
          contents: sanitizedComment.text,
          highlightedText,
          pageNumber: highlight.position.pageNumber,
          rect: highlight.position.boundingRect,
          positionData: JSON.stringify(highlight.position),
        },
        timeStamp: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to save annotation: ${errorText}`)
    }

    const savedAnnotation = await response.json()

    setHighlights((prev) => 
      prev.map(h => h.id === tempId ? { ...h, id: savedAnnotation.id } : h)
    )

    onAnalytics?.({
      action: "annotation_add",
      document: fileUrl,
      metadata: {
        annotationType: "Highlight",
        contents: sanitizedComment.text,
        highlightedText,
        pageNumber: highlight.position.pageNumber,
        annotationId: savedAnnotation.id,
      },
      timeStamp: new Date().toISOString(),
    })
    
  } catch (error) {
    console.error('❌ Error saving annotation to API:', error)
  }
}

  const deleteHighlight = async (highlightId: string) => {
    try {
      const response = await fetch(`/api/annotation/${highlightId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete annotation')

      setHighlights((prev) => prev.filter((h) => h.id !== highlightId))

      onAnalytics?.({
        action: "annotation_delete",
        document: fileUrl,
        metadata: {
          annotationId: highlightId,
        },
        timeStamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error deleting annotation:', error)
    }
  }

  const updateHighlight = (highlightId: string, position: Partial<ScaledPosition>, content: Partial<Content>) => {
    setHighlights((prev) =>
      prev.map((h) =>
        h.id === highlightId
          ? {
              ...h,
              position: { ...h.position, ...position },
              content: { ...h.content, ...content },
            }
          : h,
      ),
    )
  }

  const handleDownloadWithHighlights = async () => {
  setIsDownloading(true)
  try {
    const existingPdfBytes = await fetch(fileUrl).then(res => res.arrayBuffer())
    const pdfDoc = await PDFDocument.load(existingPdfBytes)

    const pages = pdfDoc.getPages()
    
    highlights.forEach(highlight => {
      const pageIndex = highlight.position.pageNumber - 1
      if (pageIndex >= 0 && pageIndex < pages.length) {
        const page = pages[pageIndex]
        const { width: pdfPageWidth, height: pdfPageHeight } = page.getSize()
        
        const viewportWidth = highlight.position.boundingRect?.width || pdfPageWidth
        const viewportHeight = highlight.position.boundingRect?.height || pdfPageHeight
        
        const scaleX = pdfPageWidth / viewportWidth
        const scaleY = pdfPageHeight / viewportHeight
        
        if (highlight.position.rects && highlight.position.rects.length > 0) {
          highlight.position.rects.forEach((rect, idx) => {
            const x1 = rect.x1 * scaleX
            const y1 = rect.y1 * scaleY
            const x2 = rect.x2 * scaleX
            const y2 = rect.y2 * scaleY
            
            const pdfX = x1
            const pdfY = pdfPageHeight - y2
            const pdfWidth = x2 - x1
            const pdfHeight = y2 - y1
                        
            page.drawRectangle({
              x: pdfX,
              y: pdfY,
              width: pdfWidth,
              height: pdfHeight,
              color: rgb(1, 1, 0),
              opacity: 0.4,
              borderWidth: 0,
            })
          })
        } else if (highlight.position.boundingRect) {
          const rect = highlight.position.boundingRect
          
          const x1 = rect.x1 * scaleX
          const y1 = rect.y1 * scaleY
          const x2 = rect.x2 * scaleX
          const y2 = rect.y2 * scaleY
          
          const pdfX = x1
          const pdfY = pdfPageHeight - y2
          const pdfWidth = x2 - x1
          const pdfHeight = y2 - y1
          
          page.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: pdfWidth,
            height: pdfHeight,
            color: rgb(1, 1, 0),
            opacity: 0.4,
            borderWidth: 0,
          })
        }

        if (highlight.comment?.text) {
          const rect = highlight.position.rects?.[0] || highlight.position.boundingRect
          if (rect) {
            const x1 = rect.x1 * scaleX
            const y2 = rect.y2 * scaleY
            
            const commentX = x1 + 2
            const commentY = pdfPageHeight - y2 - 12
            
            const fontSize = 8
            const maxWidth = Math.min(300, pdfPageWidth - commentX - 10)
            
            try {
              // Background for comment
              const textWidth = Math.min(highlight.comment.text.length * fontSize * 0.5, maxWidth)
              
              page.drawRectangle({
                x: commentX - 2,
                y: commentY - 2,
                width: textWidth + 4,
                height: fontSize + 4,
                color: rgb(1, 1, 0.9),
                opacity: 0.9,
              })
              
              // Comment text
              page.drawText(highlight.comment.text, {
                x: commentX,
                y: commentY,
                size: fontSize,
                color: rgb(0, 0, 0),
                maxWidth: maxWidth,
              })
            } catch (error) {
              console.error('Error drawing comment:', error)
            }
          }
        }
      }
    })

    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${fileUrl.split('/').pop()?.replace('.pdf', '')}_highlighted.pdf` || 'document_highlighted.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    onAnalytics?.({
      action: "document_downloaded_with_highlights",
      document: fileUrl,
      highlightCount: highlights.length,
      timeStamp: new Date().toISOString(),
    })
  } catch (error) {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileUrl.split('/').pop() || 'document.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } finally {
    setIsDownloading(false)
  }
}

  const HighlightPopup = ({ comment }: { comment: { text: string; emoji: string } }) =>
    comment?.text ? (
      <div className={`Highlight__popup ${styles.highlightPopup}`}>
        {comment.text ? comment.text.replace(/[\u{1F300}-\u{1F9FF}]/gu, "").trim() : ""}
      </div>
    ) : null

  const CustomTip = ({
    onConfirm,
    onOpen,
  }: {
    onConfirm: (comment: { text: string; emoji: string }) => void
    onOpen: () => void
  }) => {
    const [text, setText] = useState("")

    useEffect(() => {
      onOpen()
    }, [onOpen])

    return (
      <div
        className={`PdfHighlighter__tip-container ${styles.highlightTip}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="PdfHighlighter__tip-compact">
          <input
            type="text"
            placeholder="Add note..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            className={styles.highlightInput}
          />
          <button
            type="submit"
            onClick={() => {
              onConfirm({ text: text.replace(/[\u{1F300}-\u{1F9FF}]/gu, "").trim(), emoji: "" })
              window.getSelection()?.removeAllRanges()
            }}
            className={styles.highlightSubmit}
          >
            Add
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.webViewer}>
      <div className={styles.pdfToolbar}>
        <button className={styles.primaryButton} onClick={handleDownloadWithHighlights} disabled={isDownloading} type="button">
          <IconDownload size={16} /> {isDownloading ? "Mengunduh…" : "Unduh PDF dengan highlight"}
        </button>
      </div>
      <div className={styles.pdfWorkspace}>
        <div className={styles.pdfCanvas}>
          <PdfLoader
            url={fileUrl}
            beforeLoad={
              <div className={styles.pdfLoading} role="status">Memuat PDF…</div>
            }
          >
            {(pdfDocument) => (
              <PdfHighlighter
                pdfDocument={pdfDocument}
                enableAreaSelection={(event) => event.altKey}
                scrollRef={(scrollTo) => {
                  scrollViewerTo.current = scrollTo
                  scrollToHighlightFromHash()
                }}
                onScrollChange={resetHash}
                onSelectionFinished={(position, content, hideTipAndSelection, transformSelection) => (
                  <CustomTip
                    onOpen={transformSelection}
                    onConfirm={(comment) => {
                      addHighlight({ content, position, comment })
                      hideTipAndSelection()
                    }}
                  />
                )}
                highlightTransform={(highlight, index, setTip, hideTip, viewportToScaled, screenshot, isScrolledTo) => {
                  const isTextHighlight = !highlight.content?.image
                  const component = isTextHighlight ? (
                    <Highlight
                      isScrolledTo={isScrolledTo}
                      position={highlight.position}
                      comment={highlight.comment}
                    />
                  ) : (
                    <AreaHighlight
                      isScrolledTo={isScrolledTo}
                      highlight={highlight}
                      onChange={(boundingRect) => {
                        updateHighlight(
                          highlight.id,
                          { boundingRect: viewportToScaled(boundingRect) },
                          { image: screenshot(boundingRect) },
                        )
                      }}
                    />
                  )
                  return (
                    <Popup
                      popupContent={<HighlightPopup comment={highlight.comment} />}
                      onMouseOver={() => setTip(highlight, () => <HighlightPopup comment={highlight.comment} />)}
                      onMouseOut={hideTip}
                      key={index}
                    >
                      {component}
                    </Popup>
                  )
                }}
                highlights={highlights}
              />
            )}
          </PdfLoader>
        </div>
        <aside className={styles.pdfNotes}>
          <h3>Highlight & catatan</h3>
          <div className={styles.pdfNotesList}>
            {isLoadingAnnotations ? (
              <div className={styles.annotationLoading} role="status"><span className={styles.spinner} />Memuat anotasi…</div>
            ) : (
              <>
                {highlights.length === 0 ? <p className={styles.muted}>Belum ada highlight.</p> : (
                  highlights.map((h) => {
                    const text = typeof h.content === "string" ? h.content : h.content?.text || ""
                    return (
                      <article className={styles.pdfNoteCard} key={h.id}>
                        <button className={styles.pdfNoteBody} onClick={() => scrollViewerTo.current(h)} type="button">
                          <span className={styles.muted}>Halaman {h.position.pageNumber}</span>
                          {text && (
                            <strong>
                              {text}
                            </strong>
                          )}
                          {h.comment?.text && (
                            <span>Catatan: {h.comment.text.replace(/[\u{1F300}-\u{1F9FF}]/gu, "").trim()}</span>
                          )}
                        </button>
                        <button className={styles.deleteHighlight} aria-label="Hapus highlight" type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteHighlight(h.id)
                          }}
                        >
                          <IconTrash size={16} />
                        </button>
                      </article>
                    )
                  })
                )}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default WebViewer
