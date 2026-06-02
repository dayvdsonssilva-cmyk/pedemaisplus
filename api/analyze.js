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

  const contexto = `
- Situação: ${q1 === 'chegando' ? 'Ele ainda não ficou com ela' : 'Já ficaram juntos'}
- Comportamento dela: ${q2 === 'quente' ? 'Demonstra interesse' : q2 === 'morno' ? 'Quente e frio' : q2 === 'frio' ? 'É distante' : 'Trata como amigo (friendzone)'}`;

  const instrucao = `Você é um especialista em sedução e comunicação masculina. Analise a conversa de WhatsApp ${imagem ? 'na imagem' : 'abaixo'} e retorne um JSON.

CONTEXTO:${contexto}
${conversation ? '\nCONVERSA:\n' + conversation : ''}

Retorne APENAS um JSON válido, sem markdown, sem texto extra:
{
  "arquetipo": "uma dessas opções: CALCULISTA, ENTREGADORA, DESAFIADORA, CÚMPLICE, APAIXONADA, TESTADORA, ARREPENDIDA, ESCAPISTA",
  "pct": 65,
  "diagnostico": "2-3 frases diretas explicando o padrão da conversa e onde ele está errando. Ex: Você está parecendo ansioso e disponível demais. Ela sentiu que tem o controle total e reduziu o interesse.",
  "frases_matadoras": [
    {
      "contexto": "quando ela demorar pra responder",
      "frase": "Mensagem pronta e poderosa para mandar agora. Natural, no estilo dela, sem parecer robô."
    },
    {
      "contexto": "para reativar o interesse dela",
      "frase": "Segunda mensagem matadora. Cria tensão ou curiosidade."
    },
    {
      "contexto": "para marcar um encontro",
      "frase": "Terceira mensagem. Direta, segura, sem pedir permissão."
    }
  ]
}

Regras:
- pct entre 15 e 85
- diagnostico: brutal e honesto, máximo 3 frases
- frases_matadoras: mensagens PRONTAS para copiar e mandar no WhatsApp, no português informal brasileiro, sem aspas desnecessárias
- As frases devem ser baseadas no contexto real da conversa analisada`;

  let userContent;
  if (imagem) {
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
        max_tokens: 1200,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('API error:', err);
      return res.status(500).json({ error: 'Erro na API.' });
    }

    const data = await response.json();
    const text = data.choices[0].message.content.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'Resposta inválida.' });

    const result = JSON.parse(jsonMatch[0]);
    return res.status(200).json(result);

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}
