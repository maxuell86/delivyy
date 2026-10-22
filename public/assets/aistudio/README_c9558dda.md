# 🍕 App de Delivery — template white-label

PWA estático de delivery (pizzaria/restaurante) que roda em qualquer hospedagem
de arquivos (GitHub Pages, Netlify, etc.) e é personalizável **sem mexer em
código**: marca, cores, horários, frete, cupons, fidelidade e SEO ficam em um
único arquivo (`config.js`) ou no painel do lojista (`customizar.html`).

O projeto nasceu para a pizzaria **Sabore In Casa** e hoje serve de template:
os valores dela ficam em `config.js` como padrão.

## 📱 Funcionalidades

* Cardápio digital (pizzas e bebidas ao vivo do Supabase; combos/snacks locais)
* Escolha de tamanho da pizza, borda e meio a meio
* Carrinho de compras com frete por bairro/faixa e regra de frete grátis
* Programa de fidelidade com níveis configuráveis
* Cupons (livres, por nível de gasto ou de aniversário)
* Happy hour / promoção relâmpago com contador
* Pedido via WhatsApp
* Pagamento via Pix / cartão (Mercado Pago) direto no app
* Instalação como aplicativo (PWA)
* SEO automático (title, Open Graph, JSON-LD de Restaurante e Cardápio)

## 🧾 Estrutura do projeto

```
config.js               -> ⭐ Identidade da loja INTEIRA (marca, tema, horários,
                           entrega, fidelidade, cupons, banners, SEO, chaves)
config-loader.js        -> Mescla config.js + cache local + Supabase e aplica
                           tema/marca/SEO no app
customizar.html         -> 🎨 Painel do lojista (personaliza tudo, sem código)
customizar.js           -> Lógica do painel
supabase/config-loja.sql-> Cria config_loja + funções no Supabase (rode uma vez)
index.html              -> Página principal
styles.css              -> Design do app (cores via variáveis CSS)
app.js                  -> Lógica do cardápio, carrinho e pedidos
integracao-sistema.js   -> Cardápio ao vivo + registro de vendas (Supabase)
produtos.json           -> Reserva local de combos/snacks/bebidas
pagamento-mercadopago.js-> Pagamento com cartão/Pix (Mercado Pago)
pix.js / mapa.js        -> Utilitários avulsos (chave Pix e "ver no mapa")
impressao.js            -> Impressão de pedidos
notificacao.js          -> Notificações locais do navegador (opcional)
sw.js                   -> Service worker (título de instalação do PWA)
manifest.json           -> Instalação como app
admin.html              -> Atalhos para o painel de gestão e o customizador
imagens/                -> Fotos, banners e ícones
```

## 🚀 Como rodar

Não precisa de Node nem build — sirva os arquivos estáticos:

```
python -m http.server 8000
```

Depois abra http://localhost:8000 no navegador.

## 🎨 Personalizar (painel do lojista)

1. Rode o arquivo **`supabase/config-loja.sql`** no SQL Editor do seu projeto
   Supabase (cria a tabela `config_loja` e as funções com senha).
2. Abra **`customizar.html`** (ou o link no `admin.html`) e entre com a senha
   inicial **`142536`** — troque-a na aba *Avançado*.
3. Ajuste as abas (Marca & Contato, Tema, Horários, Entrega, Fidelidade &
   Cupons, Banners, Integrações & SEO) e clique em **Salvar e publicar**.

O que o painel salva vai para o Supabase e vale para todos os clientes na hora
(com cache local para o app funcionar mesmo offline). A senha protege contra
uso casual; a gravação é sempre validada no servidor.

* **Exportar config.js** baixa o arquivo pronto — bom para versionar no Git
  ou para quando quiser que os padrões do projeto mudem de vez.
* **Restaurar padrão** apaga a personalização salva e volta ao `config.js`.

Também dá para personalizar tudo editando **`config.js`** direto (útil para
trocar o restaurante de ponta a ponta antes de entregar o app).

## ✅ Checklist: criar o app de um restaurante novo

1. Duplique o projeto.
2. Edite `config.js` (ou use o painel depois): nome, slogan, WhatsApp,
   endereço, horários, faixas de frete/bairros, níveis, cupons, banners, SEO.
3. Troque as imagens em `/imagens` (logo, banners, fotos) e o `manifest.json`.
4. Crie o projeto Supabase do restaurante e rode `supabase/config-loja.sql`.
5. Preencha `integracoes.supabaseUrl`, `supabaseAnonKey`,
   `mercadoPagoPublicKey` e `pixChave` no `config.js`.
6. Ajuste `seo.baseUrl` para a URL publicada e `integracoes.painelGestaoUrl`
   para o painel de gestão dele (se houver).
7. Publique os arquivos (GitHub Pages ou outra hospedagem) e faça um pedido
   de teste de ponta a ponta (WhatsApp + Pix/cartão).

## 🔗 Integração com o sistema de gestão

O cardápio (pizzas e bebidas, com preço por sabor/tamanho) vem ao vivo do
banco Supabase do painel de gestão da loja, e cada pedido gera uma venda
automaticamente lá. Se o Supabase ficar indisponível, o app cai para o
cardápio de reserva (`config.js > cardapio` e `produtos.json`) — o pedido
pelo WhatsApp nunca fica bloqueado por isso. Detalhes em
`integracao-sistema.js`.

> **Atenção (fase 6, opcional):** os cupons/fidelidade também são validados no
> servidor do Pix/cartão pelas edge functions do Supabase, que ainda têm os
> valores originais. Enquanto elas não lerem `config_loja` (instruções no fim
> de `supabase/config-loja.sql`), o painel muda a vitrine do app, mas o valor
> final cobrado no Pix/cartão segue o que está nas edge functions.

## 👨‍🍳 Desenvolvido para

Pizzaria **Sabore In Casa** — e para qualquer restaurante que precise do
mesmo app sem reescrever nada.





