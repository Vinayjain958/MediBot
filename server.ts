import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API endpoint for backend handling
  app.post("/api/chat", async (req, res) => {
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

      res.json({
        choices: [{ message: { content: response.text } }]
      });
    } catch (err: any) {
      console.error("Fetch Error:", err);
      // Passing the exact error message so you can see if the key is rejected!
      res.status(500).json({ error: err.message || "Failed to communicate with API" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
