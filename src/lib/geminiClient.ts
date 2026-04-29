import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

/**
 * Agent 1: Ingestion Agent
 * Converts raw text (from OCR/Files) into structured JSON.
 */
export async function ingestionAgent(rawText: string) {
  try {
    const prompt = `You are an expert Medical Registrar. Extract structured data from this medical document text.
    TEXT: ${rawText}
    Focus on: Diagnoses, Medications (name, dose, freq), Lab Results, and Provider.`;

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['diagnosis', 'medication', 'lab_report', 'treatment', 'note'] },
            date: { type: Type.STRING, description: "YYYY-MM-DD" },
            provider: { type: Type.STRING },
            summary: { type: Type.STRING },
            medications: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  dosage: { type: Type.STRING },
                  frequency: { type: Type.STRING }
                }
              }
            },
            diagnoses: { type: Type.ARRAY, items: { type: Type.STRING } },
            lab_results: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "type", "date"]
        }
      }
    });

    return JSON.parse(result.text.trim());
  } catch (error) {
    console.error("Ingestion Agent Error:", error);
    throw error;
  }
}

/**
 * AXON Vitality Agent
 * Calculates a health sustainability score from base vitals.
 */
export async function vitalityAgent(profile: any) {
  try {
    const prompt = `Act as a clinical analyst for AXON. Based on this patient profile, calculate a 'Health Vitality Score' out of 100.
    Provide a brief explanation and 3 focus areas for improvement.
    PROFILE: ${JSON.stringify(profile)}`;

    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vitality_score: { type: Type.NUMBER },
            explanation: { type: Type.STRING },
            improvement_areas: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["vitality_score", "explanation", "improvement_areas"]
        }
      }
    });
    return JSON.parse(result.text.trim());
  } catch (error) {
    console.error("Vitality Agent Error:", error);
    return { vitality_score: 70, explanation: "Default baseline assessment.", improvement_areas: ["NUTRITION", "SLEEP", "FOCUS"] };
  }
}

/**
 * Agent 2: Context Agent
 * Builds a chronological narrative from all records.
 */
export async function contextAgent(records: any[]) {
  const prompt = `Analyze these medical records and build a concise chronological health narrative.
  Identify trends or missing links between episodes.
  RECORDS: ${JSON.stringify(records)}`;
  
  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  });
  return result.text.trim();
}

/**
 * Agent 3: Risk Agent
 * Analyzes chronic disease patterns.
 */
export async function riskAgent(records: any[]) {
  const prompt = `Review these medical records for chronic risk factors.
  Output JSON format with risk_level (low, medium, high), identified_conditions (array), and confidence (0-1).
  RECORDS: ${JSON.stringify(records)}`;

  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          risk_level: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
          conditions: { type: Type.ARRAY, items: { type: Type.STRING } },
          confidence: { type: Type.NUMBER },
          reasoning: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(result.text.trim());
}

/**
 * Agent 4: Medication Agent
 * Checks for interactions and conflicts.
 */
export async function medicationAgent(medications: any[]) {
  const prompt = `Check for interactions or risks in this medication list.
  Medications: ${JSON.stringify(medications)}`;

  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  });
  return result.text.trim();
}

/**
 * Agent 5: Summary Agent
 * Clinical executive summary.
 */
export async function summaryAgent(patient: any, records: any[]) {
  const prompt = `Provide a professional 3-sentence clinical executive summary for a doctor.
  Patient: ${JSON.stringify(patient)}
  History: ${JSON.stringify(records)}`;

  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  });
  return result.text.trim();
}
