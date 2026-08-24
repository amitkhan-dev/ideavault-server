import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { getDb } from '../config/db.js';

let authInstance = null;

export const getAuth = () => {
  if (!authInstance) {
    authInstance = betterAuth({
      database: mongodbAdapter(getDb()),

      secret: process.env.BETTER_AUTH_SECRET,

      baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',

      emailAndPassword: {
        enabled: true,
      },

      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      },

      trustedOrigins: [
        process.env.CLIENT_URL || 'http://localhost:3000',
      ],
    });
  }

  return authInstance;
};