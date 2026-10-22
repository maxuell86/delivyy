// ===============================
// CONFIG LOADER (merge + aplicacao de tema/marca/SEO)
// ===============================
// Este arquivo transforma a configuracao (config.js + o que o lojista salvou
// no painel no Supabase + cache local do navegador) em:
//   - window.CONFIG: a config efetiva, lida por todo o app;
//   - variaveis CSS do tema aplicadas no :root;
//   - marca/SEO/endereco aplicados no DOM.
//
// Ordem de resolucao (o ultimo ganha):
//   config.js (padrao)  <  cache local (ultima config remota conhecida)
//   <  config_loja do Supabase (buscado por integracao-sistema.js)
//
// Se o Supabase estiver fora do ar, o cache local garante que o app continua
// com a ultima configuracao conhecida - nunca quebra por causa disso.

const CONFIG_CHAVE_CACHE = "configLojaOverride"

// ---------- Merge profundo (o "extra" sobrescreve o "base") ----------

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

// ---------- Cache local ----------

function lerConfigCache(){
    try{ return JSON.parse(localStorage.getItem(CONFIG_CHAVE_CACHE) || "{}") }catch(e){ return {} }
}

function salvarConfigNoCache(dados){
    try{ localStorage.setItem(CONFIG_CHAVE_CACHE, JSON.stringify(dados || {})) }catch(e){}
}

function limparConfigCache(){
    try{ localStorage.removeItem(CONFIG_CHAVE_CACHE) }catch(e){}
}

// ---------- Helpers de cor/fonte ----------

function hexParaRgb(hex){
    const limpo = String(hex || "").replace("#", "").trim()
    if(limpo.length === 3){
        const r = limpo[0]+limpo[0], g = limpo[1]+limpo[1], b = limpo[2]+limpo[2]
        return `${parseInt(r,16)},${parseInt(g,16)},${parseInt(b,16)}`
    }
    if(limpo.length === 6){
        return `${parseInt(limpo.slice(0,2),16)},${parseInt(limpo.slice(2,4),16)},${parseInt(limpo.slice(4,6),16)}`
    }
    return "255,152,0"
}

function urlFontesGoogle(fontes){
    const corpo  = (fontes?.corpo || "").trim()
    const titulo = (fontes?.titulo || "").trim()
    const fam = n => n.split(" ").join("+")
    const partes = []
    if(corpo)  partes.push(`family=${fam(corpo)}:wght@400;600;700;800;900`)
    if(titulo && titulo.toLowerCase() !== corpo.toLowerCase()) partes.push(`family=${fam(titulo)}:wght@700;800;900`)
    if(!partes.length) return ""
    return `https://fonts.googleapis.com/css2?${partes.join("&")}&display=swap`
}

// ---------- Aplicar tema (variaveis CSS) ----------

function aplicarTema(){
    const t = window.CONFIG?.tema || {}
    const raiz = document.documentElement
    const set = (nome, valor) => { if(valor) raiz.style.setProperty(nome, valor) }

    set("--laranja",       t.primaria)
    set("--laranja-esc",   t.primariaEscura)
    set("--laranja-clara", t.primariaClara)
    set("--grad-inicio",   t.gradienteInicio)
    set("--laranja-rgb",       hexParaRgb(t.primaria))
    set("--laranja-clara-rgb", hexParaRgb(t.primariaClara))
    set("--cor-preco",     t.preco)
    set("--cor-preco-rgb", hexParaRgb(t.preco))
    set("--verde-wpp",     t.whatsapp)
    set("--verde-wpp-rgb", hexParaRgb(t.whatsapp))
    set("--verde",         t.verde)
    set("--verde-rgb",     hexParaRgb(t.verde))
    set("--vermelho",      t.vermelho)
    set("--vermelho-rgb",  hexParaRgb(t.vermelho))
    set("--bg-dark",       t.fundo)
    set("--bg-card",       t.card)
    set("--bg-item",       t.item)
    set("--radius",        t.raio)

    const corpo  = t.fontes?.corpo  || "Nunito"
    const titulo = t.fontes?.titulo || corpo
    set("--font-body",   `'${corpo}', Arial, sans-serif`)
    set("--font-titulo", `'${titulo}', Arial, sans-serif`)

    const url = urlFontesGoogle(t.fontes)
    let link = document.getElementById("fonteLink")
    if(!link){
        link = document.createElement("link")
        link.id = "fonteLink"
        link.rel = "stylesheet"
        document.head.appendChild(link)
    }
    if(url) link.href = url
}

// ---------- Aplicar PWA (meta theme-color + manifest opcional) ----------

