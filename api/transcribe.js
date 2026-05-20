// api/transcribe.js
// Recebe áudio em base64, transcreve com Whisper, extrai dados com Claude

export const maxDuration = 30;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { audio, mime = "audio/webm" } = req.body || {};
  if (!audio) return res.status(400).json({ error: "Áudio obrigatório" });
  if (!process.env.OPENAI_KEY) return res.status(500).json({ error: "OPENAI_KEY não configurada" });

  try {
    // 1. Transcreve com Whisper
    const buffer = Buffer.from(audio, "base64");
    const blob = new Blob([buffer], { type: mime });
    const formData = new FormData();
    formData.append("file", blob, "audio.webm");
    formData.append("model", "whisper-1");
    formData.append("language", "pt");

    const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.OPENAI_KEY}` },
      body: formData,
    });

    if (!whisperRes.ok) {
      const e = await whisperRes.json();
      return res.status(500).json({ error: e.error?.message || "Erro na transcrição" });
    }

    const { text } = await whisperRes.json();
    if (!text) return res.status(500).json({ error: "Transcrição vazia" });

    // 2. Claude extrai os dados estruturados
    const themes = ["princesa","herois","spiderman","frozen","stitch","unicornio","barbie","patrulha","dino","futebol","gamer","neon","kpop"];

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        messages: [{
          role: "user",
          content: `Analise este pedido de convite de aniversário e extraia os dados. Responda SOMENTE com JSON válido, sem markdown.

Pedido: "${text}"

Temas disponíveis: ${themes.join(", ")}

Retorne:
{
  "nome": "nome do aniversariante ou vazio",
  "idade": "número da idade ou vazio",  
  "data": "data no formato YYYY-MM-DD ou vazio",
  "hora": "horário HH:MM ou vazio",
  "local": "local da festa ou vazio",
  "tema": "um dos temas disponíveis mais adequado",
  "genero": "menina ou menino",
  "photoMode": "ser (quer virar o personagem), com (quer personagem ao lado), normal (só foto)",
  "mensagem": "mensagem criativa para os convidados com o nome da pessoa, baseada no que foi pedido",
  "transcricao": "texto original transcrito"
}`
        }]
      }),
    });

    const claudeData = await claudeRes.json();
    const content = claudeData.content?.find(b => b.type === "text")?.text || "{}";

    let extracted = {};
    try { extracted = JSON.parse(content.replace(/```json|```/g, "").trim()); }
    catch { extracted = { transcricao: text }; }

    return res.status(200).json({ ...extracted, transcricao: text });

  } catch (error) {
    return res.status(500).json({ error: "Erro interno: " + error.message });
  }
}
