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
  const res = await fetch(`${FLOUCI_BASE}/generate_payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_token: process.env.FLOUCI_APP_TOKEN,
      app_secret: process.env.FLOUCI_APP_SECRET,
      amount: Math.round(amount * 1000), // TND → millimes
      accept_card: "true",
      session_timeout_secs: 1200,
      success_link: successLink,
      fail_link: failLink,
      developer_tracking_id: orderId,
    }),
  });

  if (!res.ok) throw new Error(`Flouci HTTP ${res.status}`);
  const data = await res.json();

  if (!data.result?.success) {
    throw new Error(data.result?.message ?? "Flouci initiation failed");
  }

  return {
    paymentUrl: data.result.link as string,
    paymentId: data.result.payment_id as string,
  };
}

// Flouci appends ?payment_id=xxx to the success_link redirect.
export async function verifyFlouciPayment(paymentId: string): Promise<boolean> {
  const res = await fetch(`${FLOUCI_BASE}/verify_payment/${paymentId}`, {
    headers: {
      apppublic: process.env.FLOUCI_APP_TOKEN!,
      appsecret: process.env.FLOUCI_APP_SECRET!,
    },
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.result?.status === "SUCCESS";
}
