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
          content: `Você é ${nomeF}, filho(a) de ${nomePai} que já faleceu.
Escreva frases curtas e emocionantes em PRIMEIRA PESSOA — como se você estivesse falando DIRETAMENTE com seu pai.
${memoria ? 'Memória especial: ' + memoria : ''}

CORRETO: "Pai, te amo para sempre.", "Sinto sua falta todo dia, Pai.", "Obrigado por tudo que me ensinou."
ERRADO: "${nomeF} ama seu pai.", "Pedro é lembrado com carinho.", "Juntos na saudade."

Responda APENAS em JSON sem markdown:
{
  "frases": ["frase1","frase2","frase3","frase4","frase5","frase6","frase7"],
  "mensagem": "mensagem final de 2 linhas em primeira pessoa, de ${nomeF} para ${nomePai}, direta e emocionante"
}

Regras OBRIGATÓRIAS:
- SEMPRE em primeira pessoa — você está falando com seu pai
- Use "Pai" com carinho, nunca o nome dele nas frases
- Máximo 8 palavras por frase
- Português brasileiro
- Frases que causam arrepio e lágrimas
- Exemplos perfeitos: "Pai, a saudade dói mas o amor cura.", "Você vive em mim, Pai.", "Obrigado por ser meu herói.", "Pai, nunca vou te esquecer.", "Te amo além do que as palavras dizem."`
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
