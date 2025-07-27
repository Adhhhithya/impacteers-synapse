// src/pages/JobRolesPage.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function JobRolesPage() {
  const [jobRoles, setJobRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobRoles = async () => {
      try {
        const response = await axios.get('http://localhost:8000/job-roles');
        setJobRoles(response.data);
      } catch (error) {
        console.error("Failed to fetch job roles:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobRoles();
  }, []);

  const handleFindMatchesClick = (roleId, roleName) => {
    navigate('/matcher', { state: { preselectedJobRoleId: roleId, preselectedJobRoleName: roleName } });
  };

  if (isLoading) {
    return <div className="page-container">Loading job roles...</div>;
  }

  return (
    <div className="page-container">
      <h1>Available Job Roles</h1>
      <p>Explore the job roles currently defined in the system. Click "Find Matches" to see which candidates are a good fit.</p>
      <ul className="item-list">
        {jobRoles.map(role => (
          // This is the section to check carefully
          <li key={role.id} className="item-card">
            <h3>{role.name}</h3>
            <p>{role.description}</p>
            
            {/* THIS IS THE BUTTON THAT IS MISSING. IS IT HERE? */}
            <button 
              className="find-matches-for-role-button" 
              onClick={() => handleFindMatchesClick(role.id, role.name)}
            >
              Find Matches
            </button>

          </li>
        ))}
      </ul>
    </div>
  );
}

export default JobRolesPage;