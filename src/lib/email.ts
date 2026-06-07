import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM ?? "noreply@loot.tn";

function h(str: string | null | undefined): string {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const base = `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0d0d14;color:#e5e7eb;border-radius:12px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#7c3aed,#db2777);padding:28px 32px">
      <h1 style="margin:0;font-size:22px;color:#fff;font-weight:900;letter-spacing:1px">LootStore</h1>
      <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,.7)">Jeux numériques &amp; Cartes prépayées</p>
    </div>
    <div style="padding:32px">
`;
const foot = `
    </div>
    <div style="padding:16px 32px;background:#070710;text-align:center">
      <p style="margin:0;font-size:11px;color:#4b5563">© ${new Date().getFullYear()} LootStore · Tunisie</p>
    </div>
  </div>
`;

export async function sendWelcomeEmail(email: string, orderNumber: string, setupUrl: string) {
  const html = `${base}
    <h2 style="color:#fff;margin:0 0 12px">Bienvenue sur LootStore ! 🎮</h2>
    <p style="color:#9ca3af;margin:0 0 20px">Votre paiement pour la commande <strong style="color:#fff">#${orderNumber}</strong> a été confirmé. Nous avons automatiquement créé un compte pour vous.</p>
    <div style="background:#1a1a2e;border:1px solid #2d2d4e;border-radius:8px;padding:20px;margin-bottom:24px">
      <p style="margin:0 0 8px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px">Votre compte</p>
      <p style="margin:0"><span style="color:#9ca3af">Email :</span> <strong style="color:#fff">${email}</strong></p>
    </div>
    <p style="color:#9ca3af;font-size:13px;margin:0 0 20px">Cliquez ci-dessous pour définir votre mot de passe et accéder à votre espace client.</p>
    <a href="${setupUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">
      Définir mon mot de passe →
    </a>
    <p style="color:#6b7280;font-size:12px;margin:20px 0 0">Ce lien expire dans 72 heures.</p>
  ${foot}`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: `🎮 Votre commande LootStore #${orderNumber} confirmée — accédez à votre compte`,
    html,
  });

  if (error) throw new Error(error.message);
}

type DeliveryItem = {
  productName: string;
  type: "key" | "account";
  keyValue?: string;
  email?: string;
  password?: string;
};

export async function sendDeliveryEmail(to: string, orderNumber: string, items: DeliveryItem[]) {
  const itemsHtml = items.map((item, i) => `
    <div style="background:#1a1a2e;border:1px solid #2d2d4e;border-radius:10px;padding:20px;margin-bottom:16px">
      <p style="margin:0 0 12px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px">
        Article ${i + 1} — ${item.productName}
      </p>
      ${item.type === "account" ? `
        <p style="margin:0 0 8px">
          <span style="color:#9ca3af;font-size:13px">👤 Email :</span>
          <strong style="color:#fff;font-size:15px;margin-left:6px">${item.email}</strong>
        </p>
        <p style="margin:0">
          <span style="color:#9ca3af;font-size:13px">🔒 Mot de passe :</span>
          <strong style="color:#a78bfa;font-size:16px;letter-spacing:2px;margin-left:6px">${item.password}</strong>
        </p>
      ` : `
        <p style="margin:0 0 6px;font-size:13px;color:#9ca3af">🔑 Clé d'activation</p>
        <p style="margin:0;font-family:monospace;font-size:18px;letter-spacing:3px;color:#a78bfa;font-weight:700">${item.keyValue}</p>
      `}
    </div>
  `).join("");

  const html = `${base}
    <h2 style="color:#fff;margin:0 0 8px">Votre commande est prête ! 🎮</h2>
    <p style="color:#9ca3af;margin:0 0 24px">
      Commande <strong style="color:#fff">#${orderNumber}</strong> — voici vos accès :
    </p>
    ${itemsHtml}
    <a href="${process.env.SITE_URL ?? "https://loot.tn"}/dashboard/cles"
       style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;margin-top:8px">
      Voir mes accès →
    </a>
    <p style="color:#6b7280;font-size:12px;margin:20px 0 0">
      Conservez ces informations en lieu sûr. Support disponible 7j/7 via votre espace client.
    </p>
  ${foot}`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `🎮 Votre commande LootStore #${orderNumber} est livrée`,
    html,
  });

  if (error) throw new Error(error.message);
}

type TicketMessage = {
  message: string;
  senderName: string;
  senderRole: string;
  createdAt: string;
};

