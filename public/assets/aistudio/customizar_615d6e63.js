// =============================================================
// PAINEL DO LOJISTA (customizar.html)
// =============================================================
// Personaliza o app de delivery sem mexer em codigo:
//   - carrega config.js (padrao) + cache local + config_loja (Supabase)
//   - monta os formularios por aba
//   - "Salvar e publicar" grava no Supabase (RPC com senha) e no cache local
//   - "Exportar config.js" baixa o arquivo pronto para versionar/deploy
//
// A senha de entrada e conferida contra o config.js e contra o Supabase
// (funcao verificar_senha_config_loja). O salvamento SEMPRE valida a senha
// no servidor (salvar_config_loja) - a protecao local e so conveniencia.

// ---------- Estado ----------
let C = null            // config de trabalho (padrao + cache + remoto)
let senhaPainel = ""    // senha digitada (usada no salvamento)
let cli = null          // cliente Supabase

const CHAVE_CACHE = "configLojaOverride"

// ---------- Helpers de DOM ----------
const el  = id => document.getElementById(id)
const vf  = id => (el(id)?.value ?? "")
const nf  = id => Number(el(id)?.value || 0)
const cf  = id => !!el(id)?.checked

function esc(s){
    return String(s ?? "")
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
}

function status(msg, tipo){
    const barra = el("statusBar")
    if(!barra) return
    barra.className = "status" + (tipo ? " " + tipo : "")
    barra.innerHTML = msg
}

function msgGate(msg){
    const g = el("gateMsg")
    if(g) g.innerText = msg || ""
}

// ---------- Merge / diff / cache ----------

function ehObjetoSimples(v){
    return v !== null && typeof v === "object" && !Array.isArray(v)
}

function mergeProfundo(base, extra){
    const saida = JSON.parse(JSON.stringify(base ?? {}))
    if(!ehObjetoSimples(extra)) return saida
    Object.keys(extra).forEach(chave=>{
        const valor = extra[chave]
        if(ehObjetoSimples(valor) && ehObjetoSimples(saida[chave])){
            saida[chave] = mergeProfundo(saida[chave], valor)
        } else if(valor !== undefined){
            saida[chave] = JSON.parse(JSON.stringify(valor))
        }
    })
    return saida
}

// Guarda apenas o que difere do padrao - o config.js continua evoluindo
// e valores nao personalizados acompanham as melhorias do template.
function diffProfundo(base, atual){
    if(Array.isArray(atual) || Array.isArray(base)){
        return JSON.stringify(atual ?? null) === JSON.stringify(base ?? null)
            ? undefined
            : JSON.parse(JSON.stringify(atual ?? null))
    }
    if(ehObjetoSimples(base) && ehObjetoSimples(atual)){
        const saida = {}
        Object.keys(atual).forEach(k=>{
            const d = diffProfundo(base[k], atual[k])
            if(d !== undefined) saida[k] = d
        })
        return Object.keys(saida).length ? saida : undefined
    }
    return JSON.stringify(atual ?? null) === JSON.stringify(base ?? null) ? undefined : atual
}

function lerCache(){
    try{ return JSON.parse(localStorage.getItem(CHAVE_CACHE) || "{}") }catch(e){ return {} }
}
function salvarCache(dados){
    try{ localStorage.setItem(CHAVE_CACHE, JSON.stringify(dados || {})) }catch(e){}
}
function limparCache(){
    try{ localStorage.removeItem(CHAVE_CACHE) }catch(e){}
}

// ---------- Construtores de campos ----------

function linha(rotulo, inputHtml, dica){
    return `<label class="campo"><span>${rotulo}</span>${inputHtml}${dica ? `<small>${dica}</small>` : ""}</label>`
}
function inputTxt(id, valor, placeholder){
    return `<input type="text" id="${id}" value="${esc(valor)}" placeholder="${esc(placeholder || "")}">`
}
function inputNum(id, valor, min, max, step){
    return `<input type="number" id="${id}" value="${valor ?? 0}" min="${min ?? 0}"` +
        (max !== undefined ? ` max="${max}"` : "") +
        ` step="${step ?? 1}">`
}
function inputCor(id, valor){
    return `<input type="color" id="${id}" value="${esc(valor || "#000000")}" oninput="atualizarPreview()">`
}
function textarea(id, valor, rows){
    return `<textarea id="${id}" rows="${rows || 4}">${esc(valor)}</textarea>`
}

// ---------- Abas ----------

const TABS = [
    { id:"secMarca",       nome:"🏪 Marca & Contato" },
    { id:"secTema",        nome:"🎨 Tema" },
    { id:"secHorarios",    nome:"🕕 Horários" },
    { id:"secEntrega",     nome:"🛵 Entrega" },
    { id:"secFidelidade",  nome:"⭐ Fidelidade & Cupons" },
    { id:"secBanners",     nome:"🖼️ Banners" },
    { id:"secIntegracoes", nome:"🔌 Integrações & SEO" },
    { id:"secAvancado",    nome:"⚙️ Avançado" },
]

