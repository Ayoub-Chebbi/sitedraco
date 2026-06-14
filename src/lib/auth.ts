import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        const ip = request?.headers?.get("x-forwarded-for")?.split(",")[0].trim()
          ?? request?.headers?.get("x-real-ip")
          ?? "unknown";
        const { allowed } = await rateLimit(`login:${ip}`, { max: 10, windowMs: 15 * 60 * 1000 });
        if (!allowed) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session: sessionData }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.avatarUrl = (user as { avatarUrl?: string | null }).avatarUrl;
        token.roleCheckedAt = Date.now();
      }
      if (trigger === "update") {
        if (sessionData?.name !== undefined) token.name = sessionData.name;
        if (sessionData?.avatarUrl !== undefined) token.avatarUrl = sessionData.avatarUrl;
      }
      // Refresh role from DB every 15 min so role changes take effect quickly
      const checkedAt = (token.roleCheckedAt as number) ?? 0;
      if (token.id && Date.now() - checkedAt > 15 * 60 * 1000) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.roleCheckedAt = Date.now();
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id ?? token.sub) as string;
        session.user.role = token.role as string;
        session.user.avatarUrl = token.avatarUrl as string | null | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/connexion",
    error: "/connexion",
  },
  session: { strategy: "jwt" },
});
