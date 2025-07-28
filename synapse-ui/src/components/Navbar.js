// src/components/Navbar.js
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        Impacteers Synapse
      </Link>
      <ul className="navbar-nav">
         <li><NavLink to="/">Dashboard</NavLink></li> {/* Changed Home to Dashboard */}
        <li><NavLink to="/matcher">Matcher</NavLink></li>
        <li><NavLink to="/job-roles">Job Roles</NavLink></li>
        <li><NavLink to="/candidates">Candidates</NavLink></li>
        <li><NavLink to="/add-candidate">Add Candidate</NavLink></li>
        <li><NavLink to="/graph-explorer">Explorer</NavLink></li> {/* <-- ADD NEW LINK */}
        
      </ul>
    </nav>
  );
}

export default Navbar;