function montarTabs(){
    const nav = el("tabs")
    nav.innerHTML = TABS.map((t,i)=>`<button class="tab${i===0?" ativa":""}" data-sec="${t.id}">${t.nome}</button>`).join("")
    nav.addEventListener("click", ev=>{
        const b = ev.target.closest(".tab")
        if(!b) return
        document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("ativa", x === b))
        document.querySelectorAll(".sec").forEach(s=>s.style.display = (s.id === b.dataset.sec) ? "block" : "none")
    })
    document.querySelectorAll(".sec").forEach((s,i)=>{ s.style.display = i === 0 ? "block" : "none" })
}

// ---------- Ligacao com o Supabase ----------

async function conectarSupabase(){
    const cfg = (window.CONFIG_PADRAO && window.CONFIG_PADRAO.integracoes) || {}
    if(typeof window.supabase === "undefined" || !cfg.supabaseUrl || !cfg.supabaseAnonKey){
        status("⚠️ Supabase não configurado no config.js — o painel funciona só neste navegador (use \"Exportar config.js\" para aplicar em produção).", "aviso")
        return
    }
    cli = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey)
    try{
        const { data, error } = await cli
            .from("config_loja")
            .select("dados")
            .eq("id", 1)
            .maybeSingle()
        if(error){
            if(/relation|does not exist|schema|permission/i.test(error.message || "")){
                status("⚠️ Tabela <b>config_loja</b> não encontrada no Supabase. Rode o arquivo <b>supabase/config-loja.sql</b> no SQL Editor do projeto.", "aviso")
            }
            return
        }
        if(data && data.dados && Object.keys(data.dados).length){
            C = mergeProfundo(window.CONFIG_PADRAO || {}, data.dados)
            status("✓ Configuração carregada do Supabase.", "ok")
            render()
        } else {
            status("Nenhuma personalização salva ainda — mostrando os padrões do config.js.", "")
        }
    }catch(e){
        console.warn("Falha ao carregar configuração remota:", e)
    }
}

// ---------- Entrada (senha) ----------

async function entrarPainel(){
    const senha = el("gateSenha").value
    if(!senha){ msgGate("Digite a senha do painel"); return }

    // 1) senha do config.js
    if(C && C.painel && senha === C.painel.senha){ liberar(senha); return }

    // 2) senha cadastrada no Supabase
    if(cli){
        try{
            const { data, error } = await cli.rpc("verificar_senha_config_loja", { p_senha: senha })
            if(!error && data === true){ liberar(senha); return }
        }catch(e){ /* segue para o erro */ }
    }
    msgGate("Senha incorreta")
}

function liberar(senha){
    senhaPainel = senha
    msgGate("")
    el("gate").style.display = "none"
    el("painel").style.display = "block"
    render()
}

// ---------- Renderizacao geral ----------

function render(){
    if(!C) return
    el("painelTitulo").innerHTML = `🎨 Personalizar <b>${esc(C.marca?.nome || "")}</b>`
    document.title = `Personalizar — ${C.marca?.nome || "Delivery"}`
    renderMarca()
    renderTema()
    renderHorarios()
    renderEntrega()
    renderFidelidade()
    renderBanners()
    renderIntegracoes()
    renderAvancado()
    atualizarPreview()
}

// =============================================================
// ABA: MARCA & CONTATO
// =============================================================

function renderMarca(){
    const m = C.marca || {}, ct = C.contato || {}, en = C.endereco || {}, so = m.sobre || {}
    el("secMarca").innerHTML = `
    <h2>Marca & Contato</h2>
    <div class="grid2">
        ${linha("Nome da loja", inputTxt("mNome", m.nome))}
        ${linha("Slogan", inputTxt("mSlogan", m.slogan), "Ex: Pizzaria Delivery")}
        ${linha("Rodapé", inputTxt("mRodape", m.rodape), "Ex: © Minha Pizzaria")}
        ${linha("Crédito do rodapé (aceita HTML)", inputTxt("mCredito", m.credito))}
        ${linha("Favicon (caminho da imagem)", inputTxt("mFavicon", m.favicon))}
        ${linha("Ícone Apple (caminho da imagem)", inputTxt("mAppleIcon", m.appleIcon))}
    </div>
    ${linha("Frase de destaque no bloco de endereço (aceita HTML)", inputTxt("mTagline", m.tagline))}
    <h3>Sobre nós</h3>
    ${linha("Título", inputTxt("mSobreTitulo", so.titulo))}
    ${linha("Parágrafos (um por linha)", textarea("mSobreParagrafos", (so.paragrafos || []).join("\n"), 5))}
    <h3>Contato</h3>
    <div class="grid2">
        ${linha("WhatsApp (só dígitos, com 55)", inputTxt("mWhatsapp", ct.whatsapp), "Ex: 5565996953036 — destino dos pedidos")}
        ${linha("WhatsApp exibido", inputTxt("mWhatsappExibicao", ct.whatsappExibicao))}
        ${linha("Telefone (usado no Google/SEO)", inputTxt("mTelefone", ct.telefone))}
    </div>
    <h3>Endereço</h3>
    <div class="grid2">
        ${linha("Rua", inputTxt("mRua", en.rua))}
        ${linha("Número", inputTxt("mNumero", en.numero))}
        ${linha("Bairro", inputTxt("mBairro", en.bairro))}
        ${linha("Cidade", inputTxt("mCidade", en.cidade))}
        ${linha("Estado (UF)", inputTxt("mEstado", en.estado))}
        ${linha("CEP", inputTxt("mCep", en.cep))}
    </div>`
}

