import { GoogleGenAI } from "@google/genai";
import { Alert, KpiData } from '../types';
import { KPI_DEFINITIONS } from '../constants';

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
    const kpiInfo = KPI_DEFINITIONS[alert.kpi];

    const unit = kpiInfo.unit === '%' ? '%' : ` ${kpiInfo.unit}`;

    const deviationDescription = kpiInfo.higherIsBetter
      ? `has fallen to ${alert.value}${unit}, which is below the target of ${alert.targetRate}${unit}`
      : `has risen to ${alert.value}${unit}, which is above the target of ${alert.targetRate}${unit}`;

    const prompt = `
      You are an expert in logistics and supply chain management acting as an AI agent.
      The "${alert.kpi}" metric for the "${alert.region}" region ${deviationDescription}.
      This occurred in week ${alert.week}.

      Based on this deviation, provide a concise list of 2-3 specific, actionable, and distinct recommendations to investigate and resolve this issue.
      Examples of actions include 'Initiate a review of last-mile delivery routes for this region', 'Analyze carrier performance data for potential delays', 'Review warehouse picking processes to improve order accuracy', or 'Investigate negative customer feedback for common themes'.

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


export const getConversationalInsight = async (prompt: string, data: KpiData[]): Promise<string> => {
    if (!data || data.length === 0) {
        return "I can't answer that as there is no data loaded. Please upload a CSV file first.";
    }

    try {
        const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
        const availableKpis = [...new Set(data.map(d => d.kpi))];

        const systemPrompt = `
          You are a helpful and expert Logistics Data Analyst AI.
          You will be given a user's question and a dataset of logistics Key Performance Indicator (KPI) data.
          Your task is to analyze the data to answer the user's question in a clear, concise, and helpful manner.

          The data is provided as a JSON array, where each object represents a KPI value for a specific region and week.
          The available KPIs in this dataset are: ${availableKpis.join(', ')}.

          Here are the user intents you should be able to handle:
          1.  **KPI Trend Insight:** If asked about trends, analyze the 'value' for a KPI over the 'week's. Explain if it's improving or deteriorating.
          2.  **Anomaly Detection:** If asked to detect anomalies or find problematic areas, identify regions or weeks with performance that is significantly worse than others or below the 'target'.
          3.  **Performance Recommendation:** If asked for suggestions or actions, provide logical, data-driven recommendations to improve the specified KPI.
          4.  **Data Queries:** If asked for a specific value (e.g., "what was the on-time delivery in Europe in week 10?"), find and state the exact data point.

          **IMPORTANT:**
          - If the user asks about a metric not present in the data (e.g., 'escalation accuracy'), you MUST state that the data for that metric is not available and list the KPIs you CAN analyze.
          - Base all your answers strictly on the provided data. Do not make up information.
          - Format your response using markdown for readability (e.g., use lists, bold text).
          - Be conversational and helpful.

          Here is the dataset:
          ${JSON.stringify(data)}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { role: 'user', parts: [{ text: systemPrompt }] },
                { role: 'model', parts: [{ text: "Understood. I am ready to analyze the logistics data. Please provide the user's question." }] },
                { role: 'user', parts: [{ text: prompt }] }
            ],
        });

        return response.text;
    } catch (error) {
        console.error('Error fetching conversational insight from Gemini:', error);
        return 'Sorry, I encountered an error while analyzing the data. Please try again.';
    }
};

export const generateExecutiveBrief = async (data: KpiData[], alerts: Alert[], targetWeek: number): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
    
    // Filter data for the specific target week and the previous week for trend comparison
    const recentData = data.filter(d => d.week === targetWeek || d.week === targetWeek - 1);
    
    // Filter alerts to only include those relevant to the target week
    const weekAlerts = alerts.filter(a => a.week === targetWeek);
    
    const prompt = `
      You are the Head of Logistics Operations writing a "Weekly Business Review" email to the executive leadership team.
      
      Context:
      - Report Week: ${targetWeek}
      - Total Active Alerts (Risks) for Week ${targetWeek}: ${weekAlerts.length}
      
      Data Summary (Includes previous week for context if available):
      ${JSON.stringify(recentData)}
      
      Active Alerts (Critical Issues for Week ${targetWeek}):
      ${JSON.stringify(weekAlerts)}

      Task:
      Write a professional, concise executive summary (approx 200-300 words) in Markdown format.
      
      Structure:
      1. **Executive Summary**: A 2-sentence overview of performance for Week ${targetWeek}. Was it improved or worsened compared to the prior week?
      2. **Key Performance Highlights**: Mention 1-2 regions or KPIs performing well.
      3. **Critical Risks & Bottlenecks**: Summarize the active alerts for this specific week.
      4. **Proposed Strategic Actions**: Suggest 3 high-level strategic initiatives to fix the risks (e.g., "Renegotiate carrier contracts in Europe").
      
      Tone: Professional, data-driven, decisive.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error('Error generating executive brief:', error);
    return "Error generating report. Please check your internet connection or API limits.";
  }
};