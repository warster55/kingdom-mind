import NextAuth, { NextAuthOptions } from "next-auth";
import { Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

export const authOptions: NextAuthOptions = {
  // @ts-ignore
  adapter: DrizzleAdapter(db) as Adapter,
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        
        try {
          // Use direct select for 100% reliability
          const userResult = await db.select().from(users).where(eq(users.email, credentials.email)).limit(1);
          let user = userResult[0];

          if (!user) {
            const [newUser] = await db.insert(users).values({
              email: credentials.email,
              name: credentials.email.split('@')[0],
              hasCompletedOnboarding: true,
            }).returning();
            user = newUser;
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
          };
        } catch (e) {
          console.error(`[Auth] Error during authorize:`, e);
          return null;
        }
      }
    })
  ],
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/', 
    error: '/',
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
