const ALLOWED_ORIGINS = [
  process.env.ALLOWED_ORIGIN,        // defina no Vercel: seu domínio principal
  'http://localhost:3000',
  'http://127.0.0.1:5500',           // Live Server local
].filter(Boolean);

export default async function handler(req, res) {
  const origin = req.headers.origin || req.headers.referer || '';

  // Bloqueia origens não autorizadas
  const allowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o));
  if (!allowed && process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Acesso não autorizado.' });
  }

  // CORS restrito
  const allowedOrigin = ALLOWED_ORIGINS.find(o => origin.startsWith(o)) || ALLOWED_ORIGINS[0];
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { conversation, q1, q2 } = req.body;

  if (!conversation || conversation.trim().length < 20) {
    return res.status(400).json({ error: 'Conversa muito curta ou ausente.' });
  }

  const prompt = `Você é um especialista em sedução e comunicação masculina. Analise a conversa de WhatsApp abaixo e retorne um JSON com a análise.

CONTEXTO DO USUÁRIO:
- Situação: ${q1 === 'chegando' ? 'Quer conquistar ela (ainda não rolou nada)' : 'Já ficou com ela'}
- Comportamento dela: ${q2 === 'quente' ? 'Demonstra interesse' : q2 === 'morno' ? 'Quente e frio' : q2 === 'frio' ? 'É distante' : 'Trata como amigo (friendzone)'}

CONVERSA:
${conversation}

Retorne APENAS um JSON válido, sem markdown, sem texto extra, neste formato exato:
{
  "arquetipo": "NOME DO ARQUÉTIPO EM MAIÚSCULAS (ex: CALCULISTA, ENTREGADORA, DESAFIADORA, CÚMPLICE, APAIXONADA, TESTADORA, ARREPENDIDA, ESCAPISTA)",
  "pct": 65,
  "sub": "Frase curta sobre as chances (ex: Alta. Mas cuidado agora.)",
  "frases_ruins": [
    {
      "frase": "mensagem exata que ele enviou (copie literalmente da conversa)",
      "problema": "Por que essa frase foi ruim em 1 frase curta",
      "correto": "Como deveria ter dito"
    },
    {
      "frase": "outra mensagem ruim",
      "problema": "Problema em 1 frase",
      "correto": "Versão melhorada"
    },
    {
      "frase": "terceira mensagem ruim",
      "problema": "Problema em 1 frase",
      "correto": "Versão melhorada"
    }
  ]
}

Regras:
- pct deve ser entre 10 e 90
- as frases_ruins devem ser EXATAMENTE retiradas da conversa
- Se não houver 3 frases ruins claras, aponte as 3 piores mesmo que sejam mediocres
- Seja direto e masculino no tom`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('API error:', err);
      return res.status(500).json({ error: 'Erro na API de análise.' });
    }

    const data = await response.json();
    const text = data.choices[0].message.content.trim();

    // Extrai JSON mesmo se vier com texto extra
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'Resposta inválida da IA.' });

    const result = JSON.parse(jsonMatch[0]);
    return res.status(200).json(result);

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}
