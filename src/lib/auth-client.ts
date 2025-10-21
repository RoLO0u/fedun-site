import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { ac, admin } from "./permissions";

export const authClient = createAuthClient({
    baseURL: process.env.BETTER_AUTH_URL,
    plugins: [
        adminClient({
            ac,
            roles: {
                admin,
            }
        }),
    ],
})

export type AuthClient = typeof authClient;