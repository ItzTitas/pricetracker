import { PrismaClient } from '@prisma/client';
import path from 'path';
// sqlite3 is loaded dynamically only in non-postgres local fallback to avoid Vercel build dependency issues

const pgUrl = process.env.DATABASE_URL;
const isPostgres = !!pgUrl;

// SQLite configuration for fallback
const DB_FILE = path.join(process.cwd(), 'aurumtrack.db');

// Singleton Prisma Client (prevents connection pool exhaustion in Next.js dev hot-reload)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: pgUrl || 'postgresql://mock:mock@localhost:5432/mock'
    }
  }
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Helper for database compatibility
export async function initDatabase() {
  if (isPostgres) {
    try {
      // Test Prisma connection
      await prisma.$connect();
      console.log('Prisma connected to PostgreSQL successfully.');
    } catch (err) {
      console.warn('Prisma failed to connect to PostgreSQL, using SQLite fallback.', err);
    }
  } else {
    // Initialize SQLite Tables
    return new Promise<void>((resolve, reject) => {
      const sqlite3 = require('sqlite3');
      const db = new sqlite3.Database(DB_FILE, (err: any) => {
        if (err) return reject(err);
        db.serialize(() => {
          // 1. Users Table
          db.run(`
            CREATE TABLE IF NOT EXISTS users (
              id TEXT PRIMARY KEY,
              name TEXT,
              email TEXT UNIQUE,
              password TEXT,
              image TEXT,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP,
              updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // 2. Holdings Table
          db.run(`
            CREATE TABLE IF NOT EXISTS holdings (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              metal TEXT NOT NULL,
              purity TEXT NOT NULL,
              weight REAL NOT NULL,
              purchase_date TEXT NOT NULL,
              purchase_price REAL NOT NULL,
              purchase_city TEXT NOT NULL,
              notes TEXT,
              is_archived INTEGER DEFAULT 0,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // 3. Jewelry Items Table
          db.run(`
            CREATE TABLE IF NOT EXISTS jewelry_items (
              id TEXT PRIMARY KEY,
              holding_id TEXT NOT NULL,
              item_name TEXT NOT NULL,
              jewelry_type TEXT NOT NULL,
              weight REAL NOT NULL,
              purity TEXT NOT NULL,
              purchase_price REAL,
              purchase_date TEXT,
              notes TEXT,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // 4. Price History Table
          db.run(`
            CREATE TABLE IF NOT EXISTS price_history (
              id TEXT PRIMARY KEY,
              metal TEXT NOT NULL,
              purity TEXT,
              city TEXT NOT NULL,
              currency TEXT NOT NULL,
              price REAL NOT NULL,
              timestamp TEXT DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // 5. Portfolio Snapshots Table
          db.run(`
            CREATE TABLE IF NOT EXISTS portfolio_snapshots (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              total_value REAL NOT NULL,
              invested_value REAL NOT NULL,
              gold_value REAL NOT NULL,
              silver_value REAL NOT NULL,
              timestamp TEXT DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // 6. Watchlists Table
          db.run(`
            CREATE TABLE IF NOT EXISTS watchlists (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              metal TEXT NOT NULL,
              purity TEXT,
              city TEXT NOT NULL,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // 7. Alerts Table
          db.run(`
            CREATE TABLE IF NOT EXISTS alerts (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              metal TEXT NOT NULL,
              purity TEXT,
              condition TEXT NOT NULL,
              target_price REAL NOT NULL,
              is_triggered INTEGER DEFAULT 0,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // 8. Audit Logs Table
          db.run(`
            CREATE TABLE IF NOT EXISTS audit_logs (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              action TEXT NOT NULL,
              details TEXT NOT NULL,
              timestamp TEXT DEFAULT CURRENT_TIMESTAMP
            )
          `, (err: any) => {
            db.close();
            if (err) return reject(err);
            resolve();
          });
        });
      });
    });
  }
}

// SQLite helper queries (when PG is not present)
export async function executeSql(sql: string, params: any[] = []): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const sqlite3 = require('sqlite3');
    const db = new sqlite3.Database(DB_FILE, (err: any) => {
      if (err) return reject(err);
    });

    let sqliteSql = sql;
    const pgPlaceholderRegex = /\$[0-9]+/g;
    if (pgPlaceholderRegex.test(sql)) {
      sqliteSql = sql.replace(pgPlaceholderRegex, '?');
    }

    db.run(sqliteSql, params, (err: any) => {
      db.close();
      if (err) return reject(err);
      resolve();
    });
  });
}

export async function querySql<T>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise<T[]>((resolve, reject) => {
    const sqlite3 = require('sqlite3');
    const db = new sqlite3.Database(DB_FILE, (err: any) => {
      if (err) return reject(err);
    });

    let sqliteSql = sql;
    const pgPlaceholderRegex = /\$[0-9]+/g;
    if (pgPlaceholderRegex.test(sql)) {
      sqliteSql = sql.replace(pgPlaceholderRegex, '?');
    }

    db.all(sqliteSql, params, (err: any, rows: any) => {
      db.close();
      if (err) return reject(err);
      resolve(rows as T[]);
    });
  });
}

// Aliases for compatibility
export { executeSql as execute, querySql as query };
