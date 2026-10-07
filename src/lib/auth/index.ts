import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      return true;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.sub as string) || (token.id as string) || "user-1";
      }
      return session;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "development-secret-key-at-least-32-chars-long",
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
