# Gerenciador de Taxas de Entrega por Bairro e Região

Aprimoramento da seção de logística e frete em **Configurações da Loja**, permitindo que o gerente do estabelecimento configure taxas de entrega tanto no modo **Individual por Bairro** (com taxa específica, tempo estimado e chave de status Ativo/Inativo por bairro) quanto no modo **Por Região / Zona de Entrega**, salvando esses dados diretamente na configuração do estabelecimento no Firestore e refletindo instantaneamente no Cardápio Digital e no Simulador.

## User Review & Critical Decisions

> [!IMPORTANT]
> As decisões abaixo foram confirmadas na etapa de alinhamento e guiam toda a implementação:

- **Decisão Confirmada 1 — Organização Híbrida (Individual por Bairro + Regiões/Zonas)**: O gerente poderá alternar e gerenciar entregas tanto em uma grade detalhada **Bairro a Bairro** (com busca rápida, adição individual de bairro, taxa em R$, tempo estimado e região vinculada) quanto em **Zonas/Regiões Agrupadas** (onde uma alteração de preço ou prazo da região pode ser aplicada em lote aos bairros daquela zona ou sobrescrita individualmente).
- **Decisão Confirmada 2 — Controle de Tempo Estimado e Status Ativo/Inativo por Bairro**: Cada bairro cadastrado contará com seu próprio tempo médio de entrega (ex.: `20-30 min`, `45-60 min`) e um seletor **Ativo / Inativo** para pausar temporariamente entregas em bairros específicos (por exemplo, em dias de chuva forte ou alta demanda) sem precisar excluir o bairro da base.

---

## 1. Overview & Core Concept

- **What It Does**: Substitui o campo de texto simples de faixas de entrega em **Configurações da Loja** por um módulo completo de **Gestão de Taxas de Entrega por Bairro e Região**. O gerente visualiza métricas rápidas (total de bairros ativos, menor/maior taxa, bairros pausados), filtra bairros em tempo real, cadastra novos bairros individualmente ou em lotes por região, define preços e tempos estimados específicos e ativa/desativa o atendimento de cada bairro com um clique.
- **Target Audience / Persona**: Gerentes de estabelecimentos (hamburguerias, pizzarias, restaurantes, açaiterias) que precisam precificar o frete de forma justa conforme a distância de cada bairro e controlar a área de cobertura em tempo real.
- **Key Value**: Elimina erros de cálculo manual de frete no WhatsApp, impede pedidos de bairros temporariamente suspensos e garante que o Cardápio Digital exclusivo de cada loja exiba apenas os bairros ativos com suas respectivas taxas e prazos exatos.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Resumo e Alternância de Visualização**: Ao acessar **Configurações da Loja → Taxas de Entrega por Bairro e Região**, o gerente vê indicadores rápidos (Bairros Ativos, Bairros Pausados, Taxa Média) e um controle segmentado para alternar entre **Visão por Bairros (Individual)** e **Visão por Regiões / Zonas**.
  2. **Cadastro Rápido de Bairro Individual**: No topo do componente, uma barra de adição rápida permite informar Nome do Bairro, Região/Zona (ex.: Central, Intermediária, Afastada ou nova região), Taxa (R$), Tempo Estimado (ex.: `25-35 min`) e clicar em **Adicionar Bairro**.
  3. **Edição Inline e Status Ativo/Inativo**: Na tabela de bairros, o gerente pode pesquisar qualquer bairro pelo nome, ajustar o valor da taxa em R$ (com formatação numérica tabular), editar o tempo estimado, mudar a região ou clicar no botão **Ativo / Pausado** para liberar ou suspender entregas naquele bairro imediatamente.
  4. **Gestão por Região / Zona**: Na aba de regiões, o gerente cria ou edita zonas de entrega (ex.: *Zona Próxima*, *Zona Intermediária*, *Zona Distante*), adiciona bairros rapidamente via chips/tags interativas e pode aplicar o preço/tempo padrão da zona aos bairros vinculados.
  5. **Persistência e Reflexo no Checkout**: Ao clicar em **Salvar Alterações**, todas as regras de bairros e regiões são gravadas no registro do estabelecimento (`StoreConfig` no Firestore) e passam a vigorar imediatamente no seletor de bairros do **Cardápio Digital do Cliente** e no **Simulador**.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Painel SaaS operacional de alta densidade e leitura imediata, seguindo a disciplina de superfície única com bordas sutis (`border-neutral-800`) e contraste escuro (`#0A0A0A` / `#171717`).
  - *Color Palette & Mood*: Superfície neutra escura predominante (60%), containers estruturais em cinza grafite (30%) e acentos semânticos (10%): Laranja/Âmbar (`#F97316`) para ações primárias, Verde Esmeralda (`#10B981`) para taxas e bairros ativos, e Cinza/Vermelho suave para bairros pausados.
  - *Typography & Hierarchy*: Títulos nítidos, rótulos objetivos em linha única (`whitespace-nowrap`) e valores monetários (`R$ 7,00`) e tempos (`30-45 min`) com alinhamento numérico tabular (`font-mono tabular-nums`).
  - *Component Styling & Layout*: Grade responsiva com linhas compactas, controles segmentados limpos para alternar entre *Bairros Individuais* e *Regiões/Zonas*, e metadados em texto limpo separado por `·` (sem excesso de pílulas decorativas).