function coletarMarca(){
    C.marca = C.marca || {}
    C.marca.nome = vf("mNome").trim() || C.marca.nome
    C.marca.slogan = vf("mSlogan")
    C.marca.rodape = vf("mRodape")
    C.marca.credito = vf("mCredito")
    C.marca.favicon = vf("mFavicon")
    C.marca.appleIcon = vf("mAppleIcon")
    C.marca.tagline = vf("mTagline")
    C.marca.sobre = { titulo: vf("mSobreTitulo"), paragrafos: vf("mSobreParagrafos").split("\n").map(s=>s.trim()).filter(Boolean) }
    C.contato = C.contato || {}
    C.contato.whatsapp = vf("mWhatsapp").replace(/\D/g, "")
    C.contato.whatsappExibicao = vf("mWhatsappExibicao")
    C.contato.telefone = vf("mTelefone")
    C.endereco = C.endereco || {}
    C.endereco.rua = vf("mRua")
    C.endereco.numero = vf("mNumero")
    C.endereco.bairro = vf("mBairro")
    C.endereco.cidade = vf("mCidade")
    C.endereco.estado = vf("mEstado")
    C.endereco.cep = vf("mCep")
}

// =============================================================
// ABA: TEMA
// =============================================================

const CORES_TEMA = [
    ["temaPrimaria",      "Cor primária (botões e destaques)", "primaria"],
    ["temaPrimariaEsc",   "Cor primária escura (hover)",       "primariaEscura"],
    ["temaPrimariaClara", "Cor primária clara (fim dos gradientes)", "primariaClara"],
    ["temaGradInicio",    "Início dos gradientes",             "gradienteInicio"],
    ["temaPreco",         "Cor dos preços",                    "preco"],
    ["temaWhatsapp",      "Cor do botão WhatsApp",             "whatsapp"],
    ["temaVerde",         "Verde (descontos e sucesso)",       "verde"],
    ["temaVermelho",      "Vermelho (alertas e fechar)",       "vermelho"],
    ["temaFundo",         "Fundo do app",                      "fundo"],
    ["temaCard",          "Fundo dos cartões",                 "card"],
    ["temaItem",          "Fundo dos itens/listas",            "item"],
]

const FONTES_COMUNS = ["Nunito","Montserrat","Poppins","Inter","Roboto","Open Sans","Lato","Raleway",
    "Oswald","Playfair Display","Merriweather","Quicksand","Work Sans","Rubik","Barlow","Manrope"]

function renderTema(){
    const t = C.tema || {}, f = t.fontes || {}
    el("secTema").innerHTML = `
    <h2>Tema</h2>
    <p class="dica">Paleta de cores e fontes do app. A prévia abaixo atualiza na hora.</p>
    <div class="grid3">
        ${CORES_TEMA.map(([id, rotulo, chave])=>linha(rotulo, inputCor(id, t[chave]))).join("")}
    </div>
    <h3>Fontes (Google Fonts)</h3>
    <datalist id="listaFontes">${FONTES_COMUNS.map(x=>`<option value="${x}">`).join("")}</datalist>
    <div class="grid2">
        ${linha("Fonte dos textos", `<input type="text" id="temaFonteCorpo" list="listaFontes" value="${esc(f.corpo)}" oninput="atualizarPreview()">`)}
        ${linha("Fonte dos títulos", `<input type="text" id="temaFonteTitulo" list="listaFontes" value="${esc(f.titulo)}" oninput="atualizarPreview()">`)}
        ${linha("Arredondamento dos cantos", inputTxt("temaRaio", t.raio), "Ex: 14px")}
    </div>
    <h3>Prévia</h3>
    <div class="preview" id="preview">
        <div class="pv-topo">🍕 ${esc(C.marca?.nome || "Sua Loja")} — ${esc(C.marca?.slogan || "")}</div>
        <div class="pv-card">
            <b>Pizza Calabresa — Média 30cm</b>
            <span class="pv-preco">R$ 56,90</span>
            <button class="pv-btn">Adicionar ao carrinho</button>
            <div class="pv-item">✓ Frete grátis — Happy Hour: 5% OFF</div>
        </div>
    </div>`
}

function coletarTema(){
    C.tema = C.tema || {}
    CORES_TEMA.forEach(([id, , chave])=>{ C.tema[chave] = vf(id) })
    C.tema.fontes = { corpo: vf("temaFonteCorpo").trim() || "Nunito", titulo: vf("temaFonteTitulo").trim() || "Montserrat" }
    C.tema.raio = vf("temaRaio").trim() || "14px"
}

