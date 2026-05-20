// api/transcribe.js
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
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: "ANTHROPIC_API_KEY não configurada no Vercel" });

  try {
    // 1. Transcreve com Whisper
    const buffer = Buffer.from(audio, "base64");
    const blob = new Blob([buffer], { type: "audio/webm" });
    const formData = new FormData();
    formData.append("file", blob, "audio.webm");
    formData.append("model", "whisper-1");
    formData.append("language", "pt");

    const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.OPENAI_KEY}` },
      body: formData,
    });

    const whisperText = await whisperRes.text();
    let whisperData;
    try { whisperData = JSON.parse(whisperText); }
    catch { return res.status(500).json({ error: "Whisper retornou resposta inválida: " + whisperText.slice(0,100) }); }

    if (!whisperRes.ok) return res.status(500).json({ error: whisperData.error?.message || "Erro na transcrição" });

    const text = whisperData.text;
    if (!text || text.trim().length < 3) return res.status(400).json({ error: "Áudio muito curto ou inaudível. Tente falar mais claro." });

    console.log("Transcrição:", text);

    // 2. Claude extrai dados estruturados
    const themes = ["princesa","herois","spiderman","frozen","stitch","unicornio","barbie","patrulha","dino","futebol","gamer","neon","kpop"];
    const today = new Date().toISOString().split("T")[0];
    const currentYear = new Date().getFullYear();

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 700,
        messages: [{
          role: "user",
          content: `Você é um extrator de dados de convites de aniversário. Analise o pedido abaixo e extraia os dados.

Pedido: "${text}"

Temas disponíveis: ${themes.join(", ")}
Data atual: ${today}
Ano atual: ${currentYear}

REGRAS:
- Se a pessoa mencionar um personagem (ex: Homem-Aranha, Frozen, Barbie), escolha o tema correspondente
- Se mencionar "futebol" ou esportes → futebol
- Se não mencionar tema → escolha baseado no gênero e idade
- Para datas: interprete mês por nome ("junho" = 06, "julho" = 07 etc)
- Para fotoMode: se disser "quero ser/virar" → "ser"; se disser "com o personagem/ao lado" → "com"; caso contrário → "normal"

Retorne SOMENTE este JSON válido (sem markdown, sem texto extra):
{
  "nome": "nome do aniversariante (string ou vazio)",
  "idade": "número da idade (string ou vazio)",
  "data": "data no formato YYYY-MM-DD (ou vazio se não mencionada)",
  "hora": "horário HH:MM (ou vazio se não mencionado)",
  "local": "local da festa (string ou vazio)",
  "tema": "um dos temas da lista",
  "genero": "menina ou menino",
  "photoMode": "ser, com ou normal",
  "mensagem": "mensagem animada para os convidados com o nome da pessoa (2 frases curtas em pt-BR)"
}`
        }]
      }),
    });

    const claudeText = await claudeRes.text();
    let claudeData;
    try { claudeData = JSON.parse(claudeText); }
    catch { return res.status(500).json({ error: "Erro ao processar Claude: " + claudeText.slice(0,100) }); }

    if (!claudeRes.ok) return res.status(500).json({ error: claudeData.error?.message || "Erro no Claude" });

    const content = claudeData.content?.find(b => b.type === "text")?.text || "{}";
    let extracted = {};
    try {
      const clean = content.replace(/```json|```/g, "").trim();
      extracted = JSON.parse(clean);
    } catch {
      // Claude returned invalid JSON, return at least the transcription
      extracted = { transcricao: text };
    }

    console.log("Extraído:", JSON.stringify(extracted));
    return res.status(200).json({ ...extracted, transcricao: text });

  } catch (error) {
    console.error("Erro:", error);
    return res.status(500).json({ error: "Erro interno: " + error.message });
  }
}
