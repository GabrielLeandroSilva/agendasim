<script lang="ts">
    import { signIn } from '$lib/api'
    import { setAuth } from '$lib/stores/auth'
    import { goto } from '$app/navigation'
  
    let email = $state('')
    let senha = $state('')
    let erro = $state('')
    let carregando = $state(false)
  
    async function entrar() {
      if (!email || !senha) {
        erro = 'Preencha email e senha'
        return
      }
      carregando = true
      erro = ''
      try {
        const res = await signIn(email, senha)
        setAuth(res.token, res.user)
        goto('/painel/agenda')
      } catch (e: any) {
        erro = e.message
      } finally {
        carregando = false
      }
    }
  </script>
  
  <svelte:head>
    <title>Entrar — AgendaSim</title>
  </svelte:head>
  
  <div class="pagina">
    <div class="box">
      <div class="logo-area">
        <div class="logo-icone">✂</div>
        <h1>AgendaSim</h1>
        <p>Painel do responsável</p>
      </div>
  
      <div class="form-group">
        <label for="email">Email</label>
        <input id="email" type="email" bind:value={email} placeholder="seu@email.com" />
      </div>
  
      <div class="form-group">
        <label for="senha">Senha</label>
        <input id="senha" type="password" bind:value={senha} placeholder="••••••••"
          onkeydown={(e) => e.key === 'Enter' && entrar()} />
      </div>
  
      {#if erro}
        <p class="erro">{erro}</p>
      {/if}
  
      <button class="btn-primario" onclick={entrar} disabled={carregando}>
        {carregando ? 'Entrando...' : 'Entrar'}
      </button>
  
      <p class="cadastro-link">
        Ainda não tem conta?
        <a href="/painel/cadastro">Criar conta</a>
      </p>
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
      max-width: 380px;
    }
  
    .logo-area {
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
  
    .logo-area h1 {
      font-size: 20px;
      font-weight: 500;
      margin-bottom: 4px;
    }
  
    .logo-area p {
      font-size: 13px;
      color: var(--cor-cinza);
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
  
    .btn-primario:hover {
      opacity: 0.88;
    }
  
    .btn-primario:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  
    .erro {
      color: #c0392b;
      font-size: 13px;
      margin-bottom: 0.75rem;
    }
  
    .cadastro-link {
      text-align: center;
      font-size: 13px;
      color: var(--cor-cinza);
      margin-top: 1.25rem;
    }
  
    .cadastro-link a {
      color: var(--cor-primaria);
      font-weight: 500;
    }
  </style>