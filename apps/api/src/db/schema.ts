import { pgTable, text, integer, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core'

export const statusAgendamentoEnum = pgEnum('status_agendamento', [
  'pendente',
  'confirmado',
  'recusado'
])

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id)
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at')
})

export const saloes = pgTable('saloes', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  nome: text('nome').notNull(),
  telefone: text('telefone').notNull(),
  whatsapp: text('whatsapp').notNull(),
  imagemUrl: text('imagem_url'),
  mensagemRecusa: text('mensagem_recusa'),
  userId: text('user_id').notNull().references(() => user.id),
  criadoEm: timestamp('criado_em').defaultNow().notNull()
})

export const servicos = pgTable('servicos', {
  id: text('id').primaryKey(),
  salaoId: text('salao_id').notNull().references(() => saloes.id),
  nome: text('nome').notNull(),
  duracaoMinutos: integer('duracao_minutos').notNull(),
  preco: integer('preco').notNull(),
  ativo: boolean('ativo').default(true).notNull()
})

export const horariosFuncionamento = pgTable('horarios_funcionamento', {
  id: text('id').primaryKey(),
  salaoId: text('salao_id').notNull().references(() => saloes.id),
  diaSemana: integer('dia_semana').notNull(),
  abre: text('abre').notNull(),
  fecha: text('fecha').notNull(),
  ativo: boolean('ativo').default(true).notNull()
})

export const agendamentos = pgTable('agendamentos', {
  id: text('id').primaryKey(),
  salaoId: text('salao_id').notNull().references(() => saloes.id),
  servicoId: text('servico_id').notNull().references(() => servicos.id),
  clienteNome: text('cliente_nome').notNull(),
  clienteTelefone: text('cliente_telefone').notNull(),
  data: text('data').notNull(),
  hora: text('hora').notNull(),
  status: statusAgendamentoEnum('status').default('pendente').notNull(),
  observacao: text('observacao'),
  criadoEm: timestamp('criado_em').defaultNow().notNull()
})