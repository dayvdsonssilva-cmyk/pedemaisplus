// api/claude.js — usa GPT-4o (mesma OPENAI_KEY, zero Anthropic)
export const maxDuration = 30;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.OPENAI_KEY) return res.status(500).json({ error: "OPENAI_KEY não configurada no Vercel" });

  const { messages, max_tokens = 400 } = req.body || {};
  if (!messages) return res.status(400).json({ error: "messages obrigatório" });

  try {
    // Converte formato Anthropic → OpenAI
    const openaiMessages = messages.map(m => {
      if (typeof m.content === "string") return { role: m.role, content: m.content };
      if (Array.isArray(m.content)) {
        const parts = m.content.map(p => {
          if (p.type === "text") return { type: "text", text: p.text };
          if (p.type === "image") {
            // Anthropic image → OpenAI image_url
            const { media_type, data } = p.source;
            return { type: "image_url", image_url: { url: `data:${media_type};base64,${data}`, detail: "low" } };
          }
          return { type: "text", text: JSON.stringify(p) };
        });
        return { role: m.role, content: parts };
      }
      return m;
    });

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens,
        messages: openaiMessages,
      }),
    });

    const text = await r.text();
    let data;
    try { data = JSON.parse(text); }
    catch { return res.status(500).json({ error: "Resposta inválida da OpenAI" }); }

    if (!r.ok) return res.status(500).json({ error: data.error?.message || "Erro GPT-4o" });

    // Converte resposta OpenAI → formato Anthropic (HTML não precisa mudar)
    const content = data.choices?.[0]?.message?.content || "";
    return res.status(200).json({
      content: [{ type: "text", text: content }],
      model: "gpt-4o",
    });

  } catch (e) {
    return res.status(500).json({ error: "Erro interno: " + e.message });
  }
}
