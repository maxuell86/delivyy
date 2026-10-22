export type SegmentId = 
  | 'hamburgueria'
  | 'pizzaria'
  | 'restaurante'
  | 'confeitaria'
  | 'padaria'
  | 'acaiteria'
  | 'japones';

export interface SegmentConfig {
  id: SegmentId;
  nome: string;
  icone: string;
  descricao: string;
  corPrimaria: string;
  corSecundaria: string;
  termoProduto: string; // "Hambúrguer", "Pizza", "Prato/Marmita", "Bolo/Doce", "Açaí"
  regrasExclusivas: {
    permiteMeioAMeio?: boolean;
    permiteTamanhos?: boolean;
    tamanhosPadrao?: { id: string; rotulo: string; detalhe: string; multiplicadorPreco: number }[];
    gruposOpcionaisSugeridos: string[];
  };
}

export type CategoryId = string;

export interface CategoryInfo {
  id: CategoryId;
  nome: string;
  icone: string;
  descricao: string;
  segmento?: SegmentId;
  cor?: string;
}

export interface ProductOptionItem {
  id: string;
  nome: string;
  preco: number;
}

export interface ProductOptionGroup {
  id: string;
  titulo: string;
  tipo: 'unico' | 'multiplo'; // unico = radio (ex: ponto/tamanho/massa), multiplo = checkbox (ex: adicionais/bordas)
  obrigatorio: boolean;
  minimo?: number;
  maximo?: number;
  itens: ProductOptionItem[];
}

export interface Product {
  id: string;
  nome: string;
  categoria: CategoryId;
  segmento?: SegmentId;
  preco: number;
  precoPromocional?: number;
  descricao: string;
  foto: string;
  disponivel: boolean;
  destaque?: boolean;
  selo?: string;
  tempoPreparoMin?: number;
  unidadeMedida?: string; // "unidade", "fatia", "porção", "500ml", "kg"
  opcoes?: ProductOptionGroup[];
  // Regras de Pizza (quando segmento for pizzaria)
  permiteMeioAMeio?: boolean;
  tamanhosPreco?: { [tamanhoId: string]: number };
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface PaymentMethodsConfig {
  pixAtivo: boolean;
  pixTipo: 'direto' | 'mercadopago'; // direto = chave Pix direta sem taxas; mercadopago = gateway automático
  pixChave: string;
  pixTipoChave: 'telefone' | 'cpf' | 'cnpj' | 'email' | 'aleatoria';
  pixTitular: string;
  pixCidade: string;
  pixDescontoPct: number; // ex: 5% de desconto para quem paga no Pix
  
  dinheiroAtivo: boolean;
  perguntarTroco: boolean;

  cartaoEntregaAtivo: boolean;
  cartaoDebitoAtivo: boolean;
  cartaoCreditoAtivo: boolean;
  bandeirasAceitas: string[];

  valeRefeicaoAtivo: boolean;
  valesAceitos: string[];

  mercadoPagoPublicKey?: string;
}

export interface DeliveryZone {
  nome: string;
  preco: number;
  tempo: string;
  bairros: string[];
}

export interface LoyaltyTier {
  id: string;
  nome: string;
  cor: string;
  minimo: number;
  descontoPct: number;
  desc: string;
}

export interface CouponItem {
  codigo: string;
  desconto: number;
  tipo: 'livre' | 'nivel' | 'aniversario';
  minimo?: number;
  msg: string;
}

export interface StoreConfig {
  segmento: SegmentId;
  nome: string;
  slogan: string;
  cidade: string;
  bairro: string;
  endereco: string;
  whatsapp: string;
  whatsappExibicao: string;
  corTema: string;
  taxaEntregaPadrao: number;
  tempoEntrega: string;
  aberto: boolean;
  horarioFuncionamento: string;
  cardapioConfirmadoHoje: boolean;
  ultimaConfirmacao?: string;
  pagamentos?: PaymentMethodsConfig;
  
  // Recursos Integrados do Projeto
  faixasEntrega?: DeliveryZone[];
  happyHour?: {
    ativo: boolean;
    inicio: number;
    fim: number;
    descontoPct: number;
    texto: string;
  };
  fidelidade?: {
    boasVindasPct: number;
    niveis: LoyaltyTier[];
  };
  cupons?: CouponItem[];
  horariosGrade?: { [dia: string]: { abre: number; fecha: number } | null };
}

export interface CartItem {
  id: string;
  produto: Product;
  quantidade: number;
  tamanhoSelecionado?: string;
  saboresMeioAMeio?: string[];
  opcoesSelecionadas: {
    grupoTitulo: string;
    itemNome: string;
    itemPreco: number;
  }[];
  observacoes?: string;
  subtotal: number;
}

