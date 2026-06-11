import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.json({ ok: true, service: 'AgendaSim API' }))

export default app