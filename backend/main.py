from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from typing import Any
import json
import os
import random
import chromadb
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="FanFlow AI - Smart Stadium Backend")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://fanflow-frontend.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next: Any) -> Any:
    """Attach standard security headers to every HTTP response."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Return a generic validation error message without leaking internal details."""
    return JSONResponse(status_code=422, content={"detail": "Invalid request data."})


DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "stadium_data.json")


def load_data() -> dict:
    """Load and return the full stadium dataset from the JSON data file."""
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


# --- AI / RAG setup ---
client_ai = Groq()
chroma_client = chromadb.PersistentClient(path=os.path.join(os.path.dirname(__file__), "chroma_store"))
collection = chroma_client.get_collection("stadium_knowledge")


# --- Basic data routes ---
@app.get("/")
def root() -> dict:
    """Health check endpoint confirming the backend is running."""
    return {"status": "FanFlow AI backend is running"}


@app.get("/api/stadium")
def get_stadium_info() -> dict:
    """Return general stadium metadata (name, city, capacity)."""
    return load_data()["stadium"]


@app.get("/api/gates")
def get_gates() -> list:
    """Return all stadium gates with live status, congestion, and accessibility info."""
    return load_data()["gates"]


@app.get("/api/amenities")
def get_amenities() -> list:
    """Return all stadium amenities (restrooms, first aid, food courts, etc.)."""
    return load_data()["amenities"]


@app.get("/api/transit")
def get_transit() -> dict:
    """Return shuttle, parking, and rail transit information."""
    return load_data()["transit"]


@app.get("/api/sustainability")
def get_sustainability() -> dict:
    """Return waste sorting stations and sustainability initiatives."""
    return load_data()["sustainability"]


@app.get("/api/crowd")
def get_crowd() -> list:
    """Return the base (non-live) crowd sensor dataset."""
    return load_data()["crowd_sensors"]


@app.get("/api/faqs")
def get_faqs() -> list:
    """Return the list of frequently asked questions."""
    return load_data()["faqs"]


# --- AI Concierge chat route ---
class ChatRequest(BaseModel):
    """Request body for the AI Concierge chat endpoint."""
    message: str = Field(..., min_length=1, max_length=500)
    language: str = Field(default="English", max_length=50)


@app.post("/api/chat")
@limiter.limit("15/minute")
def chat(request: Request, chat_request: ChatRequest) -> dict:
    """
    Answer a fan's question using RAG: retrieve relevant stadium facts from
    ChromaDB, then generate a grounded natural-language answer via the LLM.
    """
    results = collection.query(
        query_texts=[chat_request.message],
        n_results=4
    )
    retrieved_facts = "\n".join(results["documents"][0])

    system_prompt = (
        "You are FanFlow AI, a friendly stadium concierge assistant for the "
        "FIFA World Cup 2026. Answer the fan's question using ONLY the facts "
        "provided below. Be concise, warm, and practical. If the facts don't "
        "contain the answer, say you don't have that information and suggest "
        f"asking Guest Services. Respond in this language: {chat_request.language}.\n\n"
        f"STADIUM FACTS:\n{retrieved_facts}"
    )

    response = client_ai.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=300,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": chat_request.message}
        ]
    )

    answer_text = response.choices[0].message.content

    return {
        "answer": answer_text,
        "sources_used": results["documents"][0]
    }


# --- Crowd Intelligence ---
@app.get("/api/crowd/live")
def get_live_crowd() -> list:
    """
    Simulate live sensor readings by jittering the base crowd data on each
    call - mimics a real-time feed for demo purposes.
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
@limiter.limit("10/minute")
def generate_crowd_alert(request: Request) -> dict:
    """
    Analyze current live crowd data and generate an operator-style alert
    via the LLM - real-time decision support for stadium staff.
    """
    live_data = get_live_crowd()
    gates_data = load_data()["gates"]

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


# --- Transportation Assistant ---
class TransportRequest(BaseModel):
    """Request body for the transportation recommendation endpoint."""
    gate: str = Field(..., min_length=1, max_length=10)


@app.post("/api/transport/recommend")
@limiter.limit("15/minute")
def recommend_transport(request: Request, transport_request: TransportRequest) -> dict:
    """
    Recommend the best transportation option (shuttle, parking, or rail)
    for a fan's destination gate, reasoning over live transit data via the LLM.
    """
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
            {"role": "user", "content": f"My destination is Gate {transport_request.gate}.\n\n{context}"}
        ]
    )

    return {
        "recommendation": response.choices[0].message.content,
        "transit_options": transit
    }


# --- Sustainability Assistant ---
class WasteRequest(BaseModel):
    """Request body for the waste sorting classification endpoint."""
    item: str = Field(..., min_length=1, max_length=200)


@app.post("/api/sustainability/sort")
@limiter.limit("15/minute")
def sort_waste(request: Request, waste_request: WasteRequest) -> dict:
    """
    Classify an item description into the correct waste bin (recycling,
    compost, or landfill) using LLM reasoning rather than a keyword lookup.
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
            {"role": "user", "content": f"Item: {waste_request.item}"}
        ]
    )

    return {"result": response.choices[0].message.content}


# --- Operator: Incident Analysis ---
class IncidentRequest(BaseModel):
    """Request body for the staff incident triage endpoint."""
    description: str = Field(..., min_length=1, max_length=500)


@app.post("/api/incident/analyze")
@limiter.limit("15/minute")
def analyze_incident(request: Request, incident_request: IncidentRequest) -> dict:
    """
    Classify an incident's severity and recommend an immediate action for
    stadium operations staff via LLM-based triage reasoning.
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
            {"role": "user", "content": f"Incident: {incident_request.description}"}
        ]
    )

    return {"result": response.choices[0].message.content}