function gerarManifest(){
    const p = window.CONFIG?.pwa || {}
    return {
        name: p.nome || "Delivery",
        short_name: p.shortName || p.nome || "Delivery",
        description: p.descricao || "",
        display: "standalone",
        start_url: "./",
        scope: "./",
        background_color: p.backgroundColor || "#111",
        theme_color: p.themeColor || "#d32f2f",
        icons: p.icons || []
    }
}

function aplicarPwa(){
    const p = window.CONFIG?.pwa || {}
    let meta = document.querySelector('meta[name="theme-color"]')
    if(!meta){
        meta = document.createElement("meta")
        meta.name = "theme-color"
        document.head.appendChild(meta)
    }
    if(p.themeColor) meta.content = p.themeColor

    if(p.manifestDinamico){
        try{
            const blob = new Blob([JSON.stringify(gerarManifest())], { type: "application/manifest+json" })
            const link = document.querySelector('link[rel="manifest"]')
            if(link) link.href = URL.createObjectURL(blob)
        }catch(e){ /* mantem o manifest.json estatico */ }
    }
}

// ---------- Aplicar SEO (title, metas, schema.org) ----------

function setMeta(seletor, atributo, valor){
    if(!valor) return
    let el = document.head.querySelector(seletor)
    if(!el){
        if(seletor.startsWith("link")){
            el = document.createElement("link")
            const mRel = seletor.match(/rel="([^"]+)"/)
            el.rel = mRel ? mRel[1] : "canonical"
        } else {
            el = document.createElement("meta")
            const mNome = seletor.match(/meta\[name="([^"]+)"\]/)
            const mProp = seletor.match(/meta\[property="([^"]+)"\]/)
            if(mNome) el.setAttribute("name", mNome[1])
            if(mProp) el.setAttribute("property", mProp[1])
        }
        document.head.appendChild(el)
    }
    el.setAttribute(atributo, valor)
}

function horaSchema(h){
    h = Number(h)
    if(!isFinite(h) || h >= 24) return "23:59"
    const hh = Math.floor(h)
    const mm = Math.round((h - hh) * 60)
    return `${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}`
}

function horariosSchema(){
    const grade = window.CONFIG?.horarios?.grade || {}
    const nomes = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
    const grupos = {}
    Object.keys(grade).forEach(dia=>{
        const j = grade[dia]
        if(!j) return
        const chave = `${j.abre}-${j.fecha}`
        if(!grupos[chave]) grupos[chave] = { dias: [], abre: j.abre, fecha: j.fecha }
        grupos[chave].dias.push(nomes[Number(dia)])
    })
    return Object.values(grupos).map(g=>({
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": g.dias,
        "opens": horaSchema(g.abre),
        "closes": horaSchema(g.fecha)
    }))
}

function gerarRestaurantJsonLd(){
    const c = window.CONFIG
    const urlAbs = (x) => {
        try{ return x ? new URL(x, c.seo.baseUrl || location.href).href : undefined }catch(e){ return x }
    }
    return {
        "@context": "https://schema.org",
        "@type": c.seo.tipo || "Restaurant",
        "@id": `${c.seo.baseUrl}#restaurant`,
        "name": c.marca.nome,
        "url": c.seo.baseUrl,
        "image": urlAbs(c.seo.ogImage),
        "telephone": c.contato.telefone || `+${c.contato.whatsapp}`,
        "priceRange": c.seo.faixaPreco,
        "servesCuisine": c.seo.culinaria,
        "acceptsReservations": false,
        "paymentAccepted": (c.pedido?.pagamentos || []).map(p=>p.nome || p.valor).join(", "),
        "currenciesAccepted": "BRL",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": `${c.endereco.rua}, ${c.endereco.numero} - Bairro ${c.endereco.bairro}`,
            "addressLocality": c.endereco.cidade,
            "addressRegion": c.endereco.estado,
            "addressCountry": "BR"
        },
        "areaServed": (c.seo.areaAtendida || []).map(nome=>({ "@type": "City", "name": nome })),
        "openingHoursSpecification": horariosSchema()
    }
}

function aplicarSEO(){
    const c = window.CONFIG
    if(!c || !c.seo) return
    if(c.seo.titulo) document.title = c.seo.titulo
    setMeta('meta[name="description"]', "content", c.seo.descricao)
    setMeta('link[rel="canonical"]', "href", c.seo.baseUrl)
    setMeta('meta[property="og:title"]', "content", c.seo.titulo)
    setMeta('meta[property="og:description"]', "content", c.seo.descricao)
    setMeta('meta[property="og:url"]', "content", c.seo.baseUrl)
    try{
        if(c.seo.ogImage) setMeta('meta[property="og:image"]', "content", new URL(c.seo.ogImage, c.seo.baseUrl || location.href).href)
    }catch(e){}
    const ld = document.getElementById("restaurantJsonLd")
    if(ld){
        try{ ld.textContent = JSON.stringify(gerarRestaurantJsonLd()) }catch(e){}
    }
}

