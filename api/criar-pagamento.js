export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  res.setHeader('Access-Control-Allow-Origin', '*');

  const MP_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!MP_TOKEN) return res.status(500).json({ erro: 'Token MP não configurado' });

  const { pedidoId, nomeF, nomePai, email } = req.body || {};
  if (!pedidoId) return res.status(400).json({ erro: 'pedidoId obrigatório' });

  const BASE_URL = process.env.SITE_URL || 'https://parasemprepai.vercel.app';

  try {
    // Pagamento PIX direto — retorna QR Code imediato
    const body = {
      transaction_amount: 11.99,
      description: `Para Sempre Pai — ${nomePai || 'Homenagem'}`,
      payment_method_id: 'pix',
      payer: {
        email: email || 'cliente@parasemprepai.com.br',
        first_name: nomeF || 'Cliente',
      },
      external_reference: pedidoId,
      notification_url: `${BASE_URL}/api/webhook`,
    };

    const r = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MP_TOKEN}`,
        'X-Idempotency-Key': pedidoId,
      },
      body: JSON.stringify(body)
    });

    const data = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(data));

    const pix = data.point_of_interaction?.transaction_data;

    return res.status(200).json({
      paymentId:    data.id,
      status:       data.status,
      qrCode:       pix?.qr_code           || null,
      qrCodeBase64: pix?.qr_code_base64    || null,
      valor:        data.transaction_amount,
    });

  } catch(e) {
    console.error('MP erro:', e.message);
    return res.status(500).json({ erro: e.message });
  }
}
