import { GoogleGenAI } from "@google/genai";
import { Message, Question, Survey, Language } from "../types";

const apiKey = process.env.API_KEY || ''; 

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const summarizeChat = async (messages: Message[], lang: Language): Promise<string> => {
  if (!ai) return lang === 'pt' ? "Serviço de IA não configurado." : "AI Service not configured.";

  try {
    const chatText = messages.map(m => `${m.userName}: ${m.text}`).join('\n');
    // Prompt instructs model to answer in the requested language
    const prompt = `Summarize the following chat log from a corporate event in 3 concise bullet points in ${lang === 'pt' ? 'Portuguese' : 'English'}. Focus on sentiment and key questions:\n\n${chatText}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || (lang === 'pt' ? "Não foi possível gerar o resumo." : "Could not generate summary.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return lang === 'pt' ? "Erro ao gerar resumo." : "Error generating summary.";
  }
};

export const suggestPollQuestion = async (context: string, lang: Language): Promise<string> => {
    if (!ai) return "{}";

    try {
        const prompt = `Based on this context: "${context}", suggest a single engaging poll question with 3 options for the audience. The language must be ${lang === 'pt' ? 'Portuguese (Brazil)' : 'English'}. Return ONLY JSON format: { "question": string, "options": string[] }`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return response.text || "{}";
    } catch (e) {
        console.error(e);
        return "{}";
    }
}

export const generateSurvey = async (topic: string, lang: Language): Promise<string> => {
    if (!ai) return "";

    try {
        const prompt = `Create a short post-session feedback survey for a corporate event session about "${topic}". Include 1 rating question and 1 text question. The language must be ${lang === 'pt' ? 'Portuguese (Brazil)' : 'English'}. Return JSON format: { "title": string, "fields": [ { "id": "f1", "question": string, "type": "RATING" }, { "id": "f2", "question": string, "type": "TEXT" } ] }`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return response.text || "{}";
    } catch (e) {
        console.error(e);
        return "{}";
    }
}