import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma, querySql, executeSql } from '@/lib/db';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'mock-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock-google-client-secret',
    }),
    CredentialsProvider({
      name: 'Simulated Login',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
        image: { label: "Image", type: "text" }
      },
      async authorize(credentials) {
        // Mock authorization for easy local testing
        if (credentials?.email) {
          return {
            id: credentials.email.includes('google') ? 'google-mock-id' : 'demo-user-id',
            name: credentials.name || 'Titas Deb',
            email: credentials.email,
            image: credentials.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150'
          };
        }
        return null;
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days persistence
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return true;
      try {
        const email = user.email;
        const name = user.name || 'Titas Deb';
        const image = user.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150';
        const isPostgres = !!process.env.DATABASE_URL;

        if (isPostgres) {
          const dbUser = await prisma.user.upsert({
            where: { email },
            update: { name, image },
            create: { id: user.id || Math.random().toString(36).substring(2), email, name, image }
          });
          user.id = dbUser.id;
        } else {
          // SQLite fallback
          const existing = await querySql<{ id: string }>('SELECT id FROM users WHERE email = $1', [email]);
          if (existing && existing.length > 0) {
            await executeSql('UPDATE users SET name = $1, image = $2 WHERE email = $3', [name, image, email]);
            user.id = existing[0].id;
          } else {
            const newId = user.id || Math.random().toString(36).substring(2);
            await executeSql('INSERT INTO users (id, name, email, image) VALUES ($1, $2, $3, $4)', [newId, name, email, image]);
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
        (session.user as any).id = token.sub || 'demo-user-id';
        if (token.picture) {
          session.user.image = token.picture;
        }
      }
      return session;
    }
  },
  pages: {
    signIn: '/',
    signOut: '/auth/signout'
  }
});

export { handler as GET, handler as POST };