function atualizarPreview(){
    const pv = el("preview")
    if(!pv) return
    const p = pv.style
    if(el("temaPrimaria"))      p.setProperty("--pv-primaria", vf("temaPrimaria"))
    if(el("temaPrimariaEsc"))   p.setProperty("--pv-esc", vf("temaPrimariaEsc"))
    if(el("temaPrimariaClara")) p.setProperty("--pv-clara", vf("temaPrimariaClara"))
    if(el("temaGradInicio"))    p.setProperty("--pv-grad", vf("temaGradInicio"))
    if(el("temaPreco"))         p.setProperty("--pv-preco", vf("temaPreco"))
    if(el("temaFundo"))         p.setProperty("--pv-fundo", vf("temaFundo"))
    if(el("temaCard"))          p.setProperty("--pv-card", vf("temaCard"))
    if(el("temaItem"))          p.setProperty("--pv-item", vf("temaItem"))
    if(el("temaRaio"))          p.setProperty("--pv-raio", vf("temaRaio"))
    if(el("temaFonteCorpo"))    p.setProperty("--pv-font", `'${vf("temaFonteCorpo")}', sans-serif`)
    if(el("temaFonteTitulo"))   p.setProperty("--pv-font-titulo", `'${vf("temaFonteTitulo")}', sans-serif`)
}

// =============================================================
// ABA: HORÁRIOS
// =============================================================

const DIAS_NOMES = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"]

function renderHorarios(){
    const h = C.horarios || {}, hh = h.happyHour || {}, grade = h.grade || {}
    const linhas = DIAS_NOMES.map((nome, d)=>{
        const j = grade[String(d)]
        return `<div class="linha-dia">
            <label class="chk"><input type="checkbox" id="hAberto${d}" ${j ? "checked" : ""}> ${nome}</label>
            <div class="horas" id="hHoras${d}" style="display:${j ? "flex" : "none"}">
                das <input type="number" id="hAbre${d}" value="${j ? j.abre : 18}" min="0" max="24" step="0.5">
                às <input type="number" id="hFecha${d}" value="${j ? j.fecha : 24}" min="0" max="24" step="0.5">
            </div>
        </div>`
    }).join("")
    el("secHorarios").innerHTML = `
    <h2>Horários</h2>
    ${linha("Resumo (aparece no bloco de endereço)", inputTxt("hResumo", h.resumo), "Ex: Ter a Dom, 18h às 00h (fechado às segundas)")}
    <h3>Dias de funcionamento</h3>
    <div>${linhas}</div>
    <p class="dica">Use 24 para meia-noite. Ex: abre 18 e fecha 24 = das 18h às 00h.</p>
    <h3>Happy Hour / promoção relâmpago</h3>
    <label class="chk"><input type="checkbox" id="hhAtivo" ${hh.ativo ? "checked" : ""}> Ativo (desconto automático no carrinho)</label>
    <div class="grid2">
        ${linha("Começa (hora)", inputNum("hhInicio", hh.inicio, 0, 24, 0.5))}
        ${linha("Termina (hora)", inputNum("hhFim", hh.fim, 0, 24, 0.5))}
        ${linha("Desconto (%)", inputNum("hhPct", hh.descontoPct, 0, 100, 1))}
    </div>
    ${linha("Texto do banner", inputTxt("hhTexto", hh.texto), "Ex: Happy Hour: 5% OFF por tempo limitado!")}`
    DIAS_NOMES.forEach((_, d)=>{
        el("hAberto" + d).addEventListener("change", ()=>{
            el("hHoras" + d).style.display = el("hAberto" + d).checked ? "flex" : "none"
        })
    })
}

function coletarHorarios(){
    C.horarios = C.horarios || {}
    C.horarios.resumo = vf("hResumo")
    C.horarios.grade = {}
    for(let d = 0; d < 7; d++){
        const aberto = cf("hAberto" + d)
        C.horarios.grade[String(d)] = aberto ? { abre: nf("hAbre" + d), fecha: nf("hFecha" + d) } : null
    }
    C.horarios.happyHour = {
        ativo: cf("hhAtivo"),
        inicio: nf("hhInicio"),
        fim: nf("hhFim"),
        descontoPct: nf("hhPct"),
        texto: vf("hhTexto"),
    }
}

// =============================================================
// ABA: ENTREGA
// =============================================================

function renderEntrega(){
    const e = C.entrega || {}, p = e.bairroNaoListado || {}, fg = e.freteGratis || {}
    el("secEntrega").innerHTML = `
    <h2>Entrega / Frete</h2>
    <p class="dica">Cada faixa tem preço e tempo próprios. Bairros: um por linha — o app ignora acentos e maiúsculas na comparação.</p>
    <div id="listaFaixas"></div>
    <button class="btn-add" onclick="addFaixa()">+ Adicionar faixa</button>
    <h3>Bairro não listado</h3>
    <div class="grid2">
        ${linha("Preço (R$)", inputNum("fPrecoPadrao", p.preco, 0, 999, 0.5))}
        ${linha("Tempo estimado", inputTxt("fTempoPadrao", p.tempo), "Ex: 45-60 min")}
    </div>
    <h3>Frete grátis</h3>
    <div class="grid2">
        ${linha("A cada N itens de comida no carrinho", inputNum("fgItens", fg.itensComComida, 1, 99, 1))}
        ${linha("A cada N pedidos com pizza (histórico)", inputNum("fgPedidos", fg.pedidosComPizza, 1, 99, 1))}
    </div>
    ${linha("Níveis com frete sempre grátis (ids separados por vírgula)", inputTxt("fgNiveis", (fg.niveis || []).join(", ")), "Ex: diamante — veja os ids na aba Fidelidade")}`
    renderFaixas()
}

