"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Box, Button, Checkbox, Grid, Group, MultiSelect, Text, Modal, Badge, Paper, ActionIcon, Stack, Card, ThemeIcon, Container, useMantineColorScheme, useMantineTheme, Loader, Select, TextInput, Textarea, ScrollArea } from "@mantine/core";
import { IconNetwork, IconFilter, IconCircleDot, IconBrandHipchat, IconSearch, IconEye, IconUpload, IconChevronLeft, IconMessage, IconHighlight } from "@tabler/icons-react";
import { type ExtendedNode, type ExtendedEdge } from "./types";
import NetworkGraph from "./components/project/NetworkGraph";
import ChatPanel from "./components/project/ChatPanel";
import NodeDetail from "./components/project/NodeDetail";
import EdgeDetail from "./components/project/EdgeDetail";
import { DashboardLayout } from "./components/DashboardLayout";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { notifications } from "@mantine/notifications";
import AnnotationPanel from "./components/project/AnnotationPanel";
import ArticleDetailTable from "./components/project/ArticleDetailTable";
import { Cite } from "@citation-js/core";
import "@citation-js/plugin-ris";
import { createClient } from "@/lib/supabase/client";
import { RealUploadProgress } from "./components/project/RealTimeUploadProgress";

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

  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();

  const [mounted, setMounted] = useState(false);
  const dark = mounted ? colorScheme === 'dark' : false;
 

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
  const [nodes, setNodes] = useState<ExtendedNode[]>([]);
  const [edges, setEdges] = useState<ExtendedEdge[]>([]);
  
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [graph, setGraph] = useState<'visjs' | 'neovisjs'>('visjs');
  const [neo4jData, setNeo4jData] = useState<{nodes: any[], edges: any[]}>({nodes: [], edges: []});
  const [graphKey, setGraphKey] = useState(0);
  const graphContainerRef = useRef<HTMLDivElement>(null);

  const [previousGraph, setPreviousGraph] = useState<'visjs' | 'neovisjs'>('visjs');
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

  const [session, setSession] = useState<any>(null);

  const [currentUploadId, setCurrentUploadId] = useState<string | null>(null);

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const VideoPreview = ({stream}: {stream: MediaStream | null}) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
      if (videoRef.current && stream){
        videoRef.current.srcObject = stream;
      }
    }, [stream]);

    if (!stream){
      return null;
    }

    return(
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          objectFit: 'cover',
          border: '3px solid #fff',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          zIndex: 1000,
        }}
      >
      </video>
    )
  }

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
        data.author.map((author: any) => 
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
    const parsedData: any = {};

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
      notifications.show({
        title: 'Format tidak didukung',
        message: 'Mohon upload file RIS',
        color: 'yellow',
        position: 'top-right',
      });
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

      notifications.show({
        title: 'RIS berhasil diproses',
        message: 'Data artikel telah diisi otomatis',
        color: 'green',
        position: 'top-right',
      });
    } catch (error) {
      notifications.show({
        title: 'Error parsing RIS',
        message: 'Gagal memproses file RIS',
        color: 'red',
        position: 'top-right',
      });
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
    } catch (error: any) {

      setUpLoading(false);
      setCurrentUploadId(null);

      notifications.show({
        title: 'Upload Gagal',
        message: error.message || 'Terjadi kesalahan saat upload',
        color: 'red',
        position: 'top-right',
      });
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
    setMounted(true);
  }, []);

  useEffect(() => {
  if (activeTab !== 'chat') {
    setResetChatContext(true)
  }
}, [activeTab]);

  const handleContextReset = () => {
    setResetChatContext(false);
  }

  const cleanupNavigationButtons = useCallback(() => {
  const navigationSelectors = [
    '.neovis-navigation',
    '.neovis-controls',
    '.neovis-toolbar',
    '[class*="navigation"]',
    '[class*="control"]',
    '[class*="toolbar"]',
    '[class*="zoom"]',
    '[class*="pan"]',
    'button[title*="zoom"]',
    'button[title*="pan"]',
    'button[title*="fit"]',
    'button[title*="center"]',
    'svg[class*="control"]',
    'svg[class*="navigation"]',
    '.floating-button',
    '.graph-controls',
    'button[style*="position: absolute"]',
    'button[style*="position: fixed"]',
    'div[style*="position: absolute"][style*="button"]',
    'div[style*="position: fixed"][style*="button"]'
  ];

  navigationSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const isNavButton = el.textContent?.includes('→') || el.textContent?.includes('↓') || el.textContent?.includes('-') || el.textContent?.includes('+') || el.getAttribute('title')?.toLowerCase().includes('zoom') || el.getAttribute('title')?.toLowerCase().includes('pan') || el.getAttribute('aria-label')?.toLowerCase().includes('navigation');
        
        if (isNavButton || selector.includes('navigation') || selector.includes('control')) {
          el.remove();
        }
      });
    } catch (e) {
      console.warn(`Could not clean selector: ${selector}`, e);
    }
  });

  const allButtons = document.querySelectorAll('button, div[role="button"], span[role="button"]');
  allButtons.forEach(button => {
    const text = button.textContent?.trim();
    const title = button.getAttribute('title');
    const ariaLabel = button.getAttribute('aria-label');
    
    const navigationPatterns = [
      '→', '←', '↑', '↓', // Arrow symbols
      '⊕', '⊖', // Plus/minus in circle
      '🔍', '🔎', // Magnifying glass
      '+', '-', // Simple plus minus
      'zoom', 'pan', 'fit', 'center', 'reset' // Keywords
    ];
    
    const isNavigationButton = navigationPatterns.some(pattern => 
      text?.includes(pattern) || 
      title?.toLowerCase().includes(pattern.toLowerCase()) ||
      ariaLabel?.toLowerCase().includes(pattern.toLowerCase())
    );
    
    if (isNavigationButton) {
      const isPartOfMainUI = button.closest('.mantine-Card-root') || button.closest('.mantine-Grid-col') || button.closest('[data-mantine-component]');
      
      if (!isPartOfMainUI) {
        button.remove();
      }
    }
  });

    const cleanupAttempts = [100, 300, 500, 1000];

    cleanupAttempts.forEach(delay => {
      setTimeout(() => {

      }, delay)
    });

  return () => {
    cleanupNavigationButtons();

    if (graphContainerRef.current){
      graphContainerRef.current.innerHTML = '';
    }

    const neoElements = document.querySelectorAll('[id*="neo"], [class*="neo"], [data-neo]');
    neoElements.forEach(el => el.remove());
  }

  }, []);

  useEffect(() => {
    cleanupNavigationButtons();
  }, [router, cleanupNavigationButtons]);

  useEffect(() => {
  return () => {
    if (graphContainerRef.current) {
      graphContainerRef.current.innerHTML = '';
    }
    
    const neoElements = document.querySelectorAll('[id*="neo"], [class*="neo"], [data-neo]');
    neoElements.forEach(el => el.remove());
  };
}, []);

  useEffect(() => {
    if (graph === 'visjs' && previousGraph === 'neovisjs') {
      const timeoutId = setTimeout(() => {
        cleanupNavigationButtons();
      }, 300); 

      return () => clearTimeout(timeoutId);
    }
  }, [activeRelations, activeArticles, graph, previousGraph, cleanupNavigationButtons]);

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

  useEffect(() => {
    if (graph === 'visjs' && previousGraph === 'neovisjs' && (filteredNodes.length > 0 || filteredEdges.length > 0)) {
        const cleanupTimeout = setTimeout(() => {
            cleanupNavigationButtons();
        }, 100);

        return () => clearTimeout(cleanupTimeout);
    }
  }, [filteredNodes, filteredEdges, graph, previousGraph, cleanupNavigationButtons]);

  useEffect(() => {
    if (graph === 'visjs' && previousGraph === 'neovisjs') {
      const observer = new MutationObserver((mutations) => {
        let shouldCleanup = false;
        
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              const tagName = element.tagName.toLowerCase();
              const isButton = tagName === 'button' || element.getAttribute('role') === 'button' || tagName === 'div' && element.tagName === 'pointer';
              
              if (isButton) {
                const text = element.textContent?.trim();
                const className = element.className;
                const id = element.id;
                
                const isNavButton = ['→', '←', '↑', '↓', '+', '-', '⊕', '⊖'].some(symbol => text?.includes(symbol)) || className.includes('nav') || className.includes('control') || className.includes('zoom') || className.includes('pan') || id.includes('nav') || id.includes('control');
                
                if (isNavButton) {
                  const isPartOfMainUI = element.closest('.mantine-Card-root') || element.closest('.mantine-Grid-col') || element.closest('[data-mantine-component]');
                  
                  if (!isPartOfMainUI) {
                    shouldCleanup = true;
                  }
                }
              }
            }
          });
        });

        if (shouldCleanup) {
          setTimeout(() => {
            cleanupNavigationButtons();
          }, 50);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        attributeOldValue: false
      });

      return () => observer.disconnect();
    }
  }, [graph, previousGraph, cleanupNavigationButtons]);

  const handleRelationChange = useCallback((relation: string, checked: boolean) => {
    if (checked) {
      setActiveRelations([...activeRelations, relation]);
    } else {
      setActiveRelations(activeRelations.filter(r => r !== relation));
    }
    
    if (graph === 'visjs' && previousGraph === 'neovisjs') {
      setTimeout(() => {
        cleanupNavigationButtons();
      }, 200);
    }
  }, [activeRelations, graph, previousGraph, cleanupNavigationButtons]);

  const handleArticleSelectionChange = useCallback((selectedArticles: string[]) => {
    setActiveArticles(selectedArticles);
    setSelectedNode(null);
    
    if (graph === 'visjs' && previousGraph === 'neovisjs') {
      setTimeout(() => {
        cleanupNavigationButtons();
      }, 200);
    }
  }, [graph, previousGraph, cleanupNavigationButtons]);

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

      const mappedNodes = nodesData.map((node: any) => {
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

      const mappedEdges = edgesData.map((edge: any) => ({
        id: edge.id,
        from: edge.fromId,
        to: edge.toId,
        label: edge.label,
        relation: edge.relation || 'unknown',
        arrows: 'to',
        color: { color: getRelationColor(edge.relation) || 'gray' },
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
      notifications.show({
        title: 'Format tidak didukung',
        message: 'Mohon upload file PDF',
        color: 'yellow',
        position: 'top-right',
      });
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

      let data: any = {};
      if (contentType?.includes("application/json")){
        data = await res.json();
        console.log('File uploaded:', data);
      }else{
        const text = await res.text();
        console.log('Unexpected response:', text);
      }

    } catch (error: any) {

      setUpLoading(false);
      setCurrentUploadId(null);

      notifications.show({
        title: 'Upload Gagal',
        message: error.message || 'Terjadi Kesalahan saat upload',
        color: 'red',
        position: 'top-right',
      });
      console.error('File upload error:', error);
    }
  };

  const handleUploadComplete = async () => {
    setUpLoading(false);
    setCurrentUploadId(null);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  
    notifications.show({
      id: 'upload-success',
      title: 'Berhasil',
      message: `File "${selectedFile?.name}" berhasil diunggah dan diproses`,
      color: 'green',
      position: 'top-right',
    });

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
    return (
      <DashboardLayout
        sidebarOpened={false}
        onToggleSidebar={() => {}}
        mounted={false}
        // chatHistory={chatHistory}
        // onChatSelect={handleChatSelect}
        // onNewChat={handleNewChat}
      >
        <Container fluid h="100%" p="xl">
          <Card shadow="sm" padding="xl" radius="lg" h="100%" withBorder>
            <Stack align="center" justify="center" h="100%">
              <Loader size="lg" />
              <Text size="lg" fw={500}>
                {isLoadingData && isLoadingSession 
                  ? 'Memuat data dan sesi...' 
                  : isLoadingData 
                    ? 'Memuat data artikel...' 
                    : 'Memuat pengaturan sesi...'}
              </Text>
              <Text size="sm" c="dimmed">
                Mohon tunggu sebentar
              </Text>
            </Stack>
          </Card>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <>
        <VideoPreview stream={cameraStream} />
        <DashboardLayout
        sidebarOpened={sidebarOpened}
        onToggleSidebar={handleToggleSidebar}
        mounted={mounted}
        //   chatHistory={chatHistory}
        //   onChatSelect={handleChatSelect}
        //   onNewChat={handleNewChat}
        >
        <Container fluid h="100%" p="xl">
            <Grid h="100%">
            {/* Network Visualization Panel */}
            <Grid.Col span={{ base: 12, lg: 6 }} h="100%">
                <Card 
                shadow="sm" 
                padding="lg" 
                radius="lg" 
                h="100%" 
                withBorder
                style={{ display: 'flex', flexDirection: 'column' }}
                >
                <Group justify="space-between" mb="lg">
                    <Group gap="xs">
                    <ThemeIcon variant="light" color="blue" size="lg">
                        <IconCircleDot size={20} />
                    </ThemeIcon>
                    <Box>
                        <Text size="xl" fw={700}>Peta Konsep</Text>
                        <Text size="sm" c="dimmed">Visualisasi Artikel Penelitian</Text>
                    </Box>
                    </Group>

                    <Group gap="sm">
                    {/* <input
                            ref={fileInputRef}
                            type="file"
                            style={{ display: 'none'}}
                            onChange={onFileChange}
                            accept="application/pdf"
                    /> */}
                    {/* Dropdown View Mode */}
                    <Select
                        value={viewMode}
                        onChange={(value) => setViewMode(value as 'graph' | 'detail')}
                        data={[
                        { 
                            value: 'graph', 
                            label: 'Graph',
                            // leftSection: <IconChartDots2 size={16} />
                        },
                        { 
                            value: 'detail', 
                            label: 'Tabel',
                            // leftSection: <IconList size={16} />
                        },
                        ]}
                        size="sm"
                        radius="md"
                        withCheckIcon={false}
                        w={120}
                        styles={{
                        input: {
                            backgroundColor: dark ? theme.colors.dark[6] : 'white',
                            border: `1px solid ${dark ? theme.colors.dark[4] : theme.colors.gray[3]}`,
                            fontSize: theme.fontSizes.sm,
                            fontWeight: 500
                        },
                        section: {
                            pointerEvents: 'none'
                        }
                        }}
                    />

                    <Button
                        variant="light"
                        color="green"
                        size="sm"
                        leftSection={<IconUpload size={16} />}
                        loading={uploading}
                        onClick={handleUploadFile}
                    >
                        Upload
                    </Button>
                    
                    <Button
                        variant="light"
                        color="blue"
                        size="sm"
                        leftSection={<IconEye size={16} />}
                        onClick={() => {
                        router.push(`/projects/${sessionId}/articles`)
                        console.log('Lihat artikel clicked');
                        }}
                    >
                        Lihat Artikel
                    </Button>
                    
                    <Badge variant="light" color="blue" size="lg">
                        {filteredNodes.length} Artikel
                    </Badge>
                    </Group>
                </Group>

                <Stack gap="md" mb="lg">
                    <MultiSelect
                    label={
                        <Group gap="xs" mb="xs">
                        <IconSearch size={16} />
                        <Text size="sm" fw={500}>Pilih Artikel</Text>
                        </Group>
                    }
                    placeholder="Cari dan pilih artikel untuk divisualisasikan..."
                    value={activeArticles}
                    onChange={
                        handleArticleSelectionChange
                        // setActiveArticles(e);
                        // setSelectedNode(null);
                    }
                    data={nodes.map((node) => ({
                        value: String(node.id) || '',
                        label: node.title || node.label || `Artikel ${node.id}`, // PERBAIKAN: Fallback yang lebih baik
                    }))}
                    searchable
                    clearable
                    radius="md"
                    />

                    {viewMode === 'graph' && (
                    <Box>
                        <Group gap="xs" mb="sm">
                        <IconFilter size={16} />
                        <Text size="sm" fw={500}>Jenis Relasi</Text>
                        </Group>
                        <Group gap="sm">
                        {Object.entries(relationColors).map(([relation, color]) => (
                            <Checkbox
                            key={relation}
                            value={relation}
                            color={color}
                            label={
                                <Group gap="xs">
                                <Badge variant="dot" color={color} size="sm">
                                    {getRelationDisplayName(relation)}
                                </Badge>
                                </Group>
                            }
                            checked={activeRelations.includes(relation)}
                            onChange={(event) => 
                                handleRelationChange(relation, event.currentTarget.checked)
                            }
                            styles={{
                                input: { cursor: 'pointer' },
                                label: { cursor: 'pointer' }
                            }}
                            />
                        ))}
                        </Group>
                    </Box>
                    )}

                </Stack>

                <Paper 
                    shadow="sm" 
                    radius="md" 
                    withBorder
                    style={{ 
                    flex: 1, 
                    minHeight: 400,
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: dark 
                        ? theme.colors.dark[8] 
                        : theme.colors.gray[0]
                    }}
                >
                    {/* Dropdown di pojok kiri atas */}
                    {viewMode === 'graph' ? (
                    
                    <Box style={{
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                    }}>
                    <Box
                        style={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        zIndex: 10,
                        minWidth: 120
                        }}
                    >
                    </Box>
    
                    {/* Graph Container */}
                    <Box style={{ width: '100%', height: '100%' }}>
                        
                        <NetworkGraph
                            nodes={filteredNodes}
                            edges={filteredEdges}
                            onNodeClick={handleNodeClick}
                            onEdgeClick={handleEdgeClick}
                            key ={`${fullPath}-visjs-${graphKey}`}
                        />
                    </Box>
                    </Box>
                    ) : (
                    <Box style={{ width: '100%', height: '100%', padding: '16px' }}>
                        <ScrollArea style={{ height: '100%' }}>
                        <ArticleDetailTable 
                            nodes={nodes}
                            activeArticles={activeArticles}
                        />
                        </ScrollArea>
                    </Box>
                    )}
                </Paper>
                </Card>
            </Grid.Col>

            {/* Chat Panel */}
            <Grid.Col span={{ base: 12, lg: 6 }} h="100%">
                <Card 
                shadow="sm" 
                padding="lg" 
                radius="lg" 
                h="100%" 
                withBorder
                style={{ display: 'flex', flexDirection: 'column' }}
                >
                <Stack gap="sm" mb="sm">
                    <Group justify="center" mb="sm">
                    <Group 
                        gap={0} 
                        style={{ 
                        padding: '0px',
                        backgroundColor: dark ? theme.colors.dark[6] : theme.colors.gray[1],
                        borderRadius: '50px',
                        border: `1px solid ${dark ? theme.colors.dark[4] : theme.colors.gray[3]}`,
                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                        }}
                    >
                        <ActionIcon
                        variant={activeTab === 'chat' ? 'filled' : 'transparent'}
                        color={activeTab === 'chat' ? 'blue' : 'gray'}
                        size={34}
                        radius="xl"
                        onClick={() => setActiveTab('chat')}
                        style={{
                            transition: 'all 0.2s ease',
                            transform: activeTab === 'chat' ? 'scale(1.05)' : 'scale(1)',
                            boxShadow: activeTab === 'chat' ? '0 2px 8px rgba(37, 99, 235, 0.3)' : 'none'
                        }}
                        >
                        <IconMessage size={20} />
                        </ActionIcon>
                        
                        <ActionIcon
                        variant={activeTab === 'annotation' ? 'filled' : 'transparent'}
                        color={activeTab === 'annotation' ? 'orange' : 'gray'}
                        size={34}
                        radius="xl"
                        onClick={() => setActiveTab('annotation')}
                        style={{
                            transition: 'all 0.2s ease',
                            transform: activeTab === 'annotation' ? 'scale(1.05)' : 'scale(1)',
                            boxShadow: activeTab === 'annotation' ? '0 2px 8px rgba(255, 165, 0, 0.3)' : 'none'
                        }}
                        >
                        <IconHighlight size={20} />
                        </ActionIcon>
                    </Group>
                    </Group>

                    {/* Dynamic Title & Description - Hanya untuk Chat */}
                    {activeTab === 'chat' && (
                    <Group justify="space-between" align="flex-start">
                        <Group gap="xs">
                        <ThemeIcon 
                            variant="light" 
                            color="blue" 
                            size="lg"
                            style={{
                            transition: 'all 0.3s ease',
                            transform: 'scale(1.1)'
                            }}
                        >
                            <IconBrandHipchat size={20} />
                        </ThemeIcon>
                        <Box>
                            <Text 
                            size="xl" 
                            fw={700}
                            style={{
                                backgroundImage: 'linear-gradient(45deg, #3B82F6, #1E40AF)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                transition: 'all 0.3s ease'
                            }}
                            >
                            AI Assistant
                            </Text>
                            <Text size="sm" c="dimmed">
                            Diskusi dan Analisis Artikel
                            </Text>
                        </Box>
                        </Group>
                        
                        {/* Status Badge */}
                        {(selectedNode || selectedEdge) && (
                        <Badge 
                            variant="gradient" 
                            gradient={{ from: 'blue', to: 'cyan', deg: 45 }}
                            size="lg"
                            // rightSection={<IconChevronRight size={12} />}
                            style={{
                            animation: 'pulse 2s infinite'
                            }}
                        >
                            {/* {selectedNode ? 'Node Terpilih' : 'Edge Terpilih'} */}
                        </Badge>
                        )}
                    </Group>
                    )}

                    {/* Animated Divider - Hanya untuk Chat */}
                    {activeTab === 'chat' && (
                    <Box
                        style={{
                        height: '2px',
                        backgroundImage: 'linear-gradient(90deg, transparent, #3B82F6, transparent)',
                        borderRadius: '1px',
                        transition: 'all 0.3s ease'
                        }}
                    />
                    )}
                </Stack>

                {/* Content Area dengan Animasi */}
                <Box 
                    style={{ 
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0 // Penting untuk flex container
                    }}
                > 
                    {activeTab === 'chat' ? (
                    <Box>
                        <ChatPanel 
                        selectedNode={selectedNode} 
                        selectedEdge={selectedEdge} 
                        sessionId={sessionId}
                        resetContext={resetChatContext}
                        onContextReset={handleContextReset}
                        />
                    </Box>
                    ) : (
                    <Box>
                        <AnnotationPanel sessionId={sessionId} session={session} />
                    </Box>
                    )}
                </Box>
                </Card>
            </Grid.Col>
            </Grid>
        </Container>

        {/* Enhanced Modals */}
        <Modal
            opened={!!detailModalNode}
            onClose={() => {
            setDetailModalNode(null);
            if (edgeDetailReturn){
                setDetailModalEdge(edgeDetailReturn);
                setEdgeDetailReturn(null);
            }
            }}
            title={
            <Group gap="sm">
                <ThemeIcon variant="light" color="blue" size="md">
                <IconCircleDot size={16} />
                </ThemeIcon>
                <Box>
                <Text fw={600}>{detailModalNode?.title || 'Detail Artikel'}</Text>
                <Text size="xs" c="dimmed">Informasi lengkap artikel</Text>
                </Box>
            </Group>
            }
            size="75vw"
            radius="lg"
            shadow="xl"
        >
            <NodeDetail node={detailModalNode} 
            // trackPdfView={trackPdfView}
            // trackModalInteraction={trackModalInteraction}
            onClose={() => {
            setDetailModalNode(null);
            if (edgeDetailReturn){
                setDetailModalEdge(edgeDetailReturn);
                setEdgeDetailReturn(null);
            }
            }} 
            session={session}
            projectId={sessionId}
            />
        </Modal>

        <Modal
            opened={!!detailModalEdge}
            onClose={() => setDetailModalEdge(null)}
            title={
            <Group gap="sm">
                <ThemeIcon variant="light" color="orange" size="md">
                <IconNetwork size={16} />
                </ThemeIcon>
                <Box>
                <Text fw={600}>Relasi: {getRelationDisplayName(getDisplayRelationKey(detailModalEdge?.relation ?? ''))}</Text>
                <Text size="xs" c="dimmed">Detail hubungan antar artikel</Text>
                </Box>
            </Group>
            }
            size="lg"
            radius="lg"
            shadow="xl"
        >
            <EdgeDetail edge={detailModalEdge} onClose={() => setDetailModalEdge(null)} onOpenNodeDetail={(nodeId) => {
            const node = nodes.find((n) => n.id === nodeId);
            setDetailModalNode(node ?? null);
            setEdgeDetailReturn(detailModalEdge);
            setDetailModalEdge(null);
            }} />
        </Modal>
        
        <RealUploadProgress 
            uploadId={currentUploadId} // State baru
            uploading={uploading}
            onComplete={handleUploadComplete}
        />

        {/* // Enhanced Upload Modal JSX */}
        <Modal
            opened={uploadModalOpened}
            onClose={handleModalClose}
            title="Upload Artikel PDF"
            size="lg"
            centered
        >
            {uploadMode === 'choose' && (
            <Stack gap="lg" align="center">
                <Text size="lg" fw={500} ta="center">
                Pilih cara upload artikel
                </Text>
                
                <Group gap="md" grow>
                <Card
                    withBorder
                    padding="xl"
                    radius="md"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setUploadMode('with-ris')}
                >
                    <Stack align="center" gap="sm">
                    <ThemeIcon size="xl" variant="light" color="blue">
                        <IconUpload size={24} />
                    </ThemeIcon>
                    <Text fw={500}>Upload dengan RIS</Text>
                    <Text size="sm" c="dimmed" ta="center">
                        Upload file RIS terlebih dahulu untuk mengisi metadata secara otomatis
                    </Text>
                    </Stack>
                </Card>
                
                <Card
                    withBorder
                    padding="xl"
                    radius="md"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setUploadMode('direct')}
                >
                    <Stack align="center" gap="sm">
                    <ThemeIcon size="xl" variant="light" color="green">
                        <IconUpload size={24} />
                    </ThemeIcon>
                    <Text fw={500}>Upload Langsung</Text>
                    <Text size="sm" c="dimmed" ta="center">
                        Upload PDF langsung tanpa mengisi metadata
                    </Text>
                    </Stack>
                </Card>
                </Group>
                
                <Button variant="light" onClick={handleModalClose}>
                Batal
                </Button>
            </Stack>
            )}
            
            {uploadMode === 'with-ris' && (
            <Stack gap="md">
                <Group justify="space-between" align="center">
                <Text size="lg" fw={500}>Upload dengan RIS</Text>
                <ActionIcon variant="subtle" onClick={() => setUploadMode('choose')}>
                    <IconChevronLeft size={16} />
                </ActionIcon>
                </Group>
                
                {/* RIS File Upload */}
                <div>
                <input
                    type="file"
                    style={{ display: 'none'}}
                    ref={risFileInputRef}
                    onChange={onRisFileChange}
                    accept=".ris"
                />
                <Button
                    variant="light"
                    color="blue"
                    leftSection={<IconUpload size={16} />}
                    onClick={() => risFileInputRef.current?.click()}
                    fullWidth
                    loading={isProcessingRis}
                >
                    {risFile ? `RIS: ${risFile.name}` : 'Pilih File RIS'}
                </Button>
                </div>
                
                {/* PDF File Upload */}
                <div>
                <input
                    type="file"
                    style={{ display: 'none'}}
                    ref={fileInputRef}
                    onChange={onFileChangeInModal}
                    accept="application/pdf"
                />
                <Button
                    variant="light"
                    color="green"
                    leftSection={<IconUpload size={16} />}
                    onClick={() => fileInputRef.current?.click()}
                    fullWidth
                >
                    {selectedFile ? `PDF: ${selectedFile.name}` : 'Pilih File PDF'}
                </Button>
                </div>
                
                {/* Form Fields */}
                <TextInput
                label="Judul Artikel"
                placeholder="Masukkan judul artikel"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                required
                />
                
                <TextInput
                label="Penulis"
                placeholder="Masukkan nama penulis"
                value={uploadForm.author}
                onChange={(e) => setUploadForm({...uploadForm, author: e.target.value})}
                required
                />
                
                <TextInput
                label="Tahun"
                placeholder="Masukkan tahun publikasi"
                value={uploadForm.year}
                onChange={(e) => setUploadForm({...uploadForm, year: e.target.value})}
                required
                />
                
                <Textarea
                label="Abstrak"
                placeholder="Masukkan abstrak artikel"
                value={uploadForm.abstract}
                onChange={(e) => setUploadForm({...uploadForm, abstract: e.target.value})}
                minRows={4}
                required
                />
                
                <TextInput
                label="Kata Kunci"
                placeholder="Masukkan kata kunci (pisahkan dengan koma)"
                value={uploadForm.keywords}
                onChange={(e) => setUploadForm({...uploadForm, keywords: e.target.value})}
                />
                
                <TextInput
                label="DOI"
                placeholder="Masukkan DOI artikel"
                value={uploadForm.doi}
                onChange={(e) => setUploadForm({...uploadForm, doi: e.target.value})}
                />
                
                <Group justify="flex-end" mt="md">
                <Button variant="light" onClick={() => setUploadMode('choose')}>
                    Kembali
                </Button>
                <Button 
                    onClick={handleUploadSubmit} 
                    loading={uploading}
                    disabled={!selectedFile}
                >
                    Upload
                </Button>
                </Group>
            </Stack>
            )}
            
            {uploadMode === 'direct' && (
            <Stack gap="md">
                <Group justify="space-between" align="center">
                <Text size="lg" fw={500}>Upload Langsung</Text>
                <ActionIcon variant="subtle" onClick={() => setUploadMode('choose')}>
                    <IconChevronLeft size={16} />
                </ActionIcon>
                </Group>
                
                <div>
                <input
                    type="file"
                    style={{ display: 'none'}}
                    ref={fileInputRef}
                    onChange={onFileChangeInModal}
                    accept="application/pdf"
                />
                <Button
                    variant="light"
                    color="green"
                    leftSection={<IconUpload size={16} />}
                    onClick={() => fileInputRef.current?.click()}
                    fullWidth
                >
                    {selectedFile ? `File: ${selectedFile.name}` : 'Pilih File PDF'}
                </Button>
                </div>
                
                {selectedFile && (
                <Text size="sm" c="dimmed">
                    File: {selectedFile.name}
                </Text>
                )}
                
                <Group justify="flex-end" mt="md">
                <Button variant="light" onClick={() => setUploadMode('choose')}>
                    Kembali
                </Button>
                <Button 
                    onClick={handleDirectPdfUpload} 
                    loading={uploading}
                    disabled={!selectedFile}
                >
                    Upload Langsung
                </Button>
                </Group>
            </Stack>
            )}
        </Modal>
        </DashboardLayout>
    </>
  );
}