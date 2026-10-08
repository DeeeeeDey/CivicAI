from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_classify():
    response = client.post("/ai/classify", json={"description": "huge pothole on the road"})
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "Pothole"
    assert data["confidence"] > 0.5

def test_severity():
    response = client.post("/ai/severity", json={
        "category": "Pothole",
        "description": "massive pothole, very dangerous",
        "latitude": 22.5,
        "longitude": 88.3
    })
    assert response.status_code == 200
    data = response.json()
    assert data["severity_score"] >= 4 # Pothole base (3) + massive (1) + dangerous (1) = 5

def test_duplicate_check():
    response = client.post("/ai/duplicate-check", json={
        "new_complaint": {
            "id": "new_1",
            "description": "pothole near salt lake",
            "latitude": 22.57,
            "longitude": 88.36,
            "category": "Pothole"
        },
        "existing_complaints": [
            {
                "id": "old_1",
                "description": "pothole salt lake",
                "latitude": 22.5701,
                "longitude": 88.3601,
                "category": "Pothole"
            }
        ]
    })
    assert response.status_code == 200
    data = response.json()
    assert data["duplicate_probability"] > 0.7
    assert data["matched_complaint_id"] == "old_1"

def test_department():
    response = client.post("/ai/department", json={"category": "Garbage Accumulation"})
    assert response.status_code == 200
    data = response.json()
    assert data["department"] == "Waste Management"
