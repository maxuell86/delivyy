// Chave Pix vem de config.js (integracoes.pixChave).
// Obs: hoje o pagamento Pix de verdade acontece pelo Mercado Pago
// (pagamento-mercadopago.js) - esta funcao e apenas um atalho legado.

function gerarPix(){
    const chave = (window.CONFIG && CONFIG.integracoes && CONFIG.integracoes.pixChave) || ""
    alert("Pague no PIX: " + chave)
}
