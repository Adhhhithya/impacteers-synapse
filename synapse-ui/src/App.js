// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import JobRolesPage from './pages/JobRolesPage';
import CandidatesPage from './pages/CandidatesPage';
import MatcherPage from './pages/MatcherPage';
import AddCandidatePage from './pages/AddCandidatePage';
import GraphExplorerPage from './pages/GraphExplorerPage'; // <-- IMPORT NEW PAGE
import './App.css';
import DashboardPage from './pages/DashboardPage';
function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          
          <Route path="/matcher" element={<MatcherPage />} />
          <Route path="/job-roles" element={<JobRolesPage />} />
          <Route path="/candidates" element={<CandidatesPage />} />
          <Route path="/add-candidate" element={<AddCandidatePage />} />
          <Route path="/graph-explorer" element={<GraphExplorerPage />} /> {/* <-- ADD NEW ROUTE */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/matcher" element={<MatcherPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;