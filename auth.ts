import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) return null;

        const { email: rawIdentifier, password } = parsedCredentials.data;
        const identifier = rawIdentifier.trim();
        const isEmail = identifier.includes("@");
        
        const user = isEmail
          ? await db.user.findFirst({
              where: {
                email: {
                  equals: identifier,
                  mode: "insensitive",
                }
              }
            })
          : await db.user.findFirst({
              where: {
                username: {
                  equals: identifier,
                  mode: "insensitive",
                }
              }
            });

        if (!user || !user.passwordHash) return null;

        const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
        if (passwordsMatch) {
          return {
            id: user.id,
            email: user.email,
            name: user.username || user.email,
          };
        }

        return null;
      }
    })
  ],
});
