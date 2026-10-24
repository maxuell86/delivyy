# Max Delivery Gestão — Plataforma White-Label Multi-Estabelecimentos

Plataforma SaaS profissional de **Cardápio Digital Exclusivo, Gestão Operacional de Delivery, KDS em Tempo Real, CRM de Retenção e Inteligência Financeira (DRE & Curva ABC)** projetada para operar múltiplos estabelecimentos gastronômicos (Hamburguerias, Pizzarias, Restaurantes, Confeitarias, Padarias, Açaiterias e Culinária Japonesa) com isolamento de dados por unidade (`storeId`).

---

## Sumário

1. [Arquitetura Multi-Loja e Isolamento de Dados (`storeId`)](#1-arquitetura-multi-loja-e-isolamento-de-dados-storeid)
2. [Hierarquia de Perfis e Controle de Acesso (RBAC)](#2-hierarquia-de-perfis-e-controle-de-acesso-rbac)
3. [Cardápio Digital Exclusivo por Estabelecimento](#3-cardápio-digital-exclusivo-por-estabelecimento)
4. [Cadastro Avançado de Produtos & Ficha Técnica](#4-cadastro-avançado-de-produtos--ficha-técnica)
5. [CRM de Clientes Inativos & Disparo Rápido no WhatsApp](#5-crm-de-clientes-inativos--disparo-rápido-no-whatsapp)
6. [Inteligência Financeira: DRE Automático, Curva ABC & Exportação CSV](#6-inteligência-financeira-dre-automático-curva-abc--exportação-csv)
7. [Estrutura do Banco de Dados (Cloud Firestore)](#7-estrutura-do-banco-de-dados-cloud-firestore)
8. [Guia de Execução Local e Deploy em Produção](#8-guia-de-execução-local-e-deploy-em-produção)

---

## 1. Arquitetura Multi-Loja e Isolamento de Dados (`storeId`)

A plataforma opera em arquitetura **Multi-Tenant Real** no Cloud Firestore:

- **Identificador Único de Unidade (`storeId`)**: Cada estabelecimento cadastrado possui um `storeId` exclusivo (ex.: `default`, `pizzaria_bella_napoli`, `doce_encanto`) e um `slug` personalizado (ex.: `max-burger`, `bella-napoli`).
- **Isolamento Estrito de Catálogo e Operação**:
  - **Configurações da Loja (`store_config/{storeId}`)**: Nome, slogan, WhatsApp receptor, chave PIX oficial, taxas de entrega por bairro (`faixasEntrega`), avaliações de clientes (`avaliacoes`), despesas operacionais (`despesasFinanceiras`), clientes CRM (`clientesCrm`) e categorias personalizadas (`categoriasCustomizadas`).
  - **Produtos (`products/{storeId}_{productId}`)**: Todos os itens do cardápio são gravados e filtrados estritamente pelo `storeId` da unidade ativa.
  - **Pedidos e KDS (`orders/{orderId}`)**: Cada pedido carrega o `storeId` de origem, garantindo que o monitor da cozinha (KDS) e os relatórios financeiros de uma loja nunca se misturem com os de outra unidade.

---

## 2. Hierarquia de Perfis e Controle de Acesso (RBAC)

O controle de acesso vincula o login Google (e-mail autenticado no Firebase Auth) diretamente ao estabelecimento correspondente na coleção `admins`:

| Perfil (`role`) | Escopo (`storeId`) | Permissões e Visão no Sistema |
| :--- | :--- | :--- |
| **Gerente da Plataforma (`platform_admin`)** | Global (`all`) | Governança completa do SaaS: implantação de novos estabelecimentos (*Onboarding Wizard*), troca de segmento comercial, customização de cores/marca, vínculo de e-mails de gerentes por loja e alternância livre entre unidades. |
| **Gerente do Estabelecimento (`store_manager`)** | Restrito à sua loja | Acesso exclusivo aos dados do seu estabelecimento. Painel focado em **Operação do Dia**, abertura/fechamento da loja em 1 clique, ajuste de tempo de espera, cadastro completo de produtos, configuração de **Frete por Bairro**, **CRM de Clientes**, **DRE Financeiro** e **Curva ABC**. |
| **Atendente / Caixa (`attendant`)** | Restrito à sua loja | Operação diária de pedidos, impressão de comanda térmica (80mm/58mm), pausa rápida de itens esgotados e acompanhamento de entregas. |
| **Cozinha / KDS (`kitchen`)** | Restrito à sua loja | Direcionado automaticamente para o **Monitor de Pedidos (KDS)** em tempo real com alertas sonoros e avanço de status (*Recebido $\to$ Em Preparo $\to$ Saiu para Entrega $\to$ Concluído*). |

---

## 3. Cardápio Digital Exclusivo por Estabelecimento

Cada estabelecimento gera seu próprio link público e QR Code exclusivo para compartilhamento na bio do Instagram, WhatsApp ou impressão em mesas/balcão:

- **Formato do Link Exclusivo**:
  ```text
  https://seu-dominio.com/?modo=cardapio&loja=slug-da-loja
  ```
- **Recursos de Conversão para o Cliente Final**:
  1. **Avaliações e Nota da Loja (`StoreReview`)**: Exibição da nota média em estrelas (`★ 4.9`) e comentários verificados no topo do cardápio, permitindo ao cliente avaliar a experiência e o prato favorito.
  2. **Upsell Inteligente no Carrinho**: Ao abrir a sacola de compras, o sistema sugere automaticamente bebidas geladas e sobremesas que ainda não estão no pedido com botão de adição em 1 clique.
  3. **Taxas de Entrega Dinâmicas por Bairro (`DeliveryZone`)**: O cliente seleciona seu bairro no checkout e o sistema calcula automaticamente o valor exato do frete e o tempo estimado daquela região.
  4. **Pagamento PIX Copia e Cola Oficial (Padrão EMV Banco Central)**: Geração instantânea do payload BRCode com desconto percentual configurável para pagamentos via PIX, além de suporte a Cartão na Entrega, Dinheiro (com cálculo de troco) e Vale-Refeição.
  5. **Rastreamento do Pedido Ao Vivo**: Após enviar o pedido, o cliente acompanha na tela a mudança de status sincronizada em tempo real com a cozinha da loja.

---

## 4. Cadastro Avançado de Produtos & Ficha Técnica

O Gerente do Estabelecimento conta com um modal completo de engenharia de cardápio:

- **Upload Direto de Imagens**: Seleção de foto direto do computador ou celular com compressão automática em Canvas HTML5 (`Base64 Data URL` otimizado para Cloud Firestore), sem depender de links externos.
- **Criação de Categorias Personalizadas**: O gerente pode criar novas seções exclusivas para sua loja (com nome e emoji/ícone próprio).
- **Ficha Técnica & Disponibilidade**:
  - Peso / Volume (`pesoGramas`, ex.: `350g`, `500ml`)
  - Rendimento (`porcaoPessoas`, ex.: `Serve 2 pessoas`)
  - Custo Unitário de Insumos (`custoUnitario` em R$) para apuração automática de CMV e Margem Bruta no DRE
  - Selos de Alérgenos e Restrições (`Contém Glúten`, `Contém Lactose`, `Vegano`, `Sem Açúcar`, etc.)
  - Disponibilidade por Dia da Semana (`Seg` a `Dom`)
- **Grupos de Opções, Variações e Adicionais**:
  - Configuração de grupos de escolha única (ex.: *Ponto da Carne*, *Tamanho*, *Massa*) ou múltipla escolha (ex.: *Adicionais Pagos*, *Bordas Recheadas*) com trava de limite mínimo e máximo (`minimo` / `maximo` e `obrigatorio`).

---

## 5. CRM de Clientes Inativos & Disparo Rápido no WhatsApp

Localizado na aba **CRM & Fidelidade**, o módulo transforma o histórico de pedidos em vendas recorrentes:

- **Consolidação Automática + Cadastro Manual**: Agrupa clientes pelo telefone/nome a partir dos pedidos recebidos, calculando total de pedidos, valor total gasto, prato favorito e dias desde a última compra.
- **Radar de Clientes Sumidos / Inativos**: Filtra automaticamente clientes que não compram há mais de $X$ dias (configurável entre 7, 15 ou 30 dias), além de segmentar **Clientes VIPs** e **Ativos**.
- **Reativação em 1 Clique no WhatsApp (`wa.me`)**: Dispara mensagem personalizada citando o nome do cliente, o prato favorito dele, o código de cupom de desconto selecionado e o link direto do cardápio digital da loja.

---

## 6. Inteligência Financeira: DRE Automático, Curva ABC & Exportação CSV

Localizado na aba **DRE & Relatórios**, oferece visão contábil e estratégica para o gerente:

1. **Demonstrativo de Resultado do Exercício (DRE Gerencial Automático)**:
   - `(+) Receita Bruta Operacional` (Venda de Produtos + Taxas de Entrega)
   - `(-) Descontos Concedidos (PIX & Cupons Promocionais)`
   - `(=) Receita Operacional Líquida`
   - `(-) CMV — Custo de Mercadoria Vendida` (calculado sobre o `custoUnitario` de cada produto vendido)
   - `(=) Lucro Bruto / Margem de Contribuição`
   - `(-) Despesas Operacionais` (Módulo integrado para o gerente lançar custos fixos, variáveis, motoboys, marketing e impostos)
   - `(=) Resultado Líquido do Período (Lucro Líquido Real em R$ e %)`
2. **Matriz Curva ABC de Produtos (Regra 80 / 15 / 5)**:
   - Classifica todo o cardápio em **Classe A** (até 80% do resultado acumulado), **Classe B** (80% a 95%) e **Classe C** (95% a 100%), permitindo alternar a ordenação entre **Mais Lucrativos (Margem R$)** e **Maior Faturamento Bruto**.
3. **Exportação em CSV (Padrão Brasileiro para Excel)**:
   - Download instantâneo de **DRE Financeiro (.CSV)**, **Vendas & Curva ABC (.CSV)** e **Posição de Estoque & CMV (.CSV)** com codificação `UTF-8 BOM` e separador ponto e vírgula (`;`).

---

## 7. Estrutura do Banco de Dados (Cloud Firestore)

| Coleção Firestore | Chave do Documento | Descrição |
| :--- | :--- | :--- |
| `store_config` | `{storeId}` | Configurações gerais da unidade, slug, horários, pagamentos PIX, faixas de entrega por bairro, avaliações, despesas do DRE e clientes CRM. |
| `products` | `{storeId}_{productId}` | Catálogo de produtos isolado por estabelecimento, incluindo foto otimizada, ficha técnica, CMV e grupos de opcionais. |
| `orders` | `{orderId}` | Pedidos em tempo real enviados pelos clientes e operados no KDS da cozinha, vinculados ao `storeId`. |
| `admins` | `{userId}` | Registro de vínculos de acesso (`email`, `role`, `storeId`, `storeName`) gerenciados pelo Administrador da Plataforma. |

---

## 8. Guia de Execução Local e Deploy em Produção

### Pré-requisitos
- **Node.js** 18+ e **npm**

### Passos para Executar Localmente
```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento (porta 3000)
npm run dev

# 3. Gerar build otimizado para produção
npm run build
```

### Implantação de Novo Estabelecimento (Go-Live)
1. Faça login com a conta de **Gerente da Plataforma**.
2. Clique em **"+ Novo Estabelecimento"** no cabeçalho superior.
3. Defina o ID da loja, nome comercial, segmento gastronômico, WhatsApp, chave PIX e informe o **E-mail do Gerente do Estabelecimento**.
4. Abra o modal **"Link Personalizado, QR Code & WhatsApp"** na aba Cardápio para definir o `slug` exclusivo da loja, baixar o QR Code de mesa/balcão e compartilhar o cardápio digital com os clientes.