function renderFaixas(){
    const faixas = C.entrega?.faixas || []
    el("listaFaixas").innerHTML = faixas.map((f, i)=>`
    <div class="card-item">
        <div class="grid2">
            ${linha("Nome da faixa", inputTxt("faixaNome" + i, f.nome))}
            ${linha("Preço (R$)", inputNum("faixaPreco" + i, f.preco, 0, 999, 0.5))}
            ${linha("Tempo", inputTxt("faixaTempo" + i, f.tempo), "Ex: 20-30 min")}
        </div>
        ${linha("Bairros (um por linha)", textarea("faixaBairros" + i, (f.bairros || []).join("\n"), 6))}
        <button class="btn-remover" onclick="removerFaixa(${i})">🗑️ Remover faixa</button>
    </div>`).join("")
}

function coletarFaixas(){
    if(!C.entrega) C.entrega = {}
    const faixas = C.entrega.faixas || []
    C.entrega.faixas = faixas.map((f, i)=>({
        nome: vf("faixaNome" + i) || f.nome,
        preco: nf("faixaPreco" + i),
        tempo: vf("faixaTempo" + i),
        bairros: vf("faixaBairros" + i).split("\n").map(s=>s.trim()).filter(Boolean),
    }))
}

function addFaixa(){
    coletarFaixas()
    C.entrega.faixas.push({ nome:"Nova faixa", preco:10, tempo:"30-45 min", bairros:[] })
    renderFaixas()
}

function removerFaixa(i){
    coletarFaixas()
    C.entrega.faixas.splice(i, 1)
    renderFaixas()
}

function coletarEntrega(){
    coletarFaixas()
    C.entrega.bairroNaoListado = { preco: nf("fPrecoPadrao"), tempo: vf("fTempoPadrao") || "45-60 min" }
    C.entrega.freteGratis = {
        itensComComida: nf("fgItens") || 5,
        pedidosComPizza: nf("fgPedidos") || 5,
        niveis: vf("fgNiveis").split(",").map(s=>s.trim()).filter(Boolean),
    }
}

// =============================================================
// ABA: FIDELIDADE & CUPONS
// =============================================================

function renderFidelidade(){
    const f = C.fidelidade || {}
    el("secFidelidade").innerHTML = `
    <h2>Fidelidade & Cupons</h2>
    <div class="grid2">
        ${linha("Desconto de boas-vindas (% na 1ª compra)", inputNum("fidBoasVindas", f.boasVindasPct, 0, 100, 1))}
        ${linha("Pizza grátis a cada N pizzas", inputNum("fidPizzaGratis", f.pizzaGratisACada, 1, 99, 1))}
    </div>
    <h3>Níveis</h3>
    <p class="dica">Ordenados do menor para o maior gasto. "Mínimo" = quanto precisa gastar para alcançar o nível. "Desconto automático" = % aplicado sozinho no carrinho (ex: Diamante 15%).</p>
    <div id="listaNiveis"></div>
    <button class="btn-add" onclick="addNivel()">+ Adicionar nível</button>
    <h3>Cupons</h3>
    <p class="dica">Tipo <b>livre</b>: qualquer pessoa usa. Tipo <b>nível</b>: exige o gasto mínimo informado. Tipo <b>aniversário</b>: só vale no mês do aniversário cadastrado no app.</p>
    <div id="listaCupons"></div>
    <button class="btn-add" onclick="addCupom()">+ Adicionar cupom</button>`
    renderNiveis()
    renderCupons()
}

function renderNiveis(){
    const niveis = C.fidelidade?.niveis || []
    el("listaNiveis").innerHTML = niveis.map((n, i)=>`
    <div class="card-item">
        <div class="grid3">
            ${linha("Id (sem espaços)", inputTxt("nivelId" + i, n.id), "Ex: diamante")}
            ${linha("Nome", inputTxt("nivelNome" + i, n.nome))}
            ${linha("Cor", inputCor("nivelCor" + i, n.cor))}
            ${linha("Gasto mínimo (R$)", inputNum("nivelMinimo" + i, n.minimo, 0, 99999, 10))}
            ${linha("Desconto automático (%)", inputNum("nivelDesconto" + i, n.descontoPct, 0, 100, 1))}
        </div>
        ${linha("Descrição (aparece no app)", inputTxt("nivelDesc" + i, n.desc))}
        <button class="btn-remover" onclick="removerNivel(${i})">🗑️ Remover nível</button>
    </div>`).join("")
}

