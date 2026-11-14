import mongoose from "mongoose";
import type { Db, MongoClient } from "mongodb";

// Re-export document types from the canonical location
export type {
  UserDoc,
  ClaimDoc,
  VolunteerDoc,
  SettingsDoc,
  ScanLogDoc,
  LoginAttemptDoc,
} from "@/lib/types";

// ─── Mongoose connection (singleton, HMR-safe) ────────────────────────────

declare global {
  var _icaaMongoose: Promise<typeof mongoose> | undefined;
}

export async function connectMongoose(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set in environment");

  if (mongoose.connection.readyState === 1) return mongoose;

  globalThis._icaaMongoose ??= mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB || "icaa",
    bufferCommands: false,
  });

  return globalThis._icaaMongoose;
}

// ─── Legacy-compatible helpers ────────────────────────────────────────────
// Routes still import `db()` / `getDb()` / `mongoClient()` from "@/lib/db";
// these shims keep those imports working without touching every route.

export async function mongoClient(): Promise<MongoClient> {
  await connectMongoose();
  // mongoose.connection.getClient() returns the underlying MongoClient
  return mongoose.connection.getClient() as unknown as MongoClient;
}

export async function db(): Promise<Db> {
  await connectMongoose();
  return mongoose.connection.db as unknown as Db;
}

export const getDb = db;

// ─── Index management ─────────────────────────────────────────────────────
// Kept for backwards-compat with scripts/seed-users.ts.
// Indexes are defined on each Mongoose schema; this syncs them to MongoDB.
export async function ensureIndexes(): Promise<void> {
  const { connectMongoose: cm } = await import("@/lib/db");
  await cm();
  const { UserModel, ClaimModel, VolunteerModel, ScanLogModel, LoginAttemptModel } =
    await import("@/lib/models");
  await Promise.all([
    UserModel.syncIndexes(),
    ClaimModel.syncIndexes(),
    VolunteerModel.syncIndexes(),
    ScanLogModel.syncIndexes(),
    LoginAttemptModel.syncIndexes(),
  ]);
}
