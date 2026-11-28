"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { IconFilter, IconCircleDot, IconBrandHipchat, IconSearch, IconEye, IconUpload, IconChevronLeft, IconMessage, IconHighlight } from "@tabler/icons-react";
import { type ExtendedNode, type ExtendedEdge } from "./types";
import NetworkGraph from "./components/project/NetworkGraph";
import ChatPanel from "./components/project/ChatPanel";
import NodeDetail from "./components/project/NodeDetail";
import EdgeDetail from "./components/project/EdgeDetail";
import { DashboardLayout } from "./components/DashboardLayout";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { notifyDashboard } from "./components/DashboardFeedback";
import AnnotationPanel from "./components/project/AnnotationPanel";
import ArticleDetailTable from "./components/project/ArticleDetailTable";
import { Cite } from "@citation-js/core";
import "@citation-js/plugin-ris";
import { RealUploadProgress } from "./components/project/RealTimeUploadProgress";
import { NativeDialog } from "./components/NativeDialog";
import styles from "./Dashboard.module.css";

const relationMapping = {
  'background': 'same_background',
  'method': 'extended_method',
  'goal': 'shares_goal',
  'future': 'follows_future_work',
  'gap': 'addresses_same_gap',
};

const relationColors = {
  'background': 'blue',
  'method': 'green',
  'gap': 'red',
  'future': 'purple',
  'goal': 'orange'
};

function getRelationDisplayName(relation: string): string {
  const displayNames = {
    'background': 'Latar Belakang',
    'method': 'Metodologi',
    'goal': 'Tujuan',
    'future': 'Arahan Masa Depan',
    'gap': 'Gap Penelitian'
  };

  return displayNames[relation as keyof typeof displayNames] || relation.charAt(0).toUpperCase() + relation.slice(1);
}

function getRelationColor(relation: string): string {
  const reverseMapping: Record<string, string> = {};
  Object.entries(relationMapping).forEach(([display, api]) => {
    reverseMapping[api] = display;
  });

  const displayRelation = reverseMapping[relation];
  return relationColors[displayRelation as keyof typeof relationColors] || 'gray';
}

function getDisplayRelationKey(apiRelation: string): string{
  const reverseMapping: Record<string, string> = {};
  Object.entries(relationMapping).forEach(([display, api]) => {
    reverseMapping[api] = display;
  });
  return reverseMapping[apiRelation] || apiRelation;
}

