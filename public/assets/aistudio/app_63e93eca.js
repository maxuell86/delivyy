function setDisplay(seletor, valor){
    const el = document.querySelector(seletor)
    if(el) el.style.display = valor
}

// ===============================
// CARRINHO
// ===============================
let carrinho = []
try{ carrinho = JSON.parse(localStorage.getItem("carrinhoAtual")) || [] }catch(e){ carrinho = [] }
let numeroPedido = Number(localStorage.getItem("numeroPedido")) || 0
// Destino do pedido e demais dados da loja vivem em config.js (window.CONFIG)
// e podem ser editados pelo lojista no painel customizar.html.

// ===============================
// BANCO DE CLIENTES LOCAL
// ===============================

function getClientes(){
    return JSON.parse(localStorage.getItem("bancoclientes") || "[]")
}

function salvarClienteNoBanco(dados){
    const lista = getClientes()
    const idx   = lista.findIndex(c => c.whatsapp && c.whatsapp === dados.whatsapp)
    if(idx >= 0){
        lista[idx] = { ...lista[idx], ...dados, atualizado: new Date().toISOString() }
    } else {
        lista.push({ ...dados, id: Date.now(), cadastrado: new Date().toISOString() })
    }
    localStorage.setItem("bancoclientes", JSON.stringify(lista))
    salvarClienteNoSupabase(dados)
}

// Grava de verdade no Supabase (nao so no navegador do proprio cliente) -
// e o que permite a loja ver o cadastro mesmo se a pessoa nunca chegar a
// fazer um pedido, usar como lista de leads em campanha paga, e mostrar
// aniversariantes da semana no sistema de gestao. Via RPC (nao insert/update
// direto) porque a tabela clientes so aceita escrita autenticada por RLS -
// a funcao valida e faz o upsert por telefone do lado do servidor.
async function salvarClienteNoSupabase(dados){
    if(!dados.whatsapp) return
    try{
        const { error } = await sistemaSupabase.rpc("cadastrar_lead_delivery", {
            p_nome: dados.nome,
            p_telefone: dados.whatsapp,
            p_aniversario: dados.aniversario || null,
        })
        if(error) console.warn("Nao foi possivel salvar o cadastro no Supabase:", error)
    }catch(e){
        console.warn("Nao foi possivel salvar o cadastro no Supabase:", e)
    }
}

function verificarAniversariantesProximos(){
    const lista = getClientes()
    const hoje  = new Date()
    const aviso = []
    lista.forEach(c => {
        if(!c.aniversario) return
        const parts = c.aniversario.split("-")
        if(parts.length < 2) return
        // aniversario pode ser YYYY-MM-DD ou MM-DD
        const mes = parts.length === 3 ? Number(parts[1]) : Number(parts[0])
        const dia = parts.length === 3 ? Number(parts[2]) : Number(parts[1])
        const anivEsteAno = new Date(hoje.getFullYear(), mes-1, dia)
        const diff = Math.ceil((anivEsteAno - hoje) / (1000*60*60*24))
        if(diff >= 0 && diff <= 2){
            aviso.push({ ...c, diasRestantes: diff })
        }
    })
    return aviso
}

// ===============================
// CADASTRO DO CLIENTE
// ===============================

let cliente = JSON.parse(localStorage.getItem("clienteCadastro")) || null

function salvarCliente(dados){
    localStorage.setItem("clienteCadastro", JSON.stringify(dados))
    cliente = dados
    salvarClienteNoBanco(dados)
}

function mostrarCadastroCheckout(callback, contexto){
    if(cliente){
        callback()
        return
    }
    const ehBoasVindas = contexto === "boasVindas"
    document.getElementById("modalCadastroCheckout")?.remove()
    document.body.insertAdjacentHTML("beforeend", `
    <div id="modalCadastroCheckout" class="modal-cadastro">
      <div class="cadastro-box">
        <div class="cadastro-header">
          <div class="cadastro-logo">${CONFIG.marca.nome}</div>
          ${ehBoasVindas
            ? `<h2>App instalado!<br><span>Só mais alguns dados</span></h2><p>Pra já deixar seus benefícios prontos</p>`
            : `<h2>Quase la!<br><span>So mais alguns dados</span></h2><p>Rapido, so uma vez - promessa!</p>`}
        </div>
        <div class="cadastro-beneficios">
          <div class="beneficio-item">Desconto no aniversario</div>
          <div class="beneficio-item">Programa de fidelidade</div>
          <div class="beneficio-item">Cupons exclusivos</div>
          <div class="beneficio-item">Frete gratis progressivo</div>
        </div>
        <div class="cadastro-form">
          <label>Seu nome completo *</label>
          <input class="cadastro-input" id="cadNome" placeholder="Ex: Joao Silva" type="text">
          <label>Seu WhatsApp *</label>
          <input class="cadastro-input" id="cadWhats" placeholder="Ex: 31987654321" type="tel" maxlength="11">
          <label>Data de nascimento (opcional)</label>
          <input class="cadastro-input" id="cadAniv" type="date">
          <div id="cadastroErro" class="cadastro-erro"></div>
          <button class="btn-cadastrar" onclick="concluirCadastroCheckout()">
            ${ehBoasVindas ? "Concluir cadastro" : "Continuar e enviar pedido!"}
          </button>
          <button class="btn-pular" onclick="pularCadastroCheckout()">${ehBoasVindas ? "Agora não" : "Pular e enviar sem cadastro"}</button>
        </div>
      </div>
    </div>`)
    window._checkoutCallback = callback
}

function concluirCadastroCheckout(){
    const nome  = document.getElementById("cadNome")?.value?.trim()
    const whats = document.getElementById("cadWhats")?.value?.trim()
    const aniv  = document.getElementById("cadAniv")?.value

    if(!nome){
        document.getElementById("cadastroErro").innerText = "Digite seu nome para continuar!"
        document.getElementById("cadNome").focus()
        return
    }
    if(!whats){
        document.getElementById("cadastroErro").innerText = "Digite seu WhatsApp para continuar!"
        document.getElementById("cadWhats").focus()
        return
    }

    const dados = { nome, whatsapp: whats, aniversario: aniv || "", dataCadastro: new Date().toISOString() }
    salvarCliente(dados)

    if(aniv){
        const [ano, mes, dia] = aniv.split("-")
        fidelidade.aniversario = `${mes}-${dia}`
        salvarFidelidade()
    }

    document.getElementById("modalCadastroCheckout")?.remove()
    mostrarToastSimples(`Bem-vindo(a) ${nome.split(" ")[0]}! Enviando pedido...`)

    const campoNome = document.getElementById("nomeCliente")
    if(campoNome && !campoNome.value.trim()) campoNome.value = nome

    setTimeout(()=>{
        if(window._checkoutCallback) window._checkoutCallback()
    }, 800)
}

function pularCadastroCheckout(){
    document.getElementById("modalCadastroCheckout")?.remove()
    if(window._checkoutCallback) window._checkoutCallback()
}

function mostrarBoasVindas(){
    if(!cliente) return
    const hora = new Date().getHours()
    let saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite"
    const primeiroNome = cliente.nome.split(" ")[0]
    const el = document.getElementById("boasVindas")
    if(el){
        el.innerHTML = `${saudacao}, <b>${primeiroNome}</b>! Toque para ver seu perfil`
        el.style.display = "block"
    }
    if(verificarAniversario()){
        const cupomAniv = (CONFIG.cupons || []).find(c=>c.tipo === "aniversario")
        setTimeout(()=> mostrarToastSimples(cupomAniv
            ? `Feliz Aniversario! Use ${cupomAniv.codigo} para ${cupomAniv.desconto}% off!`
            : "Feliz Aniversario!"), 1500)
    }
}

function abrirPerfilCliente(){
    document.getElementById("modalPerfil")?.remove()
    const nivel = calcularNivel()
    const info  = getNivelInfo(nivel)
    const prox  = proximoNivelDe(nivel)
    const meta  = prox ? Number(prox.minimo) : null
    const pct   = meta ? Math.min(100,(fidelidade.totalGasto/meta)*100).toFixed(0) : 100
    const faltaTexto = meta ? `R$${(Math.max(0,meta-fidelidade.totalGasto)).toFixed(2).replace(".",",")} para ${prox.nome}` : "Nivel maximo!"
    const nomeExibir  = cliente?.nome || "Cliente"
    const whatsExibir = cliente?.whatsapp || "Nao informado"
    const anivExibir  = cliente?.aniversario ? new Date(cliente.aniversario + "T00:00:00").toLocaleDateString("pt-BR") : "Nao informado"

    document.body.insertAdjacentHTML("beforeend", `
    <div id="modalPerfil" class="modal-fid">
      <div class="fid-box">
        <div class="fid-header" style="background:linear-gradient(135deg,${info.cor}44,#1a1a1a)">
          <span style="font-size:36px;font-weight:900;color:${info.cor}">${info.nome}</span>
          <div><h2 style="color:${info.cor}">${nomeExibir}</h2><p>${info.desc}</p></div>
          <button class="fid-fechar" onclick="document.getElementById('modalPerfil').remove()">X</button>
        </div>
        <div class="fid-stats">
          <div class="fid-stat"><span class="fid-stat-num">R$${(fidelidade.totalGasto).toFixed(2).replace(".",",")}</span><span class="fid-stat-label">Total gasto</span></div>
          <div class="fid-stat"><span class="fid-stat-num">${fidelidade.totalPedidos}</span><span class="fid-stat-label">Pedidos</span></div>
          <div class="fid-stat"><span class="fid-stat-num">${fidelidade.pizzasContadas}</span><span class="fid-stat-label">Pizzas</span></div>
        </div>
        <div class="fid-progresso-box">
          <p>Faltam <b>${faltaTexto}</b></p>
          <div class="fid-barra-bg"><div class="fid-barra-fill" style="width:${pct}%;background:${info.cor}"></div></div>
          <small>${pct}% concluido</small>
        </div>
        <div class="perfil-dados">
          <h3>Meus Dados</h3>
          <div class="perfil-linha"><span>Nome</span><b>${nomeExibir}</b></div>
          <div class="perfil-linha"><span>WhatsApp</span><b>${whatsExibir}</b></div>
          <div class="perfil-linha"><span>Aniversario</span><b>${anivExibir}</b></div>
          <div class="perfil-linha"><span>Nivel</span><b>${info.nome}</b></div>
        </div>
        <div style="padding:16px 20px">
          <button onclick="editarCadastro()" style="width:100%;background:var(--laranja);border:none;color:#fff;padding:14px;border-radius:12px;font-weight:800;font-size:16px;margin-bottom:10px">Editar meus dados</button>
          <button onclick="mostrarPainelFidelidade()" style="width:100%;background:var(--bg-item);border:none;color:#fff;padding:14px;border-radius:12px;font-weight:800;font-size:16px">Ver programa de fidelidade</button>
        </div>
        <button onclick="document.getElementById('modalPerfil').remove()" class="fid-btn-fechar">Fechar</button>
      </div>
    </div>`)
}

