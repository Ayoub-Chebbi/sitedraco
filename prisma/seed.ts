import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

const products = [
  {
    name: "God of War Ragnarök",
    slug: "god-of-war-ragnarok",
    platform: "ps5",
    category: "game",
    price: 89.9,
    discountPrice: null,
    imageUrl: "https://placehold.co/400x300/1e1b4b/a78bfa?text=God+of+War",
    description: "L'aventure épique de Kratos et Atreus continue dans les royaumes nordiques. Un chef-d'œuvre narratif.",
    soldCount: 342,
    rating: 4.9,
    reviewCount: 218,
    urgencyHours: 3,
  },
  {
    name: "Spider-Man 2",
    slug: "spiderman-2-ps5",
    platform: "ps5",
    category: "game",
    price: 79.9,
    discountPrice: null,
    imageUrl: "https://placehold.co/400x300/1e3a5f/60a5fa?text=Spider-Man+2",
    description: "Incarnez Peter Parker et Miles Morales dans une aventure new-yorkaise spectaculaire.",
    soldCount: 289,
    rating: 4.8,
    reviewCount: 184,
    urgencyHours: 5,
  },
  {
    name: "Steam Wallet 50 TND",
    slug: "steam-wallet-50",
    platform: "steam",
    category: "credit",
    price: 49.9,
    discountPrice: null,
    imageUrl: "https://placehold.co/400x300/172554/38bdf8?text=Steam+50+TND",
    description: "Rechargez votre compte Steam avec 50 TND de crédit. Région MENA. Activation instantanée.",
    soldCount: 1240,
    rating: 5.0,
    reviewCount: 892,
    urgencyHours: 2,
  },
  {
    name: "Steam Wallet 100 TND",
    slug: "steam-wallet-100",
    platform: "steam",
    category: "credit",
    price: 95.0,
    discountPrice: 89.9,
    imageUrl: "https://placehold.co/400x300/0f172a/7dd3fc?text=Steam+100+TND",
    description: "Rechargez votre compte Steam avec 100 TND de crédit. Meilleur rapport qualité/prix.",
    soldCount: 876,
    rating: 4.9,
    reviewCount: 634,
    urgencyHours: 6,
  },
  {
    name: "Cyberpunk 2077",
    slug: "cyberpunk-2077-steam",
    platform: "steam",
    category: "game",
    price: 45.0,
    discountPrice: 35.0,
    imageUrl: "https://placehold.co/400x300/1a0533/f0abfc?text=Cyberpunk+2077",
    description: "Le RPG d'action futuriste dans la mégalopole de Night City. Édition complète.",
    soldCount: 567,
    rating: 4.7,
    reviewCount: 412,
    urgencyHours: 4,
  },
  {
    name: "EA FC 25",
    slug: "ea-fc-25-ps5",
    platform: "ps5",
    category: "game",
    price: 69.9,
    discountPrice: null,
    imageUrl: "https://placehold.co/400x300/0d3349/34d399?text=EA+FC+25",
    description: "Le football d'élite mondial revient avec EA FC 25. Nouvelles mécaniques, graphismes next-gen.",
    soldCount: 445,
    rating: 4.6,
    reviewCount: 321,
    urgencyHours: 8,
  },
  {
    name: "PlayStation Plus 1 Mois",
    slug: "ps-plus-1-mois",
    platform: "ps5",
    category: "subscription",
    price: 14.9,
    discountPrice: null,
    imageUrl: "https://placehold.co/400x300/1e1b4b/818cf8?text=PS+Plus+1M",
    description: "Abonnement PS Plus Essential 1 mois. Jeux gratuits mensuels + multijoueur en ligne.",
    soldCount: 2100,
    rating: 4.9,
    reviewCount: 1540,
    urgencyHours: 2,
  },
  {
    name: "PlayStation Plus 12 Mois",
    slug: "ps-plus-12-mois",
    platform: "ps5",
    category: "subscription",
    price: 149.9,
    discountPrice: 129.9,
    imageUrl: "https://placehold.co/400x300/312e81/c7d2fe?text=PS+Plus+12M",
    description: "Abonnement PS Plus Essential 12 mois. La meilleure offre de l'année. Économisez 13%.",
    soldCount: 890,
    rating: 5.0,
    reviewCount: 678,
    urgencyHours: 12,
  },
  {
    name: "Xbox Game Pass 1 Mois",
    slug: "xbox-gamepass-1-mois",
    platform: "xbox",
    category: "subscription",
    price: 19.9,
    discountPrice: null,
    imageUrl: "https://placehold.co/400x300/052e16/4ade80?text=Game+Pass+1M",
    description: "Accès à plus de 100 jeux Xbox et PC pendant 1 mois. Nouveaux jeux chaque mois.",
    soldCount: 678,
    rating: 4.8,
    reviewCount: 523,
    urgencyHours: 3,
  },
  {
    name: "Minecraft Java Edition",
    slug: "minecraft-java",
    platform: "steam",
    category: "game",
    price: 35.0,
    discountPrice: null,
    imageUrl: "https://placehold.co/400x300/14532d/86efac?text=Minecraft+Java",
    description: "Le jeu de construction et survie le plus populaire au monde. Mise à jour permanente.",
    soldCount: 1890,
    rating: 5.0,
    reviewCount: 1432,
    urgencyHours: 6,
  },
  {
    name: "Fortnite V-Bucks 1000",
    slug: "fortnite-vbucks-1000",
    platform: "mobile",
    category: "credit",
    price: 12.0,
    discountPrice: null,
    imageUrl: "https://placehold.co/400x300/451a03/fb923c?text=Fortnite+1000+VB",
    description: "1000 V-Bucks pour Fortnite, utilisables sur toutes les plateformes supportées.",
    soldCount: 3240,
    rating: 4.9,
    reviewCount: 2100,
    urgencyHours: 1,
  },
  {
    name: "PUBG Mobile UC 600",
    slug: "pubg-uc-600",
    platform: "mobile",
    category: "credit",
    price: 18.5,
    discountPrice: null,
    imageUrl: "https://placehold.co/400x300/1c1917/fbbf24?text=PUBG+600+UC",
    description: "600 UC pour PUBG Mobile. Débloquez des skins, passes de combat et items premium.",
    soldCount: 1560,
    rating: 4.8,
    reviewCount: 1120,
    urgencyHours: 2,
  },
];

