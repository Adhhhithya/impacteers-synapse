// src/pages/GraphExplorerPage.js - FINAL CORRECTED "FOCUS ON HOVER" VERSION

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import useSWR from 'swr';
import Modal from 'react-modal';
import { FaPlus, FaMinus, FaExpand } from 'react-icons/fa';
// --- IMPORT THE MISSING FUNCTION ---
import { forceCollide } from 'd3-force'; 
import '../App.css';

// --- Configuration ---
const nodeColorMap = {
  Candidate: '#3b82f6', Project: '#22c55e', Skill: '#f97316', JobRole: '#ef4444', default: '#6b7280',
};
const fetcher = (url) => fetch(url).then((res) => res.json());
Modal.setAppElement('#root');

// --- Main KnowledgeGraph Component ---
const KnowledgeGraph = () => {
  const fgRef = useRef();
  const { data, error } = useSWR('http://localhost:8000/graph-explorer/data', fetcher);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  // --- State for the hover effect ---
  const [hoverNode, setHoverNode] = useState(null);

  // --- State for the modal ---
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    if (data && data.nodes) {
      const transformedData = {
        nodes: data.nodes.map(n => ({ ...n, id: n.id })),
        links: data.edges.map(e => ({ ...e, source: e.source, target: e.target })),
      };
      setGraphData(transformedData);
    }
  }, [data]);
  
  // This effect configures the D3 physics engine
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge').strength(-150);
      fgRef.current.d3Force('center').strength(0.05);
      fgRef.current.d3Force('link').distance(100);
      // Now this line will work because forceCollide is imported
      fgRef.current.d3Force('collide', forceCollide(30)); 
    }
  }, []);

  // --- Interaction Handlers ---
  const handleNodeHover = node => {
    setHoverNode(node || null);
  };

  const handleNodeClick = useCallback(node => {
    setSelectedNode(node);
    setModalIsOpen(true);
  }, []);

  const closeModal = () => { setModalIsOpen(false); };
  
  // --- Canvas Rendering Logic ---
  const handleNodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const label = node.properties.name || 'Unnamed';
    const fontSize = 14 / globalScale;
    const nodeRadius = 6;
    
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI, false);
    ctx.fillStyle = nodeColorMap[node.label] || nodeColorMap.default;
    ctx.fill();

    if (hoverNode === node) {
      ctx.font = `bold ${fontSize}px Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#333';
      ctx.fillText(label, node.x, node.y + nodeRadius + 12);
    }
  }, [hoverNode]);

  if (error) return <div className="page-container">Failed to load graph data.</div>;
  if (!data) return <div className="page-container">Loading and calculating layout...</div>;

  return (
    <>
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeCanvasObject={handleNodeCanvasObject}
        linkColor={() => 'rgba(0, 0, 0, 0.2)'}
        linkWidth={1}
        onNodeHover={handleNodeHover}
        onNodeClick={handleNodeClick}
        d3AlphaDecay={0.05}
        d3VelocityDecay={0.4}
        onEngineStop={() => fgRef.current.zoomToFit(400, 50)}
      />
      <div className="graph-controls">
        <button onClick={() => fgRef.current.zoom(fgRef.current.zoom() * 1.3, 200)} title="Zoom In"><FaPlus /></button>
        <button onClick={() => fgRef.current.zoom(fgRef.current.zoom() * 0.7, 200)} title="Zoom Out"><FaMinus /></button>
        <button onClick={() => fgRef.current.zoomToFit(400, 50)} title="Fit to View"><FaExpand /></button>
      </div>
      {selectedNode && (
        <Modal isOpen={modalIsOpen} onRequestClose={closeModal} className="node-modal" overlayClassName="modal-overlay">
          <h2>{selectedNode.label} Details</h2>
          <div className="modal-content">
            <table className="properties-table">
              <tbody>
                {Object.entries(selectedNode.properties).map(([key, value]) => (
                  <tr key={key}><td>{key.charAt(0).toUpperCase() + key.slice(1)}</td><td>{value}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={closeModal} className="close-modal-button">Close</button>
        </Modal>
      )}
    </>
  );
};

function GraphExplorerPage() {
  return (
    <div className="page-container graph-explorer-container">
      <div className="graph-header-light">
        <h1>Talent Ecosystem Graph</h1>
        <p>A living visualization of the connections between our talent, their skills, and our client partners' needs. Drag nodes to explore and hover to see details.</p>
      </div>
      <div className="graph-board">
        <KnowledgeGraph />
      </div>
    </div>
  );
}

export default GraphExplorerPage;