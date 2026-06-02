// api/create-preference.js
// Variáveis de ambiente no Vercel:
//   MP_ACCESS_TOKEN  → seu Access Token do Mercado Pago (Produção)
//   APP_URL          → https://seusite.vercel.app

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { nome, tema } = req.body || {};
  const appUrl = process.env.APP_URL || "https://seusite.vercel.app";

  try {
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        items: [
          {
            title: `ConvitAI — Convite ${tema || "Festa"} de ${nome || "Aniversário"}`,
            description: "Convite digital personalizado com arte gerada por IA",
            quantity: 1,
            unit_price: 9.99,
            currency_id: "BRL",
          },
        ],
        back_urls: {
          success: `${appUrl}/?status=approved`,
          failure: `${appUrl}/?status=failure`,
          pending: `${appUrl}/?status=pending`,
        },
        auto_return: "approved",
        statement_descriptor: "CONVITAI",
        external_reference: `${nome || "cliente"}-${Date.now()}`,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("MP Error:", err);
      return res.status(500).json({ error: err.message || "Erro ao criar preferência" });
    }

    const data = await response.json();
    return res.status(200).json({ id: data.id, init_point: data.init_point });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
