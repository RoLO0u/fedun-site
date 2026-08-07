import { createAuthClient } from "better-auth/react";
import { adminClient, anonymousClient } from "better-auth/client/plugins";
import { ac, admin } from "./permissions";

export const googleClientId =
	process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export const authClient = createAuthClient({
    baseURL: process.env.BETTER_AUTH_URL,
    plugins: [
        adminClient({
            ac,
            roles: {
                admin,
            }
        }),
        anonymousClient(),
    ],
})

export const signIn = async (callbackURL?: string) => {
  const data = await authClient.signIn.social({
    provider: "google",
    callbackURL,
  });
};

export type AuthClient = typeof authClient;