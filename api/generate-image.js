// api/generate-image.js — usa gpt-image-2 como prioridade
export const maxDuration = 60;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "Prompt obrigatório" });
  if (!process.env.OPENAI_KEY) return res.status(500).json({ error: "OPENAI_KEY não configurada no Vercel" });

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.OPENAI_KEY}`,
  };

  // gpt-image-2 como prioridade, fallbacks em sequência
  const models = [
    { model: "gpt-image-2",      size: "1024x1536", quality: "high"   },
    { model: "gpt-image-1",      size: "1024x1536", quality: "high"   },
    { model: "gpt-image-1-mini", size: "1024x1536", quality: "medium" },
    { model: "gpt-image-1.5",    size: "1024x1536", quality: "high"   },
  ];

  async function toBase64(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error("Erro ao baixar imagem");
    return Buffer.from(await r.arrayBuffer()).toString("base64");
  }

  let lastError = "Nenhum modelo disponível";

  for (const m of models) {
    try {
      console.log(`Tentando ${m.model}...`);
      const r = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers,
        body: JSON.stringify({
          model:   m.model,
          prompt:  prompt,
          n:       1,
          size:    m.size,
          quality: m.quality,
        }),
      });

      const text = await r.text();
      let data;
      try { data = JSON.parse(text); }
      catch { lastError = `Resposta inválida de ${m.model}`; continue; }

      if (!r.ok) {
        lastError = data.error?.message || `Erro ${r.status} em ${m.model}`;
        console.log(`Falhou ${m.model}:`, lastError);
        continue;
      }

      let image = data.data?.[0]?.b64_json;
      if (!image && data.data?.[0]?.url) image = await toBase64(data.data[0].url);
      if (!image) { lastError = `Imagem vazia em ${m.model}`; continue; }

      console.log(`✅ ${m.model}`);
      return res.status(200).json({ image, model: m.model });
    } catch (e) {
      lastError = e.message;
      console.log(`Erro ${m.model}:`, e.message);
    }
  }

  return res.status(500).json({ error: lastError });
}
