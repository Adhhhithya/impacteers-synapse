// src/MatchGraph.js
import React, { useEffect, useState } from 'react';
import ReactFlow, { MiniMap, Controls, Background } from 'reactflow';
import 'reactflow/dist/style.css';
import axios from 'axios';

const nodeColorMap = {
  Candidate: '#007bff',
  Project: '#28a745',
  Skill: '#ffc107',
};

function MatchGraph({ candidateName, skills }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  useEffect(() => {
    const fetchGraphData = async () => {
      if (!candidateName || skills.length === 0) return;

      const API_BASE_URL = 'http://localhost:8000';
      const params = new URLSearchParams();
      skills.forEach(skill => params.append('skills', skill));
      const url = `${API_BASE_URL}/candidate/${candidateName}/path_to_skills?${params.toString()}`;

      try {
        const response = await axios.get(url);
        const { nodes: apiNodes, edges: apiEdges } = response.data;

        // Convert API data to the format React Flow needs
        const flowNodes = apiNodes.map((node, index) => ({
          id: node.id,
          data: { label: node.properties.name },
          position: { x: index * 200, y: Math.random() * 150 }, // Simple initial positioning
          style: { 
            background: nodeColorMap[node.label] || '#cccccc', 
            color: '#fff',
            fontWeight: 'bold'
          },
        }));

        const flowEdges = apiEdges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          animated: true,
        }));
        
        setNodes(flowNodes);
        setEdges(flowEdges);

      } catch (error) {
        console.error("Failed to fetch graph data:", error);
      }
    };

    fetchGraphData();
  }, [candidateName, skills]);

  return (
    <div style={{ height: '300px', width: '100%', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '5px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

export default MatchGraph;