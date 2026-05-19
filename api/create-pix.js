// api/create-pix.js
// Env vars necessárias no Vercel:
//   MP_ACCESS_TOKEN → APP_USR-4777052863369746-032911-853dbfb492ca23eaf3357154fe70c820-453129079

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { nome, tema, email } = req.body || {};

  try {
    const idempotencyKey = `convitai-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        transaction_amount: 9.99,
        description: `ConvitAI — Convite ${tema || "Festa"} de ${nome || "Aniversário"}`,
        payment_method_id: "pix",
        payer: {
          email: email || "cliente@convitai.com.br",
          first_name: nome || "Cliente",
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("MP PIX Error:", JSON.stringify(err));
      return res.status(500).json({ error: err.message || "Erro ao criar PIX" });
    }

    const data = await response.json();
    return res.status(200).json({
      id: data.id,
      status: data.status,
      qr_code: data.point_of_interaction?.transaction_data?.qr_code || "",
      qr_code_base64: data.point_of_interaction?.transaction_data?.qr_code_base64 || "",
      ticket_url: data.point_of_interaction?.transaction_data?.ticket_url || "",
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
