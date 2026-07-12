"""
test_ai_endpoints.py
Additional tests covering successful paths for AI-powered POST endpoints.
Requires GROQ_API_KEY to be set (real API calls made in these tests).
Run with: pytest
"""

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_chat_success():
    """Chat endpoint should return an answer and sources for a valid question."""
    response = client.post("/api/chat", json={
        "message": "Where can I feed my baby?",
        "language": "English"
    })
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "sources_used" in data
    assert len(data["answer"]) > 0


def test_transport_recommend_success():
    """Transport recommendation should return a recommendation for a valid gate."""
    response = client.post("/api/transport/recommend", json={"gate": "A"})
    assert response.status_code == 200
    data = response.json()
    assert "recommendation" in data
    assert "transit_options" in data


def test_sustainability_sort_success():
    """Waste sorting should classify a valid item description."""
    response = client.post("/api/sustainability/sort", json={"item": "plastic water bottle"})
    assert response.status_code == 200
    data = response.json()
    assert "result" in data
    assert len(data["result"]) > 0


def test_incident_analyze_success():
    """Incident analysis should classify severity for a valid description."""
    response = client.post("/api/incident/analyze", json={
        "description": "Spilled drink causing a slippery floor near Gate B"
    })
    assert response.status_code == 200
    data = response.json()
    assert "result" in data
    assert "SEVERITY" in data["result"].upper()


def test_chat_rejects_overly_long_message():
    """Chat endpoint should reject messages exceeding the max length."""
    response = client.post("/api/chat", json={
        "message": "a" * 1000,
        "language": "English"
    })
    assert response.status_code == 422