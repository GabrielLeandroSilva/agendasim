import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { signUp, signIn, verifyToken } from './auth'
import salaoRoutes from './routes/salao'
import servicoRoutes from './routes/servico'
import agendamentoRoutes from './routes/agendamento'

type Bindings = {
  DATABASE_URL: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors({
  origin: ['http://localhost:5173'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

app.get('/', (c) => c.json({ ok: true, service: 'AgendaSim API' }))

app.post('/auth/sign-up', async (c) => {
  try {
    const { name, email, password } = await c.req.json()
    const result = await signUp(c.env.DATABASE_URL, name, email, password)
    return c.json(result, 201)
  } catch (e: any) {
    return c.json({ error: e.message }, 400)
  }
})

app.post('/auth/sign-in', async (c) => {
  try {
    const { email, password } = await c.req.json()
    const result = await signIn(c.env.DATABASE_URL, email, password)
    return c.json(result)
  } catch (e: any) {
    return c.json({ error: e.message }, 401)
  }
})

app.get('/auth/me', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) return c.json({ error: 'Token não enviado' }, 401)
  const token = authHeader.replace('Bearer ', '')
  const payload = await verifyToken(token)
  if (!payload) return c.json({ error: 'Token inválido' }, 401)
  return c.json({ userId: payload.userId })
})

app.route('/salao', salaoRoutes)
app.route('/servico', servicoRoutes)
app.route('/agendamento', agendamentoRoutes)

export default app