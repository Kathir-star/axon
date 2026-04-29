import { GoogleGenAI } from "@google/genai";

const getAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("VITE_GEMINI_API_KEY is missing in axonAiAgent. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

const ai = getAI();

export const generateClinicalRecommendation = async (decryptedPatientContext: any[], userQuery: string) => {
  if (!ai) return "Error: AI client not initialized. Check VITE_GEMINI_API_KEY.";
  
  // Use the latest standard production model
  const model = "gemini-2.0-flash"; 

  const systemInstruction = `
    You are AXON, an advanced, privacy-preserving medical AI agent.
    Your role is to surface clinically relevant context from longitudinal patient records.
    Analyze the following patient data array: ${JSON.stringify(decryptedPatientContext)}
    
    Respond to the query with highly specific, data-driven medical insights. 
    Maintain a clinical, objective, and secure tone. Highlight risk signals and treatment-response patterns.
    
    If data is insufficient, state: "Insufficient data vectors to project trajectory."
  `;

  try {
    const result = await ai.models.generateContent({
      model,
      contents: userQuery,
      config: { systemInstruction }
    });
    return result.text;
  } catch (error) {
    console.error("AXON Agent Error:", error);
    return "Error: Unable to synthesize clinical context at this time.";
  }
};

/**
 * High-fidelity synthesis for the Clinical Brief
 */
export const synthesizeClinicalBrief = async (records: any[]) => {
  if (!ai) return "Insufficient data to project clinical trajectory (AI unavailable).";
  
  const model = "gemini-2.0-flash";
  
  const systemInstruction = `
    You are AXON. Synthesize the longitudinal health history of the patient.
    Maintain a clinical, advanced tone.
  `;

  const prompt = `
    RECORDS: ${JSON.stringify(records)}
    
    Format:
    - Immediate Risk Signals (High/Medium/Low)
    - Treatment-Response Patterns
    - Actionable Clinical Context
  `;

  try {
    const result = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { systemInstruction }
    });
    return result.text;
  } catch (error) {
    console.error("Synthesis error:", error);
    return "Insufficient data to project clinical trajectory.";
  }
};