function renderCupons(){
    const cupons = C.cupons || []
    el("listaCupons").innerHTML = cupons.map((c, i)=>`
    <div class="card-item">
        <div class="grid3">
            ${linha("Código", inputTxt("cupomCodigo" + i, c.codigo))}
            ${linha("Desconto (%)", inputNum("cupomDesconto" + i, c.desconto, 0, 100, 1))}
            ${linha("Tipo", `<select id="cupomTipo${i}">
                <option value="livre" ${c.tipo === "livre" ? "selected" : ""}>Livre (qualquer um)</option>
                <option value="nivel" ${c.tipo === "nivel" ? "selected" : ""}>Nível (gasto mínimo)</option>
                <option value="aniversario" ${c.tipo === "aniversario" ? "selected" : ""}>Aniversário</option>
            </select>`)}
            ${linha("Gasto mínimo (R$, só p/ tipo nível)", inputNum("cupomMinimo" + i, c.minimo, 0, 99999, 10))}
        </div>
        ${linha("Mensagem", inputTxt("cupomMsg" + i, c.msg))}
        <button class="btn-remover" onclick="removerCupom(${i})">🗑️ Remover cupom</button>
    </div>`).join("")
}

function coletarFidelidade(){
    C.fidelidade = C.fidelidade || {}
    C.fidelidade.boasVindasPct = nf("fidBoasVindas")
    C.fidelidade.pizzaGratisACada = nf("fidPizzaGratis") || 10
    C.fidelidade.niveis = (C.fidelidade.niveis || []).map((n, i)=>({
        id: (vf("nivelId" + i) || n.id).replace(/\s+/g, "-").toLowerCase(),
        nome: vf("nivelNome" + i) || n.nome,
        cor: vf("nivelCor" + i) || n.cor,
        minimo: nf("nivelMinimo" + i),
        descontoPct: nf("nivelDesconto" + i),
        desc: vf("nivelDesc" + i),
    }))
    C.cupons = (C.cupons || []).map((c, i)=>({
        codigo: (vf("cupomCodigo" + i) || c.codigo).toUpperCase().trim(),
        desconto: nf("cupomDesconto" + i),
        tipo: vf("cupomTipo" + i) || "livre",
        minimo: nf("cupomMinimo" + i),
        msg: vf("cupomMsg" + i),
    }))
}

function addNivel(){
    coletarFidelidade()
    C.fidelidade.niveis.push({ id:"novo-nivel", nome:"Novo nível", cor:"#ff9800", minimo:0, descontoPct:0, desc:"" })
    renderNiveis()
}

function removerNivel(i){
    coletarFidelidade()
    C.fidelidade.niveis.splice(i, 1)
    renderNiveis()
}

function addCupom(){
    coletarFidelidade()
    C.cupons.push({ codigo:"NOVOCUPOM", desconto:10, tipo:"livre", minimo:0, msg:"10% off!" })
    renderCupons()
}

function removerCupom(i){
    coletarFidelidade()
    C.cupons.splice(i, 1)
    renderCupons()
}

// =============================================================
// ABA: BANNERS
// =============================================================

function renderBanners(){
    el("secBanners").innerHTML = `
    <h2>Banners</h2>
    <p class="dica">Carrossel do topo do app. O nome precisa bater com um combo do seu cardápio (o clique abre a montagem dele).</p>
    <div id="listaBanners"></div>
    <button class="btn-add" onclick="addBanner()">+ Adicionar banner</button>`
    renderListaBanners()
}

function renderListaBanners(){
    const banners = C.banners || []
    el("listaBanners").innerHTML = banners.map((b, i)=>`
    <div class="card-item">
        <div class="grid3">
            ${linha("Nome do combo", inputTxt("bannerNome" + i, b.nome))}
            ${linha("Preço (R$)", inputNum("bannerPreco" + i, b.preco, 0, 99999, 0.1))}
            ${linha("Foto (caminho)", inputTxt("bannerFoto" + i, b.foto))}
        </div>
        ${linha("Frase ao adicionar (opcional)", inputTxt("bannerToast" + i, b.toast), "Ex: perfeito pra dividir!")}
        <button class="btn-remover" onclick="removerBanner(${i})">🗑️ Remover banner</button>
    </div>`).join("")
}

function coletarBanners(){
    C.banners = (C.banners || []).map((b, i)=>({
        nome: vf("bannerNome" + i) || b.nome,
        preco: nf("bannerPreco" + i),
        foto: vf("bannerFoto" + i) || b.foto,
        toast: vf("bannerToast" + i),
    }))
}

function addBanner(){
    coletarBanners()
    C.banners.push({ nome:"Novo combo", preco:0, foto:"imagens/banners/", toast:"" })
    renderListaBanners()
}

function removerBanner(i){
    coletarBanners()
    C.banners.splice(i, 1)
    renderListaBanners()
}

// =============================================================
// ABA: INTEGRAÇÕES & SEO
// =============================================================

