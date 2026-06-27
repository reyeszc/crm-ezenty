import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const LoginSchema = z.object({
  correo: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    Credentials({
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { correo, password } = parsed.data;

        const [usuario] = await db.select().from(schema.usuarios)
          .where(eq(schema.usuarios.correo, correo)).limit(1);

        if (!usuario || !usuario.activo) return null;
        if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) return null;

        const valid = await bcrypt.compare(password, usuario.passwordHash);

        if (!valid) {
          const intentos = usuario.intentosFallidos + 1;
          const bloqueadoHasta = intentos >= 5 ? new Date(Date.now() + 15 * 60000) : null;
          await db.update(schema.usuarios)
            .set({ intentosFallidos: intentos, ...(bloqueadoHasta ? { bloqueadoHasta } : {}) })
            .where(eq(schema.usuarios.id, usuario.id));
          return null;
        }

        await db.update(schema.usuarios)
          .set({ intentosFallidos: 0, bloqueadoHasta: null })
          .where(eq(schema.usuarios.id, usuario.id));

        return {
          id: usuario.id,
          name: usuario.nombre,
          email: usuario.correo,
          image: usuario.avatarUrl || null,
          rol: usuario.rol,
          onboardingCompletado: usuario.onboardingCompletado,
          tema: usuario.tema,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id;
        token.rol = (user as any).rol;
        token.onboardingCompletado = (user as any).onboardingCompletado;
        token.tema = (user as any).tema;
        token.image = user.image;
      }
      // Save Google tokens for Gmail API
      if (account?.provider === "google") {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.googleEmail = user?.email;
        token.image = user.image;
      }
      // When session is updated (e.g. after photo upload), refresh avatarUrl from DB
      if (trigger === "update" && token.id) {
        try {
          const { db, schema } = await import("@/lib/db");
          const { eq } = await import("drizzle-orm");
          const [u] = await db.select({ avatarUrl: schema.usuarios.avatarUrl })
            .from(schema.usuarios).where(eq(schema.usuarios.id, token.id as string)).limit(1);
          if (u?.avatarUrl) token.image = u.avatarUrl;
        } catch {}
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).rol = token.rol;
        (session.user as any).onboardingCompletado = token.onboardingCompletado;
        (session.user as any).tema = token.tema;
        (session.user as any).accessToken = token.accessToken;
        (session.user as any).googleEmail = token.googleEmail;
        session.user.image = token.image as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      // Allow Google sign-in only for authorized emails
      if (account?.provider === "google") {
        const allowedEmails = ["zreyes@ezentyprocare.com", "info@ezentyprocare.com", "admin@ezenty.com"];
        if (!allowedEmails.includes(user.email || "")) return false;
        // Save/update token in DB for Gmail API use
        try {
          const [existing] = await db.select({ id: schema.usuarios.id })
            .from(schema.usuarios).where(eq(schema.usuarios.correo, user.email!)).limit(1);
          if (existing) {
            await db.update(schema.usuarios)
              .set({ actualizadoEn: new Date() })
              .where(eq(schema.usuarios.correo, user.email!));
            user.id = existing.id;
            (user as any).rol = "ADMIN";
          }
        } catch {}
        return true;
      }
      return true;
    },
  },
});
