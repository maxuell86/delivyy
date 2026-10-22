// ===============================
// PAGAMENTO REAL (Mercado Pago) — Pix e Cartão
// ===============================
// Pix: cria uma cobranca real via Edge Function, mostra o QR code oficial
// do Mercado Pago e fica de olho no status ate confirmar sozinho (webhook).
// Cartao: usa o "Card Payment Brick" oficial do Mercado Pago (o numero do
// cartao nunca passa pelo nosso servidor, so o token gerado por eles).
// Dinheiro nao usa nada disso - continua sendo so combinado na entrega.

// Chave publica do Mercado Pago vem de config.js (integracoes)
const MP_PUBLIC_KEY = CONFIG.integracoes.mercadoPagoPublicKey

const mpSDK = (typeof MercadoPago !== "undefined" && MP_PUBLIC_KEY)
    ? new MercadoPago(MP_PUBLIC_KEY, { locale: "pt-BR" })
    : null

let brickCartaoAtual = null

function precoBR(v){ return Number(v).toFixed(2).replace(".", ",") }

// Monta o payload comum (itens/cliente) a partir do carrinho e dos campos do checkout.
// itens_completos leva sabor_id/bebida_id/lanche_id/combo_id (mesmo formato usado no
// pedido por WhatsApp) - e o que permite o pedido virar venda de verdade sozinho quando
// o pagamento for confirmado (trigger criar_vendas_do_pedido_pago no Supabase). itens
// (nome/qtd/preco) continua existindo por compatibilidade com o que ja lia esse campo.
function montarDadosPedido(nomeCliente, enderecoTexto, total, subtotal, frete, desconto){
    const observacoes = `Pedido delivery (Mercado Pago)`
    const itensCompletos = []
    carrinho.forEach(item=>{
        if(item.tipo === "pizza" && item.saborId && item.tamanho){
            itensCompletos.push({ tipo:"pizza", sabor_id:item.saborId, tamanho:item.tamanho, quantidade:item.qtd, preco_unitario:item.preco, observacoes })
        } else if(item.tipo === "bebidas" && item.bebidaId){
            itensCompletos.push({ tipo:"bebida", bebida_id:item.bebidaId, quantidade:item.qtd, preco_unitario:item.preco, observacoes })
        } else if(item.tipo === "snacks" && item.lancheId){
            itensCompletos.push({ tipo:"lanche", lanche_id:item.lancheId, quantidade:item.qtd, preco_unitario:item.preco, observacoes })
        } else if(item.tipo === "combo" && item.comboId){
            itensCompletos.push({ tipo:"combo", combo_id:item.comboId, quantidade:item.qtd, preco_unitario:item.preco, itens_inclusos:item.itensInclusos||[], observacoes })
        }
    })
    return {
        itens: carrinho.map(i => ({ nome: i.nome, qtd: i.qtd, preco: i.preco })),
        itens_completos: itensCompletos,
        cliente: {
            nome: nomeCliente,
            telefone: cliente?.whatsapp || null,
            endereco: enderecoTexto,
        },
        subtotal, frete, desconto, total,
        email: cliente?.email || undefined,
        // O servidor e quem decide de verdade se esse cupom vale (nunca confia
        // no %/condicao calculado aqui no navegador) - manda so o codigo.
        cupom_codigo: cupomAplicado?.codigo || null,
    }
}

async function chamarCriarPagamento(payload){
    const { data, error } = await sistemaSupabase.functions.invoke("criar-pagamento-mercadopago", { body: payload })
    if(error){
        let detalhe = null
        try{ detalhe = await error.context?.json?.() }catch(e){}
        throw new Error(detalhe?.error || error.message || "Falha ao criar pagamento")
    }
    return data
}

// ===============================
// MODAL BASE (compartilhado por pix e cartao)
// ===============================

function abrirModalPagamento(conteudoHtml){
    document.getElementById("modalPagamentoMP")?.remove()
    document.body.insertAdjacentHTML("beforeend", `
    <div id="modalPagamentoMP" class="modal-pix">
      <div class="pix-box" id="corpoModalPagamentoMP">${conteudoHtml}</div>
    </div>`)
}

function fecharModalPagamento(){
    document.getElementById("modalPagamentoMP")?.remove()
    if(brickCartaoAtual){ brickCartaoAtual.unmount(); brickCartaoAtual = null }
}

function atualizarCorpoModalPagamento(html){
    const el = document.getElementById("corpoModalPagamentoMP")
    if(el) el.innerHTML = html
}

// ===============================
// PIX
// ===============================