function renderIntegracoes(){
    const i = C.integracoes || {}, s = C.seo || {}, p = C.pwa || {}, ca = C.cardapio || {}
    el("secIntegracoes").innerHTML = `
    <h2>Integrações & SEO</h2>
    <p class="dica">Chaves do seu projeto. A <b>anon key</b> do Supabase e a chave pública do Mercado Pago são públicas por natureza (vão no app) — nunca coloque a service_role aqui.</p>
    <div class="grid2">
        ${linha("Supabase URL", inputTxt("iSupabaseUrl", i.supabaseUrl))}
        ${linha("Mercado Pago (chave pública)", inputTxt("iMpKey", i.mercadoPagoPublicKey))}
        ${linha("Chave Pix", inputTxt("iPixChave", i.pixChave))}
        ${linha("Link do painel de gestão", inputTxt("iPainelGestaoUrl", i.painelGestaoUrl))}
    </div>
    ${linha("Supabase anon key", textarea("iSupabaseAnonKey", i.supabaseAnonKey, 3))}
    <h3>SEO (Google / redes sociais)</h3>
    <div class="grid2">
        ${linha("URL publicada do app", inputTxt("sBaseUrl", s.baseUrl), "Termina com / — Ex: https://minhaloja.github.io/app/")}
        ${linha("Título (aba do navegador/Google)", inputTxt("sTitulo", s.titulo))}
        ${linha("Imagem de compartilhamento", inputTxt("sOgImage", s.ogImage))}
        ${linha("Faixa de preço", inputTxt("sFaixaPreco", s.faixaPreco), "Ex: R$32 - R$170")}
        ${linha("Tipo de culinária", inputTxt("sCulinaria", s.culinaria), "Ex: Pizza")}
        ${linha("Tipo de negócio (schema.org)", inputTxt("sTipo", s.tipo), "Ex: Restaurant, FastFoodRestaurant")}
    </div>
    ${linha("Descrição", textarea("sDescricao", s.descricao, 3))}
    ${linha("Cidades atendidas (uma por linha)", textarea("sAreaAtendida", (s.areaAtendida || []).join("\n"), 4))}
    <h3>PWA (instalação como app)</h3>
    <div class="grid2">
        ${linha("Nome completo", inputTxt("pNome", p.nome))}
        ${linha("Nome curto (ícone)", inputTxt("pShortName", p.shortName))}
        ${linha("Cor do tema (barra do navegador)", inputCor("pThemeColor", p.themeColor))}
        ${linha("Cor de fundo (tela de abertura)", inputCor("pBackgroundColor", p.backgroundColor))}
    </div>
    ${linha("Descrição", textarea("pDescricao", p.descricao, 2))}
    <label class="chk"><input type="checkbox" id="pManifestDinamico" ${p.manifestDinamico ? "checked" : ""}> Gerar manifest dinamicamente a partir desta config (senão usa o manifest.json do projeto)</label>
    <h3>Cardápio</h3>
    ${linha("Prefixo das descrições dos sabores", inputTxt("caPrefixo", ca.prefixoDescricao), "Deixe vazio para não prefixar. Ex: Massa 100% integral.")}`
}

function coletarIntegracoes(){
    C.integracoes = C.integracoes || {}
    C.integracoes.supabaseUrl = vf("iSupabaseUrl").trim()
    C.integracoes.supabaseAnonKey = vf("iSupabaseAnonKey").trim()
    C.integracoes.mercadoPagoPublicKey = vf("iMpKey").trim()
    C.integracoes.pixChave = vf("iPixChave").trim()
    C.integracoes.painelGestaoUrl = vf("iPainelGestaoUrl").trim()
    C.seo = C.seo || {}
    C.seo.baseUrl = vf("sBaseUrl").trim()
    C.seo.titulo = vf("sTitulo")
    C.seo.descricao = vf("sDescricao")
    C.seo.ogImage = vf("sOgImage")
    C.seo.faixaPreco = vf("sFaixaPreco")
    C.seo.culinaria = vf("sCulinaria")
    C.seo.tipo = vf("sTipo").trim() || "Restaurant"
    C.seo.areaAtendida = vf("sAreaAtendida").split("\n").map(s=>s.trim()).filter(Boolean)
    C.pwa = C.pwa || {}
    C.pwa.nome = vf("pNome")
    C.pwa.shortName = vf("pShortName")
    C.pwa.descricao = vf("pDescricao")
    C.pwa.themeColor = vf("pThemeColor")
    C.pwa.backgroundColor = vf("pBackgroundColor")
    C.pwa.manifestDinamico = cf("pManifestDinamico")
    C.cardapio = C.cardapio || {}
    C.cardapio.prefixoDescricao = vf("caPrefixo")
}

// =============================================================
// ABA: AVANÇADO
// =============================================================

function renderAvancado(){
    el("secAvancado").innerHTML = `
    <h2>Avançado</h2>
    <h3>Trocar a senha do painel</h3>
    <p class="dica">A senha fica guardada com hash no seu Supabase (tabela interna, sem acesso público). A senha inicial é <b>142536</b>.</p>
    <div class="grid2">
        ${linha("Senha atual", `<input type="password" id="senhaAtual" autocomplete="current-password">`)}
        ${linha("Nova senha (mínimo 6 caracteres)", `<input type="password" id="senhaNova" autocomplete="new-password">`)}
    </div>
    <button class="btn-sec" onclick="trocarSenha()">🔑 Trocar senha</button>
    <h3>Ferramentas</h3>
    <p class="dica">O painel salva no Supabase (nuvem) e neste navegador. O "Exportar config.js" serve para versionar/deploy manual.</p>
    <button class="btn-sec" onclick="exportarConfig()">⬇️ Exportar config.js</button>
    <button class="btn-sec" onclick="exportarManifest()">⬇️ Exportar manifest.json</button>
    <button class="btn-remover" onclick="restaurarPadrao()">↩️ Restaurar padrão (apaga a personalização salva)</button>
    <button class="btn-remover" onclick="limparCacheLocal()">🧹 Limpar cópia local neste navegador</button>`
}