function editarCadastro(){
    document.getElementById("modalPerfil")?.remove()
    document.getElementById("modalCadastroCheckout")?.remove()
    mostrarCadastroCheckout(()=>{ mostrarToastSimples("Dados atualizados!") })
    setTimeout(()=>{
        if(cliente){
            const nome  = document.getElementById("cadNome")
            const whats = document.getElementById("cadWhats")
            const aniv  = document.getElementById("cadAniv")
            if(nome)  nome.value  = cliente.nome || ""
            if(whats) whats.value = cliente.whatsapp || ""
            if(aniv)  aniv.value  = cliente.aniversario || ""
        }
    }, 150)
}

// ===============================
// FIDELIDADE
// ===============================

let fidelidade = JSON.parse(localStorage.getItem("fidelidade")) || {
    totalGasto: 0, totalPedidos: 0, pedidosComComida: 0,
    pizzasContadas: 0, aniversario: "", nivel: "bronze"
}

function salvarFidelidade(){
    localStorage.setItem("fidelidade", JSON.stringify(fidelidade))
}

// Niveis, metas e percentuais de desconto vem de config.js (fidelidade.niveis)

function nivelAtualDaGasto(gasto){
    const niveis = (CONFIG.fidelidade && CONFIG.fidelidade.niveis) || []
    let atual = niveis[0] || { id:"bronze", nome:"Bronze", cor:"#cd7f32", minimo:0, descontoPct:0, desc:"" }
    niveis.forEach(n=>{ if(gasto >= Number(n.minimo||0)) atual = n })
    return atual
}

// Nivel que da desconto automatico no carrinho (ex: Diamante = 15% off)
function nivelComDescontoPorGasto(gasto){
    const niveis = (CONFIG.fidelidade && CONFIG.fidelidade.niveis) || []
    let achado = null
    niveis.forEach(n=>{
        if(Number(n.descontoPct||0) > 0 && gasto >= Number(n.minimo||0)) achado = n
    })
    return achado
}

function proximoNivelDe(nivelId){
    const niveis = (CONFIG.fidelidade && CONFIG.fidelidade.niveis) || []
    const i = niveis.findIndex(n=>n.id === nivelId)
    return (i >= 0 && i < niveis.length-1) ? niveis[i+1] : null
}

function calcularNivelDe(gasto){
    return nivelAtualDaGasto(gasto).id
}

// Estimativa local (leitura rapida, sem ida ao servidor) - usada so pra preview
// enquanto o carrinho e montado. O valor que realmente conta o desconto/frete
// e conferido no Supabase em calcularDescontosServidor() na hora de finalizar.
function calcularNivel(){
    return calcularNivelDe(fidelidade.totalGasto)
}

function getNivelInfo(nivel){
    const niveis = (CONFIG.fidelidade && CONFIG.fidelidade.niveis) || []
    return niveis.find(n=>n.id === nivel) || niveis[0] || { id:"bronze", nome:"Bronze", cor:"#cd7f32", desc:"" }
}

// ===============================
// HORARIO
// ===============================

// Horarios de funcionamento vem de config.js (horarios.grade):
// chave = dia da semana (0=domingo...6=sabado); null = fechado;
// {abre, fecha} em horas decimais (24 = meia-noite).

const NOMES_DIAS = ["domingo","segunda-feira","terca-feira","quarta-feira","quinta-feira","sexta-feira","sabado"]

function nomeDia(dia){ return NOMES_DIAS[dia] || "" }

function horarioDoDia(dia){
    const grade = (CONFIG.horarios && CONFIG.horarios.grade) || {}
    return grade[String(dia)] || null
}

function horaTexto(h){
    h = Number(h)
    return h === 24 ? "00:00" : `${h}h`
}

// Proxima janela de funcionamento (usada nos pedidos agendados)
function proximaAbertura(){
    const agora = new Date()
    const h = agora.getHours() + agora.getMinutes()/60
    for(let i=0;i<8;i++){
        const dia = (agora.getDay() + i) % 7
        const janela = horarioDoDia(dia)
        if(!janela) continue
        if(i === 0 && h < Number(janela.abre)) return { dia, abre: Number(janela.abre), ehAmanha: false }
        if(i > 0) return { dia, abre: Number(janela.abre), ehAmanha: i === 1 }
    }
    return null
}

function verificarHorario(){
    const agora  = new Date()
    const dia    = agora.getDay()
    const h      = agora.getHours() + agora.getMinutes()/60
    const janela = horarioDoDia(dia)
    if(janela && h >= Number(janela.abre) && h < Number(janela.fecha)){
        return { aberto: true, msg: `Aberto agora - Fecha as ${horaTexto(janela.fecha)}` }
    }
    if(janela && h < Number(janela.abre)){
        const falta = Number(janela.abre) - h
        const hf = Math.floor(falta)
        const mf = Math.floor((falta % 1) * 60)
        return { aberto: false, msg: `Abrimos as ${Number(janela.abre)}h - Faltam ${hf > 0 ? hf+"h " : ""}${mf}min - Seu pedido entrara na fila!` }
    }
    const prox = proximaAbertura()
    if(!prox) return { aberto: false, msg: "Estamos fechados no momento." }
    const quando = prox.ehAmanha ? "amanha" : nomeDia(prox.dia)
    return { aberto: false, msg: `Fechado hoje (${nomeDia(dia)}) - Pedidos entram na fila para ${quando} as ${prox.abre}h!` }
}

function mostrarHorario(){
    const el = document.getElementById("statusHorario")
    if(!el) return
    const s = verificarHorario()
    el.innerHTML = s.msg
    el.className = s.aberto ? "horario-aberto" : "horario-fechado"
}

// ===============================
// RELAMPAGO
// ===============================

function happyHourConfig(){
    return (CONFIG.horarios && CONFIG.horarios.happyHour) || {}
}

function verificarRelampago(){
    const hh = happyHourConfig()
    if(hh.ativo === false) return false
    const h = new Date().getHours()
    return h >= Number(hh.inicio ?? 18) && h < Number(hh.fim ?? 19)
}

let relampagoInterval = null

function mostrarBannerRelampago(){
    const el = document.getElementById("bannerRelampago")
    if(!el) return
    if(verificarRelampago()){
        el.style.display = "flex"
        atualizarCountdown()
        if(!relampagoInterval) relampagoInterval = setInterval(atualizarCountdown, 1000)
    } else {
        el.style.display = "none"
    }
}

function atualizarCountdown(){
    const el = document.getElementById("countdownRelampago")
    if(!el) return
    const hh    = happyHourConfig()
    const agora = new Date()
    const fim   = new Date(); fim.setHours(Number(hh.fim ?? 19),0,0,0)
    const diff  = fim - agora
    if(diff <= 0){ document.getElementById("bannerRelampago").style.display="none"; return }
    const m = Math.floor(diff/60000)
    const s = Math.floor((diff%60000)/1000)
    el.innerText = `${m}:${String(s).padStart(2,"0")}`
}

// ===============================
// ANIVERSARIO
// ===============================

function verificarAniversario(){
    const anivFid = fidelidade.aniversario
    const anivCli = cliente?.aniversario ? (() => {
        const parts = cliente.aniversario.split("-")
        return parts.length === 3 ? `${parts[1]}-${parts[2]}` : cliente.aniversario
    })() : ""
    const aniv = anivFid || anivCli
    if(!aniv) return false
    const hoje = new Date()
    const [mes, dia] = aniv.split("-")
    return hoje.getMonth()+1 === Number(mes) && hoje.getDate() === Number(dia)
}

// ===============================
// CUPOM
// ===============================

let cupomAplicado = null

// Cupons vem de config.js (cupons): tipo "livre", "nivel" (gasto minimo) ou
// "aniversario". O valor final e sempre reconferido no Supabase na hora de
// fechar o pedido (calcularDescontosServidor).

function cupomPorCodigo(codigo){
    return (CONFIG.cupons || []).find(c => String(c.codigo).toUpperCase() === String(codigo || "").toUpperCase())
}

function cupomDisponivel(cupom){
    if(!cupom) return false
    if(cupom.tipo === "aniversario") return verificarAniversario()
    if(cupom.tipo === "nivel")       return fidelidade.totalGasto >= Number(cupom.minimo || 0)
    return true
}

function aplicarCupom(){
    const codigo = document.getElementById("campoCupom")?.value?.trim().toUpperCase()
    if(!codigo){ mostrarMsgCupom("Digite um codigo de cupom","erro"); return }
    const cupom = cupomPorCodigo(codigo)
    if(!cupom){ mostrarMsgCupom("Cupom invalido","erro"); return }
    if(!cupomDisponivel(cupom)){
        const falta = Math.max(0, Number(cupom.minimo || 0) - fidelidade.totalGasto)
        if(cupom.tipo === "nivel")            mostrarMsgCupom(`Faltam R$${falta.toFixed(2).replace(".",",")} em compras para este cupom`,"erro")
        else if(cupom.tipo === "aniversario") mostrarMsgCupom("Valido apenas no seu mes de aniversario","erro")
        else                                  mostrarMsgCupom("Cupom nao disponivel agora","erro")
        return
    }
    cupomAplicado = { codigo, desconto: Number(cupom.desconto), msg: cupom.msg }
    mostrarMsgCupom(`OK! ${cupom.msg} (-${cupom.desconto}%)`,"sucesso")
    atualizarCarrinho()
}

function mostrarMsgCupom(msg, tipo){
    const el = document.getElementById("msgCupom")
    if(!el) return
    el.innerText = msg
    el.className = tipo === "sucesso" ? "cupom-sucesso" : "cupom-erro"
}

function removerCupom(){
    cupomAplicado = null
    const el = document.getElementById("campoCupom")
    if(el) el.value = ""
    const msg = document.getElementById("msgCupom")
    if(msg) msg.innerText = ""
    atualizarCarrinho()
}

// ===============================
// PAINEL FIDELIDADE
// ===============================

// Busca os numeros reais no Supabase (gasto total, contador de pizza) em vez
// de confiar no que ficou salvo no localStorage deste aparelho - o mesmo
// numero que decide o desconto na hora de pagar e o que aparece aqui.
async function buscarFidelidadeReal(){
    const telefone = cliente?.whatsapp || null
    if(!telefone) return { gasto: fidelidade.totalGasto, contadorPizza: 0, temTelefone: false }
    try{
        const [{data:gasto}, {data:clienteRow}] = await Promise.all([
            sistemaSupabase.rpc("cliente_total_gasto", {p_telefone: telefone}),
            sistemaSupabase.from("clientes").select("contador_pedidos_pizza").eq("telefone", telefone).maybeSingle(),
        ])
        return { gasto: Number(gasto||0), contadorPizza: Number(clienteRow?.contador_pedidos_pizza||0), temTelefone: true }
    }catch(e){
        console.warn("Nao foi possivel buscar fidelidade real, usando dado local:", e)
        return { gasto: fidelidade.totalGasto, contadorPizza: 0, temTelefone: true }
    }
}

