<script lang="ts">
  import { onMount } from 'svelte'
  import { fetchAgendamentos, atualizarStatus } from '$lib/api'
  import { auth, clearAuth } from '$lib/stores/auth'
  import { goto } from '$app/navigation'

  let agendamentos = $state<any[]>([])
  let carregando = $state(true)
  let token = $state('')
  let filtro = $state<'todos' | 'pendente' | 'confirmado' | 'recusado'>('pendente')

  onMount(() => {
    const unsubscribe = auth.subscribe(async (a) => {
      if (!a.token) {
        goto('/painel')
        return
      }
      token = a.token
      await carregar()
    })
    return unsubscribe
  })

  async function carregar() {
    carregando = true
    try {
      agendamentos = await fetchAgendamentos(token)
    } catch {
      goto('/painel')
    } finally {
      carregando = false
    }
  }

  async function atualizar(id: string, status: 'confirmado' | 'recusado') {
    try {
      await atualizarStatus(token, id, status)
      await carregar()
    } catch (e: any) {
      alert(e.message)
    }
  }

  function sair() {
    clearAuth()
    goto('/painel')
  }

  function filtrados() {
    return agendamentos.filter(a => filtro === 'todos' ? true : a.status === filtro)
  }

  function formatarData(data: string) {
    return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', {
      weekday: 'short', day: '2-digit', month: '2-digit'
    })
  }

  function corStatus(status: string) {
    if (status === 'confirmado') return '#085041'
    if (status === 'recusado') return '#A32D2D'
    return '#854F0B'
  }

  function bgStatus(status: string) {
    if (status === 'confirmado') return '#E1F5EE'
    if (status === 'recusado') return '#FCEBEB'
    return '#FAEEDA'
  }
</script>

<svelte:head>
  <title>Agenda — AgendaSim</title>
</svelte:head>

