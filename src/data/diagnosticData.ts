export interface DiagnosticItem {
  id: string;
  categoria: 'urgente' | 'estrutural' | 'vendas' | 'tecnico';
  titulo: string;
  problemaAtual: string;
  impactoNoNegocio: string;
  solucaoImplementada: string;
}

export const DIAGNOSTICO_PROJETO: DiagnosticItem[] = [
  {
    id: 'pizza-vs-burger',
    categoria: 'urgente',
    titulo: 'Incoerência de Marca: Código herdado de Pizzaria',
    problemaAtual: 'O projeto tem nome "Max hamburguer", mas o código e interface ainda exibem termos como "Todas as nossas pizzas são feitas com massa 100% integral", seletor de "Borda Catupiry/Cheddar", "Meio a Meio", "Tamanhos P/M/G 25cm/30cm/35cm" e contagem de fidelidade "pizzasContadas".',
    impactoNoNegocio: 'Confunde o cliente que tenta pedir um hambúrguer mas vê opções de borda recheada e tamanho de pizza; passa impressão de amadorismo e quebra a taxa de conversão.',
    solucaoImplementada: 'Adequação completa para hamburgueria artesanal: opções reais de hambúrguer (Ponto da carne, Tipo de pão brioche/australiano, Adicionais com cobrança extra automática, e Opção de retirar ingredientes).',
  },
  {
    id: 'cadastro-sem-interface',
    categoria: 'estrutural',
    titulo: 'Ausência de Gestão Visual de Produtos (Cadastro Travado)',
    problemaAtual: 'Para alterar preços, criar hambúrgueres novos ou mudar fotos, o restaurante dependia de editar arquivos de código manualmente (produtos.json ou config.js) ou rodar queries complexas no Supabase.',
    impactoNoNegocio: 'O dono ou atendente do restaurante não consegue atualizar o cardápio no dia a dia. Se um item encarece ou muda a receita, o cardápio fica desatualizado.',
    solucaoImplementada: 'Criamos este Painel Intuitivo de Cadastro de Produtos com interface moderna, suporte a fotos, categorias personalizadas, grupos de complementos e exportação instantânea.',
  },
  {
    id: 'estoque-pausa-rapida',
    categoria: 'vendas',
    titulo: 'Falta de Controle de "Pausar Produto Esgotado" em 1 Clique',
    problemaAtual: 'Se acabasse o bacon, o pão australiano ou uma cerveja durante a noite, não havia botão rápido de "Esgotado". O cliente pedia e o restaurante tinha que mandar WhatsApp avisando que não tinha.',
    impactoNoNegocio: 'Frustração do cliente, cancelamento de pedidos e retrabalho para o atendente estornar Pix ou trocar o pedido.',
    solucaoImplementada: 'Botão de toggle instantâneo "Disponível / Esgotado" em cada card, com filtro de conferência diária antes de abrir.',
  },
  {
    id: 'confirmacao-cardapio-dia',
    categoria: 'vendas',
    titulo: 'Rotina de "Confirmar Cardápio de Hoje" para os Clientes',
    problemaAtual: 'O restaurante não tinha uma rotina para checar os preços do dia, ativar o happy hour e disparar o cardápio confirmado para os clientes.',
    impactoNoNegocio: 'Itens em promoção errada ou esquecimento de ativar o horário de funcionamento.',
    solucaoImplementada: 'Checklist interativo de 3 minutos de abertura: confere itens pausados, ativa promoções e gera texto formatado de transmissão para WhatsApp e Instagram Stories.',
  },
  {
    id: 'adicionais-ticket-medio',
    categoria: 'vendas',
    titulo: 'Oportunidade Perdida de Upsell (Aumentar Ticket Médio)',
    problemaAtual: 'Em hamburguerias, mais de 30% do lucro vem dos adicionais pagos (bacon extra +R$4,50, hambúrguer extra +R$9,90, molho verde da casa +R$4,50, batata turbinada). No código anterior, não havia suporte a opcionais pagos.',
    impactoNoNegocio: 'Ticket médio estagnado e cliente sem opção de personalizar o lanche do jeito que ama.',
    solucaoImplementada: 'Módulo completo de Grupos de Adicionais e Complementos no cadastro de cada produto, com cálculo automático no carrinho e no pedido enviado pelo WhatsApp.',
  },
  {
    id: 'pre-visualizacao-cliente',
    categoria: 'tecnico',
    titulo: 'Falta de Simulador em Tempo Real',
    problemaAtual: 'O lojista alterava o cardápio às cegas sem saber exatamente como o cliente final enxergaria no smartphone.',
    impactoNoNegocio: 'Erros de digitação, fotos cortadas e descrições confusas só eram descobertos após o cliente reclamar.',
    solucaoImplementada: 'Simulador integrado estilo iPhone que roda ao vivo o cardápio do cliente com carrinho interativo, cálculo de frete e envio teste para o WhatsApp.',
  },
];
