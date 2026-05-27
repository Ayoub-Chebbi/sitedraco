import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM ?? "noreply@loot.tn";

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

export async function sendWelcomeEmail(email: string, password: string, orderNumber: string) {
  const html = `${base}
    <h2 style="color:#fff;margin:0 0 12px">Bienvenue sur LootStore ! 🎮</h2>
    <p style="color:#9ca3af;margin:0 0 20px">Votre commande <strong style="color:#fff">#${orderNumber}</strong> a bien été enregistrée. Nous avons automatiquement créé un compte pour vous.</p>
    <div style="background:#1a1a2e;border:1px solid #2d2d4e;border-radius:8px;padding:20px;margin-bottom:24px">
      <p style="margin:0 0 8px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px">Vos identifiants</p>
      <p style="margin:0 0 6px"><span style="color:#9ca3af">Email :</span> <strong style="color:#fff">${email}</strong></p>
      <p style="margin:0"><span style="color:#9ca3af">Mot de passe temporaire :</span> <strong style="color:#a78bfa;font-size:18px;letter-spacing:2px">${password}</strong></p>
    </div>
    <p style="color:#9ca3af;font-size:13px;margin:0 0 20px">⚠️ Pensez à changer votre mot de passe après votre première connexion.</p>
    <a href="${process.env.SITE_URL ?? process.env.NEXTAUTH_URL ?? "https://loot.tn"}/connexion" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">
      Voir ma commande →
    </a>
  ${foot}`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: `🎮 Votre commande LootStore #${orderNumber} + vos accès`,
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
  const ticketUrl = `${siteUrl}/dashboard/support/${ticketId}`;

  const historyHtml = recentMessages
    .slice(-5) // show last 5 messages for context
    .map((m) => {
      const isStaff = ["admin", "support"].includes(m.senderRole);
      const bg = isStaff ? "#1e1b4b" : "#1a1a2e";
      const border = isStaff ? "#4c1d95" : "#2d2d4e";
      const nameColor = isStaff ? "#a78bfa" : "#9ca3af";
      const align = isStaff ? "right" : "left";
      return `
        <div style="text-align:${align};margin-bottom:12px">
          <div style="display:inline-block;max-width:80%;background:${bg};border:1px solid ${border};border-radius:12px;padding:10px 14px;text-align:left">
            <p style="margin:0 0 4px;font-size:11px;color:${nameColor};font-weight:600">
              ${isStaff ? "🛡️ Support" : "👤 " + m.senderName}
            </p>
            <p style="margin:0;font-size:13px;color:#e5e7eb;line-height:1.5">${m.message.replace(/\n/g, "<br>")}</p>
          </div>
        </div>
      `;
    })
    .join("");

  const html = `${base}
    <h2 style="color:#fff;margin:0 0 6px">Nouvelle réponse à votre ticket 💬</h2>
    <p style="color:#9ca3af;margin:0 0 20px;font-size:14px">
      Bonjour ${clientName ?? ""},<br>
      <strong style="color:#a78bfa">${agentName}</strong> a répondu à votre demande :
      <em style="color:#d1d5db">${ticketSubject}</em>
    </p>

    <!-- New message highlight -->
    <div style="background:#1e1b4b;border:1px solid #4c1d95;border-left:4px solid #7c3aed;border-radius:10px;padding:16px 18px;margin-bottom:24px">
      <p style="margin:0 0 6px;font-size:11px;color:#a78bfa;font-weight:700;text-transform:uppercase;letter-spacing:.5px">
        🛡️ ${agentName} (Support)
      </p>
      <p style="margin:0;font-size:14px;color:#e5e7eb;line-height:1.6">${newMessage.replace(/\n/g, "<br>")}</p>
    </div>

    <!-- Conversation history -->
    ${recentMessages.length > 1 ? `
    <div style="margin-bottom:24px">
      <p style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin:0 0 12px">Historique récent</p>
      ${historyHtml}
    </div>
    ` : ""}

    <!-- CTA -->
    <a href="${ticketUrl}"
       style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">
      Voir la conversation →
    </a>

    <p style="color:#6b7280;font-size:12px;margin:20px 0 0">
      Ticket #${ticketId.slice(-8).toUpperCase()} · Vous pouvez répondre directement sur le site.
    </p>
  ${foot}`;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `💬 Réponse à votre ticket — ${ticketSubject}`,
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
