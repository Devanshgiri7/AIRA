// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_KEY) {
  console.warn("Warning: OPENAI_API_KEY not set in .env");
}

// Helper that calls OpenAI Chat Completions
async function callOpenAI(messages) {
  // Use the Chat Completions endpoint
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",   // change if you want another model
      messages,
      max_tokens: 400,
      temperature: 0.7,
    }),
  });

  const text = await r.text();
  if (!r.ok) {
    throw new Error(`OpenAI error ${r.status}: ${text}`);
  }
  return JSON.parse(text);
}

// Proxy endpoint used by your frontend
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages) return res.status(400).json({ error: "messages required" });

    const data = await callOpenAI(messages);

    // safe extract assistant text
    const assistant =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      "";

    return res.json({ reply: assistant, raw: data });
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: "server error", detail: String(err) });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));