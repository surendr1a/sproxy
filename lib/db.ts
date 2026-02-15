// lib/db.ts
import mongoose from "mongoose"

let cached = (global as any).mongoose

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null }
}

export async function connectDB() {
  // already connected (hot reload / lambda reuse)
  if (cached.conn) return cached.conn

  const MONGO_URI = process.env.MONGO_URI

  // ⚠️ ENV check RUNTIME pe — NOT at build time
  if (!MONGO_URI) {
    throw new Error("❌ MONGO_URI missing at runtime")
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGO_URI)
      .then((mongoose) => {
        console.log("✅ MongoDB connected")
        return mongoose
      })
  }

  cached.conn = await cached.promise
  return cached.conn
}
