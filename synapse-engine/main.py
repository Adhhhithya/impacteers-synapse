# main.py - FINAL, STABLE, & CORRECTED VERSION

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from neo4j import GraphDatabase
import spacy
from pydantic import BaseModel
import httpx # Library for making HTTP requests

# --- Database & NLP Model Loading ---
# IMPORTANT: Replace these placeholders with your actual AuraDB credentials
URI = "neo4j+s://6cd72b90.databases.neo4j.io"
AUTH = ("neo4j", "bJMxl9r5vPKP8Z9HcequIcWIERLK8Yg5uz8BJOMM5j4")

driver = GraphDatabase.driver(URI, auth=AUTH)
nlp = spacy.load("en_core_web_sm")
KNOWN_SKILLS = [
    "Python", "SQL", "FastAPI", "User Research", "Tableau", "Java", "JavaScript",
    "React", "Node.js", "Data Analysis", "Machine Learning", "Project Management",
    "Cloud Computing", "AWS", "Security" # Added more skills for Credly demo
]

# --- FastAPI App Initialization ---
app = FastAPI(
    title="Impacteers Synapse API",
    description="The core intelligence engine for smart talent matching.",
    version="2.1.0", # Final Version with Live Ingestion
)
origins = ["http://localhost:3000"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- Pydantic Models for Request Bodies ---
class ProcessTextRequest(BaseModel):
    name: str
    title: str
    text: str
    manual_skills: list[str] = []

class CredlyRequest(BaseModel):
    candidate_name: str
    candidate_title: str
    credly_url: str

# --- Data Seeding (Robust Version) ---
@app.on_event("startup")
async def seed_database():
    with driver.session() as session:
        result = session.run("MATCH (s:Skill) RETURN count(s) as count").single()
        if result["count"] == 0:
            print("Database is empty. Seeding with full data model...")
            # Step 1: Create all known skills first to avoid race conditions
            session.run("UNWIND $skills_list as skill_name MERGE (:Skill {name: skill_name})", skills_list=KNOWN_SKILLS)
            
            # Step 2: Create all other sample nodes and relationships
            session.run("""
                MERGE (e:Candidate {name: 'Elena', title: 'Data Scientist'})
                MERGE (j:Candidate {name: 'John', title: 'Backend Developer'})
                MERGE (p1:Project {name: 'Customer Churn Prediction'})
                MERGE (jr1:JobRole {name: 'Data Analyst', description: 'Analyzes data to provide insights.'})
                MERGE (jr2:JobRole {name: 'Python Backend Developer', description: 'Builds server-side applications.'})
                
                WITH e, j, p1, jr1, jr2
                MATCH (s_py:Skill {name: 'Python'}), (s_sql:Skill {name: 'SQL'}), 
                      (s_tab:Skill {name: 'Tableau'}), (s_fa:Skill {name: 'FastAPI'})

                MERGE (e)-[:HAS_SKILL]->(s_py)
                MERGE (j)-[:HAS_SKILL]->(s_py)
                MERGE (j)-[:HAS_SKILL]->(s_fa)
                MERGE (e)-[:WORKED_ON]->(p1)
                MERGE (p1)-[:USES_SKILL]->(s_py)
                MERGE (p1)-[:USES_SKILL]->(s_tab)
                MERGE (p1)-[:USES_SKILL]->(s_sql)
                MERGE (jr1)-[:REQUIRES_SKILL]->(s_py)
                MERGE (jr1)-[:REQUIRES_SKILL]->(s_sql)
                MERGE (jr1)-[:REQUIRES_SKILL]->(s_tab)
                MERGE (jr2)-[:REQUIRES_SKILL]->(s_py)
                MERGE (jr2)-[:REQUIRES_SKILL]->(s_fa)
            """)
            print("Data seeding complete.")

# --- API Endpoints ---
@app.get("/")
def read_root():
    return {"message": "Welcome to the Synapse Engine! Final Version with Live Ingestion."}

@app.post("/ingest/credly-badge")
async def ingest_credly_badge(request: CredlyRequest):
    if not request.credly_url.startswith("https://www.credly.com/badges/"):
        raise HTTPException(status_code=400, detail="Invalid Credly badge URL.")
    
    base_url = request.credly_url.split('?')[0].replace('/json', '')
    json_url = f"{base_url}/json"

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(json_url, follow_redirects=True)
            response.raise_for_status()
            badge_data = response.json()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=exc.response.status_code, detail=f"Credly server returned an error: {exc.response.text}")
        except httpx.RequestError as exc:
            raise HTTPException(status_code=400, detail=f"Failed to fetch badge data from URL: {exc}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing badge data: {str(e)}")

    cert_name = badge_data.get("name")
    issuing_org = badge_data.get("issuer", {}).get("name")
    validated_skills = [skill.get("name") for skill in badge_data.get("skills", []) if skill.get("name")]

    if not cert_name or not issuing_org:
        raise HTTPException(status_code=400, detail="Could not extract certification name or issuer from badge data.")

    query = """
        MERGE (c:Candidate {name: $c_name})
        ON CREATE SET c.title = $c_title
        MERGE (cert:Certification {name: $cert_name})
        ON CREATE SET cert.issuingOrg = $issuing_org, cert.verifyURL = $url
        MERGE (c)-[:HAS_CERTIFICATION]->(cert)
        WITH cert
        UNWIND $skills as skill_name
        MERGE (s:Skill {name: skill_name})
        MERGE (cert)-[:VALIDATES_SKILL]->(s)
    """
    with driver.session() as session:
        session.run(query, 
            c_name=request.candidate_name, c_title=request.candidate_title,
            cert_name=cert_name, issuing_org=issuing_org,
            url=request.credly_url, skills=validated_skills
        )

    return {"status": "success", "message": f"Successfully ingested '{cert_name}' for {request.candidate_name}.", "extracted_skills": validated_skills}

