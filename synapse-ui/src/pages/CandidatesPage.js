// src/pages/CandidatesPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await axios.get('http://localhost:8000/candidates');
        setCandidates(response.data);
      } catch (error) {
        console.error("Failed to fetch candidates:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  if (isLoading) {
    return <div className="page-container">Loading candidates...</div>;
  }

  return (
    <div className="page-container">
      <h1>Registered Candidates</h1>
      <ul className="item-list">
        {candidates.map(candidate => (
          <li key={candidate.id} className="item-card">
            <h3>{candidate.name}</h3>
            <p>{candidate.title}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CandidatesPage;