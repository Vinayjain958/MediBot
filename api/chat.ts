// This file automatically acts as your backend server on Vercel.
// Vercel routes any request to /api/chat to this Serverless Function.
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60; // Max allowed duration on Vercel Hobby tier is 60 seconds

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb', 
    },
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const { messages } = req.body;

  // You requested to hardcode this specific key.
  const GEMINI_API_KEY = "AIzaSyAVMamIjAFkmpNosSmWLOK41QyIEDf9vrY";

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  try {
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: "You are a professional medical assistant named MediBot. Format your responses using strict and robust Markdown. Always be brief, clear, and professional. REMEMBER: Never output raw random characters. Provide disclaimers that you are an AI assistant and not a real doctor.",
        temperature: 0.7,
      }
    });

    return res.status(200).json({
      choices: [{ message: { content: response.text } }]
    });

  } catch (err: any) {
    console.error("Fetch Error:", err);
    return res.status(500).json({ error: err.message || "Failed to communicate with API" });
  }
}
