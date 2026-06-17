const BASE_URL = 'http://localhost:8787'

export async function fetchSalao(slug: string) {
  const res = await fetch(`${BASE_URL}/salao/${slug}`)
  if (!res.ok) throw new Error('Salão não encontrado')
  return res.json()
}

export async function criarAgendamento(slug: string, dados: {
  clienteNome: string
  clienteTelefone: string
  servicoId: string
  data: string
  hora: string
  observacao?: string
}) {
  const res = await fetch(`${BASE_URL}/agendamento/${slug}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Erro ao agendar')
  }
  return res.json()
}

export async function fetchDisponibilidade(slug: string, data: string) {
  const res = await fetch(`${BASE_URL}/agendamento/disponibilidade/${slug}?data=${data}`)
  if (!res.ok) throw new Error('Erro ao buscar disponibilidade')
  return res.json()
}

export async function signIn(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/sign-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Erro ao entrar')
  }
  return res.json()
}

export async function signUp(name: string, email: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/sign-up`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Erro ao cadastrar')
  }
  return res.json()
}

export async function fetchAgendamentos(token: string) {
  const res = await fetch(`${BASE_URL}/agendamento`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Erro ao buscar agendamentos')
  return res.json()
}

export async function atualizarStatus(token: string, id: string, status: 'confirmado' | 'recusado') {
  const res = await fetch(`${BASE_URL}/agendamento/${id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  })
  if (!res.ok) throw new Error('Erro ao atualizar status')
  return res.json()
}