async function mostrarPainelFidelidade(){
    document.getElementById("modalFidelidade")?.remove()
    document.body.insertAdjacentHTML("beforeend", `<div id="modalFidelidade" class="modal-fid"><div class="fid-box"><p style="padding:40px;text-align:center">Carregando...</p></div></div>`)

    const { gasto, contadorPizza } = await buscarFidelidadeReal()
    const nivel = calcularNivelDe(gasto)
    const info  = getNivelInfo(nivel)
    const prox  = proximoNivelDe(nivel)
    const meta  = prox ? Number(prox.minimo) : null
    const pct   = meta ? Math.min(100,(gasto/meta)*100).toFixed(0) : 100
    const falta = meta ? Math.max(0,meta-gasto).toFixed(2) : 0
    const fg    = freteGratisConfig()
    const pedRest = Math.max(0, fg.pedidosComPizza - contadorPizza)

    const progresso = meta
        ? `<div class="fid-progresso-box"><p>Faltam <b>R$${falta}</b> para <b>${prox.nome}</b></p><div class="fid-barra-bg"><div class="fid-barra-fill" style="width:${pct}%;background:${info.cor}"></div></div><small>${pct}% concluido</small></div>`
        : `<div class="fid-progresso-box"><p>Voce esta no nivel maximo!</p></div>`

    document.getElementById("modalFidelidade")?.remove()
    document.body.insertAdjacentHTML("beforeend", `
    <div id="modalFidelidade" class="modal-fid">
      <div class="fid-box">
        <div class="fid-header" style="background:linear-gradient(135deg,${info.cor}44,#1a1a1a)">
          <span style="font-size:36px;font-weight:900;color:${info.cor}">${info.nome}</span>
          <div><h2 style="color:${info.cor}">Cliente ${info.nome}</h2><p>${info.desc}</p></div>
          <button class="fid-fechar" onclick="document.getElementById('modalFidelidade').remove()">X</button>
        </div>
        <div class="fid-stats">
          <div class="fid-stat"><span class="fid-stat-num">R$${(gasto).toFixed(2).replace(".",",")}</span><span class="fid-stat-label">Total gasto</span></div>
          <div class="fid-stat"><span class="fid-stat-num">${contadorPizza}/5</span><span class="fid-stat-label">Pedidos c/ pizza</span></div>
        </div>
        ${progresso}
        <div class="fid-missao"><div class="fid-missao-icone">Frete</div><div class="fid-missao-info"><b>Frete gratis a cada ${fg.pedidosComPizza} pedidos com pizza!</b><div class="fid-mini-barra-bg"><div class="fid-mini-barra-fill" style="width:${Math.min(100,(contadorPizza/fg.pedidosComPizza*100)).toFixed(0)}%"></div></div><small>${pedRest > 0 ? `Faltam ${pedRest} pedido(s) com pizza` : "Frete gratis no proximo pedido com pizza!"}</small></div></div>
        <div class="fid-missao"><div class="fid-missao-icone">Aniv</div><div class="fid-missao-info"><b>Desconto de aniversario - 10% off!</b>${fidelidade.aniversario || cliente?.aniversario ? `<small style="color:#2ecc71">Cadastrado</small>` : `<button onclick="editarCadastro()" style="margin-top:6px;background:var(--laranja);border:none;color:#fff;padding:8px 14px;border-radius:8px;cursor:pointer;font-weight:800;width:100%;font-size:15px">Cadastrar aniversario</button>`}</div></div>
        <div class="fid-missao"><div class="fid-missao-icone">Amigos</div><div class="fid-missao-info"><b>Indique um amigo!</b><small>Compartilhe o app pelo WhatsApp</small><button onclick="indicarAmigo()" style="margin-top:6px;background:var(--verde-wpp);border:none;color:#fff;padding:8px 14px;border-radius:8px;cursor:pointer;font-weight:800;width:100%;font-size:15px">Compartilhar app</button></div></div>
        <div class="fid-cupons"><h3>Seus Cupons</h3>${gerarListaCupons(gasto)}</div>
        <button onclick="document.getElementById('modalFidelidade').remove()" class="fid-btn-fechar">Fechar</button>
      </div>
    </div>`)
}

function gerarListaCupons(gasto){
    let html = ""
    const lista = CONFIG.cupons || []
    lista.forEach(cupom=>{
        if(cupom.tipo === "livre") return // cupons secretos nao aparecem na lista
        if(cupom.tipo === "aniversario"){
            if(verificarAniversario()) html += `<div class="fid-cupom-item"><b>${cupom.codigo}</b> - ${cupom.desconto}% off aniversario <button onclick="usarCupomDireto('${cupom.codigo}')">Usar</button></div>`
            return
        }
        const minimo = Number(cupom.minimo || 0)
        if(gasto >= minimo) html += `<div class="fid-cupom-item"><b>${cupom.codigo}</b> - ${cupom.desconto}% off <button onclick="usarCupomDireto('${cupom.codigo}')">Usar</button></div>`
        else html += `<div class="fid-cupom-item locked">BLOQUEADO - ${cupom.codigo} - Falta R$${(minimo-gasto).toFixed(2).replace(".",",")}</div>`
    })
    return html || `<p style="color:#888;font-size:14px">Continue comprando para desbloquear cupons!</p>`
}

function usarCupomDireto(codigo){
    document.getElementById("modalFidelidade")?.remove()
    const el = document.getElementById("campoCupom")
    if(el) el.value = codigo
    aplicarCupom()
    document.getElementById("carrinho").scrollIntoView({behavior:"smooth"})
}

function indicarAmigo(){
    const c   = CONFIG
    const msg = encodeURIComponent(`Conhece o ${c.marca.nome}? Delivery de Hambuguer incrivel em ${c.endereco.cidade}! Peca aqui: ${c.seo.baseUrl}`)
    window.open(`https://wa.me/?text=${msg}`)
}

function mostrarModalSubiuNivel(info){
    document.getElementById("modalNivel")?.remove()
    document.body.insertAdjacentHTML("beforeend",`
    <div id="modalNivel" style="position:fixed;inset:0;background:rgba(0,0,0,0.92);display:flex;justify-content:center;align-items:center;z-index:999999;padding:20px;">
      <div style="background:var(--bg-card);border-radius:22px;padding:32px 24px;text-align:center;max-width:340px;width:100%;border:2px solid ${info.cor};box-shadow:0 0 50px ${info.cor}88;animation:pixShow .3s ease">
        <div style="font-size:48px;font-weight:900;color:${info.cor};margin-bottom:12px">${info.nome}</div>
        <h2 style="color:${info.cor};font-size:26px;margin-bottom:8px">Voce subiu de nivel!</h2>
        <p style="font-size:20px;font-weight:800;margin-bottom:6px">Cliente ${info.nome}</p>
        <p style="color:#ccc;font-size:15px;margin-bottom:22px">${info.desc}</p>
        <button onclick="document.getElementById('modalNivel').remove()" style="background:${info.cor};border:none;color:#000;padding:14px;border-radius:12px;font-weight:800;font-size:17px;cursor:pointer;width:100%">Incrivel!</button>
      </div>
    </div>`)
}

function mostrarProgressoFidelidade(totalFinal, temComida){
    const nivelAntes = calcularNivel()
    fidelidade.totalGasto += totalFinal
    fidelidade.totalPedidos++
    if(temComida) fidelidade.pedidosComComida++
    carrinho.forEach(item=>{
        if(item.tipo === "pizza" || item.tipo === "combo") fidelidade.pizzasContadas++
    })
    fidelidade.nivel = calcularNivel()
    salvarFidelidade()
    const nivelDepois = calcularNivel()
    if(nivelAntes !== nivelDepois){ setTimeout(()=> mostrarModalSubiuNivel(getNivelInfo(nivelDepois)), 1500); return }
    const aCadaN = Number(CONFIG.fidelidade?.pizzaGratisACada || 10)
    if(fidelidade.pizzasContadas > 0 && fidelidade.pizzasContadas % aCadaN === 0){
        setTimeout(()=> mostrarToastSimples("Parabens! Voce ganhou uma pizza gratis! Avise no proximo pedido."), 2000)
    }
    const prox = proximoNivelDe(nivelDepois)
    if(prox) mostrarToastSimples(`Faltam R$${(Math.max(0,Number(prox.minimo)-fidelidade.totalGasto)).toFixed(2).replace(".",",")} para virar ${prox.nome}!`)
}

function mostrarBarraFidelidade(){
    const el = document.getElementById("barraFidelidade")
    if(!el) return
    const nivel = calcularNivel()
    const info  = getNivelInfo(nivel)
    const prox  = proximoNivelDe(nivel)
    const meta  = prox ? Number(prox.minimo) : null
    const pct   = meta ? Math.min(100,(fidelidade.totalGasto/meta)*100) : 100
    const faltaTexto = meta ? `R$${(Math.max(0,meta-fidelidade.totalGasto)).toFixed(2).replace(".",",")} para ${prox.nome}` : "Nivel maximo!"
    el.innerHTML = `
    <div class="fid-barra-topo" onclick="mostrarPainelFidelidade()">
      <span class="fid-nivel-badge" style="color:${info.cor}">${info.nome}</span>
      <div class="fid-barra-mini-bg"><div class="fid-barra-mini-fill" style="width:${pct}%;background:${info.cor}"></div></div>
      <span class="fid-falta-texto">${faltaTexto}</span>
      <span class="fid-ver-btn">Ver</span>
    </div>`
}

// ===============================
// BUSCA GLOBAL
// ===============================

// Cardapio real (pizzas e bebidas) agora vem do sistema de gestao via Supabase
// (integracao-sistema.js). A lista de reserva usada quando o sistema estiver
// indisponivel mora em config.js (cardapio.pizzasFallback) - assim o template
// troca de restaurante sem mexer no codigo e o app nunca fica fora do ar.

function pizzasFallback(){
    return (CONFIG.cardapio && CONFIG.cardapio.pizzasFallback) || []
}

