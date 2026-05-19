// api/generate-image.js

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "Prompt é obrigatório" });
  if (!process.env.OPENAI_KEY) return res.status(500).json({ error: "OPENAI_KEY não configurada no Vercel" });

  try {
    // Step 1: gerar imagem — receber URL
    const genRes = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1792",
        quality: "hd",
        // SEM style, SEM response_format — usa padrão (url)
      }),
    });

    if (!genRes.ok) {
      const err = await genRes.json();
      return res.status(500).json({ error: err.error?.message || "Erro ao gerar imagem" });
    }

    const genData = await genRes.json();
    const imageUrl = genData.data?.[0]?.url;
    if (!imageUrl) return res.status(500).json({ error: "URL da imagem não retornada" });

    // Step 2: baixar imagem e converter para base64 no servidor
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return res.status(500).json({ error: "Erro ao baixar imagem gerada" });

    const arrayBuffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return res.status(200).json({ image: base64 });
  } catch (error) {
    return res.status(500).json({ error: "Erro interno: " + error.message });
  }
}
