import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { createDb } from '../db/client'
import { saloes, servicos, horariosFuncionamento } from '../db/schema'
import { verifyToken } from '../auth'

type Bindings = {
  DATABASE_URL: string
}

type Variables = {
  userId: string
}

const salao = new Hono<{ Bindings: Bindings; Variables: Variables }>()

const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) return c.json({ error: 'Token não enviado' }, 401)
  const token = authHeader.replace('Bearer ', '')
  const payload = await verifyToken(token)
  if (!payload) return c.json({ error: 'Token inválido' }, 401)
  c.set('userId', payload.userId)
  await next()
}

salao.post('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const { nome, telefone, whatsapp, slug } = await c.req.json()
    const db = createDb(c.env.DATABASE_URL)
    const existing = await db.select().from(saloes).where(eq(saloes.slug, slug)).limit(1)
    if (existing.length > 0) return c.json({ error: 'Slug já em uso' }, 400)
    const [created] = await db.insert(saloes).values({
      id: crypto.randomUUID(),
      slug,
      nome,
      telefone,
      whatsapp,
      userId,
      criadoEm: new Date()
    }).returning()
    return c.json(created, 201)
  } catch (e: any) {
    return c.json({ error: e.message }, 400)
  }
})

salao.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const db = createDb(c.env.DATABASE_URL)
  const [found] = await db.select().from(saloes).where(eq(saloes.userId, userId)).limit(1)
  if (!found) return c.json({ error: 'Salão não encontrado' }, 404)
  return c.json(found)
})

salao.put('/me', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const db = createDb(c.env.DATABASE_URL)
    const [found] = await db.select().from(saloes).where(eq(saloes.userId, userId)).limit(1)
    if (!found) return c.json({ error: 'Salão não encontrado' }, 404)
    const body = await c.req.json()
    const [updated] = await db.update(saloes)
      .set({ ...body })
      .where(eq(saloes.id, found.id))
      .returning()
    return c.json(updated)
  } catch (e: any) {
    return c.json({ error: e.message }, 400)
  }
})

salao.get('/:slug', async (c) => {
  const { slug } = c.req.param()
  const db = createDb(c.env.DATABASE_URL)
  const [found] = await db.select().from(saloes).where(eq(saloes.slug, slug)).limit(1)
  if (!found) return c.json({ error: 'Salão não encontrado' }, 404)
  const servicosDoSalao = await db.select().from(servicos)
    .where(eq(servicos.salaoId, found.id))
  const horarios = await db.select().from(horariosFuncionamento)
    .where(eq(horariosFuncionamento.salaoId, found.id))
  return c.json({ salao: found, servicos: servicosDoSalao, horarios })
})

export default salao