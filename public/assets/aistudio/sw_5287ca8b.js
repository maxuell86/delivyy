// sw.js — existe só pra satisfazer o requisito de instalação do navegador
// (Chrome/Edge só oferece "Instalar app" com um service worker ativo).
// Deliberadamente não guarda cache de nada: preço, cardápio e estoque mudam
// o tempo todo, e um pedido feito contra dado desatualizado é pior do que
// não ter o app instalado.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {}); // não intercepta - sempre vai direto pra rede