const upsellPairs: Array<[string, string[]]> = [
  ["god-of-war-ragnarok", ["ps-plus-12-mois", "spiderman-2-ps5", "ea-fc-25-ps5"]],
  ["spiderman-2-ps5", ["ps-plus-1-mois", "god-of-war-ragnarok", "ea-fc-25-ps5"]],
  ["steam-wallet-50", ["cyberpunk-2077-steam", "minecraft-java", "steam-wallet-100"]],
  ["steam-wallet-100", ["cyberpunk-2077-steam", "minecraft-java", "steam-wallet-50"]],
  ["cyberpunk-2077-steam", ["steam-wallet-50", "steam-wallet-100", "minecraft-java"]],
  ["ea-fc-25-ps5", ["ps-plus-12-mois", "god-of-war-ragnarok", "spiderman-2-ps5"]],
  ["ps-plus-1-mois", ["ps-plus-12-mois", "god-of-war-ragnarok", "spiderman-2-ps5"]],
  ["ps-plus-12-mois", ["god-of-war-ragnarok", "spiderman-2-ps5", "ea-fc-25-ps5"]],
  ["xbox-gamepass-1-mois", ["minecraft-java", "cyberpunk-2077-steam"]],
  ["minecraft-java", ["steam-wallet-50", "steam-wallet-100", "cyberpunk-2077-steam"]],
  ["fortnite-vbucks-1000", ["pubg-uc-600"]],
  ["pubg-uc-600", ["fortnite-vbucks-1000"]],
];

async function main() {
  console.log("🌱 Seeding LootStore database...");

  // Comptes
  for (const [email, hash, name, role] of [
    ["admin@lootstore.tn", await bcrypt.hash("Admin123!", 12), "Admin LootStore", "admin"],
    ["support@lootstore.tn", await bcrypt.hash("Support123!", 12), "Agent Support", "support"],
    ["client@test.tn", await bcrypt.hash("Client123!", 12), "Ahmed Test", "customer"],
  ] as const) {
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash: hash, name, role, isVerified: true },
    });
  }

  // Produits
  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        imageUrl: product.imageUrl,
        soldCount: product.soldCount,
        rating: product.rating,
        reviewCount: product.reviewCount,
        urgencyHours: product.urgencyHours,
        discountPrice: product.discountPrice,
      },
      create: { ...product, isActive: true, lowStockAlert: 5 },
    });
    console.log(`  ✓ ${product.name}`);
  }

  // Clés de démo
  const allProducts = await prisma.product.findMany();
  for (const product of allProducts) {
    const existing = await prisma.productKey.count({ where: { productId: product.id } });
    if (existing === 0) {
      await prisma.productKey.createMany({
        data: Array.from({ length: 15 }, (_, i) => ({
          productId: product.id,
          keyValue: `DEMO-${product.slug.toUpperCase().slice(0, 6)}-${(i + 1).toString().padStart(4, "0")}-XXXX`,
          status: "available",
        })),
      });
    }
  }

  // Upsells
  await prisma.productUpsell.deleteMany();
  for (const [productSlug, upsellSlugs] of upsellPairs) {
    const product = await prisma.product.findUnique({ where: { slug: productSlug } });
    if (!product) continue;
    for (let i = 0; i < upsellSlugs.length; i++) {
      const upsell = await prisma.product.findUnique({ where: { slug: upsellSlugs[i] } });
      if (!upsell) continue;
      await prisma.productUpsell.create({
        data: { productId: product.id, upsellProductId: upsell.id, displayOrder: i },
      });
    }
  }
  console.log("  ✓ Upsells configurés");

  console.log("\n✅ Seed LootStore terminé!");
  console.log("\n📋 Comptes de démonstration:");
  console.log("  Admin    → admin@lootstore.tn    / Admin123!");
  console.log("  Support  → support@lootstore.tn  / Support123!");
  console.log("  Client   → client@test.tn        / Client123!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
