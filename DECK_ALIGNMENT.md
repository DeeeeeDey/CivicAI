# Deck Alignment Progress

## 1. REAL IMAGE AI in /ai-service
- [x] Classification (/ai/classify): CLIP zero-shot (image + text fused 0.6/0.4), top-3 categories, image/text agreement.
- [x] Severity (/ai/severity): Base risk + visual condition + keywords + DB context + duplicates count. Output 1-5 + explanation array.
- [x] Duplicates (/ai/duplicate-check): Combine Haversine + category + time + text TF-IDF + image CLIP cosine similarity.
- [x] Verification (/ai/verify-resolution): Compare before/after images via CLIP embeddings.
- [x] Graceful fallback: Text-only mode if model fails.
- [x] Tests: 10+ sample images, /ai/health endpoint (TODO: 10 sample images script next).
- [x] Express Backend wiring: Accept images, persist per-signal scores in `AiAnalysis`, log overrides.

## 2. "AI AT THE CORE" EXPERIENCE (UI)
- [x] Report Wizard Step 4: Classification scan-frame, severity gauge, duplicate side-by-side.
- [x] Officer Review: "AI suggestion" labels, Accept/Override (reason required), override history.

## 3. HOTSPOT DETECTION
- [x] Backend clustering: DBSCAN-style on lat/lng over 30 days.
- [x] Insight generation: Plain-English insights (e.g., "Sector X: 47 road-related complaints").
- [x] UI Integration: Officer Analytics (Map page layer, Transparency page, Admin dashboard to follow).

## 4. WEBSITE PAGES MIRRORING THE DECK
- [x] /about page sections a-i (Reality, Meet CivicAI, Lifecycle, AI Demo, Location, Architecture, SDGs, Roadmap, Comparison).
- [x] Home page teasers.
- [x] Visual style consistency (Warm Editorial Glass).

## 5. AUDIT TRAIL AND ACCOUNTABILITY
- [x] Public-safe timeline in Complaint Detail and /track/:id.

## 6. DONE CRITERIA
- [ ] End-to-end tests and Docker compose verification.
