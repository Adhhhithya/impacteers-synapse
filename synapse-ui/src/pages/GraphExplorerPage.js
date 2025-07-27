// src/pages/GraphExplorerPage.js
import React from 'react';
import ReactFlow, { MiniMap, Controls, Background } from 'reactflow';
import useSWR from 'swr'; // We'll use a new data fetching library for this
import 'reactflow/dist/style.css';
import '../App.css';

// Define colors for different node types
const nodeColorMap = {
  Candidate: '#007bff',
  Project: '#28a745',
  Skill: '#ffc107',
  JobRole: '#dc3545',
};

// SWR needs a fetcher function
const fetcher = (url) => fetch(url).then((res) => res.json());

// Main Graph component
const KnowledgeGraph = () => {
  const { data, error } = useSWR('http://localhost:8000/graph-explorer/data', fetcher);

  if (error) return <div className="page-container">Failed to load graph data.</div>;
  if (!data) return <div className="page-container">Loading graph...</div>;

  // Convert API data to the format React Flow needs
  const flowNodes = data.nodes.map((node) => ({
    id: node.id,
    data: { label: node.properties.name || 'Unnamed' },
    position: { x: Math.random() * 800, y: Math.random() * 600 },
    style: {
      background: nodeColorMap[node.label] || '#6c757d',
      color: '#fff',
      fontWeight: 'bold',
      padding: '10px 15px',
      borderRadius: '5px',
    },
  }));

  const flowEdges = data.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    type: 'smoothstep',
    animated: true,
  }));

  return (
    <ReactFlow
      nodes={flowNodes}
      edges={flowEdges}
      fitView
      className="knowledge-graph"
    >
      <Controls />
      <MiniMap />
      <Background variant="dots" gap={12} size={1} />
    </ReactFlow>
  );
};


function GraphExplorerPage() {
  return (
    <div className="page-container" style={{ height: 'calc(100vh - 100px)', padding: 0 }}>
      <KnowledgeGraph />
    </div>
  );
}

export default GraphExplorerPage;