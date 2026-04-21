import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit to handle large base64 image/audio strings
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API endpoint for NVIDIA backend
  app.post("/api/chat", async (req, res) => {
    const { messages } = req.body;

    const NVIDIA_API_KEY =
      process.env.NVIDIA_API_KEY ||
      "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";

    const invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions";

    try {
      const response = await fetch(invoke_url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NVIDIA_API_KEY}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemma-4-31b-it",
          messages,
          max_tokens: 16384,
          temperature: 1.00,
          top_p: 0.95,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("NVIDIA API error:", errText);
        return res.status(response.status).json({ error: errText });
      }

      const data = await response.json();
      res.json(data);
    } catch (err) {
      console.error("Fetch Error:", err);
      res.status(500).json({ error: "Failed to communicate with API" });
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
