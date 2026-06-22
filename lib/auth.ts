import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { getServerSession } from "next-auth";
import type { AuthOptions } from "next-auth";

const hasGithubCreds = !!(
  process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
);

const authOptions: AuthOptions = {
  providers: hasGithubCreds
    ? [
        GitHub({
          clientId: process.env.GITHUB_CLIENT_ID!,
          clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        }),
      ]
    : [],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

export async function auth() {
  if (!hasGithubCreds) return null;
  try {
    return await getServerSession(authOptions);
  } catch {
    return null;
  }
}

export const signIn = handler;
export const signOut = handler;
