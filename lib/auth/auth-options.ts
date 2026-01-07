import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db, users, verificationCodes } from "@/lib/db";
import { eq, and, gt } from "drizzle-orm";

export const authOptions: NextAuthOptions = {
  // @ts-ignore
  adapter: DrizzleAdapter(db),
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Verification Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.code) return null;
        
        try {
          const email = credentials.email.toLowerCase();
          const code = credentials.code;

          // 1. Verify Code
          const codeResult = await db.select().from(verificationCodes)
            .where(and(
              eq(verificationCodes.email, email),
              eq(verificationCodes.code, code),
              gt(verificationCodes.expiresAt, new Date())
            ))
            .limit(1);

          // Support for test environment code
          const isTestMode = process.env.NODE_ENV === 'test' || process.env.X_TEST_MODE === 'true';
          const isTestBypass = isTestMode && code === '000000';

          if (codeResult.length === 0 && !isTestBypass) {
            throw new Error("INVALID_CODE");
          }

          // 2. Find User
          const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
          let user = userResult[0];

          if (!user || !user.isApproved) {
            throw new Error("WAITLIST_ACTIVE");
          }

          // 3. Clean up used code
          await db.delete(verificationCodes).where(eq(verificationCodes.email, email));

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (e: any) {
          console.error(`[Auth] Access Denied:`, e.message);
          throw e;
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