export default function Dashboard() {
  const params = useParams();
  const rawSessionId = params?.id;
  const sessionId = Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fullPath = `${pathname}?${searchParams.toString()}`;

  const [mounted, setMounted] = useState(false);
 

  const [sidebarOpened, setSidebarOpened] = useState(false);
  const [selectedNode, setSelectedNode] = useState<ExtendedNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<ExtendedEdge | null>(null);
  const [detailModalNode, setDetailModalNode] = useState<ExtendedNode | null>(null);
  const [detailModalEdge, setDetailModalEdge] = useState<ExtendedEdge | null>(null);
  const [edgeDetailReturn, setEdgeDetailReturn] = useState<ExtendedEdge | null>(null);
  const [activeRelations, setActiveRelations] = useState<string[]>([
    'background',
    'method',
    'gap',
    'future',
    'goal',
  ]);
  const [activeArticles, setActiveArticles] = useState<string[]>([]);
  const [articleSearchQuery, setArticleSearchQuery] = useState("");
  const [nodes, setNodes] = useState<ExtendedNode[]>([]);
  const [edges, setEdges] = useState<ExtendedEdge[]>([]);
  
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [uploadModalOpened, setUploadModalOpened] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    author: '',
    year: '',
    abstract: '',
    keywords: '',
    doi: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [activeTab, setActiveTab] = useState<'chat' | 'annotation'>('chat');

  const [viewMode, setViewMode] = useState<'graph' | 'detail'>('graph');

  const [resetChatContext, setResetChatContext] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUpLoading] = useState(false);

  const [uploadMode, setUploadMode ] = useState<'choose' | 'with-ris' | 'direct'>('choose');
  const [risFile, setRisFile] = useState<File | null>(null);
  const [isProcessingRis, setIsProcessingRis] = useState(false);
  const risFileInputRef = useRef<HTMLInputElement | null>(null);

  const [session, setSession] = useState<Record<string, unknown> | null>(null);

  const [currentUploadId, setCurrentUploadId] = useState<string | null>(null);

  useEffect(() => {
    const getSessionFromAPI = async () => {
      try {
        const response = await fetch('/api/session');
        const data = await response.json();
        
        if (data.user) {
          setSession({
            user: data.user,
            expires_at: data.expires_at,
            projectId: sessionId
          });
        } else {
          console.log("No session from API");
        }
      } catch (error) {
        console.error("API session fetch error:", error);
      }
    };
    
    getSessionFromAPI();
  }, []);

  const parseRisFile = async (risContent: string) => {
  try {
    const cite = new Cite(risContent);
    
    let jsonData = cite.format('data');
    
    if (typeof jsonData === 'string') {
      jsonData = JSON.parse(jsonData);
    }
    
    const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
    const data = dataArray[0];
    
    if (!data) {
      throw new Error('Tidak dapat mem-parse file RIS');
    }

    const parsedData = {
      title: data.title || '',
      author: data.author ?
        data.author.map((author: { given?: string; family?: string }) =>
          `${author.given || ''} ${author.family || ''}`.trim()
        ).join(', ') : '',
      year: data.issued ?
        data.issued['date-parts']?.[0]?.[0]?.toString() || '' : '',
      abstract: data.abstract || '',
      keywords: data.keyword ? 
        (Array.isArray(data.keyword) ? 
          data.keyword.join(', ') : 
          data.keyword) : '',
      doi: data.DOI || '',
    };

    return parsedData;
  } catch (error) {
    console.error('Error parsing RIS with citation-js:', error);
    return parseRisFileManual(risContent);
  }
};

  const parseRisFileManual = (risContent: string) => {
    const lines = risContent.split('\n');
    const parsedData: Record<string, string> = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('TI - ')){
        parsedData.title = trimmed.substring(6);
      } else if (trimmed.startsWith('AU - ')){
        if (!parsedData.author) parsedData.author = trimmed.substring(6);
        else parsedData.author += `, ${trimmed.substring(6)}`;
      } else if (trimmed.startsWith('PY - ')){
        parsedData.year = trimmed.substring(6);
      } else if (trimmed.startsWith('AB - ')){
        parsedData.abstract = trimmed.substring(6);
      } else if (trimmed.startsWith('KW - ')){
        if (!parsedData.keywords) parsedData.keywords = trimmed.substring(6);
        else parsedData.keywords += `, ${trimmed.substring(6)}`;
      } else if (trimmed.startsWith('DO - ')){
        parsedData.doi = trimmed.substring(6);
      } else if (trimmed.startsWith('T2 - ') || trimmed.startsWith('JO - ')){
        parsedData.journal = trimmed.substring(6);
      }
    }

    return parsedData;
  };

  const onRisFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.ris')) {
      notifyDashboard('Format tidak didukung', 'Mohon upload file RIS');
      return;
    }

    setRisFile(file);
    setIsProcessingRis(true);

    try {
      const content = await file.text();
      const parsedData = await parseRisFile(content);
      
      setUploadForm({
        title: parsedData.title || '',
        author: parsedData.author || '',
        year: parsedData.year || '',
        abstract: parsedData.abstract || '',
        keywords: parsedData.keywords || '',
        doi: parsedData.doi || '',
      });

      notifyDashboard('RIS berhasil diproses', 'Data artikel telah diisi otomatis');
    } catch (error) {
      notifyDashboard('Error parsing RIS', 'Gagal memproses file RIS', true);
    } finally {
      setIsProcessingRis(false);
      e.target.value = '';
    }
  };

  const handleDirectPdfUpload = async () => {
    if (!selectedFile) return;

    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCurrentUploadId(uploadId);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', selectedFile.name);
    formData.append('sessionId', sessionId as string);
    formData.append('uploadId', uploadId);

    setUpLoading(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok){
        const text = await res.text();
        throw new Error(`Upload failed: ${text}`);
      };
    } catch (error: unknown) {

      setUpLoading(false);
      setCurrentUploadId(null);

      notifyDashboard('Upload Gagal', error instanceof Error ? error.message : 'Terjadi kesalahan saat upload', true);
    }
  };

  const handleModalClose = () => {
    setUploadModalOpened(false);
    setSelectedFile(null);
    setRisFile(null);
    setUploadMode('choose');
    setUploadForm({
      title: '',
      author: '',
      year: '',
      abstract: '',
      keywords: '',
      doi: '',
    });
  };


  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const handleContextReset = () => {
    setResetChatContext(false);
  }

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpened((o) => !o);
  }, []);

  const filteredNodes = useMemo(() => {
    if (isLoadingSession || isLoadingData) return [];
    
    if (activeArticles.length === 0) return nodes;
    
    return nodes.filter((node) => activeArticles.includes(String(node.id)));
  }, [activeArticles, nodes, isLoadingSession, isLoadingData]);

  const filteredEdges = useMemo(() => {
    if (isLoadingSession || isLoadingData) return [];
    
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    
    const mappedActiveRelations = activeRelations.map(relation => 
      relationMapping[relation as keyof typeof relationMapping]
    ).filter(Boolean);
    
    return edges.filter((edge) => {
      const matchRelation = activeRelations.length > 0 && mappedActiveRelations.includes(edge.relation || '');
      const matchNodes = nodeIds.has(edge.from) && nodeIds.has(edge.to);
      
      return matchRelation && matchNodes;
    });
  }, [activeRelations, edges, filteredNodes, isLoadingSession, isLoadingData]);

  const handleRelationChange = useCallback((relation: string, checked: boolean) => {
    setActiveRelations((current) => checked ? [...current, relation] : current.filter((item) => item !== relation));
  }, []);

  const handleArticleSelectionChange = useCallback((selectedArticles: string[]) => {
    setActiveArticles(selectedArticles);
    setSelectedNode(null);
  }, []);

  const fetchData = async () => {
    try {
      setIsLoadingData(true);
      const nodesRes = await fetch(`/api/nodes?sessionId=${sessionId}`);
      const edgesRes = await fetch(`/api/edges?sessionId=${sessionId}`);

      if (!nodesRes.ok || !edgesRes.ok){
        throw new Error('Failed to fetch data');
      }

      const nodesData = await nodesRes.json();
      const edgesData = await edgesRes.json();

      const mappedNodes = nodesData.map((node: ExtendedNode) => {
        const fullLabel = node.title || node.label || `Node ${node.id}`;
        const truncatedLabel = fullLabel.length > 30 
          ? fullLabel.substring(0, 10) + '...' 
          : fullLabel;

      return {
        ...node,
        label: truncatedLabel,
        title: fullLabel,
      }
      });

      setNodes(mappedNodes);

      const mappedEdges = edgesData.map((edge: ExtendedEdge & { fromId?: string; toId?: string }) => ({
        id: edge.id,
        from: edge.fromId,
        to: edge.toId,
        label: edge.label,
        relation: edge.relation || 'unknown',
        arrows: 'to',
        color: { color: getRelationColor(edge.relation || '') || 'gray' },
        font: { color: 'black', background: 'white' },
      }));

      setEdges(mappedEdges);
    } catch (error) {
      console.error("Error Fetching Data:", error);
    } finally {
      setIsLoadingData(false);
    }
  };
  
  const loadSession = async () => {
    if (!sessionId) return;
    
    try {
      setIsLoadingSession(true);
      const res = await fetch(`/api/brainstorming-sessions/${sessionId}`);
      const session = await res.json();

      setActiveArticles(session.selectedFilterArticles ?? []);
      setActiveRelations(session.graphFilters ?? [
        'background',
        'method',
        'gap',
        'future',
        'goal',
      ]);
    } catch (error) {
      console.error("Error loading session:", error);
    } finally {
      setIsLoadingSession(false);
    }
  };

  useEffect(() => {
    if (!sessionId) return;
    
    const initializeData = async () => {
      await Promise.all([
        fetchData(),
        loadSession()
      ]);
    };
    
    initializeData();
  }, [sessionId]);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!sessionId || isLoadingSession || isLoadingData) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/brainstorming-sessions/${sessionId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            selectedFilterArticles: activeArticles,
            graphFilters: activeRelations,
            lastSelectedNodeId: selectedNode?.id ?? null,
            lastSelectedEdgeId: selectedEdge?.id ?? null
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error("Error saving session:", error);
      }
    }, 500);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [activeArticles, activeRelations, selectedNode, selectedEdge, sessionId, isLoadingSession, isLoadingData]);

  const handleNodeClick = useCallback((node: ExtendedNode) => {
    setSelectedEdge(null);
    setSelectedNode({...node});
    setDetailModalNode(node);
    if (session) {
      console.log("Tracking node click...");
    } else {
      console.warn("No session for node tracking");
    }
  }, [session]);

  const handleEdgeClick = useCallback((edge: ExtendedEdge) => {
    setSelectedNode(null);
    setSelectedEdge(edge);
    setDetailModalEdge(edge);
  }, []);

  const handleUploadFile = () => {
    setUploadModalOpened(true);
  };

  const onFileChangeInModal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf')){
      notifyDashboard('Format tidak didukung', 'Mohon upload file PDF');
      return;
    }

    setSelectedFile(file);
    if (!uploadForm.title) {
      setUploadForm({
        ...uploadForm,
        title: file.name.replace('.pdf', '')
      });
    }
    
    e.target.value = '';
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCurrentUploadId(uploadId);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', selectedFile.name);
    formData.append('sessionId', sessionId as string);
    formData.append('uploadId', uploadId);
    formData.append('author', uploadForm.author);
    formData.append('year', uploadForm.year);
    formData.append('abstract', uploadForm.abstract);
    formData.append('keywords', uploadForm.keywords);
    formData.append('doi', uploadForm.doi);

    setUpLoading(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const contentType = res.headers.get("content-type");
      if (!res.ok){
        const text = await res.text();
        throw new Error(`Upload failed: ${text}`);
      };

      let data: Record<string, unknown> = {};
      if (contentType?.includes("application/json")){
        data = await res.json();
        console.log('File uploaded:', data);
      }else{
        const text = await res.text();
        console.log('Unexpected response:', text);
      }

    } catch (error: unknown) {

      setUpLoading(false);
      setCurrentUploadId(null);

      notifyDashboard('Upload Gagal', error instanceof Error ? error.message : 'Terjadi Kesalahan saat upload', true);
      console.error('File upload error:', error);
    }
  };

  const handleUploadComplete = async () => {
    setUpLoading(false);
    setCurrentUploadId(null);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  
    notifyDashboard('Berhasil', `File "${selectedFile?.name}" berhasil diunggah dan diproses`);

    setUploadModalOpened(false);
    setSelectedFile(null);
    setUploadForm({
      title: '',
      author: '',
      year: '',
      abstract: '',
      keywords: '',
      doi: '',
    });

    await fetchData();
  };

  if (!mounted || isLoadingSession || isLoadingData) {
    return <DashboardLayout sidebarOpened={false} onToggleSidebar={() => {}} mounted={false} fullBleed>
      <section className={styles.loadingState} aria-live="polite">
        <span className={styles.spinner} aria-hidden="true" />
        <h1>{isLoadingData && isLoadingSession ? "Memuat data dan sesi…" : isLoadingData ? "Memuat data artikel…" : "Memuat pengaturan sesi…"}</h1>
        <p>Mohon tunggu sebentar.</p>
      </section>
    </DashboardLayout>;
  }

  const closeNodeDetail = () => {
    setDetailModalNode(null);
    if (edgeDetailReturn) {
      setDetailModalEdge(edgeDetailReturn);
      setEdgeDetailReturn(null);
    }
  };

  return <DashboardLayout sidebarOpened={sidebarOpened} onToggleSidebar={handleToggleSidebar} mounted={mounted} fullBleed>
    <div className={styles.dashboardPage}>
      <div className={styles.dashboardHeading}>
        <div><p className={styles.eyebrow}>RUANG KERJA RISET</p><h1>{session?.projectId ? "Peta riset" : "Dashboard"}</h1><p>Jelajahi hubungan antarartikel dan diskusikan temuan bersama AI.</p></div>
        <button className={styles.secondaryButton} onClick={() => router.push(`/projects/${sessionId}/articles`)} type="button"><IconEye size={17} /> Lihat artikel</button>
      </div>
      <div className={styles.dashboardGrid}>
        <section className={`${styles.panel} ${styles.researchPanel}`} aria-labelledby="map-title">
          <header className={styles.panelHeader}>
            <div className={styles.panelTitle}><span className={styles.iconTile}><IconCircleDot size={19} /></span><div><h2 id="map-title">Peta konsep</h2><p>Visualisasi artikel penelitian</p></div></div>
            <div className={styles.panelActions}>
              <label className={styles.srOnly} htmlFor="view-mode">Tampilan</label>
              <select id="view-mode" className={styles.select} value={viewMode} onChange={(event) => setViewMode(event.target.value as "graph" | "detail")}><option value="graph">Grafik</option><option value="detail">Tabel</option></select>
              <button className={styles.primaryButton} onClick={handleUploadFile} type="button" disabled={uploading}><IconUpload size={16} /> {uploading ? "Mengunggah" : "Upload"}</button>
            </div>
          </header>
          <div className={styles.filterArea}>
            <label className={styles.formField} htmlFor="article-search"><span className={styles.fieldLabel}><IconSearch size={15} /> Pilih artikel untuk difokuskan</span><input id="article-search" className={styles.fieldInput} placeholder="Cari judul artikel…" onChange={(event) => setArticleSearchQuery(event.currentTarget.value)} value={articleSearchQuery} /></label>
            <div className={styles.articleChoices} aria-label="Artikel">
              {nodes.filter((node) => (node.title || node.label || "").toLowerCase().includes(articleSearchQuery.toLowerCase())).map((node) => {
                const id = String(node.id);
                return <label className={styles.articleChoice} key={id}><input type="checkbox" checked={activeArticles.includes(id)} onChange={(event) => handleArticleSelectionChange(event.currentTarget.checked ? [...activeArticles, id] : activeArticles.filter((value) => value !== id))} /><span>{node.title || node.label || `Artikel ${node.id}`}</span></label>;
              })}
              {nodes.length === 0 && <p className={styles.emptyHint}>Belum ada artikel di ruang kerja ini.</p>}
            </div>
            {viewMode === "graph" && <fieldset className={styles.relationFilters}><legend><IconFilter size={15} /> Jenis relasi</legend>{Object.keys(relationColors).map((relation) => <label className={styles.relationChoice} key={relation}><input type="checkbox" checked={activeRelations.includes(relation)} onChange={(event) => handleRelationChange(relation, event.currentTarget.checked)} /><span className={`${styles.relationDot} ${styles[`relation_${relation}`]}`} />{getRelationDisplayName(relation)}</label>)}</fieldset>}
          </div>
          <div className={styles.visualization}>
            <div className={styles.visualizationMeta}><span>{filteredNodes.length} artikel</span>{activeArticles.length > 0 && <button className={styles.textButton} onClick={() => handleArticleSelectionChange([])} type="button">Hapus pilihan</button>}</div>
            <div className={styles.visualizationContent}>
              {viewMode === "graph" ? <NetworkGraph nodes={filteredNodes} edges={filteredEdges} onNodeClick={handleNodeClick} onEdgeClick={handleEdgeClick} key={`${fullPath}-visjs`} /> : <ArticleDetailTable nodes={nodes} activeArticles={activeArticles} />}
            </div>
          </div>
        </section>

        <section className={`${styles.panel} ${styles.assistantPanel}`} aria-labelledby="assistant-title">
          <div className={styles.panelTabs} role="tablist" aria-label="Panel kerja">
            <button className={`${styles.tab} ${activeTab === "chat" ? styles.tabActive : ""}`} role="tab" aria-selected={activeTab === "chat"} onClick={() => setActiveTab("chat")} type="button"><IconMessage size={17} /> Diskusi AI</button>
            <button className={`${styles.tab} ${activeTab === "annotation" ? styles.tabActive : ""}`} role="tab" aria-selected={activeTab === "annotation"} onClick={() => { setActiveTab("annotation"); setResetChatContext(true); }} type="button"><IconHighlight size={17} /> Anotasi</button>
          </div>
          {activeTab === "chat" && <header className={styles.assistantHeading}><span className={styles.iconTile}><IconBrandHipchat size={19} /></span><div><h2 id="assistant-title">AI Assistant</h2><p>Diskusi dan analisis artikel</p></div>{(selectedNode || selectedEdge) && <span className={styles.contextBadge}>Konteks aktif</span>}</header>}
          <div className={styles.assistantContent}>
            {activeTab === "chat" ? <ChatPanel selectedNode={selectedNode} selectedEdge={selectedEdge} sessionId={sessionId} resetContext={resetChatContext} onContextReset={handleContextReset} /> : <AnnotationPanel sessionId={sessionId} session={session} />}
          </div>
        </section>
      </div>
    </div>

    <NativeDialog open={!!detailModalNode} onClose={closeNodeDetail} labelledBy="node-detail-title" className={styles.detailDialog}>
      <header className={styles.dialogHeader}><div><h2 className={styles.dialogTitle} id="node-detail-title">Detail artikel</h2><p className={styles.muted}>Tujuan, metodologi, dan konteks penelitian</p></div><button className={styles.dialogClose} onClick={closeNodeDetail} type="button" aria-label="Tutup dialog">×</button></header>
      <NodeDetail node={detailModalNode} onClose={closeNodeDetail} session={session} projectId={sessionId} />
    </NativeDialog>
    <NativeDialog open={!!detailModalEdge} onClose={() => setDetailModalEdge(null)} labelledBy="edge-detail-title" className={styles.detailDialog}>
      <header className={styles.dialogHeader}><div><h2 className={styles.dialogTitle} id="edge-detail-title">Detail hubungan</h2><p className={styles.muted}>Arah dan konteks relasi antarartikel</p></div><button className={styles.dialogClose} onClick={() => setDetailModalEdge(null)} type="button" aria-label="Tutup dialog">×</button></header>
      <EdgeDetail key={String(detailModalEdge?.id)} edge={detailModalEdge} onClose={() => setDetailModalEdge(null)} onOpenNodeDetail={(nodeId) => { const node = nodes.find((item) => item.id === nodeId); setDetailModalNode(node ?? null); setEdgeDetailReturn(detailModalEdge); setDetailModalEdge(null); }} />
    </NativeDialog>
    <RealUploadProgress key={currentUploadId ?? "idle"} uploadId={currentUploadId} uploading={uploading} onComplete={handleUploadComplete} />

    <NativeDialog open={uploadModalOpened} onClose={handleModalClose} labelledBy="upload-dialog-title" className={styles.uploadDialog}>
      <header className={styles.dialogHeader}><div><p className={styles.eyebrow}>PUSTAKA RUANG KERJA</p><h2 className={styles.dialogTitle} id="upload-dialog-title">Tambah artikel PDF</h2></div><button className={styles.dialogClose} onClick={handleModalClose} type="button" aria-label="Tutup dialog">×</button></header>
      {uploadMode === "choose" && <div className={styles.uploadChoices}><p>Pilih cara untuk menambahkan artikel.</p><button className={styles.uploadChoice} onClick={() => setUploadMode("with-ris")} type="button"><IconUpload size={20} /><strong>Impor dengan RIS</strong><span>Isi metadata artikel dari berkas RIS.</span></button><button className={styles.uploadChoice} onClick={() => setUploadMode("direct")} type="button"><IconUpload size={20} /><strong>Upload langsung</strong><span>Tambahkan PDF tanpa metadata.</span></button><button className={styles.quietButton} onClick={handleModalClose} type="button">Batal</button></div>}
      {uploadMode === "with-ris" && <form className={styles.uploadForm} onSubmit={(event) => { event.preventDefault(); void handleUploadSubmit(); }}>
        <button className={styles.backButton} onClick={() => setUploadMode("choose")} type="button"><IconChevronLeft size={15} /> Pilih metode lain</button>
        <label className={styles.filePicker}><span>Berkas RIS</span><input type="file" ref={risFileInputRef} onChange={onRisFileChange} accept=".ris" /><span>{isProcessingRis ? "Membaca berkas…" : risFile?.name || "Pilih berkas RIS"}</span></label>
        <label className={styles.filePicker}><span>Dokumen PDF</span><input type="file" ref={fileInputRef} onChange={onFileChangeInModal} accept="application/pdf" required /><span>{selectedFile?.name || "Pilih berkas PDF"}</span></label>
        <label className={styles.formField}><span className={styles.fieldLabel}>Judul artikel</span><input className={styles.fieldInput} placeholder="Judul artikel" value={uploadForm.title} onChange={(event) => setUploadForm({ ...uploadForm, title: event.target.value })} required /></label>
        <label className={styles.formField}><span className={styles.fieldLabel}>Penulis</span><input className={styles.fieldInput} placeholder="Nama penulis" value={uploadForm.author} onChange={(event) => setUploadForm({ ...uploadForm, author: event.target.value })} required /></label>
        <label className={styles.formField}><span className={styles.fieldLabel}>Tahun</span><input className={styles.fieldInput} inputMode="numeric" placeholder="Tahun publikasi" value={uploadForm.year} onChange={(event) => setUploadForm({ ...uploadForm, year: event.target.value })} required /></label>
        <label className={styles.formField}><span className={styles.fieldLabel}>Abstrak</span><textarea className={styles.fieldTextarea} placeholder="Abstrak artikel" value={uploadForm.abstract} onChange={(event) => setUploadForm({ ...uploadForm, abstract: event.target.value })} required /></label>
        <label className={styles.formField}><span className={styles.fieldLabel}>Kata kunci</span><input className={styles.fieldInput} placeholder="Pisahkan dengan koma" value={uploadForm.keywords} onChange={(event) => setUploadForm({ ...uploadForm, keywords: event.target.value })} /></label>
        <label className={styles.formField}><span className={styles.fieldLabel}>DOI</span><input className={styles.fieldInput} placeholder="DOI artikel" value={uploadForm.doi} onChange={(event) => setUploadForm({ ...uploadForm, doi: event.target.value })} /></label>
        <footer className={styles.dialogActions}><button className={styles.quietButton} onClick={() => setUploadMode("choose")} type="button">Kembali</button><button className={styles.primaryButton} disabled={uploading || !selectedFile} type="submit">{uploading ? "Mengunggah…" : "Upload artikel"}</button></footer>
      </form>}
      {uploadMode === "direct" && <div className={styles.uploadForm}>
        <button className={styles.backButton} onClick={() => setUploadMode("choose")} type="button"><IconChevronLeft size={15} /> Pilih metode lain</button>
        <label className={styles.filePicker}><span>Dokumen PDF</span><input type="file" ref={fileInputRef} onChange={onFileChangeInModal} accept="application/pdf" /><span>{selectedFile?.name || "Pilih berkas PDF"}</span></label>
        <footer className={styles.dialogActions}><button className={styles.quietButton} onClick={() => setUploadMode("choose")} type="button">Kembali</button><button className={styles.primaryButton} disabled={uploading || !selectedFile} onClick={() => void handleDirectPdfUpload()} type="button">{uploading ? "Mengunggah…" : "Upload PDF"}</button></footer>
      </div>}
    </NativeDialog>
  </DashboardLayout>;
}
