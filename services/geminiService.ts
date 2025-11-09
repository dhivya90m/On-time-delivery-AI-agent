
import { GoogleGenAI } from "@google/genai";
import { Alert } from '../types';

const getGeminiApiKey = (): string => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable not set");
  }
  return apiKey;
};

export const getCorrectiveActions = async (alert: Alert): Promise<string[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });

    const prompt = `
      You are an expert in logistics and supply chain management acting as an AI agent.
      The On-Time Delivery (OTD) rate for the "${alert.region}" region has dropped to ${alert.otdRate}%, which is below the target of ${alert.targetRate}%.
      This occurred in week ${alert.week}.

      Based on this deviation, provide a concise list of 2-3 specific, actionable, and distinct recommendations to investigate and resolve this issue.
      Examples of actions include 'Initiate a review of last-mile delivery routes for this region', 'Escalate to the regional logistics manager for immediate investigation', or 'Analyze carrier performance data for potential delays'.

      Format the output as a valid JSON array of strings. For example:
      ["Action 1", "Action 2", "Action 3"]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const textResponse = response.text.trim();
    
    // Clean the response to make it valid JSON
    const jsonString = textResponse.replace(/^```json\s*|```\s*$/g, '');

    const actions = JSON.parse(jsonString);
    if (Array.isArray(actions) && actions.every(item => typeof item === 'string')) {
      return actions;
    }
    throw new Error('Invalid response format from AI');
  } catch (error) {
    console.error('Error fetching corrective actions from Gemini:', error);
    // Return fallback recommendations on error
    return [
      'Error: Could not retrieve AI recommendations.',
      'Suggestion: Manually review carrier performance.',
      'Suggestion: Check for regional disruptions or events.',
    ];
  }
};
