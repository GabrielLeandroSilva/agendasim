import { Hono } from 'hono'
import { eq, and } from 'drizzle-orm'
import { createDb } from '../db/client'
import { agendamentos, saloes, servicos } from '../db/schema'
import { verifyToken } from '../auth'

type Bindings = {
  DATABASE_URL: string
}

type Variables = {
  userId: string
}

const agendamento = new Hono<{ Bindings: Bindings; Variables: Variables }>()

const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) return c.json({ error: 'Token não enviado' }, 401)
  const token = authHeader.replace('Bearer ', '')
  const payload = await verifyToken(token)
  if (!payload) return c.json({ error: 'Token inválido' }, 401)
  c.set('userId', payload.userId)
  await next()
}

agendamento.post('/:slug', async (c) => {
  try {
    const { slug } = c.req.param()
    const { clienteNome, clienteTelefone, servicoId, data, hora, observacao } = await c.req.json()
    const db = createDb(c.env.DATABASE_URL)
    const [salao] = await db.select().from(saloes).where(eq(saloes.slug, slug)).limit(1)
    if (!salao) return c.json({ error: 'Salão não encontrado' }, 404)
    const conflito = await db.select().from(agendamentos)
      .where(
        and(
          eq(agendamentos.salaoId, salao.id),
          eq(agendamentos.data, data),
          eq(agendamentos.hora, hora),
          eq(agendamentos.status, 'confirmado')
        )
      ).limit(1)
    if (conflito.length > 0) return c.json({ error: 'Horário já reservado' }, 409)
    const [created] = await db.insert(agendamentos).values({
      id: crypto.randomUUID(),
      salaoId: salao.id,
      servicoId,
      clienteNome,
      clienteTelefone,
      data,
      hora,
      status: 'pendente',
      observacao,
      criadoEm: new Date()
    }).returning()
    return c.json(created, 201)
  } catch (e: any) {
    return c.json({ error: e.message }, 400)
  }
})

agendamento.get('/disponibilidade/:slug', async (c) => {
  const { slug } = c.req.param()
  const { data } = c.req.query()
  if (!data) return c.json({ error: 'Data é obrigatória' }, 400)
  const db = createDb(c.env.DATABASE_URL)
  const [salao] = await db.select().from(saloes).where(eq(saloes.slug, slug)).limit(1)
  if (!salao) return c.json({ error: 'Salão não encontrado' }, 404)
  const ocupados = await db.select().from(agendamentos)
    .where(
      and(
        eq(agendamentos.salaoId, salao.id),
        eq(agendamentos.data, data),
        eq(agendamentos.status, 'confirmado')
      )
    )
  const horariosOcupados = ocupados.map(a => a.hora)
  return c.json({ data, horariosOcupados })
})

agendamento.get('/', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const db = createDb(c.env.DATABASE_URL)
  const [salao] = await db.select().from(saloes).where(eq(saloes.userId, userId)).limit(1)
  if (!salao) return c.json({ error: 'Salão não encontrado' }, 404)
  const lista = await db.select().from(agendamentos)
    .where(eq(agendamentos.salaoId, salao.id))
    .orderBy(agendamentos.criadoEm)
  return c.json(lista)
})

agendamento.put('/:id/status', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const { id } = c.req.param()
    const { status } = await c.req.json()
    if (!['confirmado', 'recusado'].includes(status)) {
      return c.json({ error: 'Status inválido' }, 400)
    }
    const db = createDb(c.env.DATABASE_URL)
    const [salao] = await db.select().from(saloes).where(eq(saloes.userId, userId)).limit(1)
    if (!salao) return c.json({ error: 'Salão não encontrado' }, 404)
    const [updated] = await db.update(agendamentos)
      .set({ status })
      .where(and(eq(agendamentos.id, id), eq(agendamentos.salaoId, salao.id)))
      .returning()
    if (!updated) return c.json({ error: 'Agendamento não encontrado' }, 404)
    return c.json(updated)
  } catch (e: any) {
    return c.json({ error: e.message }, 400)
  }
})

export default agendamento