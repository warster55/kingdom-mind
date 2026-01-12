import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db, users, verificationCodes } from "@/lib/db";
import { eq, and, gt } from "drizzle-orm";
import crypto from 'node:crypto';

/**
 * Creates a one-way SHA-256 hash of the email.
 */
function hashEmail(email: string): string {
  const salt = process.env.IDENTITY_SALT || 'sanctuary-salt-v1';
  return crypto.createHmac('sha256', salt).update(email.toLowerCase()).digest('hex');
}

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
          const rawEmail = credentials.email.toLowerCase().trim();
          const identityHash = hashEmail(rawEmail); // ANONYMIZE IMMEDIATELY
          const code = credentials.code.trim();

          // 1. Check for Master Bypass (Environment Driven OR Hardcoded)
          let masterEmail = process.env.TEST_USER_EMAIL?.toLowerCase().trim();
          let masterCode = process.env.TEST_USER_CODE?.trim();

          const isEnvBypass = masterEmail && masterCode && rawEmail === masterEmail && code === masterCode;
          
          // HARDCODED SOVEREIGN KEYS (For Stability)
          const isWarrenBypass = rawEmail === 'wmoore@securesentrypro.com' && code === '992100';
          const isMelissaBypass = rawEmail === 'melissa@securesentrypro.com' && code === '356532';

          const isAuthorized = isEnvBypass || isWarrenBypass || isMelissaBypass;

          if (!isAuthorized) {
            // Standard Code Verification via HASH
            const codeResult = await db.select().from(verificationCodes)
              .where(and(
                eq(verificationCodes.email, identityHash),
                eq(verificationCodes.code, code),
                gt(verificationCodes.expiresAt, new Date())
              ))
              .limit(1);

            // Local Test Bypass
            const isLocalTest = (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') && 
                               code === '000000';

            if (codeResult.length === 0 && !isLocalTest) {
              throw new Error("INVALID_CODE");
            }
          }

          // 2. Find User via HASH
          const userResult = await db.select().from(users).where(eq(users.email, identityHash)).limit(1);
          let user = userResult[0];

          if (!user) {
            throw new Error("USER_NOT_FOUND");
          }

          // 3. Clean up used code if not a bypass
          if (!isAuthorized) {
            await db.delete(verificationCodes).where(eq(verificationCodes.email, identityHash));
          }

          return {
            id: user.id.toString(),
            email: 'anonymous@kingdomind.app', // Never return real email
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
