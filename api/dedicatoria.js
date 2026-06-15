export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { nomeF, nomePai, memoria, tipo = 'Pai' } = req.body || {};
  if (!nomeF || !nomePai) return res.status(400).json({ erro: 'Dados incompletos' });

  const OPENAI_KEY = process.env.OPENAI_KEY;
  if (!OPENAI_KEY) return res.status(500).json({ erro: 'Chave não configurada' });

  // Pronome e artigo adaptados ao tipo
  const masc = ['Pai','Avô','Tio','Irmão','Cônjuge','Amigo'].includes(tipo);
  const artigo  = masc ? 'meu' : 'minha';
  const dele    = masc ? 'dele' : 'dela';
  const pronome = masc ? 'ele' : 'ela';

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
          content: `Você é ${nomeF} e quer homenagear ${artigo} ${tipo} ${nomePai} que já faleceu.
Escreva frases curtas, emocionantes e em PRIMEIRA PESSOA — como se você estivesse falando DIRETAMENTE com ${pronome}.
${memoria ? `Memória especial: ${memoria}` : ''}

CORRETO: "${tipo}, te amo para sempre.", "Sinto sua falta todo dia, ${tipo}.", "Obrigado por tudo que me ensinou."
ERRADO: "${nomeF} ama ${artigo} ${tipo}.", "${nomePai} é lembrado com carinho."

Responda APENAS em JSON sem markdown:
{
  "frases": ["frase1","frase2","frase3","frase4","frase5","frase6","frase7"],
  "mensagem": "mensagem final de 2 linhas em primeira pessoa, de ${nomeF} para ${nomePai}"
}

Regras OBRIGATÓRIAS:
- SEMPRE em primeira pessoa — você fala COM ${pronome}
- Use "${tipo}" com carinho nas frases (não o nome ${nomePai})
- Máximo 8 palavras por frase
- Português brasileiro
- Frases que causam arrepio e lágrimas
- Exemplos: "${tipo}, a saudade dói mas o amor cura.", "Você vive em mim, ${tipo}.", "Obrigado por ser ${artigo} herói.", "${tipo}, nunca vou te esquecer."`
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
