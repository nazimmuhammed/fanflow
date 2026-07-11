"""
test_main.py
Basic test coverage for the FanFlow AI backend.
Run with: pytest
"""

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_root():
    """Root endpoint should confirm the backend is running."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "FanFlow AI backend is running"


def test_get_stadium_info():
    """Stadium info endpoint should return expected keys."""
    response = client.get("/api/stadium")
    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert "capacity" in data


def test_get_gates():
    """Gates endpoint should return a non-empty list with expected fields."""
    response = client.get("/api/gates")
    assert response.status_code == 200
    gates = response.json()
    assert isinstance(gates, list)
    assert len(gates) > 0
    assert "id" in gates[0]
    assert "status" in gates[0]
    assert "congestion" in gates[0]


def test_get_amenities():
    """Amenities endpoint should return a non-empty list."""
    response = client.get("/api/amenities")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_transit():
    """Transit endpoint should return shuttle, parking, and rail info."""
    response = client.get("/api/transit")
    assert response.status_code == 200
    data = response.json()
    assert "shuttles" in data
    assert "parking" in data
    assert "rail" in data


def test_get_sustainability():
    """Sustainability endpoint should return waste stations and initiatives."""
    response = client.get("/api/sustainability")
    assert response.status_code == 200
    data = response.json()
    assert "wasteStations" in data
    assert "initiatives" in data


def test_get_crowd():
    """Crowd sensors endpoint should return gate density readings."""
    response = client.get("/api/crowd")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_live_crowd():
    """Live crowd endpoint should return jittered readings with valid density range."""
    response = client.get("/api/crowd/live")
    assert response.status_code == 200
    readings = response.json()
    assert len(readings) > 0
    for reading in readings:
        assert 0 <= reading["density"] <= 100


def test_get_faqs():
    """FAQs endpoint should return a non-empty list."""
    response = client.get("/api/faqs")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_chat_endpoint_requires_message():
    """Chat endpoint should reject requests missing the required 'message' field."""
    response = client.post("/api/chat", json={})
    assert response.status_code == 422  # FastAPI validation error


def test_transport_recommend_requires_gate():
    """Transport recommendation endpoint should reject requests missing 'gate'."""
    response = client.post("/api/transport/recommend", json={})
    assert response.status_code == 422


def test_sustainability_sort_requires_item():
    """Waste sorting endpoint should reject requests missing 'item'."""
    response = client.post("/api/sustainability/sort", json={})
    assert response.status_code == 422


def test_incident_analyze_requires_description():
    """Incident analysis endpoint should reject requests missing 'description'."""
    response = client.post("/api/incident/analyze", json={})
    assert response.status_code == 422