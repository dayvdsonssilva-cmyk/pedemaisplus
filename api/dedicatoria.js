export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { nomeF, nomePai, memoria } = req.body || {};
  if (!nomeF || !nomePai) return res.status(400).json({ erro: 'Dados incompletos' });

  const OPENAI_KEY = process.env.OPENAI_KEY;
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
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Escreva uma homenagem emocionante para um pai falecido.
Filho(a): ${nomeF}
Nome do pai: ${nomePai}
${memoria ? 'Memória especial: ' + memoria : ''}

Crie frases curtas e muito emocionantes, usando a palavra "Pai" com carinho.
Use expressões como: "Pai, você...", "Saudade do meu Pai...", "Obrigado, Pai...", "Pai eterno..."

Responda APENAS em JSON sem markdown:
{"frases":["frase1","frase2","frase3","frase4","frase5","frase6","frase7"],"mensagem":"mensagem final emocionante em 2 linhas mencionando ${nomeF} e ${nomePai}"}

Regras OBRIGATÓRIAS:
- Máximo 8 palavras por frase
- Sempre em português brasileiro
- Use "Pai" nas frases com afeto
- Frases que causem arrepios e saudade
- Simples, diretas, poderosas
- Nível: "Pai, a saudade não tem endereço.", "Para sempre no meu coração, Pai.", "Obrigado por tudo, meu herói."`
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
