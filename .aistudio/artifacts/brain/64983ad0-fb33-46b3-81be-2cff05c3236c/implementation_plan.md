# Sincronização em Tempo Real no Cloud Firestore e Operação Multi-Dispositivo

Este plano finaliza a migração da persistência de dados da plataforma para o **Cloud Firestore**, garantindo que todas as alterações no cardápio, preços, disponibilidade de itens, configurações da loja, pedidos enviados pelo cardápio digital e permissões de equipe sejam sincronizadas instantaneamente entre todos os dispositivos conectados.

## Revisão e Decisões Principais

> [!IMPORTANT]
> A arquitetura prioriza a **sincronização automática em tempo real (Cloud-First)** com fallback resiliente para leitura instantânea, assegurando que o painel administrativo, o monitor de cozinha (KDS) e o cardápio digital do cliente reflitam a mesma base de dados na nuvem.

- **Decisão Confirmada 1 — Persistência Automática de Produtos e Loja no Firestore**: Todas as ações de criação, edição, duplicação, exclusão, ajuste de preços em lote, alteração de disponibilidade (1-clique) e personalização da loja passam a gravar diretamente no banco provisionado no Firestore, propagando atualizações em tempo real (`onSnapshot`) para todos os aparelhos abertos.
- **Decisão Confirmada 2 — Fluxo Completo do Cardápio Digital até o KDS**: Pedidos realizados pelos clientes no Simulador / Cardápio Digital são gravados automaticamente no Firestore, disparando alerta sonoro e visual instantâneo no monitor de pedidos (KDS) de qualquer computador ou tablet da operação.
- **Decisão Confirmada 3 — Inicialização Inteligente (Auto-Seed) e Gestão de Equipe**: Caso o banco de dados na nuvem ainda não possua os produtos ou configurações iniciais no primeiro acesso autenticado, o sistema popula automaticamente a coleção inicial no Firestore e disponibiliza o painel de Equipe & Administradores para controle de acessos e sincronização forçada quando necessário.

---

## 1. Visão Geral e Conceito Central

- **O Que Entrega**: Substituição do armazenamento isolado por navegador por uma camada reativa conectada ao Cloud Firestore. Qualquer alteração feita pelo administrador no celular ou computador (como pausar um item esgotado, mudar a taxa de entrega ou atualizar a chave Pix) reflete imediatamente no cardápio visto pelos clientes e nos terminais da cozinha.
- **Público-Alvo e Contexto**: Proprietários de estabelecimentos gastronômicos, gerentes de operação, atendentes de caixa e clientes finais que acessam o cardápio digital simultaneamente em múltiplos dispositivos.
- **Valor Principal**: Eliminação de divergências de preços ou itens esgotados entre dispositivos e centralização de pedidos, cardápio e configurações em tempo real para implantação comercial em estabelecimentos reais.

---

## 2. Experiência do Usuário e Design Visual

- **Fluxos de Uso Principais**:
  1. **Sincronização Transparente ao Abrir o App**: Ao carregar a plataforma, o sistema estabelece ouvintes em tempo real (`onSnapshot`) para as coleções de configurações da loja e produtos. Enquanto os dados sincronizam, o indicador de nuvem no cabeçalho exibe o estado ativo da conexão.
  2. **Atualização Instantânea de Cardápio e Preços**: Ao adicionar um produto, alterar preço rápido no card, aplicar reajuste em lote, trocar segmento ou confirmar o checklist diário, o sistema salva cada documento no Firestore (e remove itens excluídos na nuvem) sem exigir recarregamento de página.
  3. **Envio de Pedido do Cliente para o KDS**: Quando um consumidor finaliza o pedido no cardápio digital, o pedido é registrado na coleção de pedidos do Firestore com status inicial e aparece imediatamente na fila do KDS com aviso sonoro.
  4. **Painel de Equipe e Controle de Nuvem**: Pelo botão de Equipe no cabeçalho, o administrador principal gerencia os e-mails autorizados a editar a loja e pode acionar a sincronização completa do catálogo com um clique.

- **Identidade Visual e Tema**:
  - *Direção Estética*: Painel SaaS operacional de alta densidade e legibilidade (padrão *SaaS & Dashboard*), priorizando contraste claro, superfícies com bordas sutis de `1px` e hierarquia direta sem ornamentos artificiais.
  - *Paleta de Cores*: Base neutra em tons ardósia/grafite no modo escuro (`#0A0A0A` / `#171717`) e superfície limpa no modo claro (`#F8FAFC` / `#FFFFFF`), com destaque semântico laranja (`#F97316`) para ações primárias, verde esmeralda (`#10B981`) para status ativo/sincronizado, âmbar (`#F59E0B`) para atenção e vermelho (`#EF4444`) para itens pausados ou alertas.
  - *Tipografia e Alinhamento Numérico*: Tipografia sem serifa de leitura rápida para navegação e rótulos em linha única (`whitespace-nowrap`), combinada com numerais tabulares (`tabular-nums`) em todos os preços, contadores de estoque, taxas de entrega e valores financeiros.

- **Feedback Interativo**:
  - Notificações toast discretas confirmando cada gravação ou exclusão sincronizada na nuvem, além de tratamento estruturado de permissões caso um usuário não autenticado tente realizar operações restritas a administradores.

---

## 3. Decisões de Produto e Trade-Offs

