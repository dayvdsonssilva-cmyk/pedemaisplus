/**
 * IMPULSO - /api/estimar-calorias
 *
 * Recebe uma foto (base64) do front-end e pede pra uma IA com visao
 * estimar as calorias e macros do prato. Roda no servidor (Vercel
 * Serverless Function) porque a chave da API NUNCA pode ficar no
 * codigo do navegador - se ficasse, qualquer pessoa abrindo o
 * DevTools conseguiria roubar a chave e gastar sua cota.
 *
 * Configuracao necessaria no Vercel (Settings > Environment Variables):
 *   ANTHROPIC_API_KEY = sua chave, pega em console.anthropic.com
 *
 * Isso e uma ESTIMATIVA de IA, nao uma medicao exata. O front-end
 * sempre mostra como sugestao editavel antes de salvar.
 */

const PROMPT = `Voce e um nutricionista estimando calorias a partir de uma foto de comida.
Responda SOMENTE com um JSON puro, sem markdown e sem texto fora do JSON, no formato:
{"prato":"nome curto do prato","calorias_estimadas":numero,"proteina_g":numero,"carboidrato_g":numero,"gordura_g":numero,"confianca":"baixa|media|alta","observacao":"uma frase curta sobre a estimativa"}
Se a imagem nao mostrar comida claramente, responda com calorias_estimadas 0 e observacao explicando isso.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ erro: 'Metodo nao permitido.' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ erro: 'Chave de IA nao configurada no servidor. Adicione ANTHROPIC_API_KEY nas variaveis de ambiente do Vercel.' });
    return;
  }

  const { imagemBase64, mediaType } = req.body || {};
  if (!imagemBase64) {
    res.status(400).json({ erro: 'Nenhuma imagem enviada.' });
    return;
  }

  try {
    const resposta = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 400,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imagemBase64 } },
              { type: 'text', text: PROMPT }
            ]
          }
        ]
      })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      res.status(502).json({ erro: 'Falha ao consultar a IA.', detalhes: dados });
      return;
    }

    const textos = (dados.content || [])
      .filter((bloco) => bloco.type === 'text')
      .map((bloco) => bloco.text)
      .join('');

    const jsonLimpo = textos.replace(/```json|```/g, '').trim();
    const resultado = JSON.parse(jsonLimpo);

    res.status(200).json(resultado);
  } catch (_erro) {
    res.status(500).json({ erro: 'Erro ao processar a estimativa. Tenta de novo.' });
  }
}
