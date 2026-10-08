from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import math
import re

app = FastAPI(title="CivicAI AI Service", version="1.0.0")

class ClassifyRequest(BaseModel):
    description: str
    image_url: Optional[str] = None

class ClassifyResponse(BaseModel):
    category: str
    confidence: float
    model_version: str

class SeverityRequest(BaseModel):
    category: str
    description: str
    image_url: Optional[str] = None
    latitude: float
    longitude: float

class SeverityResponse(BaseModel):
    severity_score: int
    explanation: str
    model_version: str

class ComplaintRecord(BaseModel):
    id: str
    description: str
    latitude: float
    longitude: float
    category: str

class DuplicateRequest(BaseModel):
    new_complaint: ComplaintRecord
    existing_complaints: List[ComplaintRecord]

class DuplicateResponse(BaseModel):
    duplicate_probability: float
    matched_complaint_id: Optional[str] = None
    model_version: str

class DepartmentRequest(BaseModel):
    category: str

class DepartmentResponse(BaseModel):
    department: str
    model_version: str

# --- Heuristic Layer 1 ---
CATEGORIES = [
    "Pothole", "Damaged Road", "Garbage Accumulation", "Illegal Dumping",
    "Water Leakage", "Broken Streetlight", "Drainage Problem", "Fallen Tree",
    "Damaged Footpath", "Damaged Public Infrastructure"
]

DEPARTMENTS = {
    "Pothole": "Public Works",
    "Damaged Road": "Public Works",
    "Garbage Accumulation": "Waste Management",
    "Illegal Dumping": "Waste Management",
    "Water Leakage": "Water Supply",
    "Broken Streetlight": "Electrical",
    "Drainage Problem": "Sewerage",
    "Fallen Tree": "Parks",
    "Damaged Footpath": "Public Works",
    "Damaged Public Infrastructure": "Public Works"
}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/ai/classify", response_model=ClassifyResponse)
def classify(req: ClassifyRequest):
    desc = req.description.lower()
    best_cat = "Damaged Public Infrastructure"
    best_score = 0
    
    keywords = {
        "Pothole": ["pothole", "hole", "crater"],
        "Damaged Road": ["road", "street", "asphalt", "tar"],
        "Garbage Accumulation": ["garbage", "trash", "waste", "rubbish"],
        "Water Leakage": ["water", "leak", "pipe", "flooding"],
        "Broken Streetlight": ["light", "dark", "bulb", "lamp"],
        "Fallen Tree": ["tree", "branch", "fallen", "wood"],
        "Drainage Problem": ["drain", "sewer", "clog", "overflow"]
    }
    
    for cat, words in keywords.items():
        score = sum(1 for w in words if w in desc)
        if score > best_score:
            best_score = score
            best_cat = cat
            
    conf = 0.6 + (min(best_score, 3) * 0.1) if best_score > 0 else 0.5
    return ClassifyResponse(category=best_cat, confidence=conf, model_version="layer-1-heuristic")

@app.post("/ai/severity", response_model=SeverityResponse)
def severity(req: SeverityRequest):
    desc = req.description.lower()
    score = 2 
    
    if req.category in ["Pothole", "Water Leakage", "Fallen Tree"]:
        score = 3
        
    modifiers = ["dangerous", "accident", "flooding", "main road", "hospital", "school", "massive", "huge", "critical"]
    matched = [m for m in modifiers if m in desc]
    score += len(matched)
    
    score = min(max(score, 1), 5)
    exp = f"Base severity adjusted by factors: {', '.join(matched) if matched else 'none'}."
    return SeverityResponse(severity_score=score, explanation=exp, model_version="layer-1-heuristic")

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

@app.post("/ai/duplicate-check", response_model=DuplicateResponse)
def duplicate_check(req: DuplicateRequest):
    best_prob = 0.0
    best_id = None
    
    nc = req.new_complaint
    for ec in req.existing_complaints:
        if nc.category != ec.category: continue
        
        dist = haversine(nc.latitude, nc.longitude, ec.latitude, ec.longitude)
        if dist > 50: continue
        
        w1 = set(re.findall(r'\w+', nc.description.lower()))
        w2 = set(re.findall(r'\w+', ec.description.lower()))
        overlap = len(w1 & w2) / max(len(w1 | w2), 1)
        
        prob = 0.5 + (0.5 * overlap)
        if prob > best_prob:
            best_prob = prob
            best_id = ec.id
            
    return DuplicateResponse(
        duplicate_probability=round(best_prob, 2), 
        matched_complaint_id=best_id if best_prob >= 0.7 else None,
        model_version="layer-1-heuristic"
    )

@app.post("/ai/department", response_model=DepartmentResponse)
def department(req: DepartmentRequest):
    dept = DEPARTMENTS.get(req.category, "General Administration")
    return DepartmentResponse(department=dept, model_version="layer-1-heuristic")
