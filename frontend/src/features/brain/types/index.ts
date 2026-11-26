import { type Node, type Edge } from "vis-network";

export interface ExtendedNode extends Node {
    att_goal?: string;
    att_method?: string;
    att_background?: string;
    att_future?: string;
    att_gaps?: string;
    att_url?: string;
    title?: string;
}

export interface ExtendedEdge extends Edge {
    id?: string;
    relation?: string;
    label?: string;
    color?: {
        color?: string;
        highlight?: string;
        hover?: string;
        opacity?: number;
    };
    fromTitle?: string;
    toTitle?: string;
    properties?: {
        description?: string;
        weight?: number;
        explanation?: string;
        similarity?: string;
        keywords?: string;
        type?: string;
    };
    displayDescription?: string;
}

export interface NetworkGraphProps {
    nodes: ExtendedNode[];
    edges: ExtendedEdge[];
    onNodeClick?: (node: ExtendedNode) => void;
    onEdgeClick?: (edge: ExtendedEdge) => void;
}

export interface BrainstormingProject {
    id: string;
    title: string;
    description?: string;
    coverColor: string;
    articleCount: number;
    chatCount: number;
    lastActivity: string;
    createdAt: string;
}

export interface BrainstormingSession {
  id: string,
  title: string,
  description?: string,
  coverColor: string,
  lastActivity: string,
  active: boolean,
}

export interface BrainstormingSessionItem {
    id: string,
    title: string,
    description?: string,
    coverColor: string,
    lastActivity: string,
    active: boolean,
}

export interface BrainstormingSessionApiResponse {
    id: string;
    title: string;
    description?: string | null;
    coverColor?: string | null;
    lastActivity?: string | null;
    updatedAt?: string | null;
    createdAt: string;
    _count?: {
        articles?: number;
        chatMessages?: number;
    };
}

export interface SessionContextResponse {
    sessionId?: string;
    user?: {
        id?: string;
        email?: string;
    };
    expires_at?: string | number;
    error?: string;
}
