// api/check-payment.js

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const id = req.query?.id || new URL(req.url, "http://x").searchParams.get("id");
  if (!id) return res.status(400).json({ error: "id é obrigatório" });

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(500).json({ error: err.message });
    }

    const data = await response.json();
    return res.status(200).json({
      id: data.id,
      status: data.status,          // pending | approved | rejected | cancelled
      status_detail: data.status_detail,
    });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao verificar pagamento" });
  }
}