<div class="painel">
  <header class="topo">
    <div class="topo-esq">
      <div class="logo-icone">✂</div>
      <span class="titulo">AgendaSim</span>
    </div>
    <nav class="nav">
      <a href="/painel/agenda" class="nav-link ativo">Agenda</a>
      <a href="/painel/servicos" class="nav-link">Serviços</a>
      <a href="/painel/configuracoes" class="nav-link">Configurações</a>
    </nav>
    <button class="btn-sair" onclick={sair}>Sair</button>
  </header>

  <div class="conteudo">
    <div class="cabecalho-pagina">
      <h1>Agendamentos</h1>
      <button class="btn-atualizar" onclick={carregar}>↻ Atualizar</button>
    </div>

    <div class="filtros">
      {#each (['pendente', 'confirmado', 'recusado', 'todos'] as const) as f}
        <button
          class="filtro-btn"
          class:ativo={filtro === f}
          onclick={() => filtro = f}
        >
          {f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
          {#if f !== 'todos'}
            <span class="badge">{agendamentos.filter(a => a.status === f).length}</span>
          {/if}
        </button>
      {/each}
    </div>

    {#if carregando}
      <div class="vazio">Carregando...</div>
    {:else if filtrados().length === 0}
      <div class="vazio">
        <p>Nenhum agendamento {filtro === 'todos' ? '' : filtro}</p>
      </div>
    {:else}
      <div class="lista">
        {#each filtrados() as ag}
          <div class="card agendamento-card">
            <div class="card-topo">
              <div class="cliente-info">
                <div class="avatar">{ag.clienteNome.charAt(0).toUpperCase()}</div>
                <div>
                  <p class="cliente-nome">{ag.clienteNome}</p>
                  <a
                    href="https://wa.me/55{ag.clienteTelefone.replace(/\D/g, '')}"
                    target="_blank"
                    class="cliente-tel"
                  >
                    {ag.clienteTelefone}
                  </a>
                </div>
              </div>
              <span
                class="status-badge"
                style="background:{bgStatus(ag.status)}; color:{corStatus(ag.status)}"
              >
                {ag.status}
              </span>
            </div>

            <div class="card-meio">
              <span class="info-item">📅 {formatarData(ag.data)}</span>
              <span class="info-item">🕐 {ag.hora}</span>
            </div>

            {#if ag.observacao}
              <p class="observacao">"{ag.observacao}"</p>
            {/if}

            {#if ag.status === 'pendente'}
              <div class="acoes">
                <button class="btn-confirmar" onclick={() => atualizar(ag.id, 'confirmado')}>
                  ✓ Confirmar
                </button>
                <button class="btn-recusar" onclick={() => atualizar(ag.id, 'recusado')}>
                  ✕ Recusar
                </button>
              </div>
            {/if}

            {#if ag.status === 'recusado'}
              <div class="acoes">
                <a
                  href="https://wa.me/55{ag.clienteTelefone.replace(/\D/g, '')}?text=Olá {ag.clienteNome}, infelizmente não conseguimos confirmar seu horário. Vamos remarcar?"
                  target="_blank"
                  class="btn-whatsapp"
                >
                  💬 Avisar pelo WhatsApp
                </a>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
  
  <style>
    .painel {
      min-height: 100vh;
      background: var(--cor-fundo);
    }
  
    .topo {
      background: #fff;
      border-bottom: 0.5px solid var(--cor-borda);
      padding: 0 1.5rem;
      height: 56px;
      display: flex;
      align-items: center;
      gap: 1.5rem;
      position: sticky;
      top: 0;
      z-index: 10;
    }
  
    .topo-esq {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  
    .logo-icone {
      width: 32px;
      height: 32px;
      background: var(--cor-primaria);
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }
  
    .titulo {
      font-size: 15px;
      font-weight: 500;
    }
  
    .nav {
      display: flex;
      gap: 0.25rem;
      flex: 1;
    }
  
    .nav-link {
      padding: 6px 14px;
      border-radius: var(--raio-pill);
      font-size: 14px;
      color: var(--cor-cinza);
      transition: all 0.2s;
    }
  
    .nav-link:hover, .nav-link.ativo {
      background: var(--cor-primaria-clara);
      color: var(--cor-primaria);
      font-weight: 500;
    }
  
    .btn-sair {
      background: none;
      border: 0.5px solid var(--cor-borda);
      padding: 6px 14px;
      border-radius: var(--raio-pill);
      font-size: 13px;
      color: var(--cor-cinza);
      cursor: pointer;
    }
  
    .conteudo {
      max-width: 680px;
      margin: 0 auto;
      padding: 1.5rem;
    }
  
    .cabecalho-pagina {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
    }
  
    .cabecalho-pagina h1 {
      font-size: 20px;
      font-weight: 500;
    }
  
    .btn-atualizar {
      background: none;
      border: 0.5px solid var(--cor-borda);
      padding: 6px 14px;
      border-radius: var(--raio-pill);
      font-size: 13px;
      color: var(--cor-cinza);
      cursor: pointer;
    }
  
    .filtros {
      display: flex;
      gap: 8px;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }
  
    .filtro-btn {
      padding: 6px 14px;
      border-radius: var(--raio-pill);
      border: 0.5px solid var(--cor-borda);
      background: #fff;
      font-size: 13px;
      color: var(--cor-cinza);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
  
    .filtro-btn.ativo {
      background: var(--cor-primaria);
      color: #fff;
      border-color: var(--cor-primaria);
    }
  
    .badge {
      background: rgba(255,255,255,0.25);
      padding: 1px 7px;
      border-radius: 20px;
      font-size: 11px;
    }
  
    .filtro-btn:not(.ativo) .badge {
      background: var(--cor-primaria-clara);
      color: var(--cor-primaria);
    }
  
    .lista {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
  
    .agendamento-card {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
  
    .card-topo {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  
    .cliente-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  
    .avatar {
      width: 40px;
      height: 40px;
      background: var(--cor-primaria-clara);
      color: var(--cor-primaria);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 500;
      flex-shrink: 0;
    }
  
    .cliente-nome {
      font-size: 15px;
      font-weight: 500;
      margin-bottom: 2px;
    }
  
    .cliente-tel {
      font-size: 13px;
      color: var(--cor-primaria);
    }
  
    .status-badge {
      font-size: 12px;
      font-weight: 500;
      padding: 4px 12px;
      border-radius: 20px;
    }
  
    .card-meio {
      display: flex;
      gap: 16px;
    }
  
    .info-item {
      font-size: 13px;
      color: var(--cor-cinza);
    }
  
    .observacao {
      font-size: 13px;
      color: var(--cor-cinza);
      font-style: italic;
      border-left: 2px solid var(--cor-borda);
      padding-left: 10px;
    }
  
    .acoes {
      display: flex;
      gap: 8px;
      padding-top: 4px;
    }
  
    .btn-confirmar {
      flex: 1;
      padding: 9px;
      background: #E1F5EE;
      color: #085041;
      border: none;
      border-radius: var(--raio-md);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.2s;
    }
  
    .btn-confirmar:hover { opacity: 0.85; }
  
    .btn-recusar {
      flex: 1;
      padding: 9px;
      background: #FCEBEB;
      color: #A32D2D;
      border: none;
      border-radius: var(--raio-md);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.2s;
    }
  
    .btn-recusar:hover { opacity: 0.85; }
  
    .btn-whatsapp {
      display: inline-block;
      padding: 9px 16px;
      background: #E1F5EE;
      color: #085041;
      border-radius: var(--raio-md);
      font-size: 14px;
      font-weight: 500;
    }
  
    .vazio {
      text-align: center;
      padding: 3rem;
      color: var(--cor-cinza);
      font-size: 14px;
    }
  </style>