function iniciarBusca(){
    const input = document.getElementById("busca")
    if(!input) return
    input.addEventListener("input", async function(){
        const termo = this.value.toLowerCase().trim()
        if(!termo){
            document.getElementById("resultadoBusca")?.remove()
            document.getElementById("tituloCombos").style.display = "block"
            setDisplay(".combos-carrossel-wrap","")
            document.getElementById("produtos").innerHTML = ""
            carregarCombosSemana()
            return
        }
        document.getElementById("tituloCombos").style.display = "none"
        setDisplay(".combos-carrossel-wrap","none")
        document.getElementById("produtos").innerHTML = ""
        await cardapioProntoPromise
        const pizzas = cardapioPizzas.length ? cardapioPizzas : pizzasFallback()
        const bebidas = cardapioBebidas.length ? cardapioBebidas.map(b=>({...b, categoria:"bebidas"})) : []
        fetch("produtos.json").then(r=>r.json()).then(produtos=>{
            const outros = bebidas.length ? produtos.filter(p=>p.categoria!=="bebidas") : produtos
            const todos = [...pizzas.map(p=>({...p,categoria:"hamburgueres"})), ...bebidas, ...outros]
            const resultado = todos.filter(p =>
                p.nome.toLowerCase().includes(termo) ||
                (p.desc||p.descricao||"").toLowerCase().includes(termo) ||
                (p.categoria||"").toLowerCase().includes(termo)
            )
            let html = `<div id="resultadoBusca"><h2>Resultados para "${this.value}"</h2>`
            if(resultado.length === 0){
                html += `<div class="busca-vazia">Nenhum produto encontrado para "${this.value}"</div>`
            } else {
                html += `<p class="busca-qtd">${resultado.length} produto(s) encontrado(s)</p>`
                resultado.forEach(p => {
                    const nome  = p.nome
                    const desc  = p.desc || p.descricao || ""
                    const img   = p.img  || p.foto || "imagens/sem-imagem.png"
                    const preco = Number(p.preco ?? p.precoM ?? 0)
                    const cat   = p.categoria || "outro"
                    if(cat === "hambugueres"){
                        const campoPreco = tamanhosConfig()[0]?.campo || "precoP"
                        const precoTxt = p[campoPreco] ? `A partir R$${Number(p[campoPreco]).toFixed(2).replace(".",",")}` : "Consulte"
                        html += `<div class="card pizza-card"><img src="${img}" loading="lazy" onerror="this.src='imagens/pizza-padrao.png'"><div class="card-content">${p.selo ? `<span class="pizza-selo${p.destaque?" pizza-selo-destaque":""}">${p.selo}</span>` : ""}<h3>${nome}</h3><p>${desc}</p><div class="card-rodape"><span class="preco">${precoTxt}</span><button onclick='abrirMontagemPizza(${JSON.stringify(nome)})'>Montar</button></div></div></div>`
                    } else if(cat === "combos"){
                        html += `<div class="card destaque"><img src="${img}" loading="lazy" onerror="this.src='imagens/sem-imagem.png'"><div class="card-content"><h3>${nome}</h3><p class="combo-desc">${desc.split("+").map(i=>i.trim()).join(" + ")}</p><div class="card-rodape"><span class="preco preco-destaque">R$ ${(preco).toFixed(2).replace(".",",")}</span><button onclick='abrirMontagemCombo(${JSON.stringify(nome)})'>Montar</button></div></div></div>`
                    } else if(cat === "bebidas"){
                        html += `<div class="card"><img src="${img}" loading="lazy" onerror="this.src='imagens/sem-imagem.png'"><div class="card-content"><h3>${nome}</h3><p>${desc}</p><div class="card-rodape"><span class="preco">R$ ${(preco).toFixed(2).replace(".",",")}</span><button onclick='addCarrinho(${JSON.stringify(nome)},${preco},"bebidas",{bebidaId:${JSON.stringify(p.id||null)}})'>Adicionar</button></div></div></div>`
                    } else {
                        html += `<div class="card"><img src="${img}" loading="lazy" onerror="this.src='imagens/sem-imagem.png'"><div class="card-content"><h3>${nome}</h3><p>${desc}</p><div class="card-rodape"><span class="preco">R$ ${(preco).toFixed(2).replace(".",",")}</span><button onclick='addCarrinho(${JSON.stringify(nome)},${preco},${JSON.stringify(cat)})'>Adicionar</button></div></div></div>`
                    }
                })
            }
            html += `</div>`
            document.getElementById("resultadoBusca")?.remove()
            document.getElementById("produtos").innerHTML = html
            setTimeout(() => document.getElementById("resultadoBusca")?.scrollIntoView({behavior:"smooth", block:"start"}), 100)
        })
    })
}

// ===============================
// INICIO
// ===============================

window.onload = function(){
    carregarCombosSemana()
    iniciarBanner()
    mostrarHorario()
    mostrarBannerRelampago()
    iniciarBusca()
    mostrarBarraFidelidade()
    renderizarCardapioSEO()
    setInterval(mostrarHorario, 60000)
    if(cliente) mostrarBoasVindas()

    // Aviso de aniversariantes proximos (para o admin)
    const anivProximos = verificarAniversariantesProximos()
    if(anivProximos.length > 0){
        console.log("Aniversariantes proximos:", anivProximos)
    }
}

// Quando a configuracao remota (painel customizar.html -> Supabase) chega
// depois do boot, tudo que depende dela e recalculado aqui.
window.aoAtualizarConfig = function(){
    mostrarHorario()
    mostrarBannerRelampago()
    mostrarBarraFidelidade()
    atualizarCarrinho()
    if(bannerDiv) mostrarBanner()
}

// ===============================
// COMBOS / PRODUTOS
// ===============================

function esconderCombos(){
    document.getElementById("combosSemana").innerHTML = ""
    setDisplay(".combos-carrossel-wrap","none")
    document.getElementById("tituloCombos").style.display = "none"
}

function mostrarCombos(){
    document.getElementById("tituloCombos").style.display = "block"
    setDisplay(".combos-carrossel-wrap","")
    carregarCombosSemana()
    document.getElementById("produtos").innerHTML = ""
    document.getElementById("busca").value = ""
}

function listaPizzasAtual(){
    return cardapioPizzas.length ? cardapioPizzas : pizzasFallback()
}

async function abrirPizzas(){
    esconderCombos()
    document.getElementById("busca").value = ""
    document.getElementById("produtos").innerHTML = `<p style="text-align:center;padding:24px">Carregando cardapio...</p>`
    await cardapioProntoPromise
    const pizzas = listaPizzasAtual()
    let html = "<h2>Escolha sua Pizza</h2>"
    pizzas.forEach(p=>{
        const precoTxt = p.precoP ? `A partir R$${Number(p.precoP).toFixed(2).replace(".",",")}` : "Consulte"
        html += `<div class="card pizza-card">
            <img src="${p.img}" loading="lazy" onerror="this.src='imagens/pizza-padrao.png'">
            <div class="card-content">
                ${p.selo ? `<span class="pizza-selo${p.destaque?" pizza-selo-destaque":""}">${p.destaque?"★ ":""}${p.selo}</span>` : ""}<h3>${p.nome}</h3><p>${p.desc}</p>
                <div class="card-rodape">
                    <span class="preco">${precoTxt}</span>
                    <button onclick='abrirMontagemPizza(${JSON.stringify(p.nome)})'>Montar Pizza</button>
                </div>
            </div></div>`
    })
    document.getElementById("produtos").innerHTML = html
}

function tamanhosConfig(){ return (CONFIG.pedido && CONFIG.pedido.tamanhos) || [] }
function bordasConfig(){ return (CONFIG.pedido && CONFIG.pedido.bordas) || [] }
function precoDoTamanho(p, tam){ return Number(p?.[tam?.campo] ?? 0) }

function abrirMontagemPizza(nome){
    const pizzas = listaPizzasAtual()
    const p = pizzas.find(x=>x.nome===nome)
    if(!p){ abrirPizzas(); return }
    const outrosSabores = pizzas.filter(x=>x.nome!==nome)
    const tamanhos  = tamanhosConfig()
    const tamPadrao = tamanhos.find(t=>t.id === "M") || tamanhos[0]
    const tamOpts   = tamanhos.map(t=>`<option value="${t.id}"${t===tamPadrao?" selected":""}>${t.rotulo} ${t.cm} - R$${precoDoTamanho(p,t).toFixed(2).replace(".",",")}</option>`).join("")
    const bordaOpts = bordasConfig().map(b=>`<option value="${b.preco}">${b.nome}${Number(b.preco)>0?` (+R$${b.preco})`:""}</option>`).join("")
    document.getElementById("produtos").innerHTML = `
    <div class="montagem-box">
        <h2>Pizza ${p.nome}</h2>
        <img class="pizza-preview" src="${p.img}" loading="lazy" onerror="this.src='imagens/pizza-padrao.png'">
        <div class="opcoes-pizza">
            <div class="campo"><label>Tamanho:</label><select id="tamanho">
                ${tamOpts}
            </select></div>
            <div class="campo"><label>Borda:</label><select id="borda">
                ${bordaOpts}
            </select></div>
            <div class="campo"><label>Meio a Meio:</label><select id="meio">
                <option value="">Nao</option>
                ${outrosSabores.map(s=>`<option>${s.nome}</option>`).join("")}
            </select></div>
        </div>
        <button class="btn-montar" onclick='adicionarPizza(${JSON.stringify(nome)})'>Adicionar ao Carrinho</button>
        <span class="voltar" onclick="abrirPizzas()">Voltar</span>
    </div>`
}

function adicionarPizza(nome){
    const p = listaPizzasAtual().find(x=>x.nome===nome)
    if(!p) return
    const tamId   = document.getElementById("tamanho").value
    const tamInfo = tamanhosConfig().find(t=>t.id === tamId) || tamanhosConfig()[0]
    const bordaEl = document.getElementById("borda")
    const borda = Number(bordaEl.value)
    const bordaTxt = bordaEl.options[bordaEl.selectedIndex].text
    const meio = document.getElementById("meio").value
    const precoBase = precoDoTamanho(p, tamInfo)
    let preco = precoBase + borda
    let nomeFinal = `Pizza ${nome} ${tamInfo?.cm || ""}`.trim()
    if(meio) nomeFinal += " / Meio: " + meio
    if(borda) nomeFinal += " / Borda: " + bordaTxt
    // So conseguimos vincular a venda ao sabor certo no sistema de gestao
    // quando nao e meio a meio (senao ficaria ambiguo qual sabor "vendeu").
    const refs = (!meio && p.id) ? { saborId: p.id, tamanho: tamId } : {}
    addCarrinho(nomeFinal, preco, "pizza", refs)
    abrirPizzas()
}

