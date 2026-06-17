<script lang="ts">
    import { onMount } from 'svelte'
    import { auth, clearAuth } from '$lib/stores/auth'
    import { goto } from '$app/navigation'
  
    const BASE_URL = 'http://localhost:8787'
  
    let token = $state('')
    let carregando = $state(true)
    let salvando = $state(false)
    let salvo = $state(false)
    let erro = $state('')
  
    let nome = $state('')
    let telefone = $state('')
    let whatsapp = $state('')
    let slug = $state('')
    let mensagemRecusa = $state('')
    let corPrimaria = $state('#D4537E')
    let corTexto = $state('#2C2C2A')
  
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
        const res = await fetch(`${BASE_URL}/salao/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const salao = await res.json()
          nome = salao.nome
          telefone = salao.telefone
          whatsapp = salao.whatsapp
          slug = salao.slug
          mensagemRecusa = salao.mensagemRecusa || ''
          corPrimaria = salao.corPrimaria || '#D4537E'
          corTexto = salao.corTexto || '#2C2C2A'
          aplicarCores()
        }
      } finally {
        carregando = false
      }
    }
  
    function aplicarCores() {
      document.documentElement.style.setProperty('--cor-primaria', corPrimaria)
      document.documentElement.style.setProperty('--cor-texto', corTexto)
    }
  
    async function salvar() {
      if (!nome || !telefone || !whatsapp || !slug) {
        erro = 'Preencha todos os campos obrigatórios'
        return
      }
      salvando = true
      erro = ''
      try {
        await fetch(`${BASE_URL}/salao/me`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ nome, telefone, whatsapp, slug, mensagemRecusa, corPrimaria, corTexto })
        })
        aplicarCores()
        salvo = true
        setTimeout(() => salvo = false, 3000)
      } catch (e: any) {
        erro = e.message
      } finally {
        salvando = false
      }
    }
  
    function sair() {
      clearAuth()
      goto('/painel')
    }
  
    $effect(() => {
      if (corPrimaria) {
        document.documentElement.style.setProperty('--cor-primaria', corPrimaria)
      }
    })
  
    $effect(() => {
      if (corTexto) {
        document.documentElement.style.setProperty('--cor-texto', corTexto)
      }
    })
  </script>
  
  <svelte:head><title>Configurações — AgendaSim</title></svelte:head>
  
  <div class="painel">
    <header class="topo">
      <div class="topo-esq">
        <div class="logo-icone">✂</div>
        <span class="titulo">AgendaSim</span>
      </div>
      <nav class="nav">
        <a href="/painel/agenda" class="nav-link">Agenda</a>
        <a href="/painel/servicos" class="nav-link">Serviços</a>
        <a href="/painel/configuracoes" class="nav-link ativo">Configurações</a>
      </nav>
      <button class="btn-sair" onclick={sair}>Sair</button>
    </header>
  
    <div class="conteudo">
      <div class="cabecalho-pagina">
        <h1>Configurações</h1>
        {#if salvo}
          <span class="salvo-badge">✓ Salvo!</span>
        {/if}
      </div>
  
      {#if carregando}
        <div class="vazio">Carregando...</div>
      {:else}
        <div class="card secao">
          <h2>Informações do salão</h2>
  
          <div class="form-group">
            <label for="nome">Nome do salão *</label>
            <input id="nome" type="text" bind:value={nome} placeholder="Ex: Salão da Maria" />
          </div>
  
          <div class="form-row">
            <div class="form-group">
              <label for="tel">Telefone *</label>
              <input id="tel" type="tel" bind:value={telefone} placeholder="11999999999" />
            </div>
            <div class="form-group">
              <label for="wa">WhatsApp *</label>
              <input id="wa" type="tel" bind:value={whatsapp} placeholder="11999999999" />
            </div>
          </div>
  
          <div class="form-group">
            <label for="slug">Link do agendamento *</label>
            <div class="slug-wrapper">
              <span class="slug-prefix">agendasim.com.br/salao/</span>
              <input id="slug" type="text" bind:value={slug} placeholder="nome-do-salao" class="slug-input" />
            </div>
          </div>
        </div>
  
        <div class="card secao">
          <h2>Identidade visual</h2>
          <p class="secao-desc">As cores serão aplicadas na página de agendamento dos seus clientes.</p>
  
          <div class="form-row">
            <div class="form-group">
              <label for="cor1">Cor primária</label>
              <div class="cor-wrapper">
                <input id="cor1" type="color" bind:value={corPrimaria} class="input-cor" />
                <input type="text" bind:value={corPrimaria} class="input-hex" placeholder="#D4537E" />
              </div>
            </div>
            <div class="form-group">
              <label for="cor2">Cor do texto</label>
              <div class="cor-wrapper">
                <input id="cor2" type="color" bind:value={corTexto} class="input-cor" />
                <input type="text" bind:value={corTexto} class="input-hex" placeholder="#2C2C2A" />
              </div>
            </div>
          </div>
  
          <div class="preview-cores">
            <div class="preview-header" style="background:{corPrimaria}">
              <p style="color:#fff; font-weight:500;">{nome || 'Nome do salão'}</p>
              <button style="background:rgba(255,255,255,0.2); color:#fff; border:none; padding:6px 14px; border-radius:20px; font-size:13px;">
                Agendar horário
              </button>
            </div>
          </div>
        </div>
  
        <div class="card secao">
          <h2>Mensagem de recusa</h2>
          <p class="secao-desc">Texto enviado ao cliente quando um agendamento é recusado.</p>
          <div class="form-group">
            <label for="recusa">Mensagem</label>
            <textarea
              id="recusa"
              bind:value={mensagemRecusa}
              rows="3"
              placeholder="Ex: Olá! Infelizmente não conseguimos confirmar seu horário. Entre em contato para remarcarmos."
            ></textarea>
          </div>
        </div>
  
        {#if erro}<p class="erro">{erro}</p>{/if}
  
        <button class="btn-primario" onclick={salvar} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar configurações'}
        </button>
      {/if}
    </div>
  </div>
  
  <style>
    .painel { min-height: 100vh; background: var(--cor-fundo); }
  
    .topo {
      background: #fff;
      border-bottom: 0.5px solid var(--cor-borda);
      padding: 0 1.5rem; height: 56px;
      display: flex; align-items: center; gap: 1.5rem;
      position: sticky; top: 0; z-index: 10;
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
      padding: 6px 14px; border-radius: var(--raio-pill);
      font-size: 14px; color: var(--cor-cinza); transition: all 0.2s;
    }
  
    .nav-link:hover, .nav-link.ativo {
      background: var(--cor-primaria-clara);
      color: var(--cor-primaria); font-weight: 500;
    }
  
    .btn-sair {
      background: none; border: 0.5px solid var(--cor-borda);
      padding: 6px 14px; border-radius: var(--raio-pill);
      font-size: 13px; color: var(--cor-cinza); cursor: pointer;
    }
  
    .conteudo { max-width: 680px; margin: 0 auto; padding: 1.5rem; }
  
    .cabecalho-pagina {
      display: flex; align-items: center;
      justify-content: space-between; margin-bottom: 1.25rem;
    }
  
    .cabecalho-pagina h1 { font-size: 20px; font-weight: 500; }
  
    .salvo-badge {
      background: #E1F5EE; color: #085041;
      padding: 5px 14px; border-radius: 20px; font-size: 13px; font-weight: 500;
    }
  
    .secao { margin-bottom: 1.25rem; }
    .secao h2 { font-size: 16px; font-weight: 500; margin-bottom: 0.25rem; }
    .secao-desc { font-size: 13px; color: var(--cor-cinza); margin-bottom: 1rem; }
  
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  
    .slug-wrapper {
      display: flex; align-items: center;
      border: 1px solid var(--cor-borda); border-radius: var(--raio-md);
      overflow: hidden; background: #fff;
    }
  
    .slug-prefix {
      padding: 10px 12px; font-size: 13px;
      color: var(--cor-cinza); background: var(--cor-fundo);
      border-right: 1px solid var(--cor-borda); white-space: nowrap;
    }
  
    .slug-input {
      border: none !important; border-radius: 0 !important;
      flex: 1; padding: 10px 12px;
    }
  
    .slug-input:focus { outline: none; }
  
    .cor-wrapper { display: flex; align-items: center; gap: 8px; }
  
    .input-cor {
      width: 44px; height: 44px; padding: 2px;
      border: 1px solid var(--cor-borda);
      border-radius: var(--raio-md); cursor: pointer;
    }
  
    .input-hex { flex: 1; }
  
    .preview-cores {
      border-radius: var(--raio-md);
      overflow: hidden;
      border: 0.5px solid var(--cor-borda);
      margin-top: 0.5rem;
    }
  
    .preview-header {
      padding: 1.25rem;
      display: flex; align-items: center;
      justify-content: space-between;
      transition: background 0.3s;
    }
  
    .btn-primario {
      background: var(--cor-primaria); color: #fff;
      border: none; border-radius: var(--raio-pill);
      padding: 12px 28px; font-size: 15px; font-weight: 500;
      cursor: pointer; transition: opacity 0.2s;
    }
  
    .btn-primario:hover { opacity: 0.88; }
    .btn-primario:disabled { opacity: 0.6; cursor: not-allowed; }
  
    .erro { color: #c0392b; font-size: 13px; margin-bottom: 0.75rem; }
    .vazio { text-align: center; padding: 3rem; color: var(--cor-cinza); font-size: 14px; }
  
    textarea { resize: vertical; }
  </style>