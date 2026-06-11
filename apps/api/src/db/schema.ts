import { pgTable, text, integer, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core'

export const statusAgendamentoEnum = pgEnum('status_agendamento', [
  'pendente',
  'confirmado',
  'recusado'
])

export const saloes = pgTable('saloes', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  nome: text('nome').notNull(),
  telefone: text('telefone').notNull(),
  whatsapp: text('whatsapp').notNull(),
  imagemUrl: text('imagem_url'),
  mensagemRecusa: text('mensagem_recusa'),
  criadoEm: timestamp('criado_em').defaultNow().notNull()
})

export const responsaveis = pgTable('responsaveis', {
  id: text('id').primaryKey(),
  salaoId: text('salao_id').notNull().references(() => saloes.id),
  nome: text('nome').notNull(),
  email: text('email').notNull().unique(),
  senhaHash: text('senha_hash').notNull(),
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