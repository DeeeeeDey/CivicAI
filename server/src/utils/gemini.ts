import { GoogleGenerativeAI } from '@google/generative-ai';

const fileToGenerativePart = (file: any) => {
  return {
    inlineData: {
      data: file.buffer.toString("base64"),
      mimeType: file.mimetype
    },
  };
};

export const analyzeComplaintWithGemini = async (description: string, latitude: number, longitude: number, category: string, file: any, existing: any[]) => {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MISSING_KEY') {
        throw new Error('No GEMINI_API_KEY provided');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    You are the CivicAI Urban Assessment Engine. You act as an intelligent civic complaint router.
    Analyze the provided civic complaint data (and image if provided).

    Complaint Description: "${description}"
    Coordinates: Latitude ${latitude}, Longitude ${longitude}
    User-Suggested Category: "${category || 'None'}"

    Recent open complaints nearby (for duplicate detection):
    ${JSON.stringify(existing)}

    Your job is to return a strict JSON object (NO markdown formatting, NO backticks) with exactly this schema:
    {
      "category": "String (e.g., Pothole, Water Leakage, Garbage, Broken Streetlight)",
      "confidence": 0.0,
      "top_categories": [
         {"category": "String", "confidence": 0.9}
      ],
      "signal_driver": "String (e.g., 'image', 'text', or 'both agree')",
      "severity": 1,
      "explanation": [
         {"factor": "String", "contribution": "+1", "note": "String"}
      ],
      "department": "String (e.g., 'Public Works', 'Water Supply')",
      "duplicate_probability": 0.0,
      "matched_complaint_id": "String or null if no duplicate",
      "signal_scores": {
         "distance": 0.8,
         "image": 0.5,
         "description": 0.9,
         "time": 0.5
      }
    }
    `;

    const requestParts: any[] = [prompt];
    if (file) {
        requestParts.push(fileToGenerativePart(file));
    }

    const result = await model.generateContent(requestParts);
    let text = result.response.text().trim();
    if (text.startsWith("```")) {
        text = text.replace(/^```(?:json)?\n?/, '').replace(/```$/, '').trim();
    }
    const parsed = JSON.parse(text);
    return parsed;
};
