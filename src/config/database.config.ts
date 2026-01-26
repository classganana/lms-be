import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  // Default to local MongoDB for development if MONGODB_URI is not provided
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/lead-management',
  dbName: process.env.MONGODB_DB || 'lead-management',
}));

