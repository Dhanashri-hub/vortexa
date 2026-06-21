import fs from "fs/promises";
import path from "path";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;
let pool: any;
let db: any;

const devDbFile = path.resolve(process.cwd(), "lib/db/dev-db.json");

async function ensureDevDbDirectory() {
  await fs.mkdir(path.dirname(devDbFile), { recursive: true });
}

async function loadDevStore(): Promise<Record<string, any[]>> {
  try {
    const raw = await fs.readFile(devDbFile, "utf-8");
    return JSON.parse(raw) as Record<string, any[]>;
  } catch {
    return {};
  }
}

async function saveDevStore(store: Record<string, any[]>) {
  await ensureDevDbDirectory();
  await fs.writeFile(devDbFile, JSON.stringify(store, null, 2), "utf-8");
}

if (!process.env.DATABASE_URL) {
  // eslint-disable-next-line no-console
  console.warn(
    `DATABASE_URL not set — using file-backed dev DB at ${devDbFile} for persistence between restarts.`,
  );

  const store = await loadDevStore();

  const stub = {
    _store: store as Record<string, any[]>,

    select: () => ({
      from(table: any) {
        const name = (table && (table.name || table._name)) || String(table);
        const rows = (stub._store[name] || []).slice();
        const chain: any = {
          orderBy: async (_cb?: any) => rows,
          where: (_cond?: any) => chain,
          limit: async () => rows,
          then: (onfulfilled: any, onrejected: any) => Promise.resolve(rows).then(onfulfilled, onrejected),
        };
        return chain;
      },
    }),

    insert(table: any) {
      const name = (table && (table.name || table._name)) || String(table);
      stub._store[name] = stub._store[name] || [];
      return {
        values(obj: Record<string, any>) {
          const id = (stub._store[name].length > 0 ? stub._store[name][stub._store[name].length - 1].id : 0) + 1;
          const now = new Date().toISOString();
          const record = {
            id,
            ...obj,
            createdAt: now,
            updatedAt: now,
          } as any;
          stub._store[name].push(record);
          return {
            returning: async () => {
              await saveDevStore(stub._store);
              return [record];
            },
          };
        },
      };
    },
    update(table: any) {
      const name = (table && (table.name || table._name)) || String(table);
      return {
        set(obj: Record<string, any>) {
          return {
            where: async (_cond?: any) => {
              const rows = stub._store[name] || [];
              const updated = rows.map((r) => ({ ...r, ...obj, updatedAt: new Date().toISOString() }));
              stub._store[name] = updated;
              await saveDevStore(stub._store);
              return { returning: async () => updated };
            },
          };
        },
      };
    },
    delete(table: any) {
      const name = (table && (table.name || table._name)) || String(table);
      return {
        where: async (_cond?: any) => {
          stub._store[name] = [];
          await saveDevStore(stub._store);
          return { rowsAffected: 0 };
        },
      };
    },
  } as const;

  pool = null;
  db = stub as unknown as ReturnType<typeof drizzle>;
} else {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
}

export { pool, db };

export * from "./schema";
