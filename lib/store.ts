// In-memory mock database store
// This can be replaced with a real database later

import { randomBytes } from "crypto"

export interface User {
  id: string
  email: string
  passwordHash: string
  createdAt: Date
  trialRequestsRemaining: number
  planId: string | null
  planExpiresAt: Date | null
}

export interface ApiKey {
  id: string
  userId: string
  key: string
  maskedKey: string
  status: "active" | "disabled"
  createdAt: Date
  lastUsedAt: Date | null
}

export interface UsageLog {
  id: string
  userId: string
  apiKeyId: string
  date: string
  requestCount: number
  failedCount: number
}

export interface Plan {
  id: string
  name: string
  monthlyRequestLimit: number
  price: number
  features: string[]
}

export interface Subscription {
  id: string
  userId: string
  planId: string
  status: "active" | "canceled" | "expired"
  renewsAt: Date
}

// In-memory stores
const users: Map<string, User> = new Map()
const apiKeys: Map<string, ApiKey> = new Map()
const usageLogs: Map<string, UsageLog> = new Map()
const sessions: Map<string, string> = new Map() // sessionId -> userId
const subscriptions: Map<string, Subscription> = new Map()

// Seed plans
export const plans: Plan[] = [
  {
    id: "free",
    name: "Free Trial",
    monthlyRequestLimit: 50,
    price: 0,
    features: ["50 requests", "Speed limited", "Basic support"],
  },
  {
    id: "starter",
    name: "Starter",
    monthlyRequestLimit: 5000,
    price: 19,
    features: ["5,000 requests/mo", "Full speed", "Email support"],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyRequestLimit: 25000,
    price: 49,
    features: ["25,000 requests/mo", "Full speed", "Priority support", "API analytics"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyRequestLimit: 100000,
    price: 149,
    features: ["100,000 requests/mo", "Full speed", "Dedicated support", "Custom limits"],
  },
]

// Helper functions
export function generateId(): string {
  return randomBytes(16).toString("hex")
}

export function generateApiKey(): string {
  return `pk_${randomBytes(24).toString("hex")}`
}

export function maskApiKey(key: string): string {
  return `${key.slice(0, 7)}...${key.slice(-4)}`
}

export function hashPassword(password: string): string {
  // Simple hash for mock - in production use bcrypt
  return Buffer.from(password).toString("base64")
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

// User operations
export function createUser(email: string, password: string): User {
  const id = generateId()
  const user: User = {
    id,
    email,
    passwordHash: hashPassword(password),
    createdAt: new Date(),
    trialRequestsRemaining: 50,
    planId: null,
    planExpiresAt: null,
  }
  users.set(id, user)

  // Auto-create API key for new user
  createApiKey(id)

  // Create initial usage log
  const today = new Date().toISOString().split("T")[0]
  const usageId = generateId()
  usageLogs.set(usageId, {
    id: usageId,
    userId: id,
    apiKeyId: getApiKeysByUserId(id)[0]?.id || "",
    date: today,
    requestCount: 0,
    failedCount: 0,
  })

  return user
}

export function getUserByEmail(email: string): User | undefined {
  return Array.from(users.values()).find((u) => u.email === email)
}

export function getUserById(id: string): User | undefined {
  return users.get(id)
}

export function updateUser(id: string, updates: Partial<User>): User | undefined {
  const user = users.get(id)
  if (!user) return undefined
  const updated = { ...user, ...updates }
  users.set(id, updated)
  return updated
}

// API Key operations
export function createApiKey(userId: string): ApiKey {
  const id = generateId()
  const key = generateApiKey()
  const apiKey: ApiKey = {
    id,
    userId,
    key,
    maskedKey: maskApiKey(key),
    status: "active",
    createdAt: new Date(),
    lastUsedAt: null,
  }
  apiKeys.set(id, apiKey)
  return apiKey
}

export function getApiKeysByUserId(userId: string): ApiKey[] {
  return Array.from(apiKeys.values()).filter((k) => k.userId === userId)
}

export function getApiKeyById(id: string): ApiKey | undefined {
  return apiKeys.get(id)
}

export function regenerateApiKey(id: string): ApiKey | undefined {
  const existing = apiKeys.get(id)
  if (!existing) return undefined

  const newKey = generateApiKey()
  const updated: ApiKey = {
    ...existing,
    key: newKey,
    maskedKey: maskApiKey(newKey),
    createdAt: new Date(),
  }
  apiKeys.set(id, updated)
  return updated
}

export function updateApiKeyStatus(id: string, status: "active" | "disabled"): ApiKey | undefined {
  const apiKey = apiKeys.get(id)
  if (!apiKey) return undefined
  const updated = { ...apiKey, status }
  apiKeys.set(id, updated)
  return updated
}

// Session operations
export function createSession(userId: string): string {
  const sessionId = generateId()
  sessions.set(sessionId, userId)
  return sessionId
}

export function getSessionUserId(sessionId: string): string | undefined {
  return sessions.get(sessionId)
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId)
}

// Usage operations
export function getUsageByUserId(userId: string): UsageLog[] {
  return Array.from(usageLogs.values()).filter((u) => u.userId === userId)
}

export function incrementUsage(userId: string, apiKeyId: string, failed = false): void {
  const today = new Date().toISOString().split("T")[0]
  const existing = Array.from(usageLogs.values()).find(
    (u) => u.userId === userId && u.date === today
  )

  if (existing) {
    if (failed) {
      existing.failedCount++
    } else {
      existing.requestCount++
    }
    usageLogs.set(existing.id, existing)
  } else {
    const id = generateId()
    usageLogs.set(id, {
      id,
      userId,
      apiKeyId,
      date: today,
      requestCount: failed ? 0 : 1,
      failedCount: failed ? 1 : 0,
    })
  }

  // Decrement trial if on free plan
  const user = getUserById(userId)
  if (user && !user.planId && !failed) {
    updateUser(userId, { trialRequestsRemaining: Math.max(0, user.trialRequestsRemaining - 1) })
  }
}

export function getUsageSummary(userId: string): {
  today: number
  thisMonth: number
  failed: number
  remaining: number
} {
  const user = getUserById(userId)
  const logs = getUsageByUserId(userId)
  const today = new Date().toISOString().split("T")[0]
  const thisMonth = new Date().toISOString().slice(0, 7)

  const todayUsage = logs.filter((l) => l.date === today).reduce((sum, l) => sum + l.requestCount, 0)
  const monthUsage = logs
    .filter((l) => l.date.startsWith(thisMonth))
    .reduce((sum, l) => sum + l.requestCount, 0)
  const failedTotal = logs.reduce((sum, l) => sum + l.failedCount, 0)

  let remaining = 0
  if (user) {
    if (user.planId) {
      const plan = plans.find((p) => p.id === user.planId)
      remaining = plan ? plan.monthlyRequestLimit - monthUsage : 0
    } else {
      remaining = user.trialRequestsRemaining
    }
  }

  return {
    today: todayUsage,
    thisMonth: monthUsage,
    failed: failedTotal,
    remaining: Math.max(0, remaining),
  }
}

// Subscription operations
export function getSubscriptionByUserId(userId: string): Subscription | undefined {
  return Array.from(subscriptions.values()).find((s) => s.userId === userId)
}

export function createSubscription(userId: string, planId: string): Subscription {
  const id = generateId()
  const renewsAt = new Date()
  renewsAt.setMonth(renewsAt.getMonth() + 1)

  const subscription: Subscription = {
    id,
    userId,
    planId,
    status: "active",
    renewsAt,
  }
  subscriptions.set(id, subscription)

  // Update user's plan
  updateUser(userId, { planId, planExpiresAt: renewsAt })

  return subscription
}

// Seed demo data
export function seedDemoData(): void {
  // Create demo user
  const demoUser = createUser("demo@example.com", "demo123")

  // Add some usage history
  const apiKey = getApiKeysByUserId(demoUser.id)[0]
  if (apiKey) {
    // Generate last 30 days of usage data
    for (let i = 30; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      const id = generateId()
      usageLogs.set(id, {
        id,
        userId: demoUser.id,
        apiKeyId: apiKey.id,
        date: dateStr,
        requestCount: Math.floor(Math.random() * 15) + 1,
        failedCount: Math.floor(Math.random() * 2),
      })
    }

    // Update trial remaining based on usage
    const totalUsed = Array.from(usageLogs.values())
      .filter((l) => l.userId === demoUser.id)
      .reduce((sum, l) => sum + l.requestCount, 0)
    updateUser(demoUser.id, { trialRequestsRemaining: Math.max(0, 50 - totalUsed) })
  }
}

// Initialize demo data
seedDemoData()
