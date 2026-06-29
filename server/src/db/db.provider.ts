import { db } from "./db";

// DI token so the drizzle instance can be injected (and swapped for a test DB).
export const DB = Symbol("DB");
export const dbProvider = { provide: DB, useValue: db };
