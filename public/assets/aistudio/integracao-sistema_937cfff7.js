// ===============================
// INTEGRACAO COM O SISTEMA DE GESTAO (Supabase)
// ===============================
// Este app de delivery passa a buscar o cardapio (pizzas e bebidas) e a
// registrar cada pedido diretamente no banco do painel de gestao.
//
// As chaves do Supabase vem de config.js (integracoes) - trocar de restaurante
// e trocar os valores la, nao aqui.
//
// Se o Supabase estiver fora do ar, o app continua funcionando normalmente
// com os dados locais (produtos.json / config.js) - o envio do pedido pelo
// WhatsApp NUNCA fica bloqueado por causa disso.

const SISTEMA_SUPABASE_URL = CONFIG.integracoes.supabaseUrl
const SISTEMA_SUPABASE_ANON_KEY = CONFIG.integracoes.supabaseAnonKey

const sistemaSupabase = (typeof window.supabase !== "undefined" && SISTEMA_SUPABASE_URL && SISTEMA_SUPABASE_ANON_KEY)
    ? window.supabase.createClient(SISTEMA_SUPABASE_URL, SISTEMA_SUPABASE_ANON_KEY)
    : null

// A descricao e o selo de cada sabor agora vem do banco (sabores_pizza.descricao
// / .selo, editaveis no painel de gestao > Cardapio). O dicionario de reserva
// usado quando o sabor ainda nao tem descricao cadastrada no banco mora em
// config.js (cardapio.descricoesFallback).
function descricaoFallbackSabor(nome){
    const mapa = (CONFIG.cardapio && CONFIG.cardapio.descricoesFallback) || {}
    return mapa[nome]
}

// Prefixo aplicado a toda descricao de sabor (config.js > cardapio.prefixoDescricao;
// ex: o diferencial "Massa 100% integral."). Deixe "" para nao prefixar nada.
function descricaoComMassaIntegral(ingredientes){
    const prefixo = (CONFIG.cardapio && CONFIG.cardapio.prefixoDescricao) || ""
    if(prefixo) return ingredientes ? `${prefixo} ${ingredientes}` : prefixo
    return ingredientes || ""
}

let cardapioPizzas = []
let cardapioBebidas = []
let cardapioLanches = []
let cardapioCombos = []

const cardapioProntoPromise = carregarCardapioDoSistema()

async function carregarCardapioDoSistema(){
    if(!sistemaSupabase) return
    try{
        const [pizzasRes, bebidasRes, lanchesRes, combosRes] = await Promise.all([
            sistemaSupabase.from("v_delivery_pizzas").select("*"),
            sistemaSupabase.from("v_delivery_bebidas").select("*"),
            sistemaSupabase.from("v_delivery_lanches").select("*"),
            sistemaSupabase.from("v_delivery_combos").select("*")
        ])
        if(!pizzasRes.error && pizzasRes.data && pizzasRes.data.length){
            cardapioPizzas = pizzasRes.data.map(s => ({
                id: s.id,
                nome: s.nome,
                desc: descricaoComMassaIntegral(s.descricao || descricaoFallbackSabor(s.nome)),
                selo: s.selo || "",
                destaque: !!s.destaque,
                img: s.imagem_url || "imagens/pizza-padrao.png",
                precoP: Number(s.preco_p || 0),
                precoM: Number(s.preco_m || 0),
                precoG: Number(s.preco_g || 0)
            }))
        }
        if(!bebidasRes.error && bebidasRes.data && bebidasRes.data.length){
            cardapioBebidas = bebidasRes.data.map(b => ({
                id: b.id,
                nome: b.nome,
                preco: Number(b.preco || 0),
                img: b.imagem_url || "imagens/sem-imagem.png"
            }))
        }
        if(!lanchesRes.error && lanchesRes.data && lanchesRes.data.length){
            cardapioLanches = lanchesRes.data.map(l => ({
                id: l.id,
                nome: l.nome,
                preco: Number(l.preco || 0),
                img: l.imagem_url || "imagens/sem-imagem.png"
            }))
        }
        if(!combosRes.error && combosRes.data && combosRes.data.length){
            cardapioCombos = combosRes.data.map(c => ({
                id: c.id,
                nome: c.nome,
                preco: Number(c.preco || 0),
                descricao: c.descricao || "",
                foto: c.imagem_url || "imagens/sem-imagem.png"
            }))
        }
    }catch(e){
        console.warn("Nao foi possivel carregar o cardapio do sistema de gestao. Usando dados locais.", e)
    }
}

// Registra o pedido como venda(s) no sistema de gestao. Nunca lanca erro para
// quem chamou - se falhar (ou demorar demais), so avisa no console e o pedido
// segue normalmente pelo WhatsApp, que continua sendo a forma oficial do pedido.
// Tem um limite de tempo curto porque quem chama espera essa promise terminar
// antes de redirecionar para o WhatsApp (senao a navegacao pode cancelar a
// requisicao no meio do caminho).
async function enviarPedidoParaSistema({ itens, nome, telefone, endereco, aniversario, observacoes }){
    if(!sistemaSupabase) return null
    if(!itens || itens.length === 0) return null
    try{
        const chamada = sistemaSupabase.rpc("criar_pedido_delivery", {
            p_itens: itens,
            p_cliente_nome: nome,
            p_cliente_telefone: telefone || null,
            p_cliente_endereco: endereco || null,
            p_cliente_aniversario: aniversario || null,
            p_observacoes: observacoes || null
        })
        const timeout = new Promise(resolve => setTimeout(() => resolve({ timeout: true }), 4000))
        const resultado = await Promise.race([chamada, timeout])
        if(resultado.timeout){
            console.warn("Sincronizacao com o sistema de gestao demorou demais, seguindo sem esperar.")
            return null
        }
        if(resultado.error){
            console.warn("Pedido nao foi sincronizado com o sistema de gestao:", resultado.error.message)
            return null
        }
        return resultado.data
    }catch(e){
        console.warn("Pedido nao foi sincronizado com o sistema de gestao:", e)
        return null
    }
}

// ===============================
// CONFIGURACAO REMOTA (painel do lojista)
// ===============================
// O lojista personaliza o app pelo customizar.html, que salva na tabela
// config_loja do Supabase. Aqui buscamos essa config, guardamos no cache
// local (continua valendo offline) e reaplicamos tema/marca/SEO. Se a tabela
// ainda nao existir no projeto, segue tudo com o config.js local, sem erro.

async function carregarConfigRemotaDoSistema(){
    if(!sistemaSupabase) return
    try{
        const { data, error } = await sistemaSupabase
            .from("config_loja")
            .select("dados")
            .eq("id", 1)
            .maybeSingle()
        if(error || !data || !data.dados) return
        salvarConfigNoCache(data.dados)
        aplicarConfig(data.dados)
    }catch(e){
        console.warn("Nao foi possivel carregar a configuracao remota do painel, usando a local:", e)
    }
}

carregarConfigRemotaDoSistema()
