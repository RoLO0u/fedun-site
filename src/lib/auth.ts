import { betterAuth } from "better-auth";
import { admin as adminPlugin, anonymous } from "better-auth/plugins";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/drizzle";
import { user, session, verification, account } from "@/db/schema";
import { ac, admin } from "./permissions";

export const auth = betterAuth({
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") {
        return;
      }
      if (ctx.body.name < 3) {
        throw new APIError("BAD_REQUEST", {
          message: "Name must be at least 3 characters long",
        });
      } else if (ctx.body.name.length > 30) {
        throw new APIError("BAD_REQUEST", {
          message: "Name must be less than 30 characters long",
        })
      } else if (!/^\w+$/.test(ctx.body.name)) {
        throw new APIError("BAD_REQUEST", {
          message: "Name can only contain letters, numbers, and underscores",
        })
      }
    }),
  },
  database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
          user,
          session,
          verification,
          account,
      }
  }),
  socialProviders: {
      google: {
          clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
  },
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
      enabled: true,
  },
  plugins: [
      adminPlugin({
          ac,
          roles: {
              admin,
          }
      }),
      nextCookies(),
      anonymous({
        emailDomainName: process.env.EMAIL_DOMAIN_NAME,
        onLinkAccount: async ({ anonymousUser, newUser }) => {
        }
      }),
  ],
});


