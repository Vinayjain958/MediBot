// This file automatically acts as your backend server on Vercel.
// Vercel routes any request to /api/chat to this Serverless Function.

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb', // Vercel's free tier has a 4.5MB payload limit
    },
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const { messages } = req.body;

  // Use the environment variable if present in Vercel, otherwise fallback to your provided key
  const NVIDIA_API_KEY =
    process.env.NVIDIA_API_KEY ||
    "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";

  const invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions";

  try {
    const fetchResponse = await fetch(invoke_url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NVIDIA_API_KEY}`,
        "Accept": "application/json",
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

    if (!fetchResponse.ok) {
      const errText = await fetchResponse.text();
      console.error("NVIDIA API error:", errText);
      return res.status(fetchResponse.status).json({ error: errText });
    }

    const data = await fetchResponse.json();
    return res.status(200).json(data);
  } catch (err: any) {
    console.error("Fetch Error:", err);
    return res.status(500).json({ error: "Failed to communicate with API" });
  }
}
