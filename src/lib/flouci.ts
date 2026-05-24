const FLOUCI_BASE = "https://developers.flouci.com/api";

export async function initiateFlouciPayment({
  amount,
  orderId,
  successLink,
  failLink,
}: {
  amount: number;
  orderId: string;
  successLink: string;
  failLink: string;
}): Promise<{ paymentUrl: string; paymentId: string }> {
  const token = process.env.FLOUCI_APP_TOKEN;
  const secret = process.env.FLOUCI_APP_SECRET;
  if (!token || !secret) throw new Error("Flouci credentials not configured");

  const payload = {
    app_token: token,
    app_secret: secret,
    amount: Math.round(amount * 1000), // TND → millimes
    accept_card: "true",
    session_timeout_secs: 1200,
    success_link: successLink,
    fail_link: failLink,
    developer_tracking_id: crypto.randomUUID(), // must be UUID format
  };

  console.log("[flouci] sending payload:", JSON.stringify({ ...payload, app_token: "***", app_secret: "***" }));

  const res = await fetch(`${FLOUCI_BASE}/generate_payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  console.log("[flouci] raw response:", JSON.stringify(data));

  if (!res.ok) {
    throw new Error(`Flouci HTTP ${res.status}: ${JSON.stringify(data)}`);
  }
  if (!data.result?.success) {
    throw new Error(`Flouci rejected: ${JSON.stringify(data.result ?? data)}`);
  }

  return {
    paymentUrl: data.result.link as string,
    paymentId: data.result.payment_id as string,
  };
}

export async function verifyFlouciPayment(paymentId: string): Promise<boolean> {
  const token = process.env.FLOUCI_APP_TOKEN;
  const secret = process.env.FLOUCI_APP_SECRET;
  if (!token || !secret) {
    console.error("[flouci] verify: credentials not configured");
    return false;
  }

  const res = await fetch(`${FLOUCI_BASE}/verify_payment/${paymentId}`, {
    headers: {
      apppublic: token,
      appsecret: secret,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error(`[flouci] verify HTTP ${res.status}:`, JSON.stringify(data));
    return false;
  }

  const status = data.result?.status;
  if (status !== "SUCCESS") {
    console.error("[flouci] verify not SUCCESS:", JSON.stringify(data));
  }
  return status === "SUCCESS";
}
