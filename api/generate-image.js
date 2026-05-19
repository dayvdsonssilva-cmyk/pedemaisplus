// api/generate-image.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "Prompt é obrigatório" });

  if (!process.env.OPENAI_KEY) {
    return res.status(500).json({ error: "OPENAI_KEY não configurada no Vercel" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt + " NO text NO words NO letters NO numbers. Portrait 9:16.",
        n: 1,
        size: "1024x1792",
        quality: "hd",
        response_format: "b64_json",
        // style removido — causa erro no dall-e-3
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(500).json({ error: err.error?.message || "Erro ao gerar imagem" });
    }

    const data = await response.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) return res.status(500).json({ error: "Imagem não retornada" });

    return res.status(200).json({ image: b64 });
  } catch (error) {
    return res.status(500).json({ error: "Erro interno: " + error.message });
  }
}
