Project overview : 
CivicAI is essentially a smart civic complaint management platform that connects citizens, AI, municipal authorities, and field workers into one end-to-end workflow. The important part of your project is that it is not merely a “complaint registration app”; it attempts to solve the entire lifecycle of an urban issue—from detection → classification → prioritization → departmental routing → field assignment → resolution → citizen verification.

1. The core problem
In a conventional municipal complaint system, a citizen notices something like a pothole or garbage accumulation and reports it through a portal, phone call, social media, or sometimes not at all.
The major problems are:
Complaints may be manually categorized.
The same issue may be reported multiple times.
Authorities may not have enough information to prioritize complaints.
Complaints can reach the wrong department.
Field workers may not receive assignments efficiently.
Citizens often have limited visibility into what happens after submitting a complaint.
There may be no reliable mechanism for verifying whether an issue was actually fixed.
Municipal authorities lack a centralized data-driven view of recurring urban problems.
CivicAI addresses these problems by introducing AI-assisted automation and centralized workflow management.

2. What CivicAI actually does
The system can be understood through four major actors:
Citizen → AI System → Municipal Officer → Field Worker → Citizen
A citizen reports an issue by providing:
An image, Geographic location, A textual description.
For example: “There is a large pothole near the main entrance of the college. It has become dangerous for two-wheelers.”
The system receives this information and AI analyzes it.
It can determine: Issue type: Pothole, Severity: High, Location: GPS coordinates, Possible duplicate: Existing complaint nearby, Responsible department: Roads/Public Works.
The complaint is then sent into the municipal workflow.
An officer can review it, assign it to an appropriate field worker, monitor progress, and eventually verify the uploaded resolution evidence.
The citizen can then see that the complaint has progressed from:
Reported → Under Review → Assigned → In Progress → Resolved → Verified

3. AI component
A. Issue Classification
Image → CNN/YOLO-based model → Pothole
Image + Description → Multimodal/combined classification → Issue category
B. Severity Prediction
Severity = 1–5
1 = Minor, 2 = Low, 3 = Moderate, 4 = High, 5 = Critical
Severity = f(image condition, issue type, location, size, description, public risk)

4. Duplicate complaint detection
Compare: GPS proximity, Image similarity, Issue category, Time of submission, Description similarity.
Duplicate probability: 92%

5. Geographic intelligence
Latitude, Longitude, Address, Ward/zone, Department jurisdiction, Timestamp.
Enables hotspot detection.

6. Department routing
Automatically recommend the responsible department (e.g., Pothole -> Public Works/Roads).

7. Officer dashboard
Complaint ID, Issue type, Location, Severity, AI confidence, Duplicate status, Department, Current status, Assigned worker, Deadline/SLA.

8. Field-worker module
Assigned Task, Accept → Start Work → Upload Evidence → Mark Resolved.

9. Resolution verification
Worker uploads proof → Officer/system reviews → Citizen verifies.
Citizen can Confirm Resolution or Issue Not Resolved.

10. Complete system architecture
Frontend: React.js
Backend/API Layer: Node.js / Express
Database: PostgreSQL
AI Microservice: Python + FastAPI

11. Database structure
Users: user_id, name, email, password_hash, role (CITIZEN, OFFICER, WORKER, ADMIN)
Complaints: complaint_id, citizen_id, category, description, latitude, longitude, image_url, severity, status, department_id, assigned_worker, created_at, updated_at
AI Analysis: complaint_id, predicted_category, confidence, severity_score, duplicate_probability, duplicate_of, model_version
Departments: department_id, department_name
Assignments: assignment_id, complaint_id, officer_id, worker_id, assigned_at, completed_at
Resolution: resolution_id, complaint_id, worker_id, proof_image, description, timestamp, verification_status

13. Non-functional requirements
Security, Performance, Reliability, Scalability, Usability, Maintainability, Auditability.

15. SDG alignment
SDG 11, SDG 9, SDG 16, SDG 17.

18. The complete CivicAI workflow
Citizen observes problem → Uploads info → CivicAI analyzes → Officer reviews → Assigns worker → Worker resolves → Uploads proof → Officer verifies → Citizen verifies → Closed.
