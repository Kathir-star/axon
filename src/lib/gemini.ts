import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

/**
 * Extracts structured medical data from an image/PDF using Gemini Flash.
 */
export async function extractMedicalData(base64Image: string, mimeType: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-preview",
      contents: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        "Extract medical information from this document.",
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            patientName: { type: Type.STRING, description: "Name of the patient, or null if missing" },
            dateOfService: { type: Type.STRING, description: "Date of the visit/scan/report in YYYY-MM-DD format" },
            typeOfRecord: { type: Type.STRING, description: "E.g., Lab Report, Progress Note, Discharge Summary" },
            diagnosis: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of diagnoses mentioned" },
            medications: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of prescribed/current medications" },
            keyFindings: { type: Type.STRING, description: "A highly concise summary of key findings and results" },
            providerName: { type: Type.STRING, description: "Name of the doctor/provider" }
          },
          required: ["typeOfRecord", "keyFindings"]
        }
      }
    });
    
    return JSON.parse(response.text.trim());
  } catch (error) {
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
      model: "gemini-3.1-pro-preview", // using Pro for advanced synthesis of multiple documents
      contents: [
        `You are a brilliant medical orchestrator AI. Analyze these longitudinal patient records over time.`,
        `RECORDS: ${recordsText}`,
        `Synthesize these past records to find trends. Highlight chronic risks, medication history changes, and treatment-response patterns.`
      ],
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
  } catch (error) {
    console.error("Gemini Synthesis Error:", error);
    throw new Error("Failed to synthesize patient records");
  }
}
