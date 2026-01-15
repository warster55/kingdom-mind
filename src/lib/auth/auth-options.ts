import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db, users } from "@/lib/db";
import { eq, or } from "drizzle-orm";
import crypto from 'node:crypto';
import { verifyTotp, decryptTotpSecret } from "@/lib/auth/totp";
import { validateSeedPhrase, verifySeedPhrase } from "@/lib/auth/seed-phrase";

/**
 * Creates a one-way SHA-256 hash for identifiers (username or legacy email)
 */
function hashIdentifier(identifier: string): string {
  const salt = process.env.IDENTITY_SALT || 'sanctuary-salt-v1';
  return crypto.createHmac('sha256', salt).update(identifier.toLowerCase().trim()).digest('hex');
}

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db),
  providers: [
    // Primary Login: Username + TOTP
    CredentialsProvider({
      id: "username-totp",
      name: "Username + TOTP",
      credentials: {
        username: { label: "Username", type: "text" },
        code: { label: "TOTP Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.code) return null;

        try {
          const usernameHash = hashIdentifier(credentials.username);
          const code = credentials.code.trim();

          // Admin bypass - controlled entirely by environment variables
          const bypassUsername = process.env.ADMIN_BYPASS_USERNAME?.toLowerCase().trim();
          const bypassCode = process.env.ADMIN_BYPASS_CODE?.trim();
          const isAdminBypass = bypassUsername && bypassCode &&
                                credentials.username.toLowerCase().trim() === bypassUsername &&
                                code === bypassCode;

          // Find user by username hash (or legacy email hash for migration)
          const userResult = await db
            .select({
              id: users.id,
              name: users.name,
              role: users.role,
              totpSecret: users.totpSecret,
              totpEnabledAt: users.totpEnabledAt,
            })
            .from(users)
            .where(or(
              eq(users.username, usernameHash),
              eq(users.email, usernameHash) // Legacy support during migration
            ))
            .limit(1);
          const user = userResult[0];

          if (!user) {
            throw new Error("USER_NOT_FOUND");
          }

          if (!isAdminBypass) {
            // TOTP is required for all users
            if (!user.totpEnabledAt || !user.totpSecret) {
              throw new Error("TOTP_NOT_CONFIGURED");
            }

            const secret = decryptTotpSecret(user.totpSecret);
            const isValidTotp = verifyTotp(code, secret);

            if (!isValidTotp) {
              throw new Error("INVALID_TOTP");
            }
          }

          // Update last activity
          await db
            .update(users)
            .set({ lastActivityAt: new Date() })
            .where(eq(users.id, user.id));

          return {
            id: user.id.toString(),
            email: 'anonymous@kingdomind.app', // NextAuth requires email field
            name: user.name,
            role: user.role,
          };
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : 'Unknown error';
          console.error(`[Auth] Username+TOTP Access Denied:`, message);
          throw e;
        }
      }
    }),

    // Recovery: Username + Seed Phrase
    CredentialsProvider({
      id: "seed-phrase",
      name: "Seed Phrase Recovery",
      credentials: {
        username: { label: "Username", type: "text" },
        seedPhrase: { label: "Seed Phrase", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.seedPhrase) return null;

        try {
          const usernameHash = hashIdentifier(credentials.username);
          const seedPhrase = credentials.seedPhrase.trim().toLowerCase();

          // Validate BIP39 format
          if (!validateSeedPhrase(seedPhrase)) {
            throw new Error("INVALID_SEED_PHRASE_FORMAT");
          }

          // Find user
          const userResult = await db
            .select({
              id: users.id,
              name: users.name,
              role: users.role,
              seedPhraseHash: users.seedPhraseHash,
            })
            .from(users)
            .where(or(
              eq(users.username, usernameHash),
              eq(users.email, usernameHash) // Legacy support
            ))
            .limit(1);
          const user = userResult[0];

          if (!user) {
            throw new Error("USER_NOT_FOUND");
          }

          if (!user.seedPhraseHash) {
            throw new Error("NO_SEED_PHRASE_CONFIGURED");
          }

          // Verify seed phrase
          const isValid = verifySeedPhrase(seedPhrase, user.seedPhraseHash);
          if (!isValid) {
            throw new Error("INVALID_SEED_PHRASE");
          }

          // Update last activity
          await db
            .update(users)
            .set({ lastActivityAt: new Date() })
            .where(eq(users.id, user.id));

          return {
            id: user.id.toString(),
            email: 'anonymous@kingdomind.app',
            name: user.name,
            role: user.role,
          };
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : 'Unknown error';
          console.error(`[Auth] Seed Phrase Access Denied:`, message);
          throw e;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string | number; role?: string }).id = token.id as string | number;
        (session.user as { id?: string | number; role?: string }).role = token.role as string;
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
