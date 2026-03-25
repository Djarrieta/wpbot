import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const API_URL = process.env.API_URL || "http://localhost:4000";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      if (user.email) {
        try {
          await fetch(`${API_URL}/users/by-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: user.email, name: user.name }),
          });
        } catch (e) {
          console.error("Failed to sync user with API:", e);
        }
      }
      return true;
    },
    async jwt({ token }) {
      if (token.email && !token.dbUserId) {
        try {
          const res = await fetch(`${API_URL}/users?email=${encodeURIComponent(token.email)}`);
          if (res.ok) {
            const users = await res.json();
            if (Array.isArray(users) && users.length > 0) {
              token.dbUserId = users[0].id;
            }
          }
        } catch (e) {
          console.error("Failed to fetch user from API:", e);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.dbUserId) {
        (session as any).dbUserId = token.dbUserId;
      }
      return session;
    },
  },
});