- **Decisão 1: Escrita Direta por Documento vs. Sobrescrita Completa de Coleção**
  - *Abordagem Escolhida*: Sincronização granular por documento de produto (criação, atualização individual, exclusão dedicada no Firestore e gravação em lote otimizada para reajustes ou troca de segmento) combinada com documento único para configurações gerais da loja.
  - *Por Quê*: Reduz o consumo de leituras/escritas no Firestore, evita condições de corrida quando dois administradores editam itens diferentes ao mesmo tempo e garante baixa latência.
  - *Alternativas Consideradas*: Salvar todo o cardápio dentro de um único documento JSON foi descartado para respeitar o limite de tamanho de documento e permitir regras de validação granulares por produto.

- **Decisão 2: Estratégia Híbrida de Cache Local + Fonte da Verdade no Firestore**
  - *Abordagem Escolhida*: O Firestore atua como a fonte primária da verdade através de assinaturas em tempo real (`onSnapshot`), mantendo um espelhamento automático no cache local apenas para renderização imediata no primeiro milissegundo de abertura.
  - *Por Quê*: Garante que o aplicativo abra instantaneamente mesmo em conexões móveis instáveis, atualizando a tela assim que o stream do Firestore entrega os dados mais recentes.

---

## 4. Arquitetura Técnica e Estratégia de Dados *(Referência Técnica)*

### Diagrama de Arquitetura e Sincronização em Tempo Real

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     Camada de Autenticação & Contexto                    │
│     Google Sign-In (Firebase Auth) ──► Verificação de Admin / Equipe     │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                Camada de Sincronização (Cloud Firestore)                 │
│                                                                          │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────┐  │
│  │  Configuração Loja  │  │  Catálogo Produtos  │  │ Pedidos & Equipe │  │
│  │ (Documento Padrão)  │  │ (Coleção Produtos)  │  │ (KDS / Admins)   │  │
│  └──────────┬──────────┘  └──────────┬──────────┘  └────────┬─────────┘  │
└─────────────┼────────────────────────┼──────────────────────┼────────────┘
              │ onSnapshot / setDoc    │ onSnapshot / write   │ onSnapshot
              ▼                        ▼                      ▼
┌────────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   Configurações, Pix,  │  │ Gestão de Cardápio, │  │ Cardápio Digital &  │
│  Personalização Visual │  │ Preços em Lote,     │  │ Monitor KDS Tempo   │
│  e Checklist Diário    │  │ Estoque e Exclusão  │  │ Real + Modal Equipe │
└────────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

### Modelo de Dados e Estado

1. **Configurações da Loja (`store_config/default`)**:
   - Armazena identidade do estabelecimento (nome, slogan, segmento, endereço, WhatsApp), parâmetros operacionais (taxa de entrega, tempo médio, status aberto/fechado, confirmação do cardápio do dia), configurações completas de pagamento (Pix com chave/titular/desconto, cartões, dinheiro, vales), fidelidade/cupons e personalização visual.
2. **Catálogo de Produtos (`products/{productId}`)**:
   - Armazena dados completos do item: identificação, nome, descrição, categoria, segmento, preço base, preço promocional, foto, disponibilidade, destaque, selo, unidade de medida, tempo de preparo e grupos de complementos/opcionais (`opcoes`).
3. **Pedidos em Tempo Real (`orders/{orderId}`)**:
   - Registra os pedidos submetidos pelos clientes no Simulador / Cardápio Digital com itens, opcionais escolhidos, endereço/mesa, forma de pagamento, totais e status operacional (`recebido`, `preparo`, `pronto`, `entrega`, `concluido`, `cancelado`).
4. **Administradores Autorizados (`admins/{email}`)**:
   - Controla os usuários autorizados pelo administrador principal a modificar configurações, produtos e status de pedidos.

### Mapeamento de Interações e Mutação de Estado

- **Inicialização e Assinatura Reativa**:
  - Na montagem da aplicação principal, o sistema inicia as assinaturas `subscribeToStoreConfig` e `subscribeToProducts`.
  - Se a nuvem já contiver dados, o estado da aplicação e o cache local são atualizados imediatamente com os dados do Firestore.
  - Se o banco estiver vazio e o usuário estiver autenticado como administrador, os dados iniciais são enviados automaticamente para o Firestore para inicializar a loja na nuvem.
- **Operações de Produtos (CRUD Completo + Lote)**:
  - *Criar / Editar / Duplicar / Pausar / Destacar / Preço Rápido*: Atualiza o estado da interface imediatamente e persiste o documento completo (incluindo grupos de opcionais e configurações de medida) no Firestore.
  - *Excluir Produto*: Remove o item da listagem e executa a exclusão do documento correspondente no Firestore para que ele desapareça de todos os dispositivos conectados.
  - *Reajuste de Preços em Lote / Checklist Diário / Troca de Segmento*: Sincroniza todos os produtos afetados em lote no Firestore e atualiza a configuração da loja.
- **Operações de Configuração da Loja**:
  - Qualquer alteração em Dados da Loja, Personalização Visual, Configurações de Pagamento (Pix/Cartões), Fidelidade & Cupons ou Assistente de Implantação de Cliente persiste integralmente o objeto de configuração no Firestore.
- **Submissão de Pedido no Cardápio Digital**:
  - Ao finalizar um pedido no Simulador do Cliente (seja via pedido direto na plataforma ou fluxo integrado com WhatsApp), o pedido é gravado no Firestore via `syncOrderToFirestore`, tornando-se imediatamente visível na aba Pedidos & KDS em qualquer tela aberta.