- **Interactive Feedback & Motion**:
  - Transições rápidas ($\le 150\text{ms}$) ao alternar status Ativo/Inativo de um bairro ou trocar de aba.
  - Feedback visual imediato via Toast ao adicionar, remover, importar bairros ou salvar as configurações do estabelecimento.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Modelo de Dados Sincronizado e Retrocompatível (`taxasBairros` + `faixasEntrega`)**
  - *Chosen Approach*: Armazenar a lista detalhada de bairros individuais (com `id`, `bairro`, `regiao`, `preco`, `tempo`, `ativo`) sincronizada com a estrutura `faixasEntrega` dentro de `StoreConfig`.
  - *Why*: Garante que tanto estabelecimentos já cadastrados quanto novas lojas funcionem perfeitamente sem perda de dados, permitindo edições granulares por bairro (preço e tempo específicos + ativo/inativo) ao mesmo tempo em que mantém o agrupamento por região/zona no Cardápio Digital.
  - *Alternatives Considered*: Substituir `faixasEntrega` quebraria a compatibilidade com lojas existentes que já possuem faixas salvas no banco de dados.

- **Decision 2: Filtragem Automática de Bairros Inativos no Checkout do Cliente**
  - *Chosen Approach*: Bairros marcados como `ativo: false` permanecem salvos no painel do gerente (podendo ser reativados com 1 clique), mas ficam ocultos ou sinalizados como indisponíveis no seletor de entrega do Cardápio Digital.
  - *Why*: Evita que o gerente tenha que apagar e recadastrar bairros toda vez que precisar restringir a área de entrega em horários de pico ou chuva.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     StoreConfig (Firestore: store_config)               │
│  • taxaEntregaPadrao / tempoEntrega                                     │
│  • faixasEntrega (Regiões/Zonas + Bairros vinculados)                   │
│  • taxasBairros (Regras individuais: bairro, regiao, preco, tempo, ativo)│
└───────────────────┬─────────────────────────────────────┬───────────────┘
                    │                                     │
                    ▼                                     ▼
┌───────────────────────────────────────────┐ ┌───────────────────────────┐
│     Configurações da Loja (Gerente)       │ │ Cardápio Digital &        │
│  ┌─────────────────────────────────────┐  │ │ Simulador do Cliente      │
│  │ Gerenciador de Taxas de Entrega     │  │ │ • Lista apenas bairros    │
│  │ • Busca e Filtro (Ativos/Pausados)  │  │ │   com status Ativo        │
│  │ • Modo 1: Tabela Individual Bairro  │  │ │ • Exibe Taxa (R$) e       │
│  │   (Taxa R$, Tempo, Região, Ativo)   │  │ │   Tempo Estimado exatos   │
│  │ • Modo 2: Agrupamento por Região    │  │ │   no carrinho e WhatsApp  │
│  │   (Edição em lote + Tags de Bairros)│  │ └───────────────────────────┘
│  └─────────────────────────────────────┘  │
└───────────────────────────────────────────┘
```

- **Data Model & State**:
  - `NeighborhoodDeliveryFee`:
    - `id: string`
    - `bairro: string` (Nome do bairro)
    - `regiao: string` (Nome da região/zona, ex.: `"Região Central"`, `"Zona Sul"`)
    - `preco: number` (Valor da taxa em R$)
    - `tempo: string` (Tempo estimado, ex.: `"25-35 min"`)
    - `ativo: boolean` (Status de disponibilidade para entrega)
  - `DeliveryZone` (`faixasEntrega`):
    - Mantido e enriquecido com suporte a status `ativo` e sincronização bidirecional com `taxasBairros` no momento de salvar `StoreConfig`.

- **Interactive Component & State Mapping**:
  - **Adição Individual de Bairro**: Valida se o nome do bairro foi preenchido, evita duplicidade (atualizando se já existir), insere na lista com `ativo: true` e limpa o campo de entrada.
  - **Alternância Ativo/Inativo**: Inverte o booleano `ativo` do bairro selecionado e atualiza os contadores de resumo instantaneamente.
  - **Edição por Região/Zona**: Permite criar novas zonas, alterar o preço/tempo padrão de todos os bairros pertencentes àquela zona com um botão *"Aplicar aos bairros da região"*, ou adicionar múltiplos bairros de uma só vez.
  - **Salvamento (`handleSaveAll`)**: Sincroniza `taxasBairros` e `faixasEntrega` dentro do objeto `StoreConfig` e persiste no Firestore (`store_config/{storeId}`) via `onSaveConfig`.
