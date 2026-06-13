import { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma, querySql, executeSql } from '@/lib/db';

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      try {
        const email = user.email;
        const name = user.name || email.split('@')[0];
        const image = user.image || null;
        const isPostgres = !!process.env.DATABASE_URL;

        if (isPostgres) {
          const dbUser = await prisma.user.upsert({
            where: { email },
            update: { name, image },
            create: {
              id: user.id || Math.random().toString(36).substring(2),
              email,
              name,
              image,
            },
          });
          user.id = dbUser.id;
        } else {
          // SQLite fallback (local dev only)
          const existing = await querySql<{ id: string }>(
            'SELECT id FROM users WHERE email = $1',
            [email]
          );
          if (existing && existing.length > 0) {
            await executeSql(
              'UPDATE users SET name = $1, image = $2 WHERE email = $3',
              [name, image, email]
            );
            user.id = existing[0].id;
          } else {
            const newId = user.id || Math.random().toString(36).substring(2);
            await executeSql(
              'INSERT INTO users (id, name, email, image) VALUES ($1, $2, $3, $4)',
              [newId, name, email, image]
            );
            user.id = newId;
          }
        }
      } catch (err) {
        console.error('NextAuth signIn callback db sync error:', err);
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        if (token.picture) {
          session.user.image = token.picture as string;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
    signOut: '/auth/signout',
  },
};
