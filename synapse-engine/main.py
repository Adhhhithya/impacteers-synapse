# main.py - UPDATED FOR RADAR CHART DATA

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from neo4j import GraphDatabase
import spacy
from pydantic import BaseModel

# --- Database & NLP Model Loading ---
URI = "neo4j+s://6cd72b90.databases.neo4j.io"
AUTH = ("neo4j", "bJMxl9r5vPKP8Z9HcequIcWIERLK8Yg5uz8BJOMM5j4")
driver = GraphDatabase.driver(URI, auth=AUTH)
nlp = spacy.load("en_core_web_sm")
KNOWN_SKILLS = [
    "Python", "SQL", "FastAPI", "User Research", "Tableau", "Java", "JavaScript",
    "React", "Node.js", "Data Analysis", "Machine Learning", "Project Management"
]

# --- FastAPI App Initialization ---
app = FastAPI(
    title="Impacteers Synapse API",
    description="The core intelligence engine for smart talent matching.",
    version="1.6.0", # Version bump for Radar Chart
)
# ... (CORS middleware is the same)
origins = ["http://localhost:3000"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class ProcessTextRequest(BaseModel):
    name: str; title: str; text: str; manual_skills: list[str] = []

# --- Data Seeding (No changes) ---
@app.on_event("startup")
async def seed_database():
    with driver.session() as session:
        result = session.run("MATCH (n:Skill) RETURN count(n) as count").single()
        if result["count"] == 0:
            print("Database is empty. Seeding with full data model...")
            session.run("UNWIND $skills_list as skill_name CREATE (:Skill {name: skill_name})", skills_list=KNOWN_SKILLS)
            session.run("""
                // Create Base Nodes
                CREATE (e:Candidate {name: 'Elena', title: 'Data Scientist'}),
                       (j:Candidate {name: 'John', title: 'Backend Developer'}),
                       (p1:Project {name: 'Customer Churn Prediction'})

                // Create Job Roles with a STANDARD of 5 top_skills
                CREATE (jr1:JobRole {
                           name: 'Data Analyst', 
                           description: 'Analyzes data to provide insights.',
                           top_skills: ['SQL', 'Tableau', 'Python', 'Data Analysis', 'Project Management'] 
                       }),
                       (jr2:JobRole {
                           name: 'Python Backend Developer', 
                           description: 'Builds server-side applications.',
                           top_skills: ['Python', 'FastAPI', 'SQL', 'JavaScript', 'React']
                       })
                
                // Find all necessary skills
                WITH e, j, p1, jr1, jr2
                MATCH (s_py:Skill {name: 'Python'}), (s_sql:Skill {name: 'SQL'}), 
                      (s_tab:Skill {name: 'Tableau'}), (s_fa:Skill {name: 'FastAPI'}), 
                      (s_da:Skill {name: 'Data Analysis'}), (s_pm:Skill {name: 'Project Management'}),
                      (s_js:Skill {name: 'JavaScript'}), (s_react:Skill {name: 'React'})
                
                // Create Candidate -> Skill relationships
                MERGE (e)-[:HAS_SKILL]->(s_py)
                MERGE (e)-[:HAS_SKILL]->(s_da)
                MERGE (e)-[:HAS_SKILL]->(s_pm) // Give Elena Project Management
                MERGE (j)-[:HAS_SKILL]->(s_py)
                MERGE (j)-[:HAS_SKILL]->(s_fa)
                MERGE (j)-[:HAS_SKILL]->(s_sql)
                MERGE (j)-[:HAS_SKILL]->(s_js) // Give John JS
                MERGE (j)-[:HAS_SKILL]->(s_react) // Give John React

                // Create Candidate -> Project relationship
                MERGE (e)-[:WORKED_ON]->(p1)

                // Create Project -> Skill relationships
                MERGE (p1)-[:USES_SKILL]->(s_py)
                MERGE (p1)-[:USES_SKILL]->(s_tab)
                MERGE (p1)-[:USES_SKILL]->(s_sql)

                // Create JobRole -> Skill relationships (ALL required skills)
                MERGE (jr1)-[:REQUIRES_SKILL]->(s_py)
                MERGE (jr1)-[:REQUIRES_SKILL]->(s_sql)
                MERGE (jr1)-[:REQUIRES_SKILL]->(s_tab)
                MERGE (jr1)-[:REQUIRES_SKILL]->(s_da)
                MERGE (jr1)-[:REQUIRES_SKILL]->(s_pm)
                MERGE (jr2)-[:REQUIRES_SKILL]->(s_py)
                MERGE (jr2)-[:REQUIRES_SKILL]->(s_fa)
                MERGE (jr2)-[:REQUIRES_SKILL]->(s_sql)
                MERGE (jr2)-[:REQUIRES_SKILL]->(s_js)
                MERGE (jr2)-[:REQUIRES_SKILL]->(s_react)
            """)
            print("Data seeding complete.")

# --- API Endpoints ---
@app.get("/")
def read_root():
    return {"message": "Welcome to the Synapse Engine! Version 1.6 with Radar Charts."}

# ======================================================================
# === THE NEW, MORE DETAILED MATCHING ENDPOINT ===
# ======================================================================
@app.get("/match/by-job-role/{job_role_id}")
def match_candidates_by_job_role(job_role_id: str):
    """
    Finds candidates and returns a detailed breakdown of their score for each required skill.
    """
    query = """
        // 1. Find the job role and its required skills
        MATCH (jr:JobRole)-[:REQUIRES_SKILL]->(s:Skill)
        WHERE elementId(jr) = $job_role_id
        WITH jr, collect(s) as required_skills

        // 2. Find all candidates
        MATCH (c:Candidate)

        // 3. For each candidate, create a list of their scores for each skill
        WITH c, required_skills, [sk IN required_skills | {
            skill: sk.name,
            score: CASE
                WHEN (c)-[:HAS_SKILL]->(sk) THEN 2
                WHEN (c)-[:WORKED_ON]->(:Project)-[:USES_SKILL]->(sk) THEN 1
                ELSE 0
            END
        }] AS skill_scores
        
        // 4. Calculate the total score from the list of scores
        WITH c, skill_scores, reduce(total = 0, s IN skill_scores | total + s.score) AS total_score,
             size(required_skills) * 2 AS max_score
        
        // 5. Filter out candidates with a score of 0
        WHERE total_score > 0

        // 6. Return all the detailed data
        RETURN c.name AS name,
               c.title AS title,
               total_score,
               max_score,
               skill_scores // <-- THE NEW, IMPORTANT DATA
        ORDER BY total_score DESC
    """
    with driver.session() as session:
        results = session.run(query, job_role_id=job_role_id).data()
    
    skills_query = "MATCH (jr:JobRole) WHERE elementId(jr) = $job_role_id MATCH (jr)-[:REQUIRES_SKILL]->(s:Skill) RETURN collect(s.name) as required_skills"
    with driver.session() as session:
        skills_result = session.run(skills_query, job_role_id=job_role_id).single()
        required_skills = skills_result["required_skills"] if skills_result else []

    return {
        "job_role_id": job_role_id,
        "required_skills": required_skills,
        "matched_candidates": results
    }
# ======================================================================

# ... (All other endpoints: /job-roles, /candidates, etc. remain unchanged) ...
@app.get("/job-roles")
def get_job_roles(): # ...
    with driver.session() as session: return session.run("MATCH (jr:JobRole) RETURN jr.name as name, jr.description as description, elementId(jr) as id").data()
@app.get("/candidates")
def get_candidates(): # ...
    with driver.session() as session: return session.run("MATCH (c:Candidate) RETURN c.name as name, c.title as title, elementId(c) as id").data()
@app.get("/skills/autocomplete")
def autocomplete_skills(q: str = ""): # ...
    if not q: return []
    query = "MATCH (s:Skill) WHERE toLower(s.name) STARTS WITH toLower($query) RETURN s.name as name LIMIT 10"
    with driver.session() as session: return session.run(query, query=q).data()
@app.post("/process/text")
def process_text_and_create_candidate(request: ProcessTextRequest): # ...
    nlp_skills = {skill for skill in KNOWN_SKILLS if skill.lower() in request.text.lower()}
    all_skills = set(request.manual_skills).union(nlp_skills)
    with driver.session() as session:
        result = session.run("MERGE (c:Candidate {name: $name, title: $title}) WITH c UNWIND $skills as skill_name MATCH (s:Skill {name: skill_name}) MERGE (c)-[:HAS_SKILL]->(s) RETURN c, collect(s.name) as skills", name=request.name, title=request.title, skills=list(all_skills)).data()
    return {"status": "success", "processed_data": result}
@app.get("/candidate/{name}/path_to_skills")

@app.get("/candidate/{name}/path_to_skills")
def get_candidate_path_to_skills(name: str, skills: list[str] = Query(None)):
    if not skills: return {"nodes": [], "edges": []}
    query = "MATCH (c:Candidate {name: $name}) UNWIND $skills as skill_name MATCH (s:Skill {name: skill_name}) MATCH p = allShortestPaths((c)-[*]-(s)) WITH nodes(p) as path_nodes, relationships(p) as path_rels UNWIND path_nodes as n UNWIND path_rels as r RETURN collect(distinct {id: elementId(n), label: labels(n)[0], properties: properties(n)}) as nodes, collect(distinct {id: elementId(r), source: elementId(startNode(r)), target: elementId(endNode(r)), label: type(r)}) as edges"
    all_nodes, all_edges = {}, {}
    with driver.session() as session:
        for skill in skills:
            result = session.run(query, name=name, skills=[skill]).data()
            if result and result[0]['nodes']:
                for node in result[0]['nodes']: all_nodes[node['id']] = node
                for edge in result[0]['edges']: all_edges[edge['id']] = edge
    return {"nodes": list(all_nodes.values()), "edges": list(all_edges.values())}

@app.get("/graph-explorer/data")
def get_full_graph_data():
    """
    A simpler and more robust query to fetch all nodes and relationships
    for the graph explorer.
    """
    # This query first collects all nodes, then collects all relationships.
    # It's more reliable than trying to match paths, especially on small graphs.
    query = """
        MATCH (n)
        OPTIONAL MATCH (n)-[r]->(m)
        WITH collect(distinct n) as nodes, collect(distinct r) as rels
        UNWIND nodes as node
        RETURN collect(distinct {id: elementId(node), label: labels(node)[0], properties: properties(node)}) as nodes,
               [rel in rels WHERE rel IS NOT NULL | {id: elementId(rel), source: elementId(startNode(rel)), target: elementId(endNode(rel)), label: type(rel)}] as edges
    """
    with driver.session() as session:
        result = session.run(query).data()
    
    if result:
        return result[0]
    else:
        return {"nodes": [], "edges": []}
@app.on_event("shutdown")
def shutdown_event(): # ...
    driver.close()