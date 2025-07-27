// src/pages/AddCandidatePage.js - FINAL VERSION

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../App.css';

function AddCandidatePage() {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  // --- States for the autocomplete feature ---
  const [manualSkills, setManualSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  // This function fetches suggestions from our API endpoint
  const fetchSuggestions = useCallback(async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await axios.get(`http://localhost:8000/skills/autocomplete?q=${query}`);
      const filteredSuggestions = response.data.filter(s => !manualSkills.includes(s.name));
      setSuggestions(filteredSuggestions);
    } catch (error) {
      console.error("Failed to fetch skill suggestions:", error);
    }
  }, [manualSkills]);

  // Effect to call the fetch function when the user types
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchSuggestions(skillInput);
    }, 300); 
    
    return () => clearTimeout(debounceTimer);
  }, [skillInput, fetchSuggestions]);

  const handleAddManualSkill = (skill) => {
    if (!manualSkills.includes(skill)) {
      setManualSkills([...manualSkills, skill]);
    }
    setSkillInput('');
    setSuggestions([]);
  };

  const handleRemoveManualSkill = (skillToRemove) => {
    setManualSkills(manualSkills.filter(skill => skill !== skillToRemove));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name || !title) {
      setStatus({ type: 'error', message: 'Error: Name and Title fields are required.' });
      return;
    }
    setIsLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await axios.post('http://localhost:8000/process/text', {
        name: name,
        title: title,
        text: bio,
        manual_skills: manualSkills
      });

      const createdCandidate = response.data.processed_data[0];
      const candidateName = createdCandidate.c.name;
      const allSkills = createdCandidate.skills.join(', ');

      setStatus({ 
        type: 'success', 
        message: `Candidate "${candidateName}" created with skills: ${allSkills}.`,
        newCandidateName: candidateName 
      });
      
      setName('');
      setTitle('');
      setBio('');
      setManualSkills([]);

    } catch (error) {
      console.error("Failed to add candidate:", error);
      setStatus({ type: 'error', message: 'Error: Could not add candidate.' });
    } finally {
      setIsLoading(false);
    }
  };

  // DEBUGGING: This will print the contents of manualSkills every time the component re-renders
  console.log("Current manual skills state:", manualSkills);

  return (
    <div className="page-container">
      <h1>Add a New Candidate</h1>
      
      <form onSubmit={handleSubmit} className="item-card add-candidate-form">
        <div className="form-group">
          <label htmlFor="name">Candidate Name</label>
          <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Jane Doe" required />
        </div>
        <div className="form-group">
          <label htmlFor="title">Job Title</label>
          <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Full Stack Developer" required />
        </div>

        <div className="form-group">
          <label htmlFor="manual-skills">Manually Tag Skills</label>
          <div className="autocomplete-container">
            <input
              type="text"
              id="manual-skills"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              placeholder="Start typing a skill (e.g., Ja)"
            />
            {suggestions.length > 0 && (
              <ul className="suggestions-list">
                {suggestions.map(s => (
                  <li key={s.name} onClick={() => handleAddManualSkill(s.name)}>
                    {s.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="skill-tags-container" style={{ marginTop: '1rem', justifyContent: 'flex-start' }}>
            {manualSkills.map(skill => (
              <div key={skill} className="skill-tag">
                {skill}
                <span className="remove-tag" onClick={() => handleRemoveManualSkill(skill)}>x</span>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="bio">Bio / Resume Summary (for automatic skill extraction)</label>
          <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows="6" placeholder="Paste a paragraph about the candidate's experience and skills here..." />
        </div>

        <button type="submit" className="find-match-button" disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Add Candidate to Graph'}
        </button>
      </form>

      {status.message && (
        <div className={`status-message ${status.type}`}>
          <p>{status.message}</p>
          {status.type === 'success' && status.newCandidateName && (
            <Link to="/candidates" className="status-link">Go to Candidates Page</Link>

          )}
        </div>
      )}
    </div>
  );
}

export default AddCandidatePage;