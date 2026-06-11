export interface Salao {
    id: string
    slug: string
    nome: string
    telefone: string
    imagemUrl?: string
    whatsapp: string
  }
  
  export interface Servico {
    id: string
    salaoId: string
    nome: string
    duracaoMinutos: number
    preco: number
  }
  
  export interface Agendamento {
    id: string
    salaoId: string
    clienteNome: string
    clienteTelefone: string
    servicoId: string
    data: string
    hora: string
    status: 'pendente' | 'confirmado' | 'recusado'
    observacao?: string
  }
  
  export interface HorarioFuncionamento {
    diaSemana: 0 | 1 | 2 | 3 | 4 | 5 | 6
    abre: string
    fecha: string
    ativo: boolean
  }