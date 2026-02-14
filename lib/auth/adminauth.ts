import { NextRequest } from "next/server"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

/**
 * JWT payload type
 * (adjust fields if needed)
 */
type AdminJWTPayload = {
  id: string
  email: string
  role: string
  iat: number
  exp: number
}

/**
 * Verify admin from request
 */
export async function verifyAdmin(req: NextRequest) {
  try {
    /* ---------------- GET TOKEN ---------------- */
    const authHeader = req.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.split(" ")[1]

    if (!token) return null

    /* ---------------- VERIFY JWT ---------------- */
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as AdminJWTPayload

    if (!decoded || !decoded.id) {
      return null
    }

    /* ---------------- ROLE CHECK ---------------- */
    if (decoded.role !== "admin") {
      return null
    }

    /* ---------------- OPTIONAL DB CHECK ---------------- */
    // If you want strict validation from DB
    // (recommended for admin routes)

    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI as string)
    }

    const Admin =
      mongoose.models.Admin ||
      mongoose.model(
        "Admin",
        new mongoose.Schema({
          email: String,
          role: String,
        })
      )

    const admin = await Admin.findById(decoded.id).lean()

    if (!admin || admin.role !== "admin") {
      return null
    }

    /* ---------------- SUCCESS ---------------- */
    return admin
  } catch (error) {
    console.error("verifyAdmin error:", error)
    return null
  }
}
