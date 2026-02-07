import { GoogleGenAI } from "@google/genai";
import { UserHealthData, TimelineEvent } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Internal session cache to prevent redundant API calls
const insightCache = new Map<string, string>();
const summaryCache = new Map<string, string>();

/**
 * Local Fallback Heuristics: Used when API is unavailable or quota is reached
 */
function getLocalSummary(events: TimelineEvent[]): string {
  const counts = { Labs: 0, Surgeries: 0, Prescriptions: 0 };
  events.forEach(e => {
    if (counts.hasOwnProperty(e.category)) {
      counts[e.category as keyof typeof counts]++;
    }
  });

  const lines = [];
  lines.push(counts.Labs > 0 ? `• ${counts.Labs} Lab Result${counts.Labs > 1 ? 's' : ''} logged` : "• No recent lab records");
  lines.push(counts.Surgeries > 0 ? `• ${counts.Surgeries} Surgery record${counts.Surgeries > 1 ? 's' : ''} found` : "• No recent surgeries");
  lines.push(counts.Prescriptions > 0 ? `• ${counts.Prescriptions} Active prescription${counts.Prescriptions > 1 ? 's' : ''}` : "• No active prescriptions");
  
  return lines.join('\n');
}

function getLocalInsight(data: UserHealthData): string {
  const lines = [];
  if (data.allergies && data.allergies.toLowerCase() !== 'none') {
    lines.push(`• ALERT: ${data.allergies.toUpperCase()} ALLERGY`);
  } else {
    lines.push("• NO KNOWN DRUG ALLERGIES");
  }
  
  if (data.chronicDiseases && data.chronicDiseases.toLowerCase() !== 'none') {
    lines.push(`• MONITOR: ${data.chronicDiseases.split(',')[0].trim().toUpperCase()}`);
  } else {
    lines.push("• STABLE CHRONIC HISTORY");
  }

  lines.push("• VERIFY IDENTITY VIA QR SCAN");
  return lines.slice(0, 3).join('\n');
}

/**
 * Utility for graceful retries on rate limits (429)
 */
async function callWithRetry(fn: () => Promise<any>, retries = 1, delay = 1000): Promise<any> {
  try {
    return await fn();
  } catch (error: any) {
    const errorStr = JSON.stringify(error).toUpperCase();
    const isQuotaError = errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED') || (error?.status === 429);
    
    if (isQuotaError && retries > 0) {
      await new Promise(r => setTimeout(r, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function getHealthInsight(data: UserHealthData) {
  const cacheKey = `insight_${data.fullName}_${data.bloodGroup}_${data.allergies}_${data.chronicDiseases}`;
  if (insightCache.has(cacheKey)) return insightCache.get(cacheKey)!;

  try {
    const prompt = `Act as an Emergency Medicine Specialist. Based on the profile below, provide 3 critical ACTION-ORIENTED bullets for paramedics or responders. 
    Use direct, punchy commands (e.g., "Check glucose", "Avoid Ibuprofen"). 
    
    Profile: ${data.fullName}, Blood: ${data.bloodGroup}, Allergies: ${data.allergies}, Chronic: ${data.chronicDiseases}
    
    Output exactly 3 short lines.`;

    const response = await callWithRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { temperature: 0.1 }
    }));

    const text = response.text || getLocalInsight(data);
    insightCache.set(cacheKey, text);
    return text;
  } catch (error: any) {
    console.warn("Gemini Insight Fallback Active:", error.message);
    return getLocalInsight(data);
  }
}

export async function getCareChainSummary(events: TimelineEvent[]) {
  if (events.length === 0) return "• No records found\n• History empty\n• Monitoring required";
  
  const cacheKey = `summary_${events.length}_${events[0]?.id}`;
  if (summaryCache.has(cacheKey)) return summaryCache.get(cacheKey)!;

  try {
    const eventsStr = events.map(e => `${e.category}: ${e.title}`).join(', ');
    const prompt = `Review these medical records and provide a 'Current Health Snapshot'. 
    STRICT REQUIREMENT: Provide EXACTLY 3 punchy, one-line bullet points. 
    
    Records: ${eventsStr}`;

    const response = await callWithRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { temperature: 0.1 }
    }));

    const text = response.text || getLocalSummary(events);
    summaryCache.set(cacheKey, text);
    return text;
  } catch (error: any) {
    console.warn("Gemini Summary Fallback Active:", error.message);
    return getLocalSummary(events);
  }
}
