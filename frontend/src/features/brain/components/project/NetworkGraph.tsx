"use client";

import { useEffect, useRef, useState } from "react";
import { Network } from "vis-network";
import { DataSet } from "vis-data";
import { type ExtendedNode, type ExtendedEdge, type NetworkGraphProps } from "../../types";
import { IconArrowUp, IconArrowDown, IconArrowLeft, IconArrowRight, IconZoomIn, IconZoomOut, IconMaximize } from "@tabler/icons-react";
import styles from "../../Dashboard.module.css";

export default function NetworkGraph(
    {nodes, edges, onNodeClick, onEdgeClick}: NetworkGraphProps
){
    const containerRef = useRef<HTMLDivElement | null>(null);
    const networkRef = useRef<Network | null>(null);
    const nodeDataSetRef = useRef<DataSet<ExtendedNode> | null>(null);
    const edgeDataSetRef = useRef<DataSet<ExtendedEdge> | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(true);

    const handleMove = (direction: "up" | "down" | "left" | "right") => {
        if(!networkRef.current) return;

        const currentView = networkRef.current.getViewPosition();
        const moveStep = 100;

        const movements = {
            up: { x: 0, y: -moveStep },
            down: { x: 0, y: moveStep },
            left: { x: -moveStep, y: 0 },
            right: { x: moveStep, y: 0 }
        };

        networkRef.current.moveTo({
            position: {
                x: currentView.x + movements[direction].x,
                y: currentView.y + movements[direction].y
            },
            animation: true
        });
    };

    const handleZoomIn = (type: 'in' | 'out') => {
        if (!networkRef.current) return;
        
        const currentScale = networkRef.current.getScale();
        const zoomStep = 0.2;
        
        const newScale = type === 'in' 
        ? currentScale * (1 + zoomStep)
        : currentScale * (1 - zoomStep);
        
        networkRef.current.moveTo({
        scale: newScale,
        animation: true
        });
    };

    const handleFitView = () => {
        if (!networkRef.current) return;
        networkRef.current.fit({
            animation: true
        });
    };

    useEffect(() => {
        if (!containerRef.current) return;
        const graphContainer = containerRef.current;
        let lastWidth = 0;
        let lastHeight = 0;
        let hasFittedToVisibleSize = false;
        nodeDataSetRef.current = new DataSet<ExtendedNode>();
        edgeDataSetRef.current = new DataSet<ExtendedEdge>();

        networkRef.current = new Network(
        containerRef.current,
        {
            nodes: nodeDataSetRef.current,
            edges: edgeDataSetRef.current,
        },
        {
            nodes: {
            shape: 'circle',
            margin: {
                top: 10,
                bottom: 10,
            },
            },
            edges: {
            font: { size: 0 },
            width: 3,
            smooth: {
                enabled: true,
                type: 'dynamic',
                forceDirection: true,
                roundness: 0.5,
            },
            },
            interaction: { 
            hover: true, 
            navigationButtons: false,
            dragNodes: true,
            dragView: true,
            zoomView: true,
            multiselect: true,
            },
            physics: { 
            enabled: true,
            solver: 'forceAtlas2Based',
            forceAtlas2Based: {
                gravitationalConstant: -50,
                springLength: 0.01,
                springConstant: 0.08,
                damping: 0.4,
                avoidOverlap: 1,
            },    
            stabilization: {
                enabled: true,
                iterations: 1000,
                updateInterval: 50,
                onlyDynamicEdges: false,
                fit: true,
            },
            },
            layout: {
            improvedLayout: true,
            },
            autoResize: true,
        },
        );

        networkRef.current.on('click', (params) => {
        if (params.nodes.length > 0 && nodeDataSetRef.current) {
            const node = nodeDataSetRef.current.get(params.nodes[0]) as ExtendedNode;
            if (node) onNodeClick?.(node);
        } else if (params.edges.length > 0 && edgeDataSetRef.current) {
            const edge = edgeDataSetRef.current.get(params.edges[0]) as ExtendedEdge;
            if (edge) onEdgeClick?.(edge);
        }
        });

        networkRef.current.once('stabilizationIterationsDone', () => {
            setIsLoading(false);
            if (networkRef.current) {
            networkRef.current.setOptions({ physics: false});
            networkRef.current.fit({ animation: true});
            }
        });

        const resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            const width = Math.floor(entry.contentRect.width);
            const height = Math.floor(entry.contentRect.height);
            if (width < 1 || height < 1 || (width === lastWidth && height === lastHeight)) return;

            lastWidth = width;
            lastHeight = height;
            networkRef.current?.setSize(`${width}px`, `${height}px`);
            networkRef.current?.redraw();

            if (!hasFittedToVisibleSize && (nodeDataSetRef.current?.getIds().length ?? 0) > 0) {
                networkRef.current?.fit({ animation: false });
                hasFittedToVisibleSize = true;
            }
        });
        resizeObserver.observe(graphContainer);

        return () => {
        resizeObserver.disconnect();
        if (networkRef.current) {
            networkRef.current.destroy();
            networkRef.current = null;
        }
        };
    }, []);

    useEffect(() => {
        if (!nodeDataSetRef.current || !edgeDataSetRef.current || !networkRef.current) return;

        setIsLoading(true);
        
        nodeDataSetRef.current.clear();
        nodeDataSetRef.current.add(nodes);
        
        edgeDataSetRef.current.clear();
        edgeDataSetRef.current.add(edges);

        networkRef.current.setOptions({ physics: { enabled: true } });
        
        const stabilizationHandler = () => {
        setIsLoading(false);
        if (networkRef.current) {
            networkRef.current.setOptions({ physics: false });
            networkRef.current.fit({ animation: true });
        }
        };

        networkRef.current.once('stabilizationIterationsDone', stabilizationHandler);
        
        const timeoutId = setTimeout(() => {
        setIsLoading(false);
        if (networkRef.current) {
            networkRef.current.setOptions({ physics: false });
            networkRef.current.off('stabilizationIterationsDone', stabilizationHandler);
        }
        }, 3000);

        return () => {
        clearTimeout(timeoutId);
        if (networkRef.current) {
            networkRef.current.off('stabilizationIterationsDone', stabilizationHandler);
        }
        };
    }, [nodes, edges]);

    return <div className={styles.graphCanvas}>
        {isLoading && <span className={styles.graphLoader} role="status" aria-label="Memuat peta konsep" />}
        <div className={styles.graphNavigation} aria-label="Geser peta">
            <button className={styles.graphControl} onClick={() => handleMove("up")} type="button" aria-label="Geser ke atas"><IconArrowUp size={16} /></button>
            <div><button className={styles.graphControl} onClick={() => handleMove("left")} type="button" aria-label="Geser ke kiri"><IconArrowLeft size={16} /></button><button className={styles.graphControl} onClick={() => handleMove("down")} type="button" aria-label="Geser ke bawah"><IconArrowDown size={16} /></button><button className={styles.graphControl} onClick={() => handleMove("right")} type="button" aria-label="Geser ke kanan"><IconArrowRight size={16} /></button></div>
        </div>
        <div className={styles.graphZoom} aria-label="Zoom peta">
            <button className={styles.graphControl} onClick={() => handleZoomIn("in")} type="button" aria-label="Perbesar"><IconZoomIn size={16} /></button>
            <button className={styles.graphControl} onClick={() => handleZoomIn("out")} type="button" aria-label="Perkecil"><IconZoomOut size={16} /></button>
            <button className={styles.graphControl} onClick={handleFitView} type="button" aria-label="Pas ke layar"><IconMaximize size={16} /></button>
        </div>
        <div className={styles.graphSurface} ref={containerRef} />
    </div>;
}
