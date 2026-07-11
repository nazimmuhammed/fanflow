from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
import chromadb
from groq import Groq
from dotenv import load_dotenv
import random

load_dotenv()

app = FastAPI(title="FanFlow AI - Smart Stadium Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "stadium_data.json")

def load_data():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

# --- AI / RAG setup ---
client_ai = Groq()
chroma_client = chromadb.PersistentClient(path=os.path.join(os.path.dirname(__file__), "chroma_store"))
collection = chroma_client.get_collection("stadium_knowledge")

# --- Basic data routes ---
@app.get("/")
def root():
    return {"status": "FanFlow AI backend is running"}

@app.get("/api/stadium")
def get_stadium_info():
    return load_data()["stadium"]

@app.get("/api/gates")
def get_gates():
    return load_data()["gates"]

@app.get("/api/amenities")
def get_amenities():
    return load_data()["amenities"]

@app.get("/api/transit")
def get_transit():
    return load_data()["transit"]

@app.get("/api/sustainability")
def get_sustainability():
    return load_data()["sustainability"]

@app.get("/api/crowd")
def get_crowd():
    return load_data()["crowd_sensors"]

@app.get("/api/faqs")
def get_faqs():
    return load_data()["faqs"]

# --- AI Concierge chat route ---
class ChatRequest(BaseModel):
    message: str
    language: str = "English"

@app.post("/api/chat")
def chat(request: ChatRequest):
    results = collection.query(
        query_texts=[request.message],
        n_results=4
    )
    retrieved_facts = "\n".join(results["documents"][0])

    system_prompt = (
        "You are FanFlow AI, a friendly stadium concierge assistant for the "
        "FIFA World Cup 2026. Answer the fan's question using ONLY the facts "
        "provided below. Be concise, warm, and practical. If the facts don't "
        "contain the answer, say you don't have that information and suggest "
        f"asking Guest Services. Respond in this language: {request.language}.\n\n"
        f"STADIUM FACTS:\n{retrieved_facts}"
    )

    response = client_ai.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=300,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": request.message}
        ]
    )

    answer_text = response.choices[0].message.content

    return {
        "answer": answer_text,
        "sources_used": results["documents"][0]
    }
    # --- Crowd Intelligence ---

@app.get("/api/crowd/live")
def get_live_crowd():
    """
    Simulates live sensor readings by jittering the base crowd data
    each time this endpoint is called - mimics a real-time feed.
    """
    data = load_data()
    live_data = []
    for sensor in data["crowd_sensors"]:
        jitter = random.randint(-5, 5)
        new_density = max(0, min(100, sensor["density"] + jitter))
        live_data.append({
            "gateId": sensor["gateId"],
            "density": new_density,
            "trend": sensor["trend"]
        })
    return live_data

@app.post("/api/crowd/alert")
def generate_crowd_alert():
    """
    Takes the current live crowd data and asks the LLM to reason about it
    like a stadium operations manager would - this is the GenAI 'operational
    intelligence' piece, not just a threshold if/else check.
    """
    live_data = get_live_crowd()
    gates_data = load_data()["gates"]
    # --- Transportation Assistant ---

class TransportRequest(BaseModel):
    gate: str

@app.post("/api/transport/recommend")
def recommend_transport(request: TransportRequest):
    data = load_data()
    transit = data["transit"]

    context = (
        f"Shuttles: {json.dumps(transit['shuttles'])}\n"
        f"Parking: {json.dumps(transit['parking'])}\n"
        f"Rail: {json.dumps(transit['rail'])}"
    )

    system_prompt = (
        "You are a transportation assistant for FIFA World Cup 2026 fans at "
        "MetLife Stadium. Given the fan's destination gate and the current "
        "transit options below, recommend the SINGLE best option (shuttle, "
        "parking, or rail) considering wait time and walk distance to their "
        "gate. Be specific and concise - 2 sentences max, name the option "
        "and why."
    )

    response = client_ai.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=150,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"My destination is Gate {request.gate}.\n\n{context}"}
        ]
    )

    return {
        "recommendation": response.choices[0].message.content,
        "transit_options": transit
    }
# --- Sustainability Assistant ---

class WasteRequest(BaseModel):
    item: str

@app.post("/api/sustainability/sort")
def sort_waste(request: WasteRequest):
    """
    Uses the LLM to reason about which bin an item belongs in - genuine
    classification reasoning, not a hardcoded keyword lookup table.
    """
    system_prompt = (
        "You are a waste-sorting assistant at a FIFA World Cup 2026 stadium. "
        "The stadium has three bins: RECYCLING (plastic, cans, paper, cardboard), "
        "COMPOST (food waste, food-soiled paper), and LANDFILL (everything else, "
        "like wrappers, styrofoam, mixed materials). Given an item description, "
        "respond with ONLY: the bin name in caps, a dash, then one short reason "
        "(under 15 words). Example format: 'COMPOST - food waste breaks down naturally.'"
    )

    response = client_ai.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=60,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Item: {request.item}"}
        ]
    )

    return {"result": response.choices[0].message.content}
    # --- Operator: Incident Analysis ---

class IncidentRequest(BaseModel):
    description: str

@app.post("/api/incident/analyze")
def analyze_incident(request: IncidentRequest):
    """
    Staff describe an incident in plain language; the LLM classifies severity
    and recommends an immediate action - this is real-time decision support
    for venue staff, not just a fan-facing feature.
    """
    system_prompt = (
        "You are an incident triage assistant for stadium operations staff at "
        "FIFA World Cup 2026. Given an incident description, respond in this "
        "exact format on separate lines:\n"
        "SEVERITY: [LOW/MEDIUM/HIGH/CRITICAL]\n"
        "ACTION: [one short, specific recommended action, under 20 words]\n"
        "Be decisive and practical, like a real operations supervisor."
    )

    response = client_ai.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=100,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Incident: {request.description}"}
        ]
    )

    return {"result": response.choices[0].message.content}
    # Build a readable summary of current conditions for the LLM
    summary_lines = []
    for sensor in live_data:
        gate_info = next((g for g in gates_data if g["id"] == sensor["gateId"]), None)
        gate_name = gate_info["name"] if gate_info else sensor["gateId"]
        summary_lines.append(f"{gate_name}: {sensor['density']}% capacity")
    summary = "\n".join(summary_lines)

    system_prompt = (
        "You are an AI operations assistant for stadium crowd management at the "
        "FIFA World Cup 2026. You will be given live gate capacity readings. "
        "Identify any gates approaching or over capacity (80%+), and write ONE "
        "short, actionable recommendation for stadium staff - like a real ops "
        "radio call. If everything is fine, say so briefly and positively. "
        "Keep it under 2 sentences, no preamble."
    )

    response = client_ai.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=100,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Current gate capacity readings:\n{summary}"}
        ]
    )

    alert_text = response.choices[0].message.content

    return {
        "alert": alert_text,
        "readings": live_data
    }