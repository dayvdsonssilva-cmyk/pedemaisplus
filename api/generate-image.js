// api/generate-image.js
export const maxDuration = 60;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "Prompt obrigatório" });
  if (!process.env.OPENAI_KEY) return res.status(500).json({ error: "OPENAI_KEY não configurada" });

  // Tenta cada modelo disponível na conta
  const attempts = [
    { model: "gpt-image-2",      size: "1024x1536", quality: "high"   },
    { model: "gpt-image-1",      size: "1024x1536", quality: "high"   },
    { model: "gpt-image-1-mini", size: "1024x1536", quality: "medium" },
    { model: "gpt-image-1.5",    size: "1024x1536", quality: "high"   },
  ];

  for (const m of attempts) {
    try {
      console.log("Tentando:", m.model);

      const r = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_KEY}`,
        },
        body: JSON.stringify({
          model:   m.model,
          prompt:  prompt.slice(0, 4000), // limit prompt size
          n:       1,
          size:    m.size,
          quality: m.quality,
        }),
      });

      const raw = await r.text();
      let data;
      try { data = JSON.parse(raw); }
      catch { console.log("Parse error:", raw.slice(0,200)); continue; }

      if (!r.ok) {
        console.log(`${m.model} falhou:`, data.error?.message);
        continue;
      }

      // Pode vir como b64_json ou url
      let image = data.data?.[0]?.b64_json;

      if (!image && data.data?.[0]?.url) {
        const imgR = await fetch(data.data[0].url);
        if (imgR.ok) {
          image = Buffer.from(await imgR.arrayBuffer()).toString("base64");
        }
      }

      if (!image) { console.log(`${m.model}: sem imagem`); continue; }

      console.log("✅ Sucesso:", m.model);
      return res.status(200).json({ image, model: m.model });

    } catch (e) {
      console.log(`Erro ${m.model}:`, e.message);
    }
  }

  return res.status(500).json({
    error: "Não foi possível gerar a imagem. Verifique sua conta OpenAI em platform.openai.com"
  });
}