// Retorna uma Promise<boolean> - true se o pagamento foi confirmado, false
// se o cliente cancelou ou algo deu errado. msgPedido e o texto completo do
// pedido (mesmo formato do WhatsApp) - usado na tela de sucesso pra montar
// o comprovante com o pedido inteiro junto, nao so o valor solto.
function pagarComPix(dadosPedido, total, msgPedido){
    return new Promise(async (resolve) => {
        abrirModalPagamento(`
            <div class="pix-topo">
                <h2>Gerando seu Pix...</h2>
                <p>Só um instante</p>
            </div>
            <div class="mp-spinner"></div>
        `)

        let resultado
        try{
            resultado = await chamarCriarPagamento({ ...dadosPedido, forma_pagamento: "pix" })
        }catch(e){
            console.warn("Erro ao criar Pix via Mercado Pago:", e)
            atualizarCorpoModalPagamento(mpErroHtml("Não conseguimos gerar o Pix agora.", true))
            document.getElementById("mpBtnFechar")?.addEventListener("click", () => { fecharModalPagamento(); resolve(false) })
            return
        }

        if(!resultado?.qr_code){
            atualizarCorpoModalPagamento(mpErroHtml("O Mercado Pago não retornou o código Pix.", true))
            document.getElementById("mpBtnFechar")?.addEventListener("click", () => { fecharModalPagamento(); resolve(false) })
            return
        }

        atualizarCorpoModalPagamento(`
            <div class="pix-topo">
                <h2>Pagamento Pix</h2>
                <div class="pix-valor">R$ ${precoBR(total)}</div>
                <p>Escaneie o QR Code ou copie o código abaixo</p>
            </div>
            <div class="pix-qrcode-area">
                <img src="data:image/png;base64,${resultado.qr_code_base64}" alt="QR Code Pix" style="width:220px;height:220px;border-radius:8px;background:#fff;padding:8px;">
            </div>
            <div class="pix-copia-box">
                <label>PIX Copia e Cola</label>
                <textarea id="codigoPixTexto" readonly>${resultado.qr_code}</textarea>
            </div>
            <button class="btn-copiar" onclick="copiarCodigoPixMP()">Copiar Código Pix</button>
            <div class="mp-status-aguardando">
                <div class="mp-spinner mp-spinner-inline"></div>
                <span id="mpStatusTexto">Aguardando confirmação do pagamento...</span>
            </div>
            <button class="fechar-pix" id="mpBtnFecharPix">Cancelar</button>
        `)

        document.getElementById("mpBtnFecharPix")?.addEventListener("click", () => {
            pararEsperaPix()
            fecharModalPagamento()
            resolve(false)
        })

        esperarConfirmacaoPix(resultado.pedido_id, resolve, { ...resultado, msgPedido })
    })
}

function copiarCodigoPixMP(){
    const cod = document.getElementById("codigoPixTexto")?.value?.trim()
    if(!cod) return
    if(navigator.clipboard) navigator.clipboard.writeText(cod).then(() => mostrarToastSimples("Código Pix copiado!")).catch(() => copiarFallback(cod))
    else copiarFallback(cod)
}

let _mpPixInterval = null
let _mpPixTimeout = null

function pararEsperaPix(){
    if(_mpPixInterval) clearInterval(_mpPixInterval)
    if(_mpPixTimeout) clearTimeout(_mpPixTimeout)
    _mpPixInterval = null
    _mpPixTimeout = null
}

function esperarConfirmacaoPix(pedidoId, resolve, resultado){
    pararEsperaPix()
    _mpPixInterval = setInterval(async () => {
        try{
            const { data } = await sistemaSupabase.from("v_pedido_status").select("status").eq("id", pedidoId).single()
            if(data?.status === "pago"){
                pararEsperaPix()
                mostrarSucessoPagamento(resultado)
                resolve(true)
            }else if(data?.status === "pagamento_recusado" || data?.status === "cancelado"){
                pararEsperaPix()
                atualizarCorpoModalPagamento(mpErroHtml("O pagamento não foi aprovado. Tente novamente.", true))
                document.getElementById("mpBtnFechar")?.addEventListener("click", () => { fecharModalPagamento(); resolve(false) })
            }
        }catch(e){ /* tenta de novo no proximo intervalo */ }
    }, 3000)

    // Depois de 10 minutos sem confirmar, para de tentar sozinho (o Pix expira em 24h no MP,
    // mas nao faz sentido deixar o navegador consultando pra sempre).
    _mpPixTimeout = setTimeout(() => {
        pararEsperaPix()
        const statusEl = document.getElementById("mpStatusTexto")
        if(statusEl) statusEl.innerText = "Ainda não recebemos a confirmação. Se já pagou, aguarde mais um pouco ou fale conosco no WhatsApp."
    }, 10 * 60 * 1000)
}

