// api/generate-image.js
// Modelos disponíveis confirmados: gpt-image-1, gpt-image-1-mini, gpt-image-1.5, gpt-image-2

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "Prompt é obrigatório" });
  if (!process.env.OPENAI_KEY) return res.status(500).json({ error: "OPENAI_KEY não configurada no Vercel" });

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.OPENAI_KEY}`,
  };

  // Modelos confirmados na conta, do melhor para o mais rápido
  const attempts = [
    { model: "gpt-image-1",      size: "1024x1536", quality: "high"   },
    { model: "gpt-image-1.5",    size: "1024x1536", quality: "high"   },
    { model: "gpt-image-1-mini", size: "1024x1536", quality: "medium" },
    { model: "gpt-image-2",      size: "1024x1536", quality: "medium" },
  ];

  async function urlToBase64(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error("Erro ao baixar imagem");
    return Buffer.from(await r.arrayBuffer()).toString("base64");
  }

  let lastError = "Nenhum modelo disponível";

  for (const attempt of attempts) {
    try {
      console.log(`Tentando: ${attempt.model}`);

      const r = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers,
        body: JSON.stringify({
          model:   attempt.model,
          prompt:  prompt,
          n:       1,
          size:    attempt.size,
          quality: attempt.quality,
        }),
      });

      const data = await r.json();

      if (!r.ok) {
        lastError = data.error?.message || `Erro no modelo ${attempt.model}`;
        console.log(`Falhou ${attempt.model}:`, lastError);
        continue;
      }

      // gpt-image-* retorna b64_json direto
      let image = data.data?.[0]?.b64_json;

      // fallback: se vier URL, baixa e converte
      if (!image && data.data?.[0]?.url) {
        image = await urlToBase64(data.data[0].url);
      }

      if (!image) {
        lastError = `Imagem não retornada pelo modelo ${attempt.model}`;
        continue;
      }

      console.log(`✅ Sucesso: ${attempt.model}`);
      return res.status(200).json({ image, model: attempt.model });

    } catch (e) {
      lastError = e.message;
      console.log(`Erro ${attempt.model}:`, e.message);
    }
  }

  return res.status(500).json({ error: lastError });
}
