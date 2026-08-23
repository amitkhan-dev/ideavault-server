import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error(' MONGODB_URI is not defined in .env file!');
}

const client = new MongoClient(uri || 'mongodb://localhost:27017');
let dbInstance = null;

export const connectDB = async () => {
  if (dbInstance) return dbInstance;

  try {
    await client.connect();
    dbInstance = client.db('ideavaults');
    console.log(' MongoDB Atlas connected via Native Driver');
    return dbInstance;
  } catch (error) {
    console.error(' MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

export const getDb = () => {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return dbInstance;
};