function mostrarSucessoPagamento(info){
    let selos = ""
    if(info?.cliente_novo && info?.desconto_aplicado > 0) selos += `<div class="mp-selo">🎉 Desconto de boas-vindas aplicado: -R$ ${precoBR(info.desconto_aplicado)}</div>`
    else if(info?.desconto_aplicado > 0) selos += `<div class="mp-selo">🎉 Desconto aplicado: -R$ ${precoBR(info.desconto_aplicado)}</div>`
    if(info?.frete_gratis_aplicado) selos += `<div class="mp-selo">🚚 Frete grátis desbloqueado!</div>`

    // Manda o pedido inteiro (mesmo texto que iria pro WhatsApp) junto com o
    // aviso de comprovante, pra loja receber tudo numa mensagem so.
    const textoBase = info?.msgPedido || `Pedido #${info?.pedido_id?.slice(0,8) || ""} - R$ ${precoBR(info?.total_cobrado || 0)}`
    const msgComprovante = encodeURIComponent(`${textoBase}\n\nAqui está o comprovante do pagamento, segue em anexo 👇`)
    const linkComprovante = `https://wa.me/${CONFIG.contato.whatsapp}?text=${msgComprovante}`

    atualizarCorpoModalPagamento(`
        <div class="mp-sucesso">
            <div class="mp-sucesso-check">✓</div>
            <h2>Pagamento confirmado!</h2>
            <p>Recebemos seu pagamento. Pra já mandarmos seu pedido pra cozinha, clique abaixo, mande junto o print/comprovante e confirmamos rapidinho:</p>
            ${selos}
            <a href="${linkComprovante}" target="_blank" class="btn-copiar" style="display:inline-block;text-decoration:none;margin-top:12px;">📄 Enviar pedido + comprovante no WhatsApp</a>
            <button class="fechar-pix" id="mpBtnFecharSucesso" style="margin-top:10px;">Fechar</button>
        </div>
    `)
    document.getElementById("mpBtnFecharSucesso")?.addEventListener("click", fecharModalPagamento)
}

function mpErroHtml(mensagem, mostrarBotaoFechar){
    return `
        <div class="mp-erro">
            <div class="mp-erro-icone">!</div>
            <h2>Ops</h2>
            <p>${mensagem}</p>
            ${mostrarBotaoFechar ? `<button class="fechar-pix" id="mpBtnFechar">Fechar</button>` : ""}
        </div>
    `
}

// ===============================
// CARTÃO (Card Payment Brick)
// ===============================

function pagarComCartao(dadosPedido, total, msgPedido){
    return new Promise((resolve) => {
        if(!mpSDK){
            abrirModalPagamento(mpErroHtml("Não foi possível carregar o pagamento por cartão agora.", true))
            document.getElementById("mpBtnFechar")?.addEventListener("click", () => { fecharModalPagamento(); resolve(false) })
            return
        }

        abrirModalPagamento(`
            <div class="pix-topo">
                <h2>Pagamento com Cartão</h2>
                <div class="pix-valor">R$ ${precoBR(total)}</div>
            </div>
            <div id="mpCardBrick"></div>
            <button class="fechar-pix" id="mpBtnFecharCartao">Cancelar</button>
        `)

        document.getElementById("mpBtnFecharCartao")?.addEventListener("click", () => {
            fecharModalPagamento()
            resolve(false)
        })

        mpSDK.bricks().create("cardPayment", "mpCardBrick", {
            initialization: { amount: Number(total) },
            customization: {
                visual: {
                    style: { theme: "dark" },
                },
            },
            callbacks: {
                onReady: () => {},
                onError: (erro) => {
                    console.warn("Erro no formulario de cartao:", erro)
                },
                onSubmit: async (cardFormData) => {
                    atualizarCorpoModalPagamento(`
                        <div class="pix-topo"><h2>Processando pagamento...</h2></div>
                        <div class="mp-spinner"></div>
                    `)
                    try{
                        const resultado = await chamarCriarPagamento({
                            ...dadosPedido,
                            forma_pagamento: "cartao",
                            cardToken: cardFormData.token,
                            installments: cardFormData.installments,
                            paymentMethodId: cardFormData.payment_method_id,
                            issuerId: cardFormData.issuer_id,
                        })
                        if(resultado?.status === "approved"){
                            mostrarSucessoPagamento({ ...resultado, msgPedido })
                            resolve(true)
                        }else{
                            atualizarCorpoModalPagamento(mpErroHtml("O cartão foi recusado. Tente outro cartão ou escolha outra forma de pagamento.", true))
                            document.getElementById("mpBtnFechar")?.addEventListener("click", () => { fecharModalPagamento(); resolve(false) })
                        }
                    }catch(e){
                        console.warn("Erro ao processar cartao:", e)
                        atualizarCorpoModalPagamento(mpErroHtml("Não conseguimos processar o cartão agora.", true))
                        document.getElementById("mpBtnFechar")?.addEventListener("click", () => { fecharModalPagamento(); resolve(false) })
                    }
                },
            },
        }).then(controller => { brickCartaoAtual = controller })
    })
}
