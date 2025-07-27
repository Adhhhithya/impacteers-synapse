// src/pages/MatcherPage.js - FINAL VERSION WITH RADAR CHART

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import '../App.css';
import axios from 'axios';
import SkillRadarChart from '../components/SkillRadarChart'; // <-- IMPORT THE NEW CHART COMPONENT

function MatcherPage() {
  const location = useLocation();
  const [jobRoles, setJobRoles] = useState([]);
  const [selectedJobRoleId, setSelectedJobRoleId] = useState('');
  const [matchedCandidates, setMatchedCandidates] = useState([]);
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null); // Now stores the whole candidate object

  useEffect(() => {
    // ... (fetchJobRoles useEffect is unchanged)
    const fetchJobRoles = async () => {
      try {
        const response = await axios.get('http://localhost:8000/job-roles');
        setJobRoles(response.data);
      } catch (error) { console.error("Failed to fetch job roles:", error); }
    };
    fetchJobRoles();
  }, []);

  const handleFindMatch = useCallback(async (roleIdToSearch) => {
    // ... (This function logic is unchanged)
    const finalRoleId = roleIdToSearch || selectedJobRoleId;
    if (!finalRoleId) {
      alert("Please select a job role to match against.");
      return;
    }
    setIsLoading(true);
    setSearched(true);
    setMatchedCandidates([]);
    setRequiredSkills([]);
    setSelectedCandidate(null); // Clear selection on new search
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
  }, [selectedJobRoleId]);

  useEffect(() => {
    // ... (pre-selection useEffect is unchanged)
    const preselectedRoleId = location.state?.preselectedJobRoleId;
    if (preselectedRoleId) {
      setSelectedJobRoleId(preselectedRoleId);
      handleFindMatch(preselectedRoleId);
    }
  }, [location.state, handleFindMatch]);

  const handleClear = () => {
    // ... (this function is unchanged)
    setSelectedJobRoleId('');
    setMatchedCandidates([]);
    setRequiredSkills([]);
    setSearched(false);
    setSelectedCandidate(null);
  };

  // NEW: When we click a candidate, we store the whole object now
  const handleCandidateClick = (candidate) => {
    setSelectedCandidate(prev => (prev?.name === candidate.name ? null : candidate));
  };

  return (
    <main className="App-main">
      <div className="matcher-container">
        {/* ... (container header is unchanged) ... */}
        <h2>Match Candidates to a Job Role</h2>
        <p>Select a job role, and the system will find candidates with a calculated match score and skill breakdown.</p>
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
                <li key={candidate.name} onClick={() => handleCandidateClick(candidate)} className={selectedCandidate?.name === candidate.name ? 'selected' : ''}>
                  <div className="candidate-info">
                    <strong>{candidate.name}</strong> - {candidate.title}
                  </div>
                  <div className="candidate-score">
                    <strong>Match Score: {candidate.total_score}</strong> / {candidate.max_score}
                  </div>
                  {/* --- NEW: Conditionally render the chart --- */}
                  {selectedCandidate?.name === candidate.name && (
                    <div className="chart-wrapper">
                      <h4>Skill Breakdown for {candidate.name}</h4>
                      <div className="chart-container">
                        <SkillRadarChart 
                          skillsData={candidate.skill_scores} 
                          maxScore={2} 
                        />
                      </div>
                    </div>
                  )}
                </li>
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