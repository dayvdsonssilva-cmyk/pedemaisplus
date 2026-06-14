export default async function handler(req, res) {
  // Só aceita POST
  if (req.method !== 'POST') return res.status(405).end();

  // CORS para o próprio domínio
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');

  const { nomeF, nomePai, memoria } = req.body || {};
  if (!nomeF || !nomePai) return res.status(400).json({ erro: 'Dados incompletos' });

  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) return res.status(500).json({ erro: 'Chave não configurada' });

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: `Escreva uma homenagem para um pai falecido.
Filho(a): ${nomeF}
Pai: ${nomePai}
${memoria ? 'Memória: ' + memoria : ''}

Responda APENAS em JSON sem markdown:
{"frases":["frase1","frase2","frase3","frase4","frase5","frase6","frase7"],"mensagem":"mensagem final em 2 linhas"}

Regras: máximo 7 palavras por frase, em português, emocionantes e simples.`
        }]
      })
    });

    if (!r.ok) throw new Error('OpenAI ' + r.status);
    const data = await r.json();
    const txt  = data.choices[0].message.content.replace(/```json|```/g, '').trim();
    return res.status(200).json(JSON.parse(txt));

  } catch(e) {
    return res.status(500).json({ erro: e.message });
  }
}
