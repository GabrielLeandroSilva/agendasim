<script lang="ts">
    import { onMount } from 'svelte'
    import { auth, clearAuth } from '$lib/stores/auth'
    import { goto } from '$app/navigation'
  
    const BASE_URL = 'http://localhost:8787'
  
    let servicos = $state<any[]>([])
    let carregando = $state(true)
    let token = $state('')
    let mostrarForm = $state(false)
    let editando = $state<any>(null)
    let erro = $state('')
  
    let nome = $state('')
    let duracaoMinutos = $state(30)
    let preco = $state('')
  
    onMount(() => {
      const unsubscribe = auth.subscribe(async (a) => {
        if (!a.token) { goto('/painel'); return }
        token = a.token
        await carregar()
      })
      return unsubscribe
    })
  
    async function carregar() {
      carregando = true
      try {
        const res = await fetch(`${BASE_URL}/servico`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        servicos = await res.json()
      } finally {
        carregando = false
      }
    }
  
    function abrirNovo() {
      editando = null
      nome = ''
      duracaoMinutos = 30
      preco = ''
      erro = ''
      mostrarForm = true
    }
  
    function abrirEditar(s: any) {
      editando = s
      nome = s.nome
      duracaoMinutos = s.duracaoMinutos
      preco = (s.preco / 100).toFixed(2)
      erro = ''
      mostrarForm = true
    }
  
    async function salvar() {
      if (!nome || !preco) { erro = 'Preencha todos os campos'; return }
      erro = ''
      const body = {
        nome,
        duracaoMinutos: Number(duracaoMinutos),
        preco: Math.round(Number(preco.replace(',', '.')) * 100)
      }
      try {
        if (editando) {
          await fetch(`${BASE_URL}/servico/${editando.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(body)
          })
        } else {
          await fetch(`${BASE_URL}/servico`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(body)
          })
        }
        mostrarForm = false
        await carregar()
      } catch (e: any) {
        erro = e.message
      }
    }
  
    async function remover(id: string) {
      if (!confirm('Remover este serviço?')) return
      await fetch(`${BASE_URL}/servico/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      await carregar()
    }
  
    function formatarPreco(preco: number) {
      return (preco / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }
  
    function sair() {
      clearAuth()
      goto('/painel')
    }
  </script>
  
  <svelte:head><title>Serviços — AgendaSim</title></svelte:head>
  
  <div class="painel">
    <header class="topo">
      <div class="topo-esq">
        <div class="logo-icone">✂</div>
        <span class="titulo">AgendaSim</span>
      </div>
      <nav class="nav">
        <a href="/painel/agenda" class="nav-link">Agenda</a>
        <a href="/painel/servicos" class="nav-link ativo">Serviços</a>
        <a href="/painel/configuracoes" class="nav-link">Configurações</a>
      </nav>
      <button class="btn-sair" onclick={sair}>Sair</button>
    </header>
  
    <div class="conteudo">
      <div class="cabecalho-pagina">
        <h1>Serviços</h1>
        <button class="btn-primario" onclick={abrirNovo}>+ Novo serviço</button>
      </div>
  
      {#if mostrarForm}
        <div class="card form-card">
          <h2>{editando ? 'Editar serviço' : 'Novo serviço'}</h2>
  
          <div class="form-group">
            <label for="nome">Nome do serviço</label>
            <input id="nome" type="text" bind:value={nome} placeholder="Ex: Corte feminino" />
          </div>
  
          <div class="form-row">
            <div class="form-group">
              <label for="duracao">Duração (minutos)</label>
              <select id="duracao" bind:value={duracaoMinutos}>
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1 hora</option>
                <option value={90}>1h30</option>
                <option value={120}>2 horas</option>
              </select>
            </div>
            <div class="form-group">
              <label for="preco">Preço (R$)</label>
              <input id="preco" type="text" bind:value={preco} placeholder="Ex: 50,00" />
            </div>
          </div>
  
          {#if erro}<p class="erro">{erro}</p>{/if}
  
          <div class="form-acoes">
            <button class="btn-primario" onclick={salvar}>
              {editando ? 'Salvar alterações' : 'Adicionar serviço'}
            </button>
            <button class="btn-cancelar" onclick={() => mostrarForm = false}>Cancelar</button>
          </div>
        </div>
      {/if}
  
      {#if carregando}
        <div class="vazio">Carregando...</div>
      {:else if servicos.filter(s => s.ativo).length === 0}
        <div class="vazio">
          <p>Nenhum serviço cadastrado</p>
          <button class="btn-primario" onclick={abrirNovo} style="margin-top: 1rem">
            + Adicionar primeiro serviço
          </button>
        </div>
      {:else}
        <div class="lista">
          {#each servicos.filter(s => s.ativo) as s}
            <div class="card servico-card">
              <div class="servico-info">
                <p class="servico-nome">{s.nome}</p>
                <div class="servico-detalhes">
                  <span class="tag">{s.duracaoMinutos} min</span>
                  <span class="servico-preco">{formatarPreco(s.preco)}</span>
                </div>
              </div>
              <div class="servico-acoes">
                <button class="btn-editar" onclick={() => abrirEditar(s)}>Editar</button>
                <button class="btn-remover" onclick={() => remover(s.id)}>Remover</button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
  
  <style>
    .painel { min-height: 100vh; background: var(--cor-fundo); }
  
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
  
    .topo-esq { display: flex; align-items: center; gap: 8px; }
  
    .logo-icone {
      width: 32px; height: 32px;
      background: var(--cor-primaria); color: #fff;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px;
    }
  
    .titulo { font-size: 15px; font-weight: 500; }
  
    .nav { display: flex; gap: 0.25rem; flex: 1; }
  
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
  
    .conteudo { max-width: 680px; margin: 0 auto; padding: 1.5rem; }
  
    .cabecalho-pagina {
      display: flex; align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
    }
  
    .cabecalho-pagina h1 { font-size: 20px; font-weight: 500; }
  
    .btn-primario {
      background: var(--cor-primaria); color: #fff;
      border: none; border-radius: var(--raio-pill);
      padding: 9px 20px; font-size: 14px; font-weight: 500;
      cursor: pointer; transition: opacity 0.2s;
    }
  
    .btn-primario:hover { opacity: 0.88; }
  
    .form-card { margin-bottom: 1.25rem; }
    .form-card h2 { font-size: 16px; font-weight: 500; margin-bottom: 1rem; }
  
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  
    .form-acoes { display: flex; gap: 10px; margin-top: 0.5rem; }
  
    .btn-cancelar {
      background: none; border: 0.5px solid var(--cor-borda);
      padding: 9px 20px; border-radius: var(--raio-pill);
      font-size: 14px; color: var(--cor-cinza); cursor: pointer;
    }
  
    .lista { display: flex; flex-direction: column; gap: 10px; }
  
    .servico-card {
      display: flex; align-items: center;
      justify-content: space-between;
    }
  
    .servico-nome { font-size: 15px; font-weight: 500; margin-bottom: 6px; }
  
    .servico-detalhes { display: flex; align-items: center; gap: 10px; }
  
    .servico-preco { font-size: 15px; font-weight: 500; color: var(--cor-primaria); }
  
    .servico-acoes { display: flex; gap: 8px; }
  
    .btn-editar {
      padding: 6px 14px; border-radius: var(--raio-pill);
      border: 0.5px solid var(--cor-borda);
      background: none; font-size: 13px;
      color: var(--cor-cinza); cursor: pointer;
    }
  
    .btn-remover {
      padding: 6px 14px; border-radius: var(--raio-pill);
      border: 0.5px solid #F7C1C1;
      background: #FCEBEB; font-size: 13px;
      color: #A32D2D; cursor: pointer;
    }
  
    .erro { color: #c0392b; font-size: 13px; margin-bottom: 0.75rem; }
  
    .vazio { text-align: center; padding: 3rem; color: var(--cor-cinza); font-size: 14px; }
  </style>