async function filtrar(tipo){
    if(tipo === "combo"){ mostrarCombos(); return }
    esconderCombos()
    document.getElementById("busca").value = ""

    if(tipo === "bebidas"){
        document.getElementById("produtos").innerHTML = `<p style="text-align:center;padding:24px">Carregando cardapio...</p>`
        await cardapioProntoPromise
        if(cardapioBebidas.length){
            let html = ""
            cardapioBebidas.forEach(b=>{
                html += `<div class="card">
                    <img src="${b.img}" loading="lazy" onerror="this.src='imagens/sem-imagem.png'">
                    <div class="card-content">
                        <h3>${b.nome}</h3>
                        <div class="card-rodape">
                            <span class="preco">R$ ${(b.preco).toFixed(2).replace(".",",")}</span>
                            <button onclick='addCarrinho(${JSON.stringify(b.nome)},${b.preco},"bebidas",{bebidaId:${JSON.stringify(b.id)}})'>Adicionar</button>
                        </div>
                    </div></div>`
            })
            document.getElementById("produtos").innerHTML = html
            return
        }
        // Sistema fora do ar: cai para o produtos.json local como reserva
    }

    if(tipo === "snacks"){
        document.getElementById("produtos").innerHTML = `<p style="text-align:center;padding:24px">Carregando cardapio...</p>`
        await cardapioProntoPromise
        if(cardapioLanches.length){
            let html = ""
            cardapioLanches.forEach(l=>{
                html += `<div class="card">
                    <img src="${l.img}" loading="lazy" onerror="this.src='imagens/sem-imagem.png'">
                    <div class="card-content">
                        <h3>${l.nome}</h3>
                        <div class="card-rodape">
                            <span class="preco">R$ ${(l.preco).toFixed(2).replace(".",",")}</span>
                            <button onclick='addCarrinho(${JSON.stringify(l.nome)},${l.preco},"snacks",{lancheId:${JSON.stringify(l.id)}})'>Adicionar</button>
                        </div>
                    </div></div>`
            })
            document.getElementById("produtos").innerHTML = html
            return
        }
        // Sistema fora do ar: cai para o produtos.json local como reserva
    }

    fetch("produtos.json").then(r=>r.json()).then(produtos=>{
        let html = ""
        produtos.filter(p=>p.categoria===tipo).forEach(p=>{
            html += `<div class="card">
                <img src="${p.foto}" loading="lazy" onerror="this.src='imagens/sem-imagem.png'">
                <div class="card-content">
                    <h3>${p.nome}</h3><p>${p.descricao}</p>
                    <div class="card-rodape">
                        <span class="preco">R$ ${(Number(p.preco)).toFixed(2).replace(".",",")}</span>
                        <button onclick="addCarrinho('${p.nome}',${p.preco},'${tipo}')">Adicionar</button>
                    </div>
                </div></div>`
        })
        document.getElementById("produtos").innerHTML = html
    })
}

// ===============================
// CARROSSEL COMBOS DA SEMANA
// ===============================

let combosLista = []
let comboAtualIndex = 0

// Combos vem do sistema de gestao (com id real, usado pra sincronizar a venda
// e baixar o estoque das bebidas/lanches inclusos). Se o sistema estiver fora
// do ar, cai pro produtos.json local (sem id - o combo so nao sincroniza).
async function listaCombosAtual(){
    await cardapioProntoPromise
    if(cardapioCombos.length) return cardapioCombos
    return fetch("produtos.json").then(r=>r.json()).then(produtos=>produtos.filter(p=>p.categoria==="combos"))
}

async function carregarCombosSemana(){
    listaCombosAtual().then(lista=>{
        combosLista = lista
        let html = ""
        combosLista.forEach(c=>{
            html += `<div class="combo-slide">
                <div class="card destaque">
                    <img src="${c.foto}" loading="lazy" onerror="this.src='imagens/sem-imagem.png'">
                    <div class="card-content">
                        <h3>${c.nome}</h3>
                        <p class="combo-desc">${c.descricao.split("+").map(i=>i.trim()).join(" + ")}</p>
                        <div class="card-rodape">
                            <span class="preco preco-destaque">R$ ${(Number(c.preco)).toFixed(2).replace(".",",")}</span>
                            <button onclick="abrirMontagemCombo('${c.nome}')">Montar Combo</button>
                        </div>
                    </div>
                </div>
            </div>`
        })
        document.getElementById("combosSemana").innerHTML = html
    })
}

function abrirMontagemCombo(nome){
    listaCombosAtual().then(lista=>{
        combosLista = lista
        comboAtualIndex = combosLista.findIndex(c=>c.nome===nome)
        if(comboAtualIndex < 0) comboAtualIndex = 0
        esconderCombos()
        renderizarMontagemCombo()
    })
}

function navegarCombo(direcao){
    comboAtualIndex += direcao
    if(comboAtualIndex < 0) comboAtualIndex = combosLista.length - 1
    if(comboAtualIndex >= combosLista.length) comboAtualIndex = 0
    renderizarMontagemCombo()
}

function renderizarMontagemCombo(){
    (async () => {
        await cardapioProntoPromise
        const combo = combosLista[comboAtualIndex]
        if(!combo) return
        const desc     = combo.descricao.toLowerCase()
        const nomeNorm = norm(combo.nome)
        const semRefri = nomeNorm.includes("amigos")
        const qtdPizzas = nomeNorm.includes("familia") ? 2 : 1
        const fonteBebidas = cardapioBebidas.length ? cardapioBebidas : await fetch("produtos.json").then(r=>r.json()).then(produtos=>produtos.filter(p=>p.categoria==="bebidas"))
        const bebidas = fonteBebidas.filter(b=>{
            if(semRefri) return false
            const nb = b.nome.toLowerCase()
            if(desc.includes("refrigerante")) return nb.includes("2l")||nb.includes("2000")
            if(desc.includes("lata")||desc.includes("350ml")) return nb.includes("350")||nb.includes("lata")
            return false
        })
        const pOpts = `<option value="">Selecione</option>` + listaPizzasAtual().map(s=>`<option>${s.nome}</option>`).join("")
        let rOpts = `<option value="">Selecione</option>`
        bebidas.forEach(b=>{ rOpts += `<option value="${b.id||""}">${b.nome}</option>` })
        const dots = combosLista.map((c,i)=>`<span class="combo-dot ${i===comboAtualIndex?"ativo":""}" onclick="comboAtualIndex=${i};renderizarMontagemCombo()"></span>`).join("")
        let html = `
        <div class="montagem-box">
          <div class="combo-carrossel-header">
            <button class="combo-nav-btn" onclick="navegarCombo(-1)">&#8592;</button>
            <div class="combo-carrossel-info">
              <h2>${combo.nome}</h2>
              <div class="combo-dots">${dots}</div>
              <small>${comboAtualIndex+1} de ${combosLista.length} combos</small>
            </div>
            <button class="combo-nav-btn" onclick="navegarCombo(1)">&#8594;</button>
          </div>
          <img class="pizza-preview" src="${combo.foto}" loading="lazy" onerror="this.src='imagens/sem-imagem.png'">
          <p class="combo-preco-destaque">R$ ${(Number(combo.preco)).toFixed(2).replace(".",",")}</p>
          <div class="opcoes-pizza">`
        for(let i=1;i<=qtdPizzas;i++) html += `<div class="campo"><label>Pizza ${i}:</label><select id="pizza${i}">${pOpts}</select></div>`
        const bordaOptsCombo = bordasConfig().map(b=>`<option value="${b.preco}">${b.nome}${Number(b.preco)>0?` +R$${b.preco}`:""}</option>`).join("")
        html += `<div class="campo"><label>Borda:</label><select id="borda">${bordaOptsCombo}</select></div>`
        if(!semRefri){
            const qtdR = nomeNorm.includes("familia")?2:1
            for(let i=1;i<=qtdR;i++) html += `<div class="campo"><label>Refrigerante ${i}:</label><select id="refri${i}">${rOpts}</select></div>`
        }
        html += `</div>
        <div class="campo">
            <label>Bebidas Extras (opcional):</label>
            <div id="extrasBebidas"></div>
            <button onclick="adicionarLinhaBebida()" class="btn-add-bebida">+ Adicionar Bebida</button>
        </div>
        <button class="btn-montar" onclick="adicionarComboFinal('${combo.nome}',${combo.preco},${qtdPizzas},${semRefri})">Adicionar Combo ao Carrinho</button>
        <span class="voltar" onclick="mostrarCombos()">Voltar para combos</span>
        </div>`
        document.getElementById("produtos").innerHTML = html
        setTimeout(()=>document.getElementById("produtos").scrollIntoView({behavior:"smooth"}),100)
    })()
}

function adicionarComboFinal(nome,preco,qtdPizzas,semRefri){
    let detalhes = []
    let total = preco
    let itensInclusos = []
    for(let i=1;i<=qtdPizzas;i++){
        const p=document.getElementById(`pizza${i}`)?.value
        if(p) detalhes.push(`Pizza ${i}: ${p}`)
    }
    const bordaEl=document.getElementById("borda")
    const borda=Number(bordaEl?.value||0)
    if(borda>0){ detalhes.push(`Borda: ${bordaEl.selectedOptions[0].text}`); total+=borda }
    if(!semRefri){
        const qtdR=norm(nome).includes("familia")?2:1
        for(let i=1;i<=qtdR;i++){
            const sel=document.getElementById(`refri${i}`)
            const bebidaId=sel?.value
            const nomeBebida=sel?.selectedOptions[0]?.text
            if(bebidaId){
                detalhes.push(`Refri ${i}: ${nomeBebida}`)
                itensInclusos.push({ tipo:"bebida", bebida_id:bebidaId, quantidade:1 })
            }
        }
    }
    document.querySelectorAll("#extrasBebidas > div").forEach(div=>{
        const sel=div.querySelector(".bebidaSelect")
        const id=div.id.split("_")[1]
        const qtd=Number(document.getElementById("qtd_"+id).innerText)
        const bebidaId=sel.value
        const nb=sel.selectedOptions[0]?.text
        const pb=Number(sel.selectedOptions[0]?.dataset.preco||0)
        if(bebidaId){
            detalhes.push(`${qtd}x ${nb}`)
            total+=pb*qtd
            itensInclusos.push({ tipo:"bebida", bebida_id:bebidaId, quantidade:qtd })
        }
    })
    const descCompleta = detalhes.length > 0 ? ` (${detalhes.join(" | ")})` : ""
    const comboId = combosLista[comboAtualIndex]?.id
    addCarrinho(nome+descCompleta, total, "combo", { comboId, itensInclusos })
    mostrarCombos()
}

// ===============================
// BANNER
// ===============================

// Banners do topo vem de config.js (banners)
let bannerIndex = 0, bannerDiv

function listaBanners(){ return CONFIG.banners || [] }

function iniciarBanner(){
    bannerDiv = document.getElementById("banner")
    if(!bannerDiv) return
    if(!listaBanners().length){ bannerDiv.style.display = "none"; return }
    mostrarBanner()
    setInterval(mostrarBanner, 5000)
}

