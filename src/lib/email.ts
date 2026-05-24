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
