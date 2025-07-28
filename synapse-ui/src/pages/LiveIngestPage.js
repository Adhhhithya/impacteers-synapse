// src/pages/LiveIngestPage.js - FINAL CORRECTED VERSION

import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../App.css';

function LiveIngestPage() {
  const [candidateName, setCandidateName] = useState('');
  const [candidateTitle, setCandidateTitle] = useState('');
  const [credlyUrl, setCredlyUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '', skills: [] });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!candidateName || !candidateTitle || !credlyUrl) {
      setStatus({ type: 'error', message: 'All fields are required.', skills: [] });
      return;
    }

    setIsLoading(true);
    setStatus({ type: '', message: '', skills: [] });

    try {
      const response = await axios.post('http://localhost:8000/ingest/credly-badge', {
        candidate_name: candidateName,
        candidate_title: candidateTitle,
        credly_url: credlyUrl,
      });

      setStatus({
        type: 'success',
        message: response.data.message,
        skills: response.data.extracted_skills
      });
      
      setCandidateName('');
      setCandidateTitle('');
      setCredlyUrl('');

    } catch (error) {
      console.error("Failed to ingest Credly badge:", error);
      const errorMessage = error.response?.data?.detail || 'An unknown error occurred.';
      setStatus({ type: 'error', message: `Error: ${errorMessage}`, skills: [] });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1>Live Credential Ingestion</h1>
      <p>
        Enter a candidate's name and a public Credly badge URL. The system will connect to Credly in real-time,
        verify the credential, and automatically populate the candidate's verified skills in the knowledge graph.
      </p>

      <form onSubmit={handleSubmit} className="item-card add-candidate-form">
        <div className="form-group">
          <label htmlFor="name">Candidate Name</label>
          <input
            type="text"
            id="name"
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
            placeholder="e.g., Jane Doe"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="title">Candidate Title</label>
          <input
            type="text"
            id="title"
            value={candidateTitle}
            onChange={(e) => setCandidateTitle(e.target.value)}
            placeholder="e.g., AWS Cloud Specialist"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="credly-url">Public Credly Badge URL</label>
          <input
            type="url"
            id="credly-url"
            value={credlyUrl}
            onChange={(e) => setCredlyUrl(e.target.value)} // <-- THE FIX IS HERE
            placeholder="https://www.credly.com/badges/..."
            required
          />
        </div>

        <button type="submit" className="find-match-button" disabled={isLoading}>
          {isLoading ? 'Ingesting...' : 'Ingest & Verify Credential'}
        </button>
      </form>

      {status.message && (
        <div className={`status-message ${status.type}`}>
          <p>{status.message}</p>
          {status.type === 'success' && status.skills.length > 0 && (
            <div className="extracted-skills-list">
              <strong>Verified Skills Added:</strong>
              <ul>
                {status.skills.map(skill => <li key={skill}>{skill}</li>)}
              </ul>
            </div>
          )}
           {status.type === 'success' && (
            <Link to="/graph-explorer" className="status-link">
              Go to Graph Explorer to see the new connections!
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default LiveIngestPage;