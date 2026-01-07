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
          const email = credentials.email.toLowerCase().trim();
          const code = credentials.code.trim();

          // 1. Check for Master Bypass (Environment Driven)
          const masterEmail = process.env.TEST_USER_EMAIL?.toLowerCase().trim();
          const masterCode = process.env.TEST_USER_CODE?.trim();
          
          const isMasterBypass = masterEmail && masterCode && 
                                email === masterEmail && 
                                code === masterCode;

          console.log(`[Auth] Attempt: ${email} with code ${code}. Master: ${masterEmail} / ${masterCode}. Bypass: ${isMasterBypass}`);

          if (!isMasterBypass) {
            // Standard Code Verification
            const codeResult = await db.select().from(verificationCodes)
              .where(and(
                eq(verificationCodes.email, email),
                eq(verificationCodes.code, code),
                gt(verificationCodes.expiresAt, new Date())
              ))
              .limit(1);

            // Automation/Local Test Bypass
            const isLocalTest = (process.env.NODE_ENV === 'test' || process.env.X_TEST_MODE === 'true') && 
                               code === '000000';

            if (codeResult.length === 0 && !isLocalTest) {
              console.error(`[Auth] Invalid code for ${email}`);
              throw new Error("INVALID_CODE");
            }
          }

          // 2. Find User
          const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
          let user = userResult[0];

          if (!user || !user.isApproved) {
            console.error(`[Auth] User not approved or not found: ${email}`);
            throw new Error("WAITLIST_ACTIVE");
          }

          // 3. Clean up used code if not master bypass
          if (!isMasterBypass) {
            await db.delete(verificationCodes).where(eq(verificationCodes.email, email));
          }

          console.log(`[Auth] Success: ${email} logged in.`);
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (e: any) {
          console.error(`[Auth] Access Denied for ${credentials.email}:`, e.message);
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