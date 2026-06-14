export default async function handler(req, res) {
  // Webhook do MP é POST, verificação de status é GET
  if (req.method === 'GET') {
    // Frontend consulta: GET /api/webhook?pedido=CC123
    const { pedido } = req.query;
    if (!pedido) return res.status(400).json({ erro: 'pedido obrigatório' });

    const MP_TOKEN = process.env.MP_ACCESS_TOKEN;
    try {
      // Busca pagamentos pelo external_reference
      const r = await fetch(
        `https://api.mercadopago.com/v1/payments/search?external_reference=${pedido}&sort=date_created&criteria=desc&limit=1`,
        { headers: { 'Authorization': `Bearer ${MP_TOKEN}` } }
      );
      const data = await r.json();
      const payment = data.results?.[0];

      if (!payment) return res.status(200).json({ status: 'pendente' });

      return res.status(200).json({
        status: payment.status,          // approved | pending | rejected
        statusDetalhe: payment.status_detail,
        valor: payment.transaction_amount,
        pedidoId: payment.external_reference
      });
    } catch(e) {
      return res.status(500).json({ erro: e.message });
    }
  }

  // POST — notificação automática do MP
  if (req.method === 'POST') {
    // Apenas confirma recebimento (o status é consultado pelo GET acima)
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
