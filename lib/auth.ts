import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './db/prisma';

/**
 * NextAuth.js configuration
 * Supports Google OAuth 2.0 and Credentials authentication
 */
export const authOptions: NextAuthOptions = {
  adapter: process.env.ENABLE_PRISMA_ADAPTER === 'true' && process.env.DATABASE_URL ? (PrismaAdapter(prisma) as any) : undefined,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          scope: 'openid email profile https://www.googleapis.com/auth/drive.file',
        },
      },
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null;
        }

        return {
          id: credentials.email.split('@')[0],
          name: credentials.email.split('@')[0].replace('.', ' '),
          email: credentials.email,
          image: null,
          role: credentials.email.includes('admin') ? 'ADMIN' : 'COLLECTOR',
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        token.id = user.id;
        token.role = (user as any).role || 'COLLECTOR';
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role || 'COLLECTOR';
        (session.user as any).accessToken = token.accessToken;
        if (token.picture && !session.user.image) {
          session.user.image = token.picture as string;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  events: {
    async signIn({ user, account }) {
      console.log(`[Auth] User signed in via ${account?.provider || 'credentials'}: ${user.email}`);
    },
    async signOut() {
      console.log('[Auth] User signed out');
    },
  },
};
