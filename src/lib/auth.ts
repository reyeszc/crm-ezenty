import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
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
          rol: usuario.rol,
          onboardingCompletado: usuario.onboardingCompletado,
          tema: usuario.tema,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = (user as any).rol;
        token.onboardingCompletado = (user as any).onboardingCompletado;
        token.tema = (user as any).tema;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).rol = token.rol;
        (session.user as any).onboardingCompletado = token.onboardingCompletado;
        (session.user as any).tema = token.tema;
      }
      return session;
    },
  },
});
