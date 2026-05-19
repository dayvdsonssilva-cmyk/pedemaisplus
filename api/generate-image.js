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

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.OPENAI_KEY}`,
  };

  // Tenta gpt-image-1 (modelo atual), depois dall-e-3, depois dall-e-2
  const attempts = [
    {
      model: "gpt-image-1",
      body: { model: "gpt-image-1", prompt, n: 1, size: "1024x1536", quality: "high" },
      getImage: async (data) => {
        // gpt-image-1 retorna b64_json direto
        const b64 = data.data?.[0]?.b64_json;
        if (b64) return b64;
        // ou URL
        const url = data.data?.[0]?.url;
        if (url) return await urlToBase64(url);
        return null;
      }
    },
    {
      model: "dall-e-3",
      body: { model: "dall-e-3", prompt, n: 1, size: "1024x1792", quality: "hd" },
      getImage: async (data) => {
        const url = data.data?.[0]?.url;
        if (url) return await urlToBase64(url);
        return data.data?.[0]?.b64_json || null;
      }
    },
    {
      model: "dall-e-2",
      body: { model: "dall-e-2", prompt: prompt.slice(0, 1000), n: 1, size: "512x512" },
      getImage: async (data) => {
        const url = data.data?.[0]?.url;
        if (url) return await urlToBase64(url);
        return null;
      }
    },
  ];

  async function urlToBase64(url) {
    const r = await fetch(url);
    if (!r.ok) return null;
    const buf = await r.arrayBuffer();
    return Buffer.from(buf).toString("base64");
  }

  let lastError = "Nenhum modelo disponível";

  for (const attempt of attempts) {
    try {
      console.log(`Tentando modelo: ${attempt.model}`);
      const r = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers,
        body: JSON.stringify(attempt.body),
      });

      if (!r.ok) {
        const err = await r.json();
        lastError = err.error?.message || `Erro no modelo ${attempt.model}`;
        console.log(`Falhou ${attempt.model}:`, lastError);
        continue; // tenta o próximo
      }

      const data = await r.json();
      const image = await attempt.getImage(data);

      if (!image) {
        lastError = `Imagem não retornada pelo modelo ${attempt.model}`;
        continue;
      }

      console.log(`✅ Sucesso com modelo: ${attempt.model}`);
      return res.status(200).json({ image, model: attempt.model });

    } catch (e) {
      lastError = e.message;
      console.log(`Erro ${attempt.model}:`, e.message);
    }
  }

  return res.status(500).json({ error: lastError });
}
