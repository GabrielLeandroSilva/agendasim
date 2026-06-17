<script lang="ts">
  import { onMount } from 'svelte'
  import { criarAgendamento, fetchDisponibilidade } from '$lib/api'

  let { data } = $props()

  const { salao, servicos } = data

  let etapa = $state<'servico' | 'data' | 'dados' | 'confirmado'>('servico')
  let servicoSelecionado = $state<any>(null)
  let dataSelecionada = $state('')
  let horarioSelecionado = $state('')
  let horariosOcupados = $state<string[]>([])
  let carregandoHorarios = $state(false)

  let clienteNome = $state('')
  let clienteTelefone = $state('')
  let observacao = $state('')
  let enviando = $state(false)
  let erro = $state('')

  const horariosPossiveis = [
    '08:00','08:30','09:00','09:30','10:00','10:30',
    '11:00','11:30','12:00','12:30','13:00','13:30',
    '14:00','14:30','15:00','15:30','16:00','16:30',
    '17:00','17:30','18:00'
  ]

  onMount(() => {
    document.documentElement.style.setProperty('--cor-primaria', salao.corPrimaria || '#D4537E')
    document.documentElement.style.setProperty('--cor-texto', salao.corTexto || '#2C2C2A')
  })

  async function selecionarData(data: string) {
    dataSelecionada = data
    horarioSelecionado = ''
    carregandoHorarios = true
    try {
      const res = await fetchDisponibilidade(salao.slug, data)
      horariosOcupados = res.horariosOcupados
    } catch {
      horariosOcupados = []
    } finally {
      carregandoHorarios = false
    }
  }

  function proximosSeteDias() {
    const dias = []
    for (let i = 1; i <= 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      dias.push(d)
    }
    return dias
  }

  function formatarData(d: Date) {
    return d.toISOString().split('T')[0]
  }

  function formatarDataExibicao(d: Date) {
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
  }

  function formatarPreco(preco: number) {
    return (preco / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  async function agendar() {
    if (!clienteNome || !clienteTelefone) {
      erro = 'Preencha seu nome e telefone'
      return
    }
    enviando = true
    erro = ''
    try {
      await criarAgendamento(salao.slug, {
        clienteNome,
        clienteTelefone,
        servicoId: servicoSelecionado.id,
        data: dataSelecionada,
        hora: horarioSelecionado,
        observacao
      })
      etapa = 'confirmado'
    } catch (e: any) {
      erro = e.message
    } finally {
      enviando = false
    }
  }
</script>

<svelte:head>
  <title>{salao.nome} — AgendaSim</title>
</svelte:head>

<div class="pagina">
  <header class="cabecalho">
    {#if salao.imagemUrl}
      <img src={salao.imagemUrl} alt={salao.nome} class="logo" />
    {/if}
    <h1>{salao.nome}</h1>
    <a
      href="https://wa.me/55{salao.whatsapp.replace(/\D/g, '')}"
      target="_blank"
      class="whatsapp-link"
    >
      💬 Falar pelo WhatsApp
    </a>
  </header>

  <div class="conteudo">
    {#if etapa === 'confirmado'}
      <div class="card confirmado">
        <div class="icone-confirmado">✓</div>
        <h2>Agendamento solicitado!</h2>
        <p>Assim que o salão confirmar, você receberá uma resposta.</p>
        <p class="detalhe">
          {servicoSelecionado.nome} · {new Date(dataSelecionada + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })} às {horarioSelecionado}
        </p>
        <button class="btn-primario" onclick={() => etapa = 'servico'}>
          Fazer outro agendamento
        </button>
      </div>

    {:else if etapa === 'servico'}
      <h2 class="secao-titulo">Qual serviço você quer?</h2>
      <div class="lista-servicos">
        {#each servicos.filter((s: any) => s.ativo) as s}
          <button
            class="card servico-card"
            onclick={() => { servicoSelecionado = s; etapa = 'data' }}
          >
            <span class="servico-nome">{s.nome}</span>
            <div class="servico-info">
              <span class="tag">{s.duracaoMinutos} min</span>
              <span class="servico-preco">{formatarPreco(s.preco)}</span>
            </div>
          </button>
        {/each}
      </div>

    {:else if etapa === 'data'}
      <button class="voltar" onclick={() => etapa = 'servico'}>← Voltar</button>
      <h2 class="secao-titulo">Escolha o dia</h2>
      <div class="lista-dias">
        {#each proximosSeteDias() as dia}
          <button
            class="dia-btn"
            class:selecionado={dataSelecionada === formatarData(dia)}
            onclick={() => selecionarData(formatarData(dia))}
          >
            {formatarDataExibicao(dia)}
          </button>
        {/each}
      </div>

      {#if dataSelecionada}
        <h2 class="secao-titulo" style="margin-top: 1.5rem">Escolha o horário</h2>
        {#if carregandoHorarios}
          <p class="muted">Carregando horários...</p>
        {:else}
          <div class="lista-horarios">
            {#each horariosPossiveis as h}
              <button
                class="horario-btn"
                class:ocupado={horariosOcupados.includes(h)}
                class:selecionado={horarioSelecionado === h}
                disabled={horariosOcupados.includes(h)}
                onclick={() => horarioSelecionado = h}
              >
                {h}
              </button>
            {/each}
          </div>

          {#if horarioSelecionado}
            <div style="margin-top: 1.5rem">
              <button class="btn-primario" onclick={() => etapa = 'dados'}>
                Continuar →
              </button>
            </div>
          {/if}
        {/if}
      {/if}

    {:else if etapa === 'dados'}
      <button class="voltar" onclick={() => etapa = 'data'}>← Voltar</button>
      <h2 class="secao-titulo">Seus dados</h2>

      <div class="resumo-card card">
        <span class="tag">{servicoSelecionado.nome}</span>
        <span class="muted"> · {new Date(dataSelecionada + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })} às {horarioSelecionado}</span>
      </div>

      <div class="form-group" style="margin-top: 1.25rem">
        <label for="nome">Seu nome</label>
        <input id="nome" type="text" bind:value={clienteNome} placeholder="Ex: João Silva" />
      </div>

      <div class="form-group">
        <label for="tel">WhatsApp</label>
        <input id="tel" type="tel" bind:value={clienteTelefone} placeholder="Ex: 11999999999" />
      </div>

      <div class="form-group">
        <label for="obs">Observação (opcional)</label>
        <textarea id="obs" bind:value={observacao} rows="2" placeholder="Algum detalhe para o profissional..."></textarea>
      </div>

      {#if erro}
        <p class="erro">{erro}</p>
      {/if}

      <button class="btn-primario" onclick={agendar} disabled={enviando}>
        {enviando ? 'Enviando...' : 'Confirmar agendamento'}
      </button>
    {/if}
  </div>
</div>

<style>
  .pagina {
    max-width: 480px;
    margin: 0 auto;
    min-height: 100vh;
  }

  .cabecalho {
    background: var(--cor-primaria);
    color: #fff;
    padding: 2rem 1.5rem 1.5rem;
    text-align: center;
  }

  .logo {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid rgba(255,255,255,0.4);
    margin-bottom: 0.75rem;
  }

  .cabecalho h1 {
    font-size: 22px;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .whatsapp-link {
    font-size: 13px;
    opacity: 0.85;
    background: rgba(255,255,255,0.15);
    padding: 5px 14px;
    border-radius: 20px;
    display: inline-block;
  }

  .conteudo {
    padding: 1.5rem;
  }

  .secao-titulo {
    font-size: 17px;
    font-weight: 500;
    margin-bottom: 1rem;
    color: var(--cor-texto);
  }

  .lista-servicos {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .servico-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.2s;
    background: #fff;
    border-radius: var(--raio-lg);
    border: 0.5px solid var(--cor-borda);
    padding: 1.25rem;
  }

  .servico-card:hover {
    border-color: var(--cor-primaria);
  }

  .servico-nome {
    font-size: 15px;
    font-weight: 500;
    color: var(--cor-texto);
  }

  .servico-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .servico-preco {
    font-size: 15px;
    font-weight: 500;
    color: var(--cor-primaria);
  }

  .lista-dias {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .dia-btn {
    padding: 8px 14px;
    border-radius: var(--raio-pill);
    border: 1px solid var(--cor-borda);
    background: #fff;
    font-size: 13px;
    color: var(--cor-texto);
    transition: all 0.2s;
  }

  .dia-btn:hover, .dia-btn.selecionado {
    background: var(--cor-primaria);
    color: #fff;
    border-color: var(--cor-primaria);
  }

  .lista-horarios {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .horario-btn {
    padding: 10px;
    border-radius: var(--raio-md);
    border: 1px solid var(--cor-borda);
    background: #fff;
    font-size: 14px;
    color: var(--cor-texto);
    transition: all 0.2s;
  }

  .horario-btn:hover:not(:disabled), .horario-btn.selecionado {
    background: var(--cor-primaria);
    color: #fff;
    border-color: var(--cor-primaria);
  }

  .horario-btn.ocupado {
    opacity: 0.35;
    cursor: not-allowed;
    text-decoration: line-through;
  }

  .resumo-card {
    font-size: 14px;
    padding: 0.75rem 1rem;
  }

  .confirmado {
    text-align: center;
    padding: 2.5rem 1.5rem;
  }

  .icone-confirmado {
    width: 56px;
    height: 56px;
    background: var(--cor-primaria);
    color: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    margin: 0 auto 1rem;
  }

  .confirmado h2 {
    font-size: 20px;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .confirmado p {
    color: var(--cor-cinza);
    margin-bottom: 0.5rem;
    font-size: 14px;
  }

  .detalhe {
    font-weight: 500;
    color: var(--cor-primaria) !important;
    margin-bottom: 1.5rem !important;
  }

  .voltar {
    background: none;
    border: none;
    color: var(--cor-cinza);
    font-size: 14px;
    margin-bottom: 1rem;
    padding: 0;
    cursor: pointer;
  }

  .muted {
    color: var(--cor-cinza);
    font-size: 14px;
  }

  .erro {
    color: #c0392b;
    font-size: 13px;
    margin-bottom: 0.75rem;
  }

  textarea {
    resize: vertical;
  }
</style>