// ---------- Aplicar marca (conteudo do DOM) ----------

function aplicarMarca(){
    const c = window.CONFIG
    if(!c) return
    const el = id => document.getElementById(id)

    // Bloco de endereco/contato
    const bloco = el("blocoLoja")
    if(bloco){
        const wa = `https://wa.me/${c.contato.whatsapp}`
        bloco.innerHTML = `
<h1 style="font-size:17px;margin-bottom:6px;">🍕 ${c.marca.nome} — ${c.marca.slogan}</h1>
📍 ${c.endereco.rua} Nº ${c.endereco.numero}<br>
Bairro ${c.endereco.bairro} – ${c.endereco.cidade}
<br>
📞 <a href="${wa}" style="color:inherit;">${c.contato.whatsappExibicao || c.contato.whatsapp}</a>
&nbsp;|&nbsp; 🕕 ${c.horarios.resumo || ""}
<br>
${c.marca.tagline ? c.marca.tagline + "<br>" : ""}
<button onclick="abrirMapa()">📍 Ver no mapa</button>`
    }

    // Sobre nos
    const sobre = el("sobreNos")
    if(sobre && c.marca.sobre){
        sobre.innerHTML = `<h2>${c.marca.sobre.titulo || ""}</h2>` +
            (c.marca.sobre.paragrafos || []).map(p=>`<p>${p}</p>`).join("")
    }

    // Rodape
    const rodape = el("rodapeLoja")
    if(rodape){
        rodape.innerHTML = `${c.marca.rodape || ""}${c.marca.credito ? `<br>${c.marca.credito}` : ""}`
    }

    // Banner do happy hour (relampago)
    const rel = el("bannerRelampago")
    if(rel){
        const hh = c.horarios.happyHour || {}
        rel.innerHTML = `⚡ <b>${hh.texto || ""}</b> <span id="countdownRelampago" class="rel-countdown"></span>`
    }

    // Formas de pagamento
    const boxPag = el("pagamentoOpcoes")
    const pagamentos = c.pedido?.pagamentos || []
    if(boxPag && pagamentos.length){
        const sel = el("pagamento")
        const atual = sel?.value || pagamentos[0].valor
        boxPag.innerHTML = pagamentos.map(p=>`
<button type="button" class="pagamento-opcao" data-valor="${p.valor}" onclick="selecionarPagamento('${p.valor}')">
  <span class="pagamento-icone">${p.icone || ""}</span> ${p.nome || p.valor}
</button>`).join("")
        if(sel){
            sel.innerHTML = pagamentos.map(p=>`<option>${p.valor}</option>`).join("")
            if(pagamentos.some(p=>p.valor === atual)) sel.value = atual
        }
        const valorAtual = pagamentos.some(p=>p.valor === atual) ? atual : pagamentos[0].valor
        boxPag.querySelectorAll(".pagamento-opcao").forEach(b=>b.classList.toggle("ativo", b.dataset.valor === valorAtual))
    }

    // Icones do navegador
    const fav = document.querySelector('link[rel="icon"]')
    if(fav && c.marca.favicon) fav.href = c.marca.favicon
    const apple = document.querySelector('link[rel="apple-touch-icon"]')
    if(apple && c.marca.appleIcon) apple.href = c.marca.appleIcon
}

// ---------- Aplicacao completa ----------

function aplicarConfig(dadosOverride){
    const override = dadosOverride !== undefined ? dadosOverride : lerConfigCache()
    window.CONFIG = mergeProfundo(window.CONFIG_PADRAO || {}, override)
    aplicarTema()
    aplicarPwa()
    aplicarSEO()
    aplicarMarca()
    if(typeof window.aoAtualizarConfig === "function") window.aoAtualizarConfig()
}

// ---------- Boot ----------
// A configuracao ja nasce com o padrao + cache local (a versao remota chega
// depois, buscada pelo integracao-sistema.js, e reaplica tudo).

window.CONFIG = mergeProfundo(window.CONFIG_PADRAO || {}, lerConfigCache())
aplicarTema()
aplicarPwa()
aplicarSEO()

if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", aplicarMarca)
} else {
    aplicarMarca()
}

// Exposto para o painel e para depuracao no console
window.aplicarConfig = aplicarConfig
window.mergeProfundo = mergeProfundo
window.salvarConfigNoCache = salvarConfigNoCache
window.lerConfigCache = lerConfigCache