@app.get("/job-roles")
def get_job_roles():
    with driver.session() as session:
        return session.run("MATCH (jr:JobRole) RETURN jr.name as name, jr.description as description, elementId(jr) as id").data()

@app.get("/candidates")
def get_candidates():
    with driver.session() as session:
        return session.run("MATCH (c:Candidate) RETURN c.name as name, c.title as title, elementId(c) as id").data()

@app.get("/skills/autocomplete")
def autocomplete_skills(q: str = ""):
    if not q: return []
    query = "MATCH (s:Skill) WHERE toLower(s.name) STARTS WITH toLower($query) RETURN s.name as name LIMIT 10"
    with driver.session() as session:
        return session.run(query, query=q).data()

@app.post("/process/text")
def process_text_and_create_candidate(request: ProcessTextRequest):
    nlp_skills = {skill for skill in KNOWN_SKILLS if skill.lower() in request.text.lower()}
    all_skills = set(request.manual_skills).union(nlp_skills)
    with driver.session() as session:
        session.run("MERGE (c:Candidate {name: $name, title: $title}) WITH c UNWIND $skills as skill_name MATCH (s:Skill {name: skill_name}) MERGE (c)-[:HAS_SKILL]->(s) RETURN c, collect(s.name) as skills", name=request.name, title=request.title, skills=list(all_skills))
    return {"status": "success"}

@app.get("/match/by-job-role/{job_role_id}")
def match_candidates_by_job_role(job_role_id: str):
    query = "MATCH (jr:JobRole)-[:REQUIRES_SKILL]->(s:Skill) WHERE elementId(jr) = $job_role_id WITH jr, collect(s) as required_skills MATCH (c:Candidate) WITH c, required_skills, reduce(score = 0, sk IN required_skills | score + CASE WHEN (c)-[:HAS_CERTIFICATION]->(:Certification)-[:VALIDATES_SKILL]->(sk) THEN 4 WHEN (c)-[:HAS_SKILL]->(sk) THEN 2 WHEN (c)-[:WORKED_ON]->(:Project)-[:USES_SKILL]->(sk) THEN 1 ELSE 0 END) AS total_score WITH c, total_score, size(required_skills) * 2 AS max_score WHERE total_score > 0 RETURN c.name AS name, c.title AS title, total_score, max_score ORDER BY total_score DESC"
    with driver.session() as session:
        results = session.run(query, job_role_id=job_role_id).data()
    skills_query = "MATCH (jr:JobRole) WHERE elementId(jr) = $job_role_id MATCH (jr)-[:REQUIRES_SKILL]->(s:Skill) RETURN collect(s.name) as required_skills"
    with driver.session() as session:
        skills_result = session.run(skills_query, job_role_id=job_role_id).single()
        required_skills = skills_result["required_skills"] if skills_result else []
    return {"job_role_id": job_role_id, "required_skills": required_skills, "matched_candidates": results}

@app.get("/graph-explorer/data")
def get_full_graph_data():
    query = "MATCH (n) OPTIONAL MATCH (n)-[r]->(m) WITH collect(distinct n) as nodes, collect(distinct r) as rels UNWIND nodes as node RETURN collect(distinct {id: elementId(node), label: labels(node)[0], properties: properties(node)}) as nodes, [rel in rels WHERE rel IS NOT NULL | {id: elementId(rel), source: elementId(startNode(rel)), target: elementId(endNode(rel)), label: type(rel)}] as edges"
    with driver.session() as session:
        result = session.run(query).data()
    if result: return result[0]
    return {"nodes": [], "edges": []}

@app.on_event("shutdown")
def shutdown_event():
    driver.close()