export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  res.setHeader('Access-Control-Allow-Origin', '*');

  const MP_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!MP_TOKEN) return res.status(500).json({ erro: 'Token MP não configurado' });

  const { pedidoId, nomeF, nomePai, email } = req.body || {};
  if (!pedidoId) return res.status(400).json({ erro: 'pedidoId obrigatório' });

  // URL base do site (configure no Vercel)
  const BASE_URL = process.env.SITE_URL || 'https://parasemprepai.vercel.app';

  try {
    const body = {
      items: [{
        id: pedidoId,
        title: `Carrossel Para Sempre Pai — ${nomePai || 'Homenagem'}`,
        description: 'Carrossel personalizado para o Instagram · 10 slides prontos',
        quantity: 1,
        currency_id: 'BRL',
        unit_price: 19.90
      }],
      payer: {
        name: nomeF || '',
        email: email || 'cliente@parasemprepai.com.br'
      },
      payment_methods: {
        excluded_payment_types: [{ id: 'ticket' }, { id: 'credit_card' }, { id: 'debit_card' }],
        // Só PIX
        default_payment_method_id: 'pix'
      },
      back_urls: {
        success: `${BASE_URL}/?status=aprovado&pedido=${pedidoId}`,
        failure: `${BASE_URL}/?status=falhou&pedido=${pedidoId}`,
        pending: `${BASE_URL}/?status=pendente&pedido=${pedidoId}`
      },
      auto_return: 'approved',
      external_reference: pedidoId,
      notification_url: `${BASE_URL}/api/webhook`,
      expires: true,
      expiration_date_to: new Date(Date.now() + 30*60*1000).toISOString() // 30 min
    };

    const r = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MP_TOKEN}`
      },
      body: JSON.stringify(body)
    });

    if (!r.ok) {
      const err = await r.text();
      throw new Error('MP ' + r.status + ': ' + err);
    }

    const data = await r.json();
    return res.status(200).json({
      id: data.id,
      init_point: data.init_point,        // URL de pagamento completa
      pix_qr_code: data.point_of_interaction?.transaction_data?.qr_code || null,
      pix_copia_cola: data.point_of_interaction?.transaction_data?.qr_code_base64 || null
    });

  } catch(e) {
    return res.status(500).json({ erro: e.message });
  }
}
