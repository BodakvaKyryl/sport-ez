import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import * as authSchema from "./db/auth-schema";
import { db } from "./db/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.API_URL,

  emailAndPassword: { enabled: true },

  rateLimit: {
    window: 10,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
    },
  },

  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});
