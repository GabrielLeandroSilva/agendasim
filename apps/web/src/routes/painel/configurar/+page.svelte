<script lang="ts">
    import { onMount } from 'svelte'
    import { auth } from '$lib/stores/auth'
    import { goto } from '$app/navigation'
  
    const BASE_URL = 'http://localhost:8787'
  
    let token = $state('')
    let salvando = $state(false)
    let erro = $state('')
  
    let nome = $state('')
    let telefone = $state('')
    let whatsapp = $state('')
    let slug = $state('')
  
    onMount(() => {
      const unsubscribe = auth.subscribe(async (a) => {
        if (!a.token) { goto('/painel'); return }
        token = a.token
  
        const res = await fetch(`${BASE_URL}/salao/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          goto('/painel/agenda')
        }
      })
      return unsubscribe
    })
  
    function gerarSlug(valor: string) {
      return valor
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
    }
  
    function onNomeInput() {
      slug = gerarSlug(nome)
    }
  
    async function salvar() {
      if (!nome || !telefone || !whatsapp || !slug) {
        erro = 'Preencha todos os campos'
        return
      }
      salvando = true
      erro = ''
      try {
        const res = await fetch(`${BASE_URL}/salao`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            nome,
            telefone,
            whatsapp,
            slug,
            corPrimaria: '#D4537E',
            corTexto: '#2C2C2A'
          })
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Erro ao criar salão')
        }
        goto('/painel/agenda')
      } catch (e: any) {
        erro = e.message
      } finally {
        salvando = false
      }
    }
  </script>
  
  <svelte:head>
    <title>Configurar salão — AgendaSim</title>
  </svelte:head>
  
  <div class="pagina">
    <div class="box">
      <div class="topo">
        <div class="logo-icone">✂</div>
        <h1>Configure seu salão</h1>
        <p>Estas informações aparecerão na página de agendamento dos seus clientes.</p>
      </div>
  
      <div class="form-group">
        <label for="nome">Nome do salão *</label>
        <input
          id="nome"
          type="text"
          bind:value={nome}
          oninput={onNomeInput}
          placeholder="Ex: Salão da Maria"
        />
      </div>
  
      <div class="form-group">
        <label for="slug">Link de agendamento *</label>
        <div class="slug-wrapper">
          <span class="slug-prefix">agendasim.com.br/salao/</span>
          <input
            id="slug"
            type="text"
            bind:value={slug}
            placeholder="nome-do-salao"
            class="slug-input"
          />
        </div>
        <span class="dica">Gerado automaticamente. Você pode editar depois.</span>
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
  
      {#if erro}
        <p class="erro">{erro}</p>
      {/if}
  
      <button class="btn-primario" onclick={salvar} disabled={salvando}>
        {salvando ? 'Criando...' : 'Criar meu salão →'}
      </button>
    </div>
  </div>
  
  <style>
    .pagina {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      background: var(--cor-fundo);
    }
  
    .box {
      background: #fff;
      border-radius: var(--raio-lg);
      border: 0.5px solid var(--cor-borda);
      padding: 2rem;
      width: 100%;
      max-width: 480px;
    }
  
    .topo {
      text-align: center;
      margin-bottom: 2rem;
    }
  
    .logo-icone {
      width: 52px;
      height: 52px;
      background: var(--cor-primaria);
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      margin: 0 auto 0.75rem;
    }
  
    .topo h1 {
      font-size: 20px;
      font-weight: 500;
      margin-bottom: 6px;
    }
  
    .topo p {
      font-size: 13px;
      color: var(--cor-cinza);
    }
  
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
  
    .slug-wrapper {
      display: flex;
      align-items: center;
      border: 1px solid var(--cor-borda);
      border-radius: var(--raio-md);
      overflow: hidden;
      background: #fff;
    }
  
    .slug-prefix {
      padding: 10px 12px;
      font-size: 12px;
      color: var(--cor-cinza);
      background: var(--cor-fundo);
      border-right: 1px solid var(--cor-borda);
      white-space: nowrap;
    }
  
    .slug-input {
      border: none !important;
      border-radius: 0 !important;
      flex: 1;
      padding: 10px 12px;
    }
  
    .slug-input:focus { outline: none; }
  
    .dica {
      font-size: 12px;
      color: var(--cor-cinza);
      margin-top: 4px;
      display: block;
    }
  
    .btn-primario {
      width: 100%;
      padding: 12px;
      background: var(--cor-primaria);
      color: #fff;
      border: none;
      border-radius: var(--raio-pill);
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.2s;
      margin-top: 0.5rem;
    }
  
    .btn-primario:hover { opacity: 0.88; }
    .btn-primario:disabled { opacity: 0.6; cursor: not-allowed; }
  
    .erro {
      color: #c0392b;
      font-size: 13px;
      margin-bottom: 0.75rem;
    }
  </style>