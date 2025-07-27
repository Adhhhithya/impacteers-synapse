# **Impacteers Synapse: The Intelligent Talent Graph**

**Impacteers Synapse** is a full-stack web application designed to be the core intelligence engine for a modern talent ecosystem. It moves beyond simple keyword matching by representing candidates, skills, projects, and job roles as a dynamic knowledge graph. This allows the system to perform nuanced, context-aware matching and uncover high-potential candidates that traditional systems would miss.

## **Core Features**

*   **Intelligent Matching Engine:** Finds candidates for specific job roles by analyzing both their direct skills and skills inferred from their project experience.
*   **Weighted Scoring System:** Ranks matched candidates based on a weighted score, giving more points for explicit expertise (`HAS_SKILL`) than for inferred practical experience (`WORKED_ON` -> `USES_SKILL`).
*   **NLP-Powered Candidate Ingestion:** Features a user-friendly UI where new candidate bios can be pasted. The backend uses a spaCy NLP pipeline to automatically extract skills and populate the knowledge graph.
*   **Interactive Skill Tagging:** An autocomplete-enabled input allows for fast and accurate manual tagging of skills, which are combined with NLP-extracted skills.
*   **Dynamic Path Visualization:** When a candidate is matched, the system displays an interactive graph (using React Flow) that visually explains *why* they are a good fit by showing the paths to the required skills.
*   **Knowledge Graph Explorer:** A dedicated "god-mode" page that renders a large portion of the entire graph, allowing users to freely explore the interconnected talent ecosystem.
*   **Multi-Page "Explorer" UI:** The application is structured with separate, navigable pages for viewing all Job Roles and all Candidates currently in the system.

## **Technology Stack**

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Database** | **Neo4j AuraDB** | Cloud-hosted native graph database to store the knowledge graph. |
| **Backend** | **Python 3** & **FastAPI** | For building a high-performance, modern, and well-documented API. |
| **NLP**| **spaCy**| Industry-standard library for natural language processing to extract skills. |
| **Frontend** | **React.js**| For building a dynamic, component-based user interface. |
| **Routing** | **React Router** | For handling client-side navigation between different pages. |
| **Data Fetching**| **Axios** & **SWR** | For making API calls from the frontend to the backend. |
| **Visualization**| **React Flow**| For rendering all interactive graphs and data visualizations. |

## **System Architecture**

The application follows a standard three-tier architecture:

1.  **Frontend (`synapse-ui`):** A React single-page application that provides the entire user interface. It runs on `http://localhost:3000` and communicates with the backend via API calls.
2.  **Backend (`synapse-engine`):** A Python FastAPI server that contains all the business logic. It processes requests from the frontend, queries the database using the Cypher language, and runs the NLP pipeline. It runs on `http://localhost:8000`.
3.  **Database (Neo4j AuraDB):** A fully managed graph database in the cloud. It is the single source of truth for all data and is accessed only by the backend server.

## **Getting Started: Local Development Setup**

This guide will walk a new developer through setting up the project on their local machine.

### **Prerequisites**

*   **Git:** For cloning the repository.
*   **Python:** Version 3.9 or higher.
*   **Node.js:** Version 16 or higher, which includes `npm`.
*   **Neo4j AuraDB Account:** A free account is required to host the database.

### **Step 1: Set Up the Database**

1.  Sign up for a free **Neo4j AuraDB** account and create a new Free Tier instance.
2.  After creation, find and securely save your database credentials:
    *   **Connection URI** (e.g., `neo4j+s://xxxxxx.databases.neo4j.io`)
    *   **Password**

### **Step 2: Set Up the Backend (`synapse-engine`)**

```bash
# 1. Clone the repository
git clone https://github.com/YourUsername/impacteers-synapse-project.git
cd impacteers-synapse-project

# 2. Navigate to the backend directory
cd synapse-engine

# 3. Create and activate a Python virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

# 4. Install the required packages
# (Assuming a requirements.txt will be created. If not, install manually)
# pip install -r requirements.txt
pip install fastapi "uvicorn[standard]" neo4j spacy pydantic

# 5. Download the spaCy language model
python -m spacy download en_core_web_sm

# 6. Configure database credentials
# In the synapse-engine folder, find the `main.py` file.
# Locate the URI and AUTH variables and replace them with your AuraDB credentials.
# URI = "neo4j+s://YOUR_URI_HERE"
# AUTH = ("neo4j", "YOUR_PASSWORD_HERE")

# 7. Run the backend server
python -m uvicorn main:app --reload
```
The backend server should now be running on `http://localhost:8000`. The first time it runs, it will automatically seed the cloud database with sample data.

### **Step 3: Set Up the Frontend (`synapse-ui`)**

```bash
# 1. Open a NEW terminal window.
# 2. Navigate to the frontend directory from the project root
cd impacteers-synapse-project/synapse-ui

# 3. Install the required npm packages
npm install

# 4. Run the frontend development server
npm start
```
Your default web browser should automatically open to `http://localhost:3000`, where you can see and interact with the running application.