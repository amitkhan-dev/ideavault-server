import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { getDb } from '../config/db.js';

let authInstance = null;

export const getAuth = () => {
  if (!authInstance) {
    authInstance = betterAuth({
      database: mongodbAdapter(getDb()),
      secret: process.env.BETTER_AUTH_SECRET,
      baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5000',
      emailAndPassword: {
        enabled: true,
      },
      trustedOrigins: [process.env.CLIENT_URL || 'http://localhost:3000'],
    });
  }
  return authInstance;
};