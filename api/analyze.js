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

  const instrucao = `Você é um coach de comunicação interpessoal especializado em análise de conversas de texto.

Leia com atenção a conversa ${imagem ? 'na imagem' : 'abaixo'} e analise o padrão de comunicação do usuário.

CONTEXTO:
- Situação: ${situacao}
- Perfil dela: ${comportamento}
${conversation ? '\nCONVERSA:\n' + conversation : ''}

Analise o estilo de comunicação, identifique pontos de melhoria e gere mensagens de exemplo mais eficazes.

Retorne APENAS este JSON (sem markdown):
{
  "arquetipo": "escolha um: CALCULISTA, ENTREGADORA, DESAFIADORA, CÚMPLICE, APAIXONADA, TESTADORA, ARREPENDIDA, ESCAPISTA",
  "diagnostico": "2-3 frases sobre o padrão de comunicação observado na conversa. Seja específico com o que viu. Ex: O usuário respondeu de forma muito imediata em todas as mensagens, demonstrando ansiedade comunicativa. Isso reduziu o valor percebido na troca.",
  "frases_matadoras": [
    {
      "contexto": "situação de uso — baseada no momento da conversa",
      "frase": "Mensagem de exemplo pronta para usar. Português informal brasileiro. Baseada no contexto real da conversa lida."
    },
    {
      "contexto": "segunda situação",
      "frase": "Segunda mensagem de exemplo. Cria interesse ou curiosidade com base no que foi lido."
    },
    {
      "contexto": "terceira situação — próximo passo natural",
      "frase": "Terceira mensagem. Direta e confiante. Baseada no contexto real."
    }
  ]
}`;

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
        // response_format json_object NÃO funciona com imagem (vision)
        ...(imagem ? {} : { response_format: { type: 'json_object' } }),
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenAI error:', err);
      return res.status(500).json({ error: 'Erro na análise.' });
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    console.log('finish_reason:', choice?.finish_reason);
    console.log('refusal:', choice?.message?.refusal);
    console.log('choice completo:', JSON.stringify(choice).substring(0, 600));
    const content = choice?.message?.content;
    if (!content) {
      const motivo = choice?.message?.refusal || choice?.finish_reason || 'desconhecido';
      console.error('Conteúdo nulo. Motivo:', motivo);
      return res.status(500).json({ error: 'Erro: ' + motivo });
    }
    const text = content.trim();
    console.log('Resposta OpenAI:', text.substring(0, 300));

    let result;
    try {
      // response_format json_object já vem como JSON puro
      result = JSON.parse(text);
    } catch(e) {
      // fallback: tenta extrair JSON do texto
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('JSON inválido:', text);
        return res.status(500).json({ error: 'IA não retornou JSON válido.' });
      }
      result = JSON.parse(jsonMatch[0]);
    }

    return res.status(200).json(result);

  } catch (err) {
    console.error('Handler error:', err.message);
    return res.status(500).json({ error: 'Erro interno: ' + err.message });
  }
}
