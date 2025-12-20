import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import * as schema from './schema';

// Create SQLite database
const sqlite = new Database('./observatory.db');

// Create Drizzle client
export const db = drizzle(sqlite, { schema });

// Export for type inference
export type DbClient = typeof db;