function mostrarBanner(){
    const lista = listaBanners()
    if(!lista.length) return
    const combo = lista[bannerIndex % lista.length]
    bannerDiv.style.backgroundImage = `url('${combo.foto}')`
    bannerDiv.onclick = ()=>{ mostrarToast(combo); setTimeout(()=>abrirMontagemCombo(combo.nome),800) }
    bannerIndex = (bannerIndex+1) % lista.length
}

// ===============================
// CARRINHO
// ===============================

function addCarrinho(nome, preco, tipo="outro", refs={}){
    let item = carrinho.find(i=>i.nome===nome)
    if(item) item.qtd++
    else carrinho.push({nome, preco:Number(preco), qtd:1, tipo, ...refs})
    const btn = document.getElementById("botaoCarrinho")
    if(btn){ btn.classList.add("pulsar"); setTimeout(()=>btn.classList.remove("pulsar"),600) }
    atualizarCarrinho()
}

function contarItensFreteGratis(){
    return carrinho.reduce((a,i)=>a+(i.tipo==="hamburgueres"||i.tipo==="combo"?i.qtd:0),0)
}

function temComidaNoCarrinho(){
    return carrinho.some(i=>["hamburgueres","combo","snacks"].includes(i.tipo))
}

function temPizzaNoCarrinho(){
    return carrinho.some(i=>i.tipo==="hamburgueres"||i.tipo==="combo")
}

// Confere os descontos de verdade no Supabase (mesma logica usada na edge
// function do Pix/cartao) - vale pra Pix/Cartao/Dinheiro igual, porque o
// pedido em Dinheiro nao passa por nenhum servidor hoje, so pela mensagem
// de WhatsApp. Sem isso, o total mostrado/enviado seria so um calculo local
// que qualquer um podia adulterar, e nao bateria com o que o Pix/cartao cobra.
async function calcularDescontosServidor(subtotal, temPizza, freteBase, cupomCodigo){
    const telefone = cliente?.whatsapp || null
    let descontoPct = 0
    let motivo = ""
    let freteGratis = false

    if(telefone){
        try{
            const [{data:ehNovo}, {data:totalGasto}] = await Promise.all([
                sistemaSupabase.rpc("cliente_e_novo", {p_telefone: telefone}),
                sistemaSupabase.rpc("cliente_total_gasto", {p_telefone: telefone}),
            ])
            const gastoReal = Number(totalGasto || 0)

            // Boas-vindas e desconto automatico por nivel de fidelidade (config.js)
            const boasVindas = Number(CONFIG.fidelidade?.boasVindasPct || 0)
            if(ehNovo === true && boasVindas > descontoPct){ descontoPct = boasVindas; motivo = "Boas-vindas (1a compra)" }
            const nivelDesc = nivelComDescontoPorGasto(gastoReal)
            if(nivelDesc && Number(nivelDesc.descontoPct) > descontoPct){ descontoPct = Number(nivelDesc.descontoPct); motivo = "Cliente " + nivelDesc.nome }

            // Cupons (config.js) - o servidor do Pix/cartao e quem tem a
            // palavra final sobre o desconto; aqui so espelhamos a mesma regra.
            const cupom = cupomPorCodigo(cupomCodigo)
            if(cupom && Number(cupom.desconto) > descontoPct){
                if(cupom.tipo === "livre"){
                    descontoPct = Number(cupom.desconto); motivo = "Cupom " + cupom.codigo
                } else if(cupom.tipo === "aniversario"){
                    const {data:ehAniversariante} = await sistemaSupabase.rpc("cliente_e_aniversariante", {p_telefone: telefone})
                    if(ehAniversariante === true){ descontoPct = Number(cupom.desconto); motivo = "Desconto de aniversario" }
                } else if(cupom.tipo === "nivel" && gastoReal >= Number(cupom.minimo || 0)){
                    descontoPct = Number(cupom.desconto); motivo = "Cupom " + cupom.codigo
                }
            }

            if(temPizza){
                const {data:elegivelFrete} = await sistemaSupabase.rpc("cliente_elegivel_frete_gratis", {p_telefone: telefone})
                if(elegivelFrete === true) freteGratis = true
            }
        }catch(e){
            console.warn("Nao foi possivel confirmar descontos no servidor, seguindo sem desconto automatico:", e)
        }
    }

    return {
        desconto: subtotal * (descontoPct/100),
        frete: freteGratis ? 0 : freteBase,
        freteGratis, descontoPct, motivo,
    }
}

function atualizarCarrinho(){
    localStorage.setItem("carrinhoAtual", JSON.stringify(carrinho))
    const lista    = document.getElementById("lista")
    const contador = document.getElementById("contador")
    if(!lista) return
    let subtotal = 0
    lista.innerHTML = ""
    carrinho.forEach((item,index)=>{
        const sub = item.preco * item.qtd
        subtotal += sub
        lista.innerHTML += `
        <div class="item-carr">
            <div class="item-carr-info">
                <b>${item.nome}</b>
                <span class="item-carr-preco">R$ ${sub.toFixed(2).replace(".",",")}</span>
            </div>
            <div class="item-carr-ctrl">
                <button class="btn-qtd" onclick="diminuir(${index})">-</button>
                <span class="item-carr-qtd">${item.qtd}</span>
                <button class="btn-qtd" onclick="aumentar(${index})">+</button>
                <span class="btn-remover-link" onclick="removerItem(${index})">
                    <span class="x-vermelho">X</span>
                    <span class="remover-branco">Remover</span>
                </span>
            </div>
        </div>`
    })
    if(contador) contador.innerText = carrinho.length
    const hhPct = verificarRelampago() ? Number(happyHourConfig().descontoPct || 0) : 0
    let descRelampago = subtotal * (hhPct/100)
    let descCupom     = cupomAplicado ? (subtotal-descRelampago)*(cupomAplicado.desconto/100) : 0
    const nivelDesc   = nivelComDescontoPorGasto(fidelidade.totalGasto)
    let descNivel     = (nivelDesc && !cupomAplicado) ? subtotal*(Number(nivelDesc.descontoPct)/100) : 0
    let totalComDesc  = subtotal - descRelampago - descCupom - descNivel
    const totalEl = document.getElementById("total")
    if(totalEl) totalEl.innerText = totalComDesc.toFixed(2).replace(".",",")
    const descEl = document.getElementById("descontosAtivos")
    if(descEl){
        let tags = ""
        if(descRelampago > 0) tags += `<span class="desc-tag">Relampago -R$${(descRelampago).toFixed(2).replace(".",",")}</span>`
        if(descCupom > 0)     tags += `<span class="desc-tag">Cupom -R$${(descCupom).toFixed(2).replace(".",",")}</span>`
        if(descNivel > 0)     tags += `<span class="desc-tag">${nivelDesc.nome} -R$${(descNivel).toFixed(2).replace(".",",")}</span>`
        descEl.innerHTML = tags
    }
    const infoEl = document.getElementById("infoFrete")
    if(infoEl){
        const fg = freteGratisConfig()
        const itens = contarItensFreteGratis()
        const freteGratis = itens>=fg.itensComComida || fidelidade.pedidosComComida>=fg.pedidosComComida || (fg.niveis||[]).includes(calcularNivel())
        if(freteGratis){
            infoEl.innerHTML = `<div class="frete-badge frete-gratis">Parabens! Voce ganhou FRETE GRATIS!</div>`
        } else {
            const falta = fg.itensComComida-itens
            const pct = Math.min(100,(itens/fg.itensComComida)*100)
            const quaseLa = falta === 1
            let dots = ""
            for(let i=1;i<=fg.itensComComida;i++){
                dots += `<span class="frete-dot${i<=itens?" cheio":""}">${i<=itens?'<svg viewBox="0 0 20 20" width="11" height="11"><path d="M4 10.5l3.5 3.5L16 5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>':""}</span>`
            }
            infoEl.innerHTML = `
            <div class="frete-badge frete-progresso${quaseLa?" quase":""}">
                <div class="frete-texto">${quaseLa?"Falta só <b>1 item</b> com comida pro seu <b>frete grátis!</b>":`Adicione mais <b>${falta} itens</b> com comida para ganhar <b>frete grátis!</b>`}</div>
                <div class="frete-barra-bg"><div class="frete-barra-fill" style="width:${pct}%"><span class="frete-shine"></span></div></div>
                <div class="frete-steps"><div class="frete-dots">${dots}</div><span class="frete-contagem">${itens}/${fg.itensComComida}</span></div>
            </div>`
        }
    }
    const pag = document.getElementById("pagamento")?.value
    const trocoBox = document.getElementById("trocoBox")
    if(trocoBox) trocoBox.style.display = pag==="Dinheiro" ? "block" : "none"
    mostrarBarraFidelidade()
}

function aumentar(i){ carrinho[i].qtd++; atualizarCarrinho() }
function diminuir(i){ carrinho[i].qtd--; if(carrinho[i].qtd<=0) carrinho.splice(i,1); atualizarCarrinho() }
function removerItem(i){ carrinho.splice(i,1); atualizarCarrinho() }
function scrollCarrinho(){ document.getElementById("carrinho").scrollIntoView({behavior:"smooth"}) }

function mostrarToast(combo){
    const toast = document.getElementById("toast")
    if(!toast) return
    toast.innerText = combo.toast ? `${combo.nome} ${combo.toast}` : `${combo.nome} adicionado!`
    toast.className = "show"
    setTimeout(()=>{ toast.className = "" }, 4000)
}

function mostrarToastSimples(msg){
    const toast = document.getElementById("toast")
    if(!toast) return
    toast.innerText = msg
    toast.className = "show"
    setTimeout(()=>{ toast.className = "" }, 4000)
}

function abrirMapa(){
    const e = CONFIG.endereco
    const alvo = encodeURIComponent(`${e.rua} ${e.numero} ${e.bairro} ${e.cidade}`)
    window.open(`https://www.google.com/maps?q=${alvo}`)
}

// ===============================
// FRETE E TEMPO
// ===============================
// Faixas de bairro/preco/tempo e a regra de frete gratis vem de config.js
// (entrega.faixas / entrega.bairroNaoListado / entrega.freteGratis).

function norm(b){ return b.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"") }

function faixaDoBairro(b){
    if(!b) return null
    const bn = norm(b)
    const faixas = (CONFIG.entrega && CONFIG.entrega.faixas) || []
    for(const faixa of faixas){
        if((faixa.bairros || []).some(x=>norm(x) === bn)) return faixa
    }
    return null
}

function calcularFretePorBairro(b){
    const faixa = faixaDoBairro(b)
    if(faixa) return Number(faixa.preco || 0)
    return Number(CONFIG.entrega?.bairroNaoListado?.preco ?? 20)
}

