// api/check-models.js
// Acesse: https://seusite.vercel.app/api/check-models
// Mostra quais modelos de imagem sua conta tem acesso

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (!process.env.OPENAI_KEY) return res.status(500).json({ error: "OPENAI_KEY não configurada" });

  try {
    // Lista todos os modelos disponíveis
    const r = await fetch("https://api.openai.com/v1/models", {
      headers: { "Authorization": `Bearer ${process.env.OPENAI_KEY}` }
    });
    const data = await r.json();

    // Filtra modelos de imagem
    const imageModels = (data.data || [])
      .filter(m => m.id.includes("dall-e") || m.id.includes("image") || m.id.includes("gpt-image"))
      .map(m => m.id)
      .sort();

    // Testa cada modelo de imagem
    const tests = {};
    for (const model of imageModels) {
      try {
        const tr = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENAI_KEY}` },
          body: JSON.stringify({ model, prompt: "a red circle", n: 1, size: "256x256" })
        });
        const td = await tr.json();
        tests[model] = tr.ok ? "✅ FUNCIONA" : `❌ ${td.error?.message || "erro"}`;
      } catch(e) {
        tests[model] = `❌ ${e.message}`;
      }
    }

    return res.status(200).json({
      image_models_available: imageModels,
      tests,
      all_models_count: data.data?.length || 0,
      tip: imageModels.length === 0
        ? "⚠️ Nenhum modelo de imagem disponível. Verifique billing em platform.openai.com/account/billing"
        : "OK"
    });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
