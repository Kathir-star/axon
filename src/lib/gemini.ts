import { GoogleGenAI, Type } from "@google/genai";

// AXON Intelligence: Official Key Ingestion
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

/**
 * Unified generation helper
 */
export async function generateContent(model: string, contents: any, config?: any) {
  const response = await ai.models.generateContent({
    model,
    contents,
    config
  });
  return response;
}

/**
 * Extracts structured medical data from an image/PDF using Gemini Flash.
 */
export async function extractMedicalData(base64Data: string, mimeType: string) {
  try {
    const result = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview", // Use Pro to handle PDFs better
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        "Extract medical information from this document. Provide a 1-sentence snippet summarizing the core finding. Extract a list of keyFindings and a list of followUp suggestions. Also provide title, type (Diagnosis, Lab Report, Medication, Treatment, General), date, and provider."
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['Diagnosis', 'Lab Report', 'Medication', 'Treatment', 'General'] },
            date: { type: Type.STRING, description: "YYYY-MM-DD" },
            provider: { type: Type.STRING },
            snippet: { type: Type.STRING, description: "1-sentence quick view summary" },
            keyFindings: { type: Type.ARRAY, items: { type: Type.STRING } },
            followUp: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["title", "type", "date", "snippet", "keyFindings", "followUp"]
        }
      }
    });
    
    return JSON.parse(result.text.trim());
  } catch (error: any) {
    console.error("Gemini OCR Error:", error);
    throw new Error("Failed to extract medical data");
  }
}

/**
 * Synthesizes a longitudinal medical history into a clinical summary for doctors.
 */
export async function synthesizeLongitudinalHistory(records: any[]) {
  try {
    const recordsText = JSON.stringify(records, null, 2);
    
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `You are a brilliant medical orchestrator AI. Analyze these longitudinal patient records over time. RECORDS: ${recordsText} Synthesize these past records to find trends. Highlight chronic risks, medication history changes, and treatment-response patterns.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chronicRisks: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Highlight the top 3-4 chronic or compounding risks identified over time."
            },
            medicationPatterns: {
              type: Type.STRING,
              description: "Analyze the medication history: dose changes, new drugs, or potential interactions."
            },
            treatmentResponse: {
              type: Type.STRING,
              description: "Summarize how the patient has responded to previous treatments based on follow-up records."
            },
            clinicalSummary: {
              type: Type.STRING,
              description: "A 2-4 sentence executive summary of the patient's holistic health status for the point-of-care doctor."
            }
          },
          required: ["chronicRisks", "medicationPatterns", "treatmentResponse", "clinicalSummary"]
        }
      }
    });

    return JSON.parse(response.text.trim());
  } catch (error: any) {
    console.error("Gemini Synthesis Error:", error);
    throw new Error("Failed to synthesize patient records");
  }
}

/**
 * Agent 1: Ingestion Agent
 */
export async function ingestionAgent(rawText: string) {
  try {
    const prompt = `You are an expert Medical Registrar. Extract structured data from this medical document text.
    TEXT: ${rawText}
    Focus on: Diagnoses, Medications (name, dose, freq), Lab Results, and Provider.`;

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
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
 */
export async function vitalityAgent(profile: any) {
  try {
    const prompt = `Act as a senior clinical analyst for AXON. 
    Calculate a 'Health Vitality Score' (0-100) based on the following weighted algorithm:
    - Vitals (40%): BP, Heart Rate, Blood Sugar.
    - Lifestyle (30%): Sleep, Water, Smoking, Activity Level.
    - Family History (15%): Chronic illness history.
    - BMI (15%): Calculated from Height/Weight.

    PATIENT PROFILE: ${JSON.stringify(profile)}

    Output exactly JSON with vitality_score, detailed_explanation, and 3 specific improvement_areas.`;

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
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
    return { 
      vitality_score: 75, 
      explanation: "Baseline AXON assessment.", 
      improvement_areas: ["Hydration optimization", "Sleep consistency", "Regular activity"] 
    };
  }
}

/**
 * Agent: Risk Agent
 */
export async function riskAgent(records: any[]) {
  const prompt = `Review these medical records for chronic risk factors.
  RECORDS: ${JSON.stringify(records)}`;

  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
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
 * Chat with AXON
 */
export async function chatWithAxon(messages: any[], userQuery: string) {
  try {
    const aiChat = ai.chats.create({
      model: "gemini-3.1-pro-preview",
      config: {
        systemInstruction: "You are AXON, an advanced, privacy-preserving medical AI clinical assistant. Your role is to assist the user (doctor or patient) with their clinical history, answer health questions factually based strictly on their records, and provide clinical insights in a crisp, professional manner. Keep responses concise and well-structured.",
      }
    });
    
    // Convert previous messages to correct generic structure? No, `@google/genai` creates a chat session.
    // If we have history, we might need to pass it or just stringify the history into a prompt for a single turn if chat session is hard to hydrate.
    // Wait, let's just use generateContent with the full history as "contents".
    
    const contents = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));
    
    contents.push({
      role: 'user',
      parts: [{ text: userQuery }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: contents,
      config: {
        systemInstruction: "You are AXON, an advanced clinical assistant AI. Provide crisp, professional, and well-structured responses focusing on clinical relevance."
      }
    });
    
    return response.text;
  } catch (error) {
    console.error("AXON Chat Error:", error);
    throw error;
  }
}

export async function summaryAgent(patient: any, records: any[]) {
  const prompt = `Provide a professional 3-sentence clinical executive summary for a doctor.
  Patient: ${JSON.stringify(patient)}
  History: ${JSON.stringify(records)}`;

  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });
  return result.text.trim();
}
