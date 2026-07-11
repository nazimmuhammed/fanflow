# ⚽ FanFlow AI — Smart Stadium Operations for FIFA World Cup 2026

**A GenAI-powered platform enhancing navigation, crowd management, accessibility, transportation, sustainability, multilingual assistance, and operational intelligence for fans, organizers, and venue staff at the FIFA World Cup 2026.**

Built for PromptWars hackathon — Challenge 4: Smart Stadiums & Tournament Operations.

---

## 🎯 The Problem

Major tournament stadiums handle 80,000+ fans across dozens of gates, in a country with fans speaking dozens of languages, with no unified real-time system connecting navigation, crowd safety, accessibility, transport, and sustainability. Staff and fans currently rely on static signage, radios, and guesswork — none of it personalized, none of it predictive.

## 💡 The Solution

FanFlow AI is a full-stack web application with a GenAI reasoning layer embedded across eight modules, serving both fans and stadium operations staff from a single platform.

| Module | What it does |
|---|---|
| 🤖 **AI Concierge** | Multilingual chatbot answering fan questions, grounded in real stadium data via RAG (no hallucination) |
| 🗺️ **Interactive Stadium Map** | Clickable SVG gate diagram showing live congestion and nearby amenities |
| 👥 **Crowd Intelligence** | Live density simulation + GenAI-generated operator alerts and redirect recommendations |
| ♿ **Accessibility Mode** | High-contrast theme, text-to-speech voice readout, accessible-route filtering |
| 🚌 **Transportation Assistant** | GenAI recommends the best shuttle/parking/rail option per destination gate |
| 🌱 **Sustainability Assistant** | GenAI waste-sorting classifier (recycling/compost/landfill) + green initiative tracker |
| 🎛️ **Operator Command View** | Staff-facing dashboard: gate overview table + GenAI-powered incident triage |
| 🎨 **Matchday Ops Theme** | FIFA-inspired visual design with motion design throughout |

## 🛠️ Tech Stack

**Frontend:** React (Vite) · Tailwind CSS v4 · Framer Motion
**Backend:** FastAPI (Python) · Uvicorn
**AI / GenAI:** Groq API (Llama 3.3 70B) · ChromaDB (vector search / RAG)
**Data:** JSON-based stadium dataset (gates, amenities, transit, sustainability, crowd sensors)

## 🧠 How the AI Actually Works

This isn't a thin wrapper around an LLM. Every module uses a distinct GenAI pattern:

- **RAG (Retrieval-Augmented Generation):** The AI Concierge embeds stadium data into ChromaDB, retrieves the most relevant facts per question, and grounds every answer in real data — preventing hallucination.
- **Structured reasoning over live data:** Crowd Intelligence and Transportation feed real-time/structured data to the LLM and ask it to reason like a human operator, not just report numbers.
- **Classification via natural language:** Sustainability and Incident Triage use the LLM's reasoning to classify open-ended text input (item descriptions, incident reports) into structured categories with justification.

## 🚀 Running Locally

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python build_knowledge_base.py
uvicorn main:app --reload
```
Create a `.env` file in `backend/` with:
```
GROQ_API_KEY=your_key_here
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`.

## 🚧 Limitations & Future Work

- Crowd sensor data is simulated (jittered from a base dataset) rather than pulling from real IoT sensors — architecture is ready to swap in a live feed.
- Currently scoped to a single stadium (MetLife Stadium) as a proof of concept; data model supports multi-venue expansion.
- No persistent database yet (JSON-based) — designed to migrate cleanly to PostgreSQL for production.
- Authentication/role-based access for the Operator View is not yet implemented.

## 👤 Team

Nazim Muhammed

---

*Built as a concept demonstration for FIFA World Cup 2026 stadium operations. Not affiliated with FIFA.*
