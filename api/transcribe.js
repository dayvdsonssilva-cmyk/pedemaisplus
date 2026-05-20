// api/transcribe.js — Whisper (transcrição) + GPT-4o (extração) — tudo OPENAI_KEY
export const maxDuration = 30;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { audio, mime = "audio/webm" } = req.body || {};
  if (!audio) return res.status(400).json({ error: "Áudio obrigatório" });
  if (!process.env.OPENAI_KEY) return res.status(500).json({ error: "OPENAI_KEY não configurada no Vercel" });

  try {
    // 1. Whisper — transcreve o áudio
    const buffer = Buffer.from(audio, "base64");
    const blob = new Blob([buffer], { type: "audio/webm" });
    const formData = new FormData();
    formData.append("file", blob, "audio.webm");
    formData.append("model", "whisper-1");
    formData.append("language", "pt");

    const wRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.OPENAI_KEY}` },
      body: formData,
    });

    const wText = await wRes.text();
    let wData;
    try { wData = JSON.parse(wText); }
    catch { return res.status(500).json({ error: "Erro Whisper: " + wText.slice(0, 100) }); }
    if (!wRes.ok) return res.status(500).json({ error: wData.error?.message || "Erro na transcrição" });

    const text = wData.text?.trim();
    if (!text || text.length < 3) return res.status(400).json({ error: "Áudio muito curto. Fale mais claro e devagar." });
    console.log("Transcrição:", text);

    // 2. GPT-4o — extrai dados estruturados
    const themes = ["princesa","herois","spiderman","frozen","stitch","unicornio","barbie","patrulha","dino","futebol","gamer","neon","kpop"];
    const today = new Date().toISOString().split("T")[0];

    const gRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 600,
        response_format: { type: "json_object" },
        messages: [{
          role: "system",
          content: "Você extrai dados de pedidos de convite de aniversário. Responda SOMENTE com JSON válido.",
        }, {
          role: "user",
          content: `Analise este pedido e extraia os dados.

Pedido: "${text}"

Temas disponíveis: ${themes.join(", ")}
Data atual: ${today}

REGRAS:
- Personagem mencionado → tema correspondente (Homem-Aranha → spiderman, Frozen/Elsa → frozen, Barbie → barbie, etc.)
- "quero ser/virar o personagem" → photoMode "ser"
- "com o personagem/ao lado" → photoMode "com"
- Sem menção de foto → photoMode "normal"
- Datas: interprete meses por nome (junho=06, julho=07, etc.)
- Crie uma mensagem animada de 2 frases com o nome da pessoa

Retorne este JSON:
{
  "nome": "nome ou vazio",
  "idade": "número ou vazio",
  "data": "YYYY-MM-DD ou vazio",
  "hora": "HH:MM ou vazio",
  "local": "local ou vazio",
  "tema": "um da lista",
  "genero": "menina ou menino",
  "photoMode": "ser, com ou normal",
  "mensagem": "mensagem com o nome"
}`,
        }],
      }),
    });

    const gText = await gRes.text();
    let gData;
    try { gData = JSON.parse(gText); }
    catch { return res.status(500).json({ error: "Erro GPT-4o: " + gText.slice(0, 100) }); }
    if (!gRes.ok) return res.status(500).json({ error: gData.error?.message || "Erro GPT-4o" });

    const content = gData.choices?.[0]?.message?.content || "{}";
    let extracted = {};
    try { extracted = JSON.parse(content); }
    catch { extracted = {}; }

    console.log("Extraído:", JSON.stringify(extracted));
    return res.status(200).json({ ...extracted, transcricao: text });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Erro interno: " + e.message });
  }
}