async function trocarSenha(){
    const atual = el("senhaAtual").value
    const nova  = el("senhaNova").value
    if(!cli){ status("Supabase não conectado — não é possível trocar a senha da nuvem.", "aviso"); return }
    if(nova.length < 6){ status("A nova senha precisa de pelo menos 6 caracteres.", "erro"); return }
    const { error } = await cli.rpc("trocar_senha_config_loja", { p_senha_atual: atual, p_senha_nova: nova })
    if(error){
        status("Erro ao trocar a senha: " + error.message, "erro")
        return
    }
    senhaPainel = nova
    el("senhaAtual").value = ""
    el("senhaNova").value = ""
    status("✓ Senha trocada! Use a nova senha no próximo acesso.", "ok")
}

async function restaurarPadrao(){
    if(!confirm("Apagar TODA a personalização salva (nuvem e este navegador) e voltar aos padrões do config.js?")) return
    if(cli){
        const { error } = await cli.rpc("salvar_config_loja", { p_senha: senhaPainel, p_dados: {} })
        if(error){
            status("Erro ao restaurar: " + error.message, "erro")
            return
        }
    }
    limparCache()
    C = mergeProfundo(window.CONFIG_PADRAO || {}, {})
    render()
    status("✓ Padrão restaurado.", "ok")
}

function limparCacheLocal(){
    limparCache()
    status("✓ Cópia local removida. Recarregue o app para ver os padrões.", "ok")
}

// ---------- Salvar / exportar ----------

function coletarTudo(){
    coletarMarca()
    coletarTema()
    coletarHorarios()
    coletarEntrega()
    coletarFidelidade()
    coletarBanners()
    coletarIntegracoes()
}

async function salvarPainel(){
    try{
        coletarTudo()
        const dados = diffProfundo(window.CONFIG_PADRAO || {}, C) || {}

        if(!cli){
            salvarCache(dados)
            status("⚠️ Supabase indisponível — configuração salva só neste navegador. Use \"Exportar config.js\" para aplicar em produção.", "aviso")
            return
        }

        if(!senhaPainel){
            senhaPainel = prompt("Confirme a senha do painel para salvar:") || ""
            if(!senhaPainel){ status("Salvamento cancelado.", "erro"); return }
        }

        status("Salvando...")
        const { error } = await cli.rpc("salvar_config_loja", { p_senha: senhaPainel, p_dados: dados })
        if(error){
            const msg = error.message || ""
            if(/senha/i.test(msg)){
                senhaPainel = ""
                status("Senha incorreta — clique em Salvar novamente para tentar outra vez.", "erro")
            } else if(/function|schema cache|does not exist|permission/i.test(msg)){
                status("A tabela/função <b>config_loja</b> não existe no Supabase. Rode o arquivo <b>supabase/config-loja.sql</b> no SQL Editor do projeto.", "erro")
            } else {
                status("Erro ao salvar: " + msg, "erro")
            }
            return
        }
        salvarCache(dados)
        status("✓ Publicado! Abra o app (ou recarregue a página aberta) para ver as mudanças.", "ok")
    }catch(e){
        status("Erro inesperado ao salvar: " + (e?.message || e), "erro")
    }
}

function baixarArquivo(nome, conteudo, tipo){
    const blob = new Blob([conteudo], { type: tipo || "text/plain" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = nome
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(()=>URL.revokeObjectURL(a.href), 4000)
}

function exportarConfig(){
    try{
        coletarTudo()
        const conteudo =
            "// Gerado pelo painel customizar.html em " + new Date().toLocaleString("pt-BR") + "\n" +
            "// Substitua o config.js do projeto por este arquivo (ou copie os valores).\n" +
            "window.CONFIG_PADRAO = " + JSON.stringify(C, null, 4) + "\n"
        baixarArquivo("config.js", conteudo, "text/javascript")
        status("✓ config.js exportado. Substitua o arquivo no projeto para virar o novo padrão.", "ok")
    }catch(e){
        status("Erro ao exportar: " + (e?.message || e), "erro")
    }
}

function gerarManifestPainel(p){
    p = p || {}
    return {
        name: p.nome || "Delivery",
        short_name: p.shortName || p.nome || "Delivery",
        description: p.descricao || "",
        display: "standalone",
        start_url: "./",
        scope: "./",
        background_color: p.backgroundColor || "#111",
        theme_color: p.themeColor || "#d32f2f",
        icons: p.icons || [
            { src: "imagens/icons/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "imagens/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
    }
}

function exportarManifest(){
    try{
        coletarIntegracoes()
        baixarArquivo("manifest.json", JSON.stringify(gerarManifestPainel(C.pwa), null, 4), "application/json")
        status("✓ manifest.json exportado. Substitua o arquivo no projeto.", "ok")
    }catch(e){
        status("Erro ao exportar manifest: " + (e?.message || e), "erro")
    }
}

// ---------- Boot ----------

document.addEventListener("DOMContentLoaded", async ()=>{
    C = mergeProfundo(window.CONFIG_PADRAO || {}, lerCache())
    montarTabs()
    render()
    await conectarSupabase()
})
