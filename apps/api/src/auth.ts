import { SignJWT, jwtVerify } from 'jose'
import { eq } from 'drizzle-orm'
import { createDb } from './db/client'
import { user } from './db/schema'

const SECRET = new TextEncoder().encode('agendasim-secret-key-2024')

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const newHash = await hashPassword(password)
  return newHash === hash
}

export async function createToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return { userId: payload.userId as string }
  } catch {
    return null
  }
}

export async function signUp(databaseUrl: string, name: string, email: string, password: string) {
  const db = createDb(databaseUrl)
  const existing = await db.select().from(user).where(eq(user.email, email)).limit(1)
  if (existing.length > 0) {
    throw new Error('Email já cadastrado')
  }
  const id = crypto.randomUUID()
  const passwordHash = await hashPassword(password)
  const now = new Date()
  const [created] = await db.insert(user).values({
    id,
    name,
    email,
    emailVerified: false,
    createdAt: now,
    updatedAt: now,
    password: passwordHash
  }).returning()
  const token = await createToken(created.id)
  return { user: { id: created.id, name: created.name, email: created.email }, token }
}

export async function signIn(databaseUrl: string, email: string, password: string) {
  const db = createDb(databaseUrl)
  const [found] = await db.select().from(user).where(eq(user.email, email)).limit(1)
  if (!found) throw new Error('Usuário não encontrado')
  const valid = await verifyPassword(password, found.password!)
  if (!valid) throw new Error('Senha incorreta')
  const token = await createToken(found.id)
  return { user: { id: found.id, name: found.name, email: found.email }, token }
}