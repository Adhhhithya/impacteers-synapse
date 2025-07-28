// src/pages/DashboardPage.js

import React from 'react';
import '../App.css';

// Simple placeholder component
const Widget = ({ title, children, className = '' }) => (
  <div className={`widget ${className}`}>
    <h3 className="widget-title">{title}</h3>
    <div className="widget-content">
      {children || <p style={{textAlign: 'center', color: '#555'}}>Data will be loaded here.</p>}
    </div>
  </div>
);

function DashboardPage() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-grid">
        <Widget title="Overview Cards" className="overview-cards">
          {/* We will build this out later */}
        </Widget>
        <Widget title="Candidate Viewer" className="candidate-viewer-small">
          {/* We will build this out later */}
        </Widget>
        <Widget title="Talent Ecosystem" className="talent-ecosystem">
          {/* We will build this out later */}
        </Widget>
        <Widget title="Candidate Viewer" className="candidate-viewer-main">
          {/* We will build this out later */}
        </Widget>
        <Widget title="Role Management" className="role-management">
          {/* We will build this out later */}
        </Widget>
        <Widget title="Pipeline Tracker (ATS View)" className="pipeline-tracker">
          {/* We will build this out later */}
        </Widget>
      </div>
    </div>
  );
}

export default DashboardPage;