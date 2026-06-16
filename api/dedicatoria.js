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
${memoria ? `Memória especial: ${memoria}` : ''}

Escreva 7 frases curtas e MUITO variadas em primeira pessoa para slides de foto.
Cada frase deve ter um SENTIMENTO DIFERENTE e uma ESTRUTURA DIFERENTE.

REGRA MAIS IMPORTANTE: NÃO repita a palavra "${tipo}" mais de 1 vez no total das 7 frases.
Use "você", "teu", "tua", "seu", "sua", "te" para se referir à pessoa.

Distribua assim:
- 2 frases sobre saudade
- 2 frases sobre amor eterno  
- 2 frases sobre gratidão
- 1 frase sobre memória/legado

EXEMPLOS PERFEITOS:
"A saudade dói, mas o amor cura."
"Você vive em cada memória que guardo."
"Te carrego no coração para sempre."
"Obrigado por tudo que me ensinou."
"Sua ausência deixou um espaço imenso."
"O amor que você me deu não tem fim."
"Nunca esquecerei seu sorriso e seu abraço."

Responda APENAS em JSON sem markdown:
{
  "frases": ["frase1","frase2","frase3","frase4","frase5","frase6","frase7"],
  "mensagem": "mensagem final de 2 linhas emocionante mencionando ${tipo} e ${nomePai}, assinada por ${nomeF}"
}

Regras adicionais:
- Máximo 9 palavras por frase
- Português brasileiro natural
- NUNCA começar duas frases com a mesma palavra
- A palavra "${tipo}" pode aparecer no MÁXIMO 1 vez nas 7 frases`
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
