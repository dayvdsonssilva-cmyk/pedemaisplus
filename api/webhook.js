export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // GET — frontend consulta status pelo pedidoId
  if (req.method === 'GET') {
    const { pedido } = req.query;
    if (!pedido) return res.status(400).json({ erro: 'pedido obrigatório' });

    const MP_TOKEN = process.env.MP_ACCESS_TOKEN;
    try {
      const r = await fetch(
        `https://api.mercadopago.com/v1/payments/search?external_reference=${pedido}&sort=date_created&criteria=desc&limit=1`,
        { headers: { 'Authorization': `Bearer ${MP_TOKEN}` } }
      );
      const data = await r.json();
      const pay  = data.results?.[0];

      if (!pay) return res.status(200).json({ status: 'pendente' });

      return res.status(200).json({
        status:       pay.status,          // approved | pending | rejected
        paymentId:    pay.id,
        valor:        pay.transaction_amount,
        pedidoId:     pay.external_reference,
      });
    } catch(e) {
      return res.status(500).json({ erro: e.message });
    }
  }

  // POST — notificação MP (só confirma)
  if (req.method === 'POST') {
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
