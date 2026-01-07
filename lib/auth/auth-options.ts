import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

const ADMIN_EMAILS = ['warren@securesentrypro.com', 'test@kingdommind.app'];

export const authOptions: NextAuthOptions = {
  // @ts-ignore
  adapter: DrizzleAdapter(db),
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        
        try {
          const userResult = await db.select().from(users).where(eq(users.email, credentials.email)).limit(1);
          let user = userResult[0];

          // 1. If user doesn't exist, create as PENDING (not approved)
          if (!user) {
            const isAdmin = ADMIN_EMAILS.includes(credentials.email.toLowerCase());
            const [newUser] = await db.insert(users).values({
              email: credentials.email.toLowerCase(),
              name: credentials.email.split('@')[0],
              role: isAdmin ? 'admin' : 'user',
              isApproved: isAdmin, // Admins are auto-approved
              hasCompletedOnboarding: isAdmin,
            }).returning();
            user = newUser;
          }

          // 2. ENFORCE THE LOCK: Reject if not approved
          if (!user.isApproved) {
            throw new Error("WAITLIST_ACTIVE");
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (e: any) {
          console.error(`[Auth] Access Denied:`, e.message);
          throw e; // Pass error to the client
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
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
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