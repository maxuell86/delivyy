# 🚀 Guia de Configuração e Implantação do Aplicativo

Este documento contém o passo a passo completo para configurar, testar e publicar a sua loja/restaurante.

---

## 📋 Pré-requisitos

Antes de iniciar, certifique-se de possuir:

* [x] Uma conta gratuita no [Supabase](https://supabase.com/)
* [x] Uma conta no [Mercado Pago](https://www.mercadopago.com.br/) (para receber pagamentos por cartão e Pix no app)
* [x] Uma conta em uma plataforma de hospedagem estática ([GitHub](https://github.com/), [Netlify](https://www.netlify.com/) ou [Vercel](https://vercel.com/))
* [x] Um editor de código ([VS Code](https://code.visualstudio.com/)) instalado no seu computador

---

## 💻 Passo 1: Preparar os Arquivos e Executar Localmente

Antes de enviar qualquer arquivo para a nuvem, rode o projeto localmente para entender o seu funcionamento.

### 1. Organização da Pasta
1. Crie uma pasta no seu computador para a nova loja (ex: `delivery-restaurante-x`).
2. Copie todos os arquivos e pastas do template para dentro dela.

### 2. Abrir no Terminal
* Abra o terminal ou Prompt de Comando dentro da pasta criada.

### 3. Subir o Servidor Local
Execute o comando do Python para servir os arquivos estáticos:

```bash
python -m http.server 8000
```

### 4. Visualizar no Navegador
Acesse [http://localhost:8000](http://localhost:8000) no seu navegador. O aplicativo carregará com a identidade visual e dados padrão do `config.js` (*Sabore In Casa*).

---

## 🗄️ Passo 2: Configurar o Banco de Dados no Supabase

O Supabase gerencia o cardápio em tempo real, registra os pedidos/vendas e armazena as configurações salvas pelo painel do lojista.

1. **Criar o Projeto:**
   * Acesse o painel do Supabase, clique em **New Project**, dê um nome e crie uma senha segura para o banco.

2. **Executar a Estrutura do App (`config_loja`):**
   * No menu lateral do Supabase, clique em **SQL Editor**.
   * Clique em **New Query**.
   * Abra o arquivo `supabase/config-loja.sql` do seu projeto local, copie todo o código, cole no editor do Supabase e clique em **Run**.

3. **Configurar as Tabelas de Produtos/Vendas:**
   * Verifique se as tabelas do cardápio ao vivo (*pizzas, tamanhos, sabores, bebidas*) foram criadas com permissão de leitura pública (`RLS - Read access para anon`), permitindo que o arquivo `integracao-sistema.js` leia os itens.

4. **Coletar as Chaves de Acesso:**
   * No menu lateral, vá em **Project Settings > API**.
   * Anote a **Project URL** (URL do projeto) e a **anon public key** (Chave pública de API).

---

## ⚙️ Passo 3: Preencher as Configurações Iniciais em `config.js`

Edite o arquivo `config.js` no VS Code para definir os parâmetros base do restaurante.

### 1. Dados do Restaurante e WhatsApp
Atualize o nome da marca, slogan, endereço físico e número do WhatsApp com DDD (onde os pedidos serão recebidos).

### 2. Inserir as Chaves do Supabase
No bloco `integracoes`, preencha:

```javascript
integracoes: {
  supabaseUrl: 'https://seusuperprojeto.supabase.co',
  supabaseAnonKey: 'sua-chave-anon-publica-aqui'
}
```

### 3. Inserir Chaves de Pagamento
* Cole a sua chave pública do Mercado Pago em `mercadoPagoPublicKey`.
* Digite a chave Pix principal do estabelecimento em `pixChave`.

### 4. Ajustar Taxas de Entrega e Horários
* Configure os dias e horários de funcionamento.
* Adicione os bairros com suas respectivas taxas fixas de entrega e o valor mínimo para a regra de **Frete Grátis**.

### 5. SEO e Domínio
Em `seo.baseUrl`, insira o link web onde o site ficará hospedado (ex: `https://meurestaurante.netlify.app`).

---

## 🎨 Passo 4: Substituir Mídias e Identidade Visual

### Fotos e Banners (Pasta `/imagens`)
* `logo.png` / `logo.jpg`: Substitua pelo logotipo oficial do restaurante.
* **Banners:** Troque as mídias em destaque pelas promoções atuais da loja.
* **Ícones PWA:** Atualize os ícones nos tamanhos `192x192` e `512x512` com a marca do restaurante.

### Personalizar o Manifest (`manifest.json`)
1. Edite o `manifest.json` e altere os campos `name` e `short_name` para o nome oficial do restaurante.
2. Ajuste as propriedades `theme_color` e `background_color` conforme a paleta de cores da marca.

---

## 🌐 Passo 5: Publicar o Aplicativo (Hospedagem)

Como o app é um PWA puramente front-end, a hospedagem é gratuita e imediata.

### Opção A: Netlify ou Vercel *(Recomendado — Método Arrastar e Soltar)*
1. Crie uma conta no [Netlify](https://www.netlify.com/).
2. No painel inicial, vá até a área de **Drag and Drop** (Arrastar e Soltar) na aba *Sites*.
3. Arraste a pasta inteira do seu projeto e solte no navegador.
4. Em poucos segundos, o Netlify gerará uma URL pública (ex: `https://nome-da-loja.netlify.app`).

### Opção B: GitHub Pages
1. Crie um repositório no GitHub (público ou privado).
2. Envie os arquivos do projeto para o repositório (`git push`).
3. Vá em **Settings > Pages** do repositório, selecione a branch `main`/`master` e clique em **Save**.
4. O app estará disponível na URL do GitHub Pages em alguns minutos.

---

## 🔐 Passo 6: Validar o Painel do Lojista (`customizar.html`)

O aplicativo possui um painel administrativo que permite ao lojista alterar cores, taxas e avisos sem programar.

1. **Acessar o Painel:**
   * No navegador, abra a URL publicada acrescentando `/customizar.html` (ou clique no link em `admin.html`).

2. **Fazer Login:**
   * Insira a senha inicial do template: `142536`.

3. **Alterar a Senha Inicial (Importante):**
   > ⚠️ **Atenção:** Por questões de segurança, altere a senha imediatamente após o primeiro acesso.
   * Vá até a aba **Avançado**, defina uma nova senha administrativa segura e salve.

4. **Testar a Sincronização:**
   * Mude uma cor ou texto na aba **Marca & Contato** e clique em **Salvar e publicar**.
   * Abra a página principal do app em uma guia anônima e confirme se as mudanças foram aplicadas em tempo real.

---

## 🧪 Passo 7: Teste do Pedido de Ponta a Ponta (Checklist Final)

Faça uma simulação completa como cliente final:

- [ ] **Seleção de Produtos:** Selecione uma pizza de 2 sabores (meio a meio), escolha a borda e adicione uma bebida ao carrinho.
- [ ] **Carrinho e Frete:** Digite o bairro de entrega e valide se a taxa cobrada corresponde ao valor configurado.
- [ ] **Cupom de Desconto:** Aplique um cupom de teste para verificar a dedução no valor total.
- [ ] **Envio via WhatsApp:** Clique em enviar pedido pelo WhatsApp e confirme se a mensagem formatada chega com os dados do produto, endereço e forma de pagamento.
- [ ] **Pagamento no App (Pix / Cartão):** Verifique se o QR Code do Pix e a tela do Mercado Pago abrem normalmente.
- [ ] **Instalação PWA:** Abra o site no celular pelo navegador (Chrome/Safari) e teste a opção *"Adicionar à Tela Inicial"* para garantir que ele seja instalado como um app nativo.