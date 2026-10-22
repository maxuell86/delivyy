// Utilitario de notificacoes locais do navegador.
// Nao e incluido automaticamente pelo app - chame pedirPermissaoNotificacoes()
// de dentro de um clique do usuario se quiser usar.

function pedirPermissaoNotificacoes(){
    if(!("Notification" in window)) return Promise.resolve("unsupported")
    return Notification.requestPermission()
}

function notificar(titulo, texto){
    if(!("Notification" in window)) return
    if(Notification.permission === "granted"){
        new Notification(titulo, { body: texto })
    }
}
