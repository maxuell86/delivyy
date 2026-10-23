# Plano de Engenharia: Tema Claro/Escuro, Alerta Sonoro no KDS e Implantação em Cliente Real (Turnkey)

Plano arquitetural e operacional para transformar a plataforma em uma solução pronta para produção em clientes reais do zero, incluindo alternância independente de Tema Claro e Escuro (Painel e Cardápio), campainha sonora/visual para pedidos na cozinha (KDS) e sincronização em nuvem em tempo real entre dispositivos.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Decisões Confirmadas com o Usuário:**
> 1. **Tema Claro / Escuro Independente**: O sistema suportará tema claro e tema escuro no Painel Administrativo com chave de alternância rápida no topo, e também permitirá que o lojista configure o tema padrão do Cardápio do Cliente (Dark ou Light) de acordo com a identidade visual da sua marca.
> 2. **Sincronização em Nuvem (Multi-Dispositivo)**: Para operação real onde o cliente pede pelo celular e a cozinha/caixa recebe no tablet ou PC, a arquitetura integrará banco em nuvem em tempo real (Firebase Firestore), mantendo fallback offline via localStorage para máxima resiliência operacional.
> 3. **Alerta Sonoro no KDS (Campainha de Pedidos)**: Implementação de sintetizador de áudio Web Audio API (sem dependência de arquivos de áudio externos frágeis) para emitir sinal sonoro de campainha de alta atenção quando novos pedidos forem recebidos, com toggle de silenciar/testar som e banner de aviso visual piscante.

---

## 1. Visão Geral & Conceito do Produto

- **O que Entrega**: Uma solução SaaS completa para restaurantes e delivery (hamburguerias, pizzarias, confeitarias, sushis, açaí, etc.) que permite a implantação imediata em um cliente real, iniciando do zero:
  - Configuração da loja em 3 minutos via assistente guiado (Onboarding Wizard).
  - Tema Claro/Escuro de alta legibilidade tanto na retaguarda (admin) quanto na experiência do cliente (cardápio público).
  - Gestão de pedidos KDS com campainha sonora de alta atenção para a cozinha não perder nenhum pedido.
  - Sincronização em tempo real de pedidos e cardápio entre celulares e computadores da equipe.
- **Público-Alvo**: Donos de restaurantes, gerentes, atendentes de balcão, cozinheiros na chapa/forno e clientes finais no smartphone.
- **Proposta de Valor**: Eliminação de 100% das comissões de marketplaces (0% taxas), autonomia visual com paleta e tema personalizáveis, e fluxo de pedidos sem gargalos.

---

## 2. Experiência do Usuário & Design Visual

### A. Sistema de Temas (Claro & Escuro)
- **Painel Administrativo**:
  - Modo Escuro (Default atual): Superfícies em `#0a0a0a` / `#171717`, bordas sutis `#262626`, texto em `#f5f5f5` com excelente contraste e baixa fadiga visual para uso prolongado noturno.
  - Modo Claro: Superfícies em `#ffffff` / `#f8fafc`, bordas suaves `#e2e8f0`, texto contrastante `#0f172a` e cartões com leve elevação limpa, ideal para ambientes bem iluminados ou telas em luz do dia.
  - Botão de alternância com 1 clique acessível no cabeçalho superior (ícone Sol/Lua com transição suave $\le 150\text{ms}$).
- **Cardápio do Cliente**:
  - O lojista pode escolher a modalidade padrão nas configurações de Customização (Escuro Moderno vs. Claro Limpo) ou permitir que o próprio cliente final alterne com um switch no cabeçalho do celular.
  - Cores de destaque (primária e secundária) adaptadas dinamicamente para manter o contraste WCAG AA (mínimo 4.5:1) em ambos os fundos.

### B. Campainha Sonora e Feedback Visual no KDS
- **Web Audio API Chime**:
  - Sintetização nativa de dois tons polifônicos harmônicos (Ding-Dong / chime a 587Hz e 880Hz) sem carregar arquivos MP3 externos (garantia de funcionamento 100% offline e sem erros de rede).
  - Controle de volume, botão de teste imediato de áudio e chave de "Silenciar Alerta".
- **Efeito Visual "Novo Pedido"**:
  - Cartão recém-chegado com borda pulsante em tom esmeralda/âmbar e badge de contagem de minutos no status "Recebido".

### C. Tipografia e Rigor de Layout
- Fontes otimizadas com numerais tabulares (`tabular-nums`) em todos os valores monetários e tempos de preparo.
- Zero badges decorativos redundantes e obediência à regra 60-30-10 de distribuição de cores.

---

## 3. Decisões de Engenharia & Trade-Offs

