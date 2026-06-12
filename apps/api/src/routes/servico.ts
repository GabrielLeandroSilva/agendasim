import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { createDb } from '../db/client'
import { saloes, servicos } from '../db/schema'
import { verifyToken } from '../auth'

type Bindings = {
  DATABASE_URL: string
}

type Variables = {
  userId: string
}

const servico = new Hono<{ Bindings: Bindings; Variables: Variables }>()

const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) return c.json({ error: 'Token não enviado' }, 401)
  const token = authHeader.replace('Bearer ', '')
  const payload = await verifyToken(token)
  if (!payload) return c.json({ error: 'Token inválido' }, 401)
  c.set('userId', payload.userId)
  await next()
}

servico.get('/', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const db = createDb(c.env.DATABASE_URL)
  const [salao] = await db.select().from(saloes).where(eq(saloes.userId, userId)).limit(1)
  if (!salao) return c.json({ error: 'Salão não encontrado' }, 404)
  const lista = await db.select().from(servicos).where(eq(servicos.salaoId, salao.id))
  return c.json(lista)
})

servico.post('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const db = createDb(c.env.DATABASE_URL)
    const [salao] = await db.select().from(saloes).where(eq(saloes.userId, userId)).limit(1)
    if (!salao) return c.json({ error: 'Salão não encontrado' }, 404)
    const { nome, duracaoMinutos, preco } = await c.req.json()
    const [created] = await db.insert(servicos).values({
      id: crypto.randomUUID(),
      salaoId: salao.id,
      nome,
      duracaoMinutos,
      preco,
      ativo: true
    }).returning()
    return c.json(created, 201)
  } catch (e: any) {
    return c.json({ error: e.message }, 400)
  }
})

servico.put('/:id', authMiddleware, async (c) => {
  try {
    const { id } = c.req.param()
    const body = await c.req.json()
    const db = createDb(c.env.DATABASE_URL)
    const [updated] = await db.update(servicos)
      .set({ ...body })
      .where(eq(servicos.id, id))
      .returning()
    return c.json(updated)
  } catch (e: any) {
    return c.json({ error: e.message }, 400)
  }
})

servico.delete('/:id', authMiddleware, async (c) => {
  const { id } = c.req.param()
  const db = createDb(c.env.DATABASE_URL)
  await db.update(servicos).set({ ativo: false }).where(eq(servicos.id, id))
  return c.json({ ok: true })
})

export default servico