import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import * as path from 'path';

// Load and expand variables from the root .env.development
const envPath = path.resolve(__dirname, '../../.env.development');
const myEnv = dotenv.config({ path: envPath });
expand(myEnv);

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
