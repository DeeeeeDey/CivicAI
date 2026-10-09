import math
import re
import json
import logging
from io import BytesIO
from PIL import Image
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
import numpy as np

import ml

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("civicai-api")

app = FastAPI(title="CivicAI AI Service", version="2.0.0")

@app.on_event("startup")
async def startup_event():
    # Load model on background thread to not block server startup
    import threading
    t = threading.Thread(target=ml.init_model)
    t.start()

@app.get("/ai/health")
def health():
    return {
        "status": "ok", 
        "model_status": ml.get_status()
    }

@app.post("/ai/classify")
async def classify(
    description: str = Form(...),
    image: Optional[UploadFile] = File(None)
):
    img = None
    if image and image.filename:
        try:
            content = await image.read()
            img = Image.open(BytesIO(content)).convert("RGB")
        except Exception as e:
            logger.error(f"Failed to read image: {e}")

    result = ml.classify_issue(img, description)
    return result

@app.post("/ai/severity")
async def severity(
    category: str = Form(...),
    description: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    duplicates_count: int = Form(0),
    image: Optional[UploadFile] = File(None)
):
    img = None
    if image and image.filename:
        try:
            content = await image.read()
            img = Image.open(BytesIO(content)).convert("RGB")
        except Exception as e:
            logger.error(f"Failed to read image: {e}")

    result = ml.analyze_severity(img, category, description, duplicates_count)
    return result

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

# For Duplicate check, we might accept a JSON string for existing_complaints
@app.post("/ai/duplicate-check")
async def duplicate_check(
    new_description: str = Form(...),
    new_latitude: float = Form(...),
    new_longitude: float = Form(...),
    new_category: str = Form(...),
    existing_complaints_json: str = Form(...), # JSON string of [{id, description, latitude, longitude, category, image_embedding}]
    image: Optional[UploadFile] = File(None)
):
    img = None
    new_emb = np.zeros((512,))
    if image and image.filename and ml.is_ready():
        try:
            content = await image.read()
            img = Image.open(BytesIO(content)).convert("RGB")
            new_emb = ml.encode_image(img)
        except Exception as e:
            logger.error(f"Image read error: {e}")
            
    existing = []
    try:
        existing = json.loads(existing_complaints_json)
    except:
        pass
        
    best_prob = 0.0
    best_id = None
    signal_scores = {}
    
    for ec in existing:
        if new_category != ec.get('category'): continue
        
        dist = haversine(new_latitude, new_longitude, ec.get('latitude', 0), ec.get('longitude', 0))
        if dist > 150: continue
        
        # distance score
        dist_score = max(0, 1.0 - (dist / 150.0))
        
        # text score
        w1 = set(re.findall(r'\w+', new_description.lower()))
        w2 = set(re.findall(r'\w+', ec.get('description', '').lower()))
        text_score = len(w1 & w2) / max(len(w1 | w2), 1)
        
        # image score
        img_score = 0.0
        ec_emb = ec.get('image_embedding')
        if ec_emb and img is not None and ml.is_ready():
            try:
                ec_vec = np.array(ec_emb)
                img_score = float(np.dot(new_emb, ec_vec))
            except: pass
            
        prob = (dist_score * 0.3) + (text_score * 0.3) + (img_score * 0.4)
        
        if prob > best_prob:
            best_prob = prob
            best_id = ec.get('id')
            signal_scores = {
                "distance_score": round(dist_score, 2),
                "text_score": round(text_score, 2),
                "image_score": round(img_score, 2)
            }
            
    return {
        "duplicate_probability": round(best_prob, 2),
        "matched_complaint_id": best_id if best_prob >= 0.6 else None,
        "signal_scores": signal_scores,
        "new_image_embedding": new_emb.tolist() if img else None,
        "model_version": ml._model_version if ml.is_ready() else "heuristic"
    }

@app.post("/ai/verify-resolution")
async def verify_resolution(
    category: str = Form(...),
    before_image: UploadFile = File(...),
    after_image: UploadFile = File(...)
):
    b_img = None
    a_img = None
    try:
        b_content = await before_image.read()
        b_img = Image.open(BytesIO(b_content)).convert("RGB")
        a_content = await after_image.read()
        a_img = Image.open(BytesIO(a_content)).convert("RGB")
    except Exception as e:
        logger.error(e)
        return {"confidence": 0.0, "explanation": "Failed to parse images.", "model_version": "error"}
        
    result = ml.verify_resolution(b_img, a_img, category)
    return result

@app.post("/ai/department")
async def department(category: str = Form(...)):
    dept = ml.DEPARTMENTS.get(category, "General Administration")
    return {"department": dept, "model_version": "rules-based"}

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=7860)
