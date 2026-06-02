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

  const instrucao = `Você é um estrategista de atração masculina. Lê conversas de WhatsApp e identifica exatamente o que está travando o cara — e gera as 3 mensagens que vão virar o jogo.

Leia CADA mensagem da conversa ${imagem ? 'na imagem' : 'abaixo'}. Entenda o ritmo, o tom, quem está no controle, o que ele disse de errado, o momento exato em que a conversa esfriou ou avançou.

CONTEXTO:
- Situação: ${situacao}
- Comportamento dela: ${comportamento}
${conversation ? '\nCONVERSA:\n' + conversation : ''}

Após ler tudo, gere as 3 frases que ele deveria mandar AGORA — baseadas no que você leu.

CRITÉRIOS DAS FRASES:
- Cada frase deve mudar a dinâmica da conversa em favor dele
- Devem soar naturais, como um cara confiante falaria — não como coach, não como robô
- Português informal brasileiro, gírias naturais, sem exagero
- Nada de "te entendo", "que tal a gente", "adorei" — isso é linguagem de amigo
- As frases devem criar tensão, curiosidade ou avançar para um encontro
- Baseadas no contexto REAL: se ela falou de viagem, use isso. Se ela sumiu, provoque isso.

Retorne APENAS este JSON (sem markdown, sem explicação fora do JSON):
{
  "arquetipo": "escolha o que mais representa ela: CALCULISTA, ENTREGADORA, DESAFIADORA, CÚMPLICE, APAIXONADA, TESTADORA, ARREPENDIDA, ESCAPISTA",
  "diagnostico": "Diagnóstico direto e honesto do que você viu. Cite o erro específico dele na conversa. Ex: Você ficou disponível demais — respondeu na hora, usou muita palavra mole. Ela sentiu que tem o controle e começou a diminuir o ritmo. A conversa tá morna porque você não criou nenhuma tensão.",
  "frases_matadoras": [
    {
      "contexto": "para usar agora — com base no último momento da conversa",
      "frase": "Frase 1: impactante, curta ou média, baseada no contexto real. Cria tensão ou curiosidade. Ex se ela sumiu: 'Achei que tinha te perdido no caminho 😏 o que aconteceu?'"
    },
    {
      "contexto": "para reativar o interesse ou mudar o ritmo",
      "frase": "Frase 2: muda a dinâmica. Pode ser provocação leve, pode ser algo inesperado baseado no que ela disse na conversa. Não pode ser genérica."
    },
    {
      "contexto": "para marcar um encontro ou avançar",
      "frase": "Frase 3: direta, confiante, sem pedir permissão. Marca algo ou cria urgência. Ex: 'Sábado você tá livre de tarde?' — sem rodeio."
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
