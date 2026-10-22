// Atalho legado "Ver no mapa" - endereco vem de config.js (endereco).
// Obs: o app de delivery (index.html) usa a versao definida em app.js;
// este arquivo existe para quem incluir mapa.js separadamente.

function abrirMapa(){
    const e = (window.CONFIG && CONFIG.endereco) || {}
    const alvo = encodeURIComponent(`${e.rua || ""} ${e.numero || ""} ${e.bairro || ""} ${e.cidade || ""}`.trim())
    window.open(`https://www.google.com/maps?q=${alvo}`, "_blank")
}
