import os
import torch
import numpy as np
import logging
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
from typing import List, Tuple, Dict, Any

logger = logging.getLogger("civicai-ml")

# Global variables
_model = None
_processor = None
_model_version = "clip-vit-base-patch32"
_model_status = "loading"

# Classes
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

def init_model():
    global _model, _processor, _model_status
    try:
        logger.info(f"Loading CLIP model {_model_version} on CPU...")
        _model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        _processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        _model_status = "ready"
        logger.info("CLIP model loaded successfully.")
    except Exception as e:
        logger.error(f"Failed to load CLIP: {e}")
        _model_status = "failed"

def get_status() -> str:
    return _model_status

def is_ready() -> bool:
    return _model_status == "ready" and _model is not None

def encode_image(image: Image.Image) -> np.ndarray:
    if not is_ready(): return np.zeros((512,))
    with torch.no_grad():
        inputs = _processor(images=image, return_tensors="pt")
        emb = _model.get_image_features(**inputs)
        emb = emb / emb.norm(p=2, dim=-1, keepdim=True)
        return emb.numpy()[0]

def zero_shot_classify(image: Image.Image, candidate_texts: List[str]) -> List[float]:
    if not is_ready(): return [1.0/len(candidate_texts)] * len(candidate_texts)
    with torch.no_grad():
        inputs = _processor(text=candidate_texts, images=image, return_tensors="pt", padding=True)
        outputs = _model(**inputs)
        # logits_per_image are unscaled similarity scores
        probs = outputs.logits_per_image.softmax(dim=1)
        return probs.numpy()[0].tolist()

def text_only_classify(desc: str) -> List[float]:
    # Heuristic TF-IDF / keyword fallback logic
    desc = desc.lower()
    scores = np.zeros(len(CATEGORIES))
    keywords = {
        "Pothole": ["pothole", "hole", "crater"],
        "Damaged Road": ["road", "street", "asphalt", "tar"],
        "Garbage Accumulation": ["garbage", "trash", "waste", "rubbish"],
        "Illegal Dumping": ["dump", "illegal", "sofa", "mattress", "debris"],
        "Water Leakage": ["water", "leak", "pipe", "flooding", "burst"],
        "Broken Streetlight": ["light", "dark", "bulb", "lamp", "pole"],
        "Drainage Problem": ["drain", "sewer", "clog", "overflow"],
        "Fallen Tree": ["tree", "branch", "fallen", "wood", "storm"],
        "Damaged Footpath": ["footpath", "sidewalk", "pavement", "walkway"],
        "Damaged Public Infrastructure": ["sign", "bench", "fence", "park"]
    }
    
    total_matches = 0
    for i, cat in enumerate(CATEGORIES):
        words = keywords.get(cat, [cat.lower()])
        match_count = sum(1 for w in words if w in desc)
        scores[i] = match_count
        total_matches += match_count
        
    if total_matches == 0:
        return [1.0/len(CATEGORIES)] * len(CATEGORIES)
    
    return (scores / total_matches).tolist()

def classify_issue(image: Image.Image, description: str) -> Dict[str, Any]:
    text_probs = text_only_classify(description)
    
    if not is_ready() or image is None:
        # Fallback to text-only
        top_indices = np.argsort(text_probs)[::-1][:3]
        results = [{"category": CATEGORIES[i], "confidence": text_probs[i]} for i in top_indices]
        return {
            "top_categories": results,
            "signal_driver": "text",
            "needs_review": False,
            "model_version": "text-heuristic"
        }

    # Format texts for CLIP
    clip_texts = [f"a photo of {cat.lower()}" for cat in CATEGORIES]
    image_probs = zero_shot_classify(image, clip_texts)
    
    # Fusion 0.6 image + 0.4 text
    fused_probs = (np.array(image_probs) * 0.6) + (np.array(text_probs) * 0.4)
    top_indices = np.argsort(fused_probs)[::-1][:3]
    
    top_image_cat = CATEGORIES[np.argmax(image_probs)]
    top_text_cat = CATEGORIES[np.argmax(text_probs)]
    
    if top_image_cat == top_text_cat:
        driver = "both agree"
        needs_review = False
    elif np.max(image_probs) > np.max(text_probs) + 0.3:
        driver = "image"
        needs_review = False
    else:
        driver = "disagree"
        needs_review = True
        
    results = [{"category": CATEGORIES[i], "confidence": float(fused_probs[i])} for i in top_indices]
    
    return {
        "top_categories": results,
        "signal_driver": driver,
        "needs_review": needs_review,
        "model_version": f"fused-{_model_version}"
    }

