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

  const situacao = q1 === 'chegando'
    ? 'Ele ainda NÃO ficou com ela — quer conquistar'
    : 'Ele JÁ ficou com ela';

  const comportamento = {
    quente:   'Ela demonstra interesse — inicia conversa, manda meme',
    morno:    'Ela é quente e frio — às vezes empolgada, às vezes some',
    frio:     'Ela é distante — responde pouco, sem iniciativa',
    amizade:  'Ela trata ele como amigo — friendzone claro',
  }[q2] || 'Comportamento indefinido';

  const instrucao = `Você é um especialista em sedução e leitura de conversas de WhatsApp.

LEIA CADA MENSAGEM DA CONVERSA ${imagem ? 'NA IMAGEM' : 'ABAIXO'} COM ATENÇÃO TOTAL.
Identifique: o tom do usuário, onde ele errou, o nível de interesse dela, o momento da conversa.

CONTEXTO:
- Situação: ${situacao}
- Comportamento dela: ${comportamento}
${conversation ? '\nCONVERSA:\n' + conversation : ''}

COM BASE NO QUE VOCÊ LREU NA CONVERSA, retorne APENAS este JSON válido, sem markdown:
{
  "arquetipo": "escolha um: CALCULISTA, ENTREGADORA, DESAFIADORA, CÚMPLICE, APAIXONADA, TESTADORA, ARREPENDIDA, ESCAPISTA",
  "diagnostico": "2-3 frases diretas e brutais sobre o que você viu na conversa. Cite comportamentos específicos que ele demonstrou. Ex: Você respondeu rápido demais em todas as mensagens e usou muito emoji. Isso sinalizou ansiedade e ela percebeu que tem o controle.",
  "frases_matadoras": [
    {
      "contexto": "quando usar — baseado no momento atual da conversa",
      "frase": "Mensagem PRONTA para copiar e mandar. Natural, no português informal brasileiro. Baseada no estilo da conversa que você leu. Sem aspas."
    },
    {
      "contexto": "segunda situação baseada na conversa",
      "frase": "Segunda frase matadora. Cria curiosidade ou tensão com base no que rolou entre eles."
    },
    {
      "contexto": "terceira situação — próximo passo lógico",
      "frase": "Terceira frase. Ousada e direta. Para avançar a conquista com base no contexto real."
    }
  ]
}

REGRAS ABSOLUTAS:
- As frases_matadoras DEVEM ser baseadas na conversa que você leu — não podem ser genéricas
- O diagnostico DEVE mencionar algo específico que você viu nas mensagens
- Português informal brasileiro, como um cara falando mesmo
- Frases prontas para copiar — sem explicações dentro da frase`;

  // Monta mensagem para a OpenAI
  let userContent;
  if (imagem) {
    const base64 = imagem.split(',')[1];
    const mimeType = imagem.split(';')[0].split(':')[1];
    userContent = [
      {
        type: 'text',
        text: instrucao
      },
      {
        type: 'image_url',
        image_url: {
          url: `data:${mimeType};base64,${base64}`,
          detail: 'high'
        }
      }
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
        max_tokens: 1500,
        temperature: 0.7,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenAI error:', err);
      return res.status(500).json({ error: 'Erro na análise.' });
    }

    const data = await response.json();
    const text = data.choices[0].message.content.trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('JSON não encontrado na resposta:', text);
      return res.status(500).json({ error: 'Resposta inválida da IA.' });
    }

    const result = JSON.parse(jsonMatch[0]);
    return res.status(200).json(result);

  } catch (err) {
    console.error('Handler error:', err.message);
    return res.status(500).json({ error: 'Erro interno: ' + err.message });
  }
}