export async function sendTicketReplyEmail({
  to,
  clientName,
  ticketId,
  ticketSubject,
  agentName,
  newMessage,
  recentMessages,
}: {
  to: string;
  clientName: string | null;
  ticketId: string;
  ticketSubject: string;
  agentName: string;
  newMessage: string;
  recentMessages: TicketMessage[];
}) {
  const siteUrl = process.env.SITE_URL ?? process.env.NEXTAUTH_URL ?? "https://loot.tn";
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "LootStore";
  const ticketUrl = `${siteUrl}/dashboard/support/${ticketId}`;
  const ref = ticketId.slice(-8).toUpperCase();

  // Build conversation history rows (last 5 messages, oldest first)
  const historyRows = recentMessages
    .slice(-5)
    .map((m) => {
      const isStaff = ["admin", "support"].includes(m.senderRole);
      const bubbleBg   = isStaff ? "#f3f0ff" : "#f9fafb";
      const bubbleBorder = isStaff ? "#ddd6fe" : "#e5e7eb";
      const labelColor = isStaff ? "#7c3aed" : "#6b7280";
      const label      = isStaff ? `🛡️ Support` : `👤 ${h(m.senderName)}`;
      const align      = isStaff ? "right" : "left";
      return `
        <tr><td style="padding:0 0 10px">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="text-align:${align}">
                <div style="display:inline-block;max-width:82%;background:${bubbleBg};border:1px solid ${bubbleBorder};border-radius:12px;padding:10px 14px;text-align:left">
                  <p style="margin:0 0 3px;font-size:11px;font-weight:700;color:${labelColor}">${label}</p>
                  <p style="margin:0;font-size:13px;color:#374151;line-height:1.55">${m.message.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}</p>
                </div>
              </td>
            </tr>
          </table>
        </td></tr>
      `;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f6;font-family:Arial,Helvetica,sans-serif">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f6;padding:32px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%">

        <!-- Logo header -->
        <tr>
          <td align="center" style="background:#ffffff;border-radius:12px 12px 0 0;padding:28px 40px 24px;border-bottom:1px solid #e5e7eb">
            <p style="margin:0;font-size:24px;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:#111827">${siteName}</p>
            <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;letter-spacing:.5px">Jeux numériques · Cartes prépayées</p>
          </td>
        </tr>

        <!-- White card body -->
        <tr>
          <td style="background:#ffffff;padding:36px 40px 32px">

            <!-- Heading -->
            <p style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;line-height:1.3">
              Vous avez reçu une réponse
            </p>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6">
              Bonjour ${clientName ? `<strong style="color:#111827">${h(clientName)}</strong>` : ""},
              notre équipe support a répondu à votre demande
              <strong style="color:#111827">#${ref}</strong>.
            </p>

            <!-- Subject chip -->
            <p style="margin:0 0 20px">
              <span style="display:inline-block;background:#f3f0ff;border:1px solid #ddd6fe;border-radius:6px;padding:5px 12px;font-size:12px;font-weight:600;color:#7c3aed">
                📋 ${h(ticketSubject)}
              </span>
            </p>

            <!-- Latest support message -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px">
              <tr>
                <td style="background:#faf5ff;border:1px solid #ddd6fe;border-left:4px solid #7c3aed;border-radius:10px;padding:16px 18px">
                  <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:.5px">
                    🛡️ ${h(agentName)} · Support
                  </p>
                  <p style="margin:0;font-size:14px;color:#1f2937;line-height:1.65">${newMessage.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}</p>
                </td>
              </tr>
            </table>

            <!-- CTA button -->
            <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px">
              <tr>
                <td style="border-radius:8px;background:linear-gradient(135deg,#7c3aed,#db2777)">
                  <a href="${ticketUrl}"
                     style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:.3px;border-radius:8px">
                    Voir ma demande de support →
                  </a>
                </td>
              </tr>
            </table>

            <!-- Conversation history -->
            ${recentMessages.length > 1 ? `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e5e7eb;padding-top:24px;margin-top:4px">
              <tr>
                <td>
                  <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px">
                    Historique de la conversation
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    ${historyRows}
                  </table>
                </td>
              </tr>
            </table>
            ` : ""}

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#7c3aed;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center">
            <p style="margin:0 0 4px;font-size:13px;font-weight:800;color:#ffffff;letter-spacing:1.5px;text-transform:uppercase">${siteName}</p>
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,.65)">
              © ${new Date().getFullYear()} ${siteName} · Tunisie · Support 7j/7
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Réponse à votre demande #${ref} — ${siteName}`,
    html,
  });

  if (error) throw new Error(error.message);
}

export async function sendReviewRequestEmail({
  to,
  orderNumber,
  productNames,
  reviewUrl,
}: {
  to: string;
  orderNumber: string;
  productNames: string[];
  reviewUrl: string;
}) {
  const productsHtml = productNames
    .map((name) => `<li style="margin:0 0 6px;color:#e5e7eb">${h(name)}</li>`)
    .join("");

  const stars = [1, 2, 3, 4, 5]
    .map(
      (n) =>
        `<a href="${reviewUrl}&rating=${n}" style="display:inline-block;font-size:28px;text-decoration:none;margin:0 2px">⭐</a>`
    )
    .join("");

  const html = `${base}
    <h2 style="color:#fff;margin:0 0 8px">Votre avis compte ! 🎮</h2>
    <p style="color:#9ca3af;margin:0 0 20px">
      Commande <strong style="color:#fff">#${h(orderNumber)}</strong> — merci pour votre achat !<br>
      Comment évaluez-vous votre expérience ?
    </p>
    <ul style="margin:0 0 20px;padding-left:20px">
      ${productsHtml}
    </ul>
    <div style="text-align:center;margin:0 0 24px">
      <p style="color:#9ca3af;font-size:13px;margin:0 0 12px">Cliquez sur une étoile pour laisser votre avis :</p>
      <div style="font-size:0">${stars}</div>
    </div>
    <div style="text-align:center">
      <a href="${reviewUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">
        Laisser un avis →
      </a>
    </div>
    <p style="color:#6b7280;font-size:12px;margin:20px 0 0;text-align:center">
      Votre avis aide d'autres joueurs à faire leur choix. Merci ! 🙏
    </p>
  ${foot}`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `⭐ Votre avis sur la commande #${orderNumber} — LootStore`,
    html,
  });

  if (error) throw new Error(error.message);
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const html = `${base}
    <h2 style="color:#fff;margin:0 0 12px">Réinitialisation du mot de passe</h2>
    <p style="color:#9ca3af;margin:0 0 24px">Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous. Ce lien expire dans <strong style="color:#fff">1 heure</strong>.</p>
    <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">
      Réinitialiser mon mot de passe →
    </a>
    <p style="color:#6b7280;font-size:12px;margin:20px 0 0">Si vous n'avez pas fait cette demande, ignorez cet email.</p>
  ${foot}`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Réinitialisation de votre mot de passe LootStore",
    html,
  });

  if (error) throw new Error(error.message);
}