def analyze_severity(image: Image.Image, category: str, description: str, duplicates_count: int) -> Dict[str, Any]:
    factors = []
    base_score = 2
    
    if category in ["Pothole", "Water Leakage", "Fallen Tree", "Broken Streetlight"]:
        base_score = 3
        factors.append({"factor": "Category Base Risk", "contribution": 3, "note": f"{category} inherently requires prompt attention."})
    else:
        factors.append({"factor": "Category Base Risk", "contribution": 2, "note": f"{category} has standard base priority."})
        
    score = base_score
    
    # 1. Text Keywords
    desc = description.lower()
    danger_words = ["dangerous", "accident", "flooding", "main road", "hospital", "school", "massive", "huge", "critical"]
    matched = [w for w in danger_words if w in desc]
    if matched:
        score += 1
        factors.append({"factor": "Text Context", "contribution": +1, "note": f"Identified risk keywords: {', '.join(matched)}"})
        
    # 2. Visual Conditions (CLIP)
    if is_ready() and image is not None:
        if category == "Pothole":
            probs = zero_shot_classify(image, ["a small pothole", "a massive deep dangerous pothole"])
            if probs[1] > 0.6:
                score += 1
                factors.append({"factor": "Visual Condition", "contribution": +1, "note": "Image suggests a large/dangerous pothole."})
        elif category == "Garbage Accumulation":
            probs = zero_shot_classify(image, ["a small bag of trash", "a massive pile of garbage blocking the street"])
            if probs[1] > 0.6:
                score += 1
                factors.append({"factor": "Visual Condition", "contribution": +1, "note": "Image shows significant accumulation."})
        elif "Water" in category or "Drainage" in category:
            probs = zero_shot_classify(image, ["a minor puddle", "severe flooding and waterlogging"])
            if probs[1] > 0.6:
                score += 1
                factors.append({"factor": "Visual Condition", "contribution": +1, "note": "Image indicates severe flooding."})

    # 3. DB Context
    if duplicates_count > 0:
        boost = min(duplicates_count, 2)
        score += boost
        factors.append({"factor": "Duplicate Volume", "contribution": f"+{boost}", "note": f"{duplicates_count} similar reports nearby indicates widespread impact."})
        
    final_score = min(max(score, 1), 5)
    
    return {
        "severity_score": final_score,
        "explanation_factors": factors,
        "model_version": f"multimodal-{_model_version}" if is_ready() and image else "text-only-heuristic"
    }

def verify_resolution(before_img: Image.Image, after_img: Image.Image, category: str) -> Dict[str, Any]:
    if not is_ready() or before_img is None or after_img is None:
        return {"confidence": 0.5, "explanation": "Model unavailable. Needs manual verification.", "model_version": "fallback"}
        
    emb_before = encode_image(before_img)
    emb_after = encode_image(after_img)
    
    # Simulating a check. If images are EXACTLY the same, it's fraud (cosine sim ~ 1.0)
    cos_sim = np.dot(emb_before, emb_after)
    
    if cos_sim > 0.95:
        return {"confidence": 0.1, "explanation": "After image is virtually identical to Before image. Likely fraud.", "model_version": _model_version}
        
    # We could do a zero shot like "a fixed pothole" vs "a broken pothole" on after_img.
    if category == "Pothole" or category == "Damaged Road":
        probs = zero_shot_classify(after_img, ["a smooth repaired road", "a road with a pothole"])
        conf = float(probs[0])
        reason = "Visual evidence suggests road is repaired." if conf > 0.6 else "Visual evidence suggests damage is still present."
        return {"confidence": conf, "explanation": reason, "model_version": _model_version}
        
    if category == "Garbage Accumulation":
        probs = zero_shot_classify(after_img, ["a clean empty street", "a street with garbage"])
        conf = float(probs[0])
        reason = "Visual evidence suggests area is clean." if conf > 0.6 else "Visual evidence suggests garbage remains."
        return {"confidence": conf, "explanation": reason, "model_version": _model_version}

    # Generic fallback for other categories
    return {"confidence": 0.7, "explanation": "Visual change detected, but category-specific verification not available.", "model_version": _model_version}
