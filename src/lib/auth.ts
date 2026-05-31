import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db, schema } from "@/db";
import { env } from "@/env";
import {
  resetPasswordEmail,
  sendTransactionalEmail,
  verificationEmail,
} from "@/lib/email";
import { grantSignupBonus, provisionNewUser } from "@/lib/provisioning";

const googleConfigured = Boolean(
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET,
);

export const auth = betterAuth({
  appName: "RenderAI",
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.APP_URL],

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      const { subject, html } = resetPasswordEmail({ name: user.name, url });
      await sendTransactionalEmail({
        userId: user.id,
        type: "password_reset",
        to: user.email,
        subject,
        html,
      });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24, // 24 jam
    sendVerificationEmail: async ({ user, url }) => {
      const { subject, html } = verificationEmail({ name: user.name, url });
      await sendTransactionalEmail({
        userId: user.id,
        type: "email_verification",
        to: user.email,
        subject,
        html,
      });
    },
    afterEmailVerification: async (user) => {
      // Email/password flow: grant the one-time free credits once verified.
      await provisionNewUser(user.id, user.name);
      await grantSignupBonus(user.id);
    },
  },

  ...(googleConfigured
    ? {
        socialProviders: {
          google: {
            clientId: env.GOOGLE_CLIENT_ID!,
            clientSecret: env.GOOGLE_CLIENT_SECRET!,
          },
        },
      }
    : {}),

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
      isDisabled: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },

  session: {
    expiresIn: env.SESSION_DEFAULT_MAX_AGE,
    updateAge: 60 * 60 * 24, // perpanjang sesi setiap hari aktif
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          await provisionNewUser(createdUser.id, createdUser.name);
          // Google OAuth users arrive already verified → grant bonus now.
          if (createdUser.emailVerified) {
            await grantSignupBonus(createdUser.id);
          }
        },
      },
    },
  },

  plugins: [nextCookies()],
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
