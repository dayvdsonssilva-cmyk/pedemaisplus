// api/claude.js
// Env var necessária no Vercel:
//   ANTHROPIC_API_KEY → sua chave da Anthropic (console.anthropic.com)

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { messages, max_tokens = 400, model = "claude-sonnet-4-20250514" } = req.body || {};
  if (!messages) return res.status(400).json({ error: "messages é obrigatório" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model, max_tokens, messages }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Anthropic error:", err);
      return res.status(500).json({ error: err.error?.message || "Erro na API Anthropic" });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
