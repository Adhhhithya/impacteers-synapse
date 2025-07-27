// src/pages/GraphExplorerPage.js - FINAL STABLE & POLISHED VERSION

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import useSWR from 'swr';
import Modal from 'react-modal';
import { FaPlus, FaMinus, FaExpand } from 'react-icons/fa';
import '../App.css';

// --- Configuration ---
const nodeColorMap = {
  Candidate: '#007bff', Project: '#28a745', Skill: '#ffc107', JobRole: '#dc3545', default: '#6c757d',
};

const fetcher = (url) => fetch(url).then((res) => res.json());

Modal.setAppElement('#root');

// --- Main KnowledgeGraph Component ---
const KnowledgeGraph = () => {
  const fgRef = useRef();
  const { data, error } = useSWR('http://localhost:8000/graph-explorer/data', fetcher);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  // --- State for the hover-to-highlight feature ---
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());

  // --- State for the modal ---
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  // This effect preprocesses the data from the API
  useEffect(() => {
    if (data && data.nodes) {
      const transformedData = {
        nodes: data.nodes.map(n => ({ ...n, id: n.id, neighbors: [], links: [] })),
        links: data.edges.map(e => ({ ...e, source: e.source, target: e.target })),
      };
      // Build neighbor and link lists for each node for the hover effect
      transformedData.links.forEach(link => {
        const a = transformedData.nodes.find(n => n.id === link.source);
        const b = transformedData.nodes.find(n => n.id === link.target);
        if (a && b) {
          a.neighbors.push(b);
          b.neighbors.push(a);
          a.links.push(link);
          b.links.push(link);
        }
      });
      setGraphData(transformedData);
    }
  }, [data]);
  
  // --- This effect configures the physics engine ---
  useEffect(() => {
    if (fgRef.current) {
      // Repulsion force to prevent node overlap
      fgRef.current.d3Force('charge').strength(-150);
      // Force that pulls the graph to the center of the canvas
      fgRef.current.d3Force('center').strength(0.05);
      // Define link distance
      fgRef.current.d3Force('link').distance(100);
    }
  }, []);

  // --- Interaction Handlers ---
  const handleNodeHover = node => {
    highlightNodes.clear();
    highlightLinks.clear();
    if (node) {
      highlightNodes.add(node);
      node.neighbors.forEach(neighbor => highlightNodes.add(neighbor));
      node.links.forEach(link => highlightLinks.add(link));
    }
    setHighlightNodes(new Set(highlightNodes));
    setHighlightLinks(new Set(highlightLinks));
  };

  const handleNodeClick = useCallback(node => {
    setSelectedNode(node);
    setModalIsOpen(true);
  }, []);

  const closeModal = () => {
    setModalIsOpen(false);
  };
  
  // --- Canvas Rendering Logic ---
  const handleNodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const label = node.properties.name || 'Unnamed';
    const fontSize = 14 / globalScale;
    const nodeRadius = 6;
    
    const isHighlighted = highlightNodes.size > 0 && !highlightNodes.has(node);
    const nodeColor = isHighlighted ? 'rgba(108, 117, 125, 0.2)' : (nodeColorMap[node.label] || nodeColorMap.default);
    const textColor = isHighlighted ? 'rgba(50, 50, 50, 0.3)' : '#333';

    // Node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI, false);
    ctx.fillStyle = nodeColor;
    ctx.fill();

    // Node label
    ctx.font = `bold ${fontSize}px Sans-Serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = textColor;
    ctx.fillText(label, node.x, node.y + nodeRadius + 8);
  }, [highlightNodes]);

  if (error) return <div className="page-container">Failed to load graph data.</div>;
  if (!data) return <div className="page-container">Loading and calculating layout...</div>;

  return (
    <>
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        // Styling & Rendering
        nodeCanvasObject={handleNodeCanvasObject}
        linkColor={link => highlightLinks.size > 0 && !highlightLinks.has(link) ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.25)'}
        linkWidth={link => highlightLinks.has(link) ? 2 : 1}
        // Interaction
        onNodeHover={handleNodeHover}
        onNodeClick={handleNodeClick}
        // STABLE PHYSICS: Settle down quickly but react to interaction
        d3AlphaDecay={0.05} // Increase decay to settle faster
        d3VelocityDecay={0.4} // Standard friction
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

// NEW "BOARD" VERSION
function GraphExplorerPage() {
  return (
    <div className="page-container graph-explorer-container">
      <div className="graph-header-light">
        <h1>Talent Ecosystem Graph</h1>
        <p>A living visualization of the connections between our talent, their skills, and our client partners' needs. Drag nodes to explore and hover to highlight relationships.</p>
      </div>
      {/* Wrap the graph component in our new 'board' div */}
      <div className="graph-board">
        <KnowledgeGraph />
      </div>
    </div>
  );
}

export default GraphExplorerPage;