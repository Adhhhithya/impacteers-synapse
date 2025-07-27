// src/pages/MatcherPage.js - UPDATED TO DISPLAY SCORE

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../App.css';
import axios from 'axios';
import MatchGraph from '../MatchGraph';

function MatcherPage() {
  const location = useLocation();
  const [jobRoles, setJobRoles] = useState([]);
  const [selectedJobRoleId, setSelectedJobRoleId] = useState('');
  const [matchedCandidates, setMatchedCandidates] = useState([]);
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => {
    const fetchJobRoles = async () => {
      try {
        const response = await axios.get('http://localhost:8000/job-roles');
        setJobRoles(response.data);
      } catch (error) {
        console.error("Failed to fetch job roles:", error);
      }
    };
    fetchJobRoles();
  }, []);

  useEffect(() => {
    const preselectedRoleId = location.state?.preselectedJobRoleId;
    if (preselectedRoleId) {
      setSelectedJobRoleId(preselectedRoleId);
      handleFindMatch(preselectedRoleId);
    }
  }, [location.state]);

  const handleFindMatch = async (roleIdToSearch) => {
    const finalRoleId = roleIdToSearch || selectedJobRoleId;
    if (!finalRoleId) {
      alert("Please select a job role to match against.");
      return;
    }
    setIsLoading(true);
    setSearched(true);
    setMatchedCandidates([]);
    setRequiredSkills([]);
    setSelectedCandidate(null);
    try {
      const url = `http://localhost:8000/match/by-job-role/${finalRoleId}`;
      const response = await axios.get(url);
      setMatchedCandidates(response.data.matched_candidates);
      setRequiredSkills(response.data.required_skills);
    } catch (error) {
      console.error("Error finding matches:", error);
      alert("Failed to fetch matches. Please check the console.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClear = () => {
    setSelectedJobRoleId('');
    setMatchedCandidates([]);
    setRequiredSkills([]);
    setSearched(false);
    setSelectedCandidate(null);
  };

  const handleCandidateClick = (candidateName) => {
    setSelectedCandidate(prev => (prev === candidateName ? null : candidateName));
  };

  return (
    <main className="App-main">
      <div className="matcher-container">
        <h2>Match Candidates to a Job Role</h2>
        <p>Select a job role from the database, and the system will find candidates with a calculated match score based on their direct and project-based skills.</p>
        <div className="job-role-select-section">
          <select value={selectedJobRoleId} onChange={(e) => setSelectedJobRoleId(e.target.value)} className="job-role-select">
            <option value="" disabled>-- Select a Job Role --</option>
            {jobRoles.map(role => (<option key={role.id} value={role.id}>{role.name}</option>))}
          </select>
        </div>
        <div className="matcher-actions">
          <button onClick={() => handleFindMatch()} disabled={isLoading || !selectedJobRoleId} className="find-match-button">
            {isLoading ? 'Searching...' : 'Find Match for Role'}
          </button>
          <button onClick={handleClear} className="clear-button">Clear</button>
        </div>
      </div>
      <div className="results-container">
        <h3>Matching Candidates</h3>
        {isLoading ? (<p>Loading results...</p>) : searched ? (
            matchedCandidates.length > 0 ? (
            <div>
              <p className="skills-display"><strong>Required Skills for Role:</strong> {requiredSkills.join(', ')}</p>
              <ul>
                {matchedCandidates.map(candidate => (
                  // ======================================================================
                  // === THE ONLY PART THAT CHANGES: The list item rendering ===
                  // ======================================================================
                  <li key={candidate.name} onClick={() => handleCandidateClick(candidate.name)} className={selectedCandidate === candidate.name ? 'selected' : ''}>
                    <div className="candidate-info">
                      <strong>{candidate.name}</strong> - {candidate.title}
                    </div>
                    <div className="candidate-score">
                      <strong>Match Score: {candidate.total_score}</strong> / {candidate.max_score}
                    </div>
                    {selectedCandidate === candidate.name && (
                      <div className="graph-wrapper">
                        <h4>Why is {candidate.name} a match?</h4>
                        <MatchGraph candidateName={candidate.name} skills={requiredSkills} />
                      </div>
                    )}
                  </li>
                  // ======================================================================
                ))}
              </ul>
            </div>
            ) : (<p>No candidates found for this job role.</p>)
        ) : (<p>Select a job role and click "Find Match" to see results.</p>)}
      </div>
    </main>
  );
}

export default MatcherPage;