const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { conversation, imagem, q1, q2 } = req.body;

  if (!conversation && !imagem) {
    return res.status(400).json({ error: 'Nenhuma conversa enviada.' });
  }

  const contexto = `CONTEXTO DO USUÁRIO:
- Situação: ${q1 === 'chegando' ? 'Quer conquistar ela (ainda não rolou nada)' : 'Já ficou com ela'}
- Comportamento dela: ${q2 === 'quente' ? 'Demonstra interesse' : q2 === 'morno' ? 'Quente e frio' : q2 === 'frio' ? 'É distante' : 'Trata como amigo (friendzone)'}`;

  const instrucao = `Você é um especialista em sedução e comunicação masculina. Analise a conversa de WhatsApp ${imagem ? 'na imagem' : 'abaixo'} e retorne um JSON com a análise.

${contexto}
${conversation ? '\nCONVERSA:\n' + conversation : ''}

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
- as frases_ruins devem ser EXATAMENTE retiradas da conversa (leia a imagem se for o caso)
- Se não houver 3 frases ruins claras, aponte as 3 piores mesmo que sejam mediocres
- Seja direto e masculino no tom`;

  // Monta o conteúdo da mensagem — texto ou imagem
  let userContent;
  if (imagem) {
    // GPT-4o Vision: envia imagem base64
    const base64 = imagem.split(',')[1];
    const mimeType = imagem.split(';')[0].split(':')[1];
    userContent = [
      { type: 'text', text: instrucao },
      { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'high' } }
    ];
  } else {
    userContent = instrucao;
  }

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
        messages: [{ role: 'user', content: userContent }],
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
