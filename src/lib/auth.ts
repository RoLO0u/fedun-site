import { betterAuth } from "better-auth";
import { admin as adminPlugin} from "better-auth/plugins";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/drizzle";
import { user, session, verification, account } from "@/db/schema";
import { ac, admin } from "./permissions";
import { th } from "date-fns/locale";

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
  ],
});