| Decisão de Engenharia | Opção Escolhida | Racional Técnico | Alternativa Rejeitada |
| :--- | :--- | :--- | :--- |
| **Sons de Notificação** | Web Audio API (OscillatorNode / GainNode) | Não depende de assets externos de áudio, funciona 100% offline, latência instantânea ($\le 10\text{ms}$). | Arquivos `.mp3` hospedados externamente (podem falhar, ter bloqueio CORS ou latência). |
| **Estrutura de Temas** | Classes CSS raiz + Tokens Dinâmicos em React State | Permite alternar o painel admin sem recarregar a página e possibilita que o simulador/cardápio tenha tema independente. | Injeção de múltiplos arquivos CSS separados ou bibliotecas pesadas de temas. |
| **Persistência de Dados** | Estratégia Híbrida: Firebase Firestore em Nuvem + Fallback LocalStorage | Garante sincronização em tempo real entre celulares e PCs na operação real, e mantém o sistema 100% funcional caso o dispositivo fique momentaneamente sem internet. | Apenas LocalStorage (não sincroniza entre aparelhos diferentes de clientes e cozinha). |
| **Checkout & Pagamento** | Pix Direto BRCode + Maquininha + Dinheiro | 0% de taxas de intermediação, dinheiro na conta do restaurante na mesma hora. | Exclusividade de gateways com taxas de 3% a 5% por transação. |

---

## 4. Arquitetura Técnica & Diagrama de Dados

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ARQUITETURA DO SISTEMA                          │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   ┌─────────────────────┐                 ┌────────────────────────┐   │
│   │   PAINEL ADMIN      │                 │  CARDÁPIO DO CLIENTE   │   │
│   │ (Gestor / Cozinha)  │                 │    (Mobile / PWA)      │   │
│   │                     │                 │                        │   │
│   │ • Tema Admin        │                 │ • Tema Cardápio        │   │
│   │   [Claro / Escuro]  │                 │   [Claro / Escuro]     │   │
│   │ • KDS com Campainha │                 │ • Geração Pix BRCode   │   │
│   │   (Web Audio API)   │                 │ • Carrinho & Checkout  │   │
│   │ • Controle Estoque  │                 │ • Pedido para WhatsApp │   │
│   └──────────┬──────────┘                 └───────────┬────────────┘   │
│              │                                        │                │
│              ▼                                        ▼                │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                 CAMADA DE ESTADO & SERVIÇOS                    │   │
│   │                                                                │   │
│   │  • ThemeManager: Controle independente admin/cardápio          │   │
│   │  • SoundService: Web Audio Chime com volume e toggle           │   │
│   │  • OrderDispatcher: Envia pedidos para KDS e armazena         │   │
│   │  • SyncBridge: Sincronização Nuvem (Firestore) + LocalStorage  │   │
│   └────────────────────────────────┬───────────────────────────────┘   │
│                                    │                                   │
│                                    ▼                                   │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                    PERSISTÊNCIA DE DADOS                       │   │
│   │                                                                │   │
│   │  • Cloud Firestore: Sincronização multi-dispositivos tempo-real│   │
│   │  • LocalStorage Cache: Resiliência offline e startup rápido    │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Roteiro Passo a Passo de Execução

1. **Passo 1: Motor de Temas Claro/Escuro (`ThemeContext` / Estado)**
   - Adicionar estado de tema do Painel (`adminTheme: 'dark' | 'light'`) persistido em preferências locais.
   - Adicionar controle de tema do Cardápio do Cliente (`storeConfig.customizacao.modoEscuro`) para definir se a loja pública abre em tema escuro ou claro, com switch acessível no simulador.
   - Atualizar componentes estruturais (`Header`, `App`, `OrdersKdsView`, `InventoryView`, `ReportsView`, `CustomerSimulator`) com classes dinâmicas com alto contraste legível nos dois modos.

2. **Passo 2: Campainha Sonora e Alertas do KDS**
   - Criar utilitário `soundAlert.ts` baseado em `AudioContext` nativo do navegador para tocar um bipe/campainha melodiosa de 2 tons agradáveis para cozinha profissional.
   - Integrar no `OrdersKdsView` com botão de alternância (Ativar/Desativar Som) e botão de teste de áudio.
   - Conectar o envio de pedido do `CustomerSimulator` diretamente ao `OrdersKdsView` disparando o alerta sonoro e adicionando o pedido imediatamente na coluna "Recebido".

3. **Passo 3: Mapeamento de Sincronização em Nuvem (Firebase Firestore)**
   - Estruturar o blueprint do Firestore (`firebase-blueprint.json`) contemplando coleções:
     - `stores/{storeId}`: configurações da loja, horários e identidade.
     - `products/{productId}`: itens do cardápio, adicionais e status de estoque.
     - `orders/{orderId}`: pedidos em andamento e histórico de vendas.
   - Configurar o provisionamento do Firebase via fluxo seguro padrão AI Studio.

4. **Passo 4: Guia Operacional de Implantação do Zero em Cliente Real**
   - Atualizar a aba e o assistente de implantação com o checklist de lançamento definitivo:
     - Cadastro da chave Pix oficial do cliente e teste de QR Code.
     - Cadastro dos produtos e fotos reais com preços corretos.
     - Ajuste das taxas de entrega por bairro.
     - Instalação do cardápio como app no celular (PWA).
     - Teste de ponta a ponta: pedido do cliente no celular $\rightarrow$ campainha no PC da cozinha $\rightarrow$ impressão de comanda 80mm $\rightarrow$ rota de entrega.
