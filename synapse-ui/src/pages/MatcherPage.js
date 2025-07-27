// src/pages/MatcherPage.js - FINAL CLEANED UP VERSION

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import '../App.css';
import axios from 'axios';

// We have removed the old 'MatchGraph' import

function MatcherPage() {
  const location = useLocation();
  const [jobRoles, setJobRoles] = useState([]);
  const [selectedJobRoleId, setSelectedJobRoleId] = useState('');
  const [matchedCandidates, setMatchedCandidates] = useState([]);
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Fetch all available job roles when the page loads
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

  // Wrap handleFindMatch in useCallback to stabilize the function
  const handleFindMatch = useCallback(async (roleIdToSearch) => {
    const finalRoleId = roleIdToSearch || selectedJobRoleId;
    if (!finalRoleId) {
      alert("Please select a job role to match against.");
      return;
    }

    setIsLoading(true);
    setSearched(true);
    setMatchedCandidates([]);
    setRequiredSkills([]);

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
  }, [selectedJobRoleId]); // Dependency is the state it uses

  // This useEffect runs when the page is loaded via a link (e.g., from the Job Roles page)
  useEffect(() => {
    const preselectedRoleId = location.state?.preselectedJobRoleId;
    if (preselectedRoleId) {
      setSelectedJobRoleId(preselectedRoleId);
      handleFindMatch(preselectedRoleId);
    }
  }, [location.state, handleFindMatch]); // Add handleFindMatch to dependency array

  // Function to clear the search results and selection
  const handleClear = () => {
    setSelectedJobRoleId('');
    setMatchedCandidates([]);
    setRequiredSkills([]);
    setSearched(false);
  };

  return (
    <main className="App-main">
      <div className="matcher-container">
        <h2>Match Candidates to a Job Role</h2>
        <p>Select a job role from the database, and the system will find candidates with a calculated match score.</p>
        
        <div className="job-role-select-section">
          <select value={selectedJobRoleId} onChange={(e) => setSelectedJobRoleId(e.target.value)} className="job-role-select">
            <option value="" disabled>-- Select a Job Role --</option>
            {jobRoles.map(role => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
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
        {isLoading ? (
          <p>Loading results...</p>
        ) : searched ? (
            matchedCandidates.length > 0 ? (
            <div>
              <p className="skills-display"><strong>Required Skills for Role:</strong> {requiredSkills.join(', ')}</p>
              <ul>
                {matchedCandidates.map(candidate => (
                  <li key={candidate.name}>
                    <div className="candidate-info">
                      <strong>{candidate.name}</strong> - {candidate.title}
                    </div>
                    <div className="candidate-score">
                      <strong>Match Score: {candidate.total_score}</strong> / {candidate.max_score}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            ) : (
              <p>No candidates found for this job role.</p>
            )
        ) : (
          <p>Select a job role and click "Find Match" to see results.</p>
        )}
      </div>
    </main>
  );
}

export default MatcherPage;