function tempoEstimadoPorBairro(b){
    const faixa = faixaDoBairro(b)
    if(faixa && faixa.tempo) return faixa.tempo
    return CONFIG.entrega?.bairroNaoListado?.tempo || "45-60 min"
}

function todosBairros(){
    return ((CONFIG.entrega && CONFIG.entrega.faixas) || []).reduce((acc,faixa)=>acc.concat(faixa.bairros || []), [])
}

function freteGratisConfig(){
    return (CONFIG.entrega && CONFIG.entrega.freteGratis) || { itensComComida: 5, pedidosComPizza: 5, niveis: [] }
}

function abrirModalBairros(){
    document.getElementById("modalBairro")?.remove()
    const todos = todosBairros()
    const lista = todos.map(b=>`<div onclick="selecionarBairro('${b}')" style="padding:14px 12px;border-bottom:1px solid #eee;cursor:pointer;font-size:17px;font-weight:600">- ${b}</div>`).join("")
    document.body.insertAdjacentHTML("beforeend",`
    <div id="modalBairro" style="position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:99999;display:flex;justify-content:center;align-items:center">
      <div style="background:#fff;color:#000;width:92%;max-width:420px;padding:20px;border-radius:18px;max-height:85vh;display:flex;flex-direction:column;">
        <h2 style="margin-bottom:12px;font-size:20px">Selecione seu bairro</h2>
        <div style="overflow:auto;flex:1">${lista}</div>
        <button onclick="fecharModalBairro()" style="margin-top:14px;width:100%;padding:14px;background:var(--vermelho);color:#fff;border:none;border-radius:12px;font-weight:800;font-size:16px">Fechar</button>
      </div>
    </div>`)
}

function fecharModalBairro(){ document.getElementById("modalBairro")?.remove() }

function selecionarBairro(nome){
    document.getElementById("bairroSelecionado").value = nome
    fecharModalBairro()
    const frete = calcularFretePorBairro(nome)
    const tempo = tempoEstimadoPorBairro(nome)
    document.getElementById("freteInfo").innerHTML = `
    <div class="frete-badge frete-info-bairro">
        Frete: <b>R$${frete},00</b>  |  Estimativa: <b>${tempo}</b>
    </div>`
}

// ===============================
// BEBIDAS EXTRAS — CARD BRANCO PREMIUM
// ===============================

function adicionarLinhaBebida(){
    (cardapioBebidas.length ? Promise.resolve(cardapioBebidas) : fetch("produtos.json").then(r=>r.json()).then(produtos=>produtos.filter(p=>p.categoria==="bebidas"))).then(bebidas=>{
        const id = Date.now()
        const linhaHTML = `
        <div id="bebida_${id}" class="bebida-extra-card">
            <div class="bebida-extra-topo">
                <select class="bebidaSelect bebida-extra-select" onchange="atualizarPrecoBebida(${id})">
                    <option value="">Selecione a bebida...</option>
                    ${bebidas.map(b=>`<option value="${b.id||""}" data-preco="${b.preco}">${b.nome} — R$${(b.preco).toFixed(2).replace(".",",")}</option>`).join("")}
                </select>
            </div>
            <div class="bebida-extra-rodape">
                <span class="bebida-extra-preco" id="precoBebida_${id}">Selecione uma bebida</span>
                <div class="bebida-extra-ctrl">
                    <button class="btn-qtd-branco" onclick="diminuirBebida(${id})">-</button>
                    <span id="qtd_${id}" class="qtd-bebida-branco">1</span>
                    <button class="btn-qtd-branco" onclick="aumentarBebida(${id})">+</button>
                    <span class="btn-remover-link-escuro" onclick="removerLinhaBebida(${id})">
                        <span class="x-vermelho">X</span>
                        <span class="remover-escuro">Remover</span>
                    </span>
                </div>
            </div>
        </div>`
        document.getElementById("extrasBebidas").insertAdjacentHTML("beforeend", linhaHTML)
    })
}

function atualizarPrecoBebida(id){
    const sel   = document.querySelector(`#bebida_${id} .bebidaSelect`)
    const preco = Number(sel?.selectedOptions[0]?.dataset.preco || 0)
    const el    = document.getElementById(`precoBebida_${id}`)
    if(!el) return
    if(preco > 0){ el.innerText = `R$ ${(preco).toFixed(2).replace(".",",")}`; el.style.color = "#16a34a" }
    else { el.innerText = "Selecione uma bebida"; el.style.color = "#999" }
}

function aumentarBebida(id){ const e=document.getElementById("qtd_"+id); e.innerText=Number(e.innerText)+1 }
function diminuirBebida(id){ const e=document.getElementById("qtd_"+id); const v=Number(e.innerText); if(v>1) e.innerText=v-1 }
function removerLinhaBebida(id){ document.getElementById("bebida_"+id)?.remove() }

// ===============================
// ENVIAR PEDIDO
// ===============================

function enviarPedido(){
    if(carrinho.length===0){ mostrarToastSimples("Seu carrinho esta vazio!"); return }
    const nomeDigitado = document.getElementById("nomeCliente")?.value?.trim()
    if(!cliente && !nomeDigitado){
        mostrarCadastroCheckout(()=> processarEnvio())
        return
    }
    processarEnvio()
}

async function processarEnvio(){
    const status = verificarHorario()
    const nomeCliente = document.getElementById("nomeCliente")?.value?.trim() || cliente?.nome?.trim() || ""
    if(!nomeCliente){
        const el=document.getElementById("nomeCliente")
        if(el){ el.style.border="2px solid red"; el.placeholder="Digite seu nome primeiro"; el.focus() }
        return
    }
    numeroPedido++
    localStorage.setItem("numeroPedido",numeroPedido)
    const nf=numeroPedido.toString().padStart(3,"0")
    const rua    = document.getElementById("rua")?.value||""
    const numero = document.getElementById("numero")?.value||""
    const bairro = document.getElementById("bairroSelecionado")?.value||""
    const compl  = document.getElementById("complemento")?.value||""
    let end=`${rua}, No ${numero} - ${bairro}`
    if(compl) end+=` (${compl})`
    const pagamento = document.getElementById("pagamento")?.value||"Nao informado"
    const troco     = document.getElementById("troco")?.value||""
    const freteBase=calcularFretePorBairro(bairro)
    const tempo=tempoEstimadoPorBairro(bairro)
    const sub=carrinho.reduce((a,i)=>a+i.preco*i.qtd,0)
    const dr=verificarRelampago()?sub*0.05:0

    // Desconto de boas-vindas/Diamante/cupom e frete gratis do 5o pedido com
    // pizza: conferidos no Supabase agora, nao mais calculados so no
    // navegador - vale pra Pix, Cartao e Dinheiro igual.
    const descServ = await calcularDescontosServidor(sub-dr, temPizzaNoCarrinho(), freteBase, cupomAplicado?.codigo || null)
    const frete = descServ.frete
    const freteGratis = descServ.freteGratis
    const dc = descServ.desconto
    const total=Math.max(0, sub-dr-dc+frete)
    let msg=""
    msg+=`*${CONFIG.marca.nome.toUpperCase()}*\n`
    msg+=`*Pedido No ${nf}*\n`
    if(!status.aberto){
        const prox = proximaAbertura()
        msg+=`*PEDIDO AGENDADO - Entrara na fila ${prox ? `${prox.ehAmanha ? "amanha " : ""}as ${prox.abre}h` : "no proximo horario de funcionamento"}*\n`
    }
    msg+="-------------------------\n\n"
    msg+=`*Cliente:* ${nomeCliente}\n\n`
    msg+="*ITENS DO PEDIDO:*\n"
    carrinho.forEach(i=>{ msg+=`  - ${i.qtd}x ${i.nome}\n` })
    msg+="\n-------------------------\n"
    msg+=`Subtotal: R$ ${(sub).toFixed(2).replace(".",",")}\n`
    if(dr>0) msg+=`Desconto relampago (5%): -R$ ${(dr).toFixed(2).replace(".",",")}\n`
    if(dc>0) msg+=`${descServ.motivo} (-${descServ.descontoPct}%): -R$ ${(dc).toFixed(2).replace(".",",")}\n`
    msg+=`Frete: ${freteGratis?"GRATIS":"R$ "+frete.toFixed(2).replace(".",",")}\n`
    msg+=`\n*TOTAL A PAGAR: R$ ${(total).toFixed(2).replace(".",",")}*\n`
    msg+=`\nTempo estimado: *${tempo}*\n`
    msg+=`Endereco: ${end}\n`
    msg+=`Pagamento: ${pagamento}\n`
    if(pagamento==="PIX" || pagamento==="Cartão"){
        // Nao chama sincronizarPedidoComSistema aqui - pro Pix/cartao, quem
        // cria a venda de verdade e o pagamento sendo confirmado (trigger
        // criar_vendas_do_pedido_pago no Supabase), so quando o dinheiro cai
        // mesmo. Chamar os dois contaria a mesma venda em dobro (estoque
        // baixando duas vezes, Caixa somando o valor duas vezes).
        const dadosPedido = montarDadosPedido(nomeCliente, end, total, sub, freteGratis?0:frete, dr+dc)
        msg+=`\n*TOTAL PAGO: R$ ${(total).toFixed(2).replace(".",",")}*\n`
        msg+="\nPagamento confirmado automaticamente. Obrigado pela preferencia!\n"
        msg+="Acompanhe seu pedido pelo WhatsApp."

        const pago = pagamento==="PIX"
            ? await pagarComPix(dadosPedido, total, msg)
            : await pagarComCartao(dadosPedido, total, msg)

        if(!pago){
            numeroPedido--
            localStorage.setItem("numeroPedido",numeroPedido)
            return
        }
        mostrarProgressoFidelidade(total,temComidaNoCarrinho())
        // Nao redireciona pro WhatsApp sozinho aqui - a tela de sucesso do
        // pagamento (mostrarSucessoPagamento) ja mostra o botao de enviar o
        // comprovante, que e o unico contato com o WhatsApp que faz sentido
        // depois de um pagamento ja confirmado automaticamente.
        limparCarrinhoPosPedido()
        return
    }

    // Dinheiro (e qualquer forma paga na entrega): nao ha pagamento online
    // pra confirmar, entao a sincronizacao com o sistema aqui e a unica
    // fonte de verdade - dispara direto, sem gate nenhum.
    const sincronizacaoPromise = sincronizarPedidoComSistema(nomeCliente, end, nf)
    if(pagamento==="Dinheiro"&&troco) msg+=`Troco para: R$ ${troco}\n`
    msg+="\nObrigado pela preferencia!\n"
    msg+="Acompanhe seu pedido pelo WhatsApp."
    mostrarProgressoFidelidade(total,temComidaNoCarrinho())
    await sincronizacaoPromise
    finalizarPedido(msg)
}

function limparCarrinhoPosPedido(){
    carrinho=[]; atualizarCarrinho(); cupomAplicado=null
}

function finalizarPedido(msg){
    limparCarrinhoPosPedido()
    mostrarToastSimples("Pedido pronto! Abrindo o WhatsApp...")
    setTimeout(()=>{
        window.location.href=`https://wa.me/${CONFIG.contato.whatsapp}?text=${encodeURIComponent(msg)}`
    }, 700)
}

// ===============================
// INSTALAR COMO APP (PWA)
// ===============================

// O navegador so oferece "Instalar app" com um service worker ativo -
// sem isso, o manifest.json sozinho nao e suficiente.
if("serviceWorker" in navigator){
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(()=>{}))
}

let promptInstalacao = null

window.addEventListener("beforeinstallprompt", (e)=>{
    e.preventDefault()
    promptInstalacao = e
    if(localStorage.getItem("instalarBannerFechado") === "sim") return
    const el = document.getElementById("instalarBanner")
    if(el) el.style.display = "flex"
})

function instalarApp(){
    if(!promptInstalacao) return
    promptInstalacao.prompt()
    promptInstalacao.userChoice.finally(()=>{
        promptInstalacao = null
        fecharInstalarBanner()
    })
}

function fecharInstalarBanner(){
    document.getElementById("instalarBanner").style.display = "none"
    localStorage.setItem("instalarBannerFechado", "sim")
}

window.addEventListener("appinstalled", fecharInstalarBanner)

// Aproveita o momento de instalar o app pra capturar o cadastro (nome/
// WhatsApp/aniversario) de quem ainda nao tem - vira lead de verdade no
// Supabase mesmo que a pessoa nao feche pedido nenhum ainda.
window.addEventListener("appinstalled", ()=>{
    if(cliente) return
    setTimeout(()=>{
        mostrarCadastroCheckout(()=> mostrarToastSimples("Cadastro completo! Já pode aproveitar os benefícios."), "boasVindas")
    }, 1200)
})

// Registra as pizzas e bebidas do pedido como vendas no sistema de gestao
// (Supabase). Roda em segundo plano - se falhar, so avisa no console; o
// pedido pelo WhatsApp (fonte oficial do pedido) nunca fica bloqueado por isso.
function sincronizarPedidoComSistema(nomeCliente, enderecoTexto, numeroPedidoTexto){
    const observacoes = `Pedido delivery #${numeroPedidoTexto}`
    const itens = []
    carrinho.forEach(item=>{
        if(item.tipo === "pizza" && item.saborId && item.tamanho){
            itens.push({ tipo:"pizza", sabor_id:item.saborId, tamanho:item.tamanho, quantidade:item.qtd, preco_unitario:item.preco, observacoes })
        } else if(item.tipo === "bebidas" && item.bebidaId){
            itens.push({ tipo:"bebida", bebida_id:item.bebidaId, quantidade:item.qtd, preco_unitario:item.preco, observacoes })
        } else if(item.tipo === "snacks" && item.lancheId){
            itens.push({ tipo:"lanche", lanche_id:item.lancheId, quantidade:item.qtd, preco_unitario:item.preco, observacoes })
        } else if(item.tipo === "combo" && item.comboId){
            itens.push({ tipo:"combo", combo_id:item.comboId, quantidade:item.qtd, preco_unitario:item.preco, itens_inclusos:item.itensInclusos||[], observacoes })
        }
    })
    if(itens.length === 0) return Promise.resolve(null)
    return enviarPedidoParaSistema({
        itens,
        nome: nomeCliente,
        telefone: cliente?.whatsapp || null,
        endereco: enderecoTexto,
        aniversario: cliente?.aniversario || null,
        observacoes
    })
}

// ===============================
// CARDAPIO COMPLETO (SEO) + SCHEMA.ORG
// ===============================
// O cardapio interativo (Pizzas/Bebidas/Combos/Snacks) so aparece apos um
// clique, entao nunca existe no HTML carregado - o que o torna invisivel
// para crawlers. Esta secao renderiza o cardapio completo, sempre, assim
// que a pagina carrega (nao depende de clique), e a partir dos mesmos dados
// monta o JSON-LD de Menu (schema.org), garantindo que o que o Google ve
// bate com o que o cliente ve.

function absoluteUrl(caminho){
    if(!caminho) return undefined
    try{ return new URL(caminho, CONFIG.seo.baseUrl || location.href).href }
    catch(e){ return undefined }
}

async function renderizarCardapioSEO(){
    await cardapioProntoPromise
    const pizzas = listaPizzasAtual()
    let bebidas = cardapioBebidas
    let combos = [], snacks = []
    try{
        const produtos = await fetch("produtos.json").then(r=>r.json())
        if(!bebidas.length) bebidas = produtos.filter(p=>p.categoria==="bebidas")
        combos = produtos.filter(p=>p.categoria==="combos")
        snacks = produtos.filter(p=>p.categoria==="snacks")
    }catch(e){
        console.warn("Nao foi possivel carregar produtos.json para o cardapio completo.", e)
    }

    function precoFmt(v){ return Number(v).toFixed(2).replace(".",",") }

    function itemAccordion({nome, desc, img, precoResumo, precoDetalhe}){
        return `<details class="cardapio-item">
            <summary>
                ${img ? `<img src="${img}" alt="${nome}" loading="lazy" onerror="this.style.display='none'">` : `<span class="cardapio-item-sem-img">🍽️</span>`}
                <span class="cardapio-item-nome">${nome}</span>
                <span class="cardapio-item-preco">${precoResumo}</span>
                <span class="cardapio-item-seta">▾</span>
            </summary>
            <div class="cardapio-item-corpo">
                ${desc ? `<p>${desc}</p>` : ""}
                ${precoDetalhe ? `<p class="cardapio-item-precos-detalhe">${precoDetalhe}</p>` : ""}
            </div>
        </details>`
    }

    function secaoHtml(titulo, icone, itens, item){
        if(!itens.length) return ""
        return `<div class="cardapio-secao"><h3>${icone} ${titulo}</h3><div class="cardapio-lista">${itens.map(item).join("")}</div></div>`
    }

    const el = document.getElementById("cardapioCompleto")
    if(el){
        let html = `<summary>📖 Ver Cardápio Completo</summary><p class="cardapio-completo-sub">Consulte todos os sabores, bebidas e combos disponíveis.</p>`
        html += secaoHtml("Pizzas", "🍕", pizzas, p => itemAccordion({
            nome: p.nome, desc: p.desc, img: p.img,
            precoResumo: `a partir de R$${precoFmt(p[tamanhosConfig()[0]?.campo || "precoP"])}`,
            precoDetalhe: tamanhosConfig().map(t=>`${t.rotulo} (${t.cm}) R$${precoFmt(p[t.campo])}`).join(" · ")
        }))
        html += secaoHtml("Bebidas", "🥤", bebidas, b => itemAccordion({
            nome: b.nome, img: b.img, precoResumo: `R$${precoFmt(b.preco)}`
        }))
        html += secaoHtml("Combos", "🎁", combos, c => itemAccordion({
            nome: c.nome, desc: c.descricao, img: c.foto, precoResumo: `R$${precoFmt(c.preco)}`
        }))
        html += secaoHtml("Snacks", "🍟", snacks, s => itemAccordion({
            nome: s.nome, desc: s.descricao, img: s.foto, precoResumo: `R$${precoFmt(s.preco)}`
        }))
        el.innerHTML = html
    }

    injetarMenuJsonLd(pizzas, bebidas, combos, snacks)
}

function injetarMenuJsonLd(pizzas, bebidas, combos, snacks){
    document.getElementById("menuJsonLd")?.remove()
    const menu = {
        "@context": "https://schema.org",
        "@type": "Menu",
        "@id": `${CONFIG.seo.baseUrl}#menu`,
        "name": `Cardápio ${CONFIG.marca.nome}`,
        "inLanguage": "pt-BR",
        "hasMenuSection": [
            {
                "@type": "MenuSection",
                "name": "Pizzas",
                "description": `Pizzas em ${tamanhosConfig().length} tamanhos: ${tamanhosConfig().map(t=>`${t.rotulo} (${t.cm})`).join(", ")}`,
                "hasMenuItem": pizzas.map(p=>({
                    "@type": "MenuItem",
                    "name": p.nome,
                    "description": p.desc || undefined,
                    "image": absoluteUrl(p.img),
                    "offers": tamanhosConfig().map(t=>({
                        "@type": "Offer",
                        "name": `${t.rotulo} (${t.cm})`,
                        "price": Number(p[t.campo] || 0).toFixed(2),
                        "priceCurrency": "BRL"
                    }))
                }))
            },
            {
                "@type": "MenuSection",
                "name": "Bebidas",
                "hasMenuItem": bebidas.map(b=>({
                    "@type": "MenuItem",
                    "name": b.nome,
                    "offers": { "@type": "Offer", "price": Number(b.preco).toFixed(2), "priceCurrency": "BRL" }
                }))
            },
            {
                "@type": "MenuSection",
                "name": "Combos",
                "hasMenuItem": combos.map(c=>({
                    "@type": "MenuItem",
                    "name": c.nome,
                    "description": c.descricao || undefined,
                    "image": absoluteUrl(c.foto),
                    "offers": { "@type": "Offer", "price": Number(c.preco).toFixed(2), "priceCurrency": "BRL" }
                }))
            },
            {
                "@type": "MenuSection",
                "name": "Snacks",
                "hasMenuItem": snacks.map(s=>({
                    "@type": "MenuItem",
                    "name": s.nome,
                    "description": s.descricao || undefined,
                    "image": absoluteUrl(s.foto),
                    "offers": { "@type": "Offer", "price": Number(s.preco).toFixed(2), "priceCurrency": "BRL" }
                }))
            }
        ]
    }
    const script = document.createElement("script")
    script.type = "application/ld+json"
    script.id = "menuJsonLd"
    script.textContent = JSON.stringify(menu)
    document.head.appendChild(script)
}

function copiarFallback(t){ const el=document.createElement("textarea"); el.value=t; document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el); mostrarToastSimples("Codigo Pix copiado!") }

function selecionarPagamento(valor){
    const select = document.getElementById("pagamento")
    if(!select) return
    select.value = valor
    select.dispatchEvent(new Event("change"))
    document.querySelectorAll(".pagamento-opcao").forEach(b => b.classList.toggle("ativo", b.dataset.valor === valor))
}

document.addEventListener("DOMContentLoaded",()=>{
    document.getElementById("pagamento")?.addEventListener("change", atualizarCarrinho)
})
