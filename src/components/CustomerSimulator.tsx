import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  MapPin, 
  Clock, 
  MessageCircle, 
  Plus, 
  Minus, 
  X, 
  Check, 
  Send, 
  Sparkles, 
  QrCode, 
  CreditCard, 
  DollarSign, 
  Utensils, 
  Copy 
} from 'lucide-react';
import { Product, StoreConfig, CartItem, CategoryId } from '../types';
import { CATEGORIAS_POR_SEGMENTO, SEGMENTOS_DISPONIVEIS } from '../data/segmentData';
import { generatePixPayload } from '../utils/pixPayload';

interface CustomerSimulatorProps {
  products: Product[];
  storeConfig: StoreConfig;
}

export const CustomerSimulator: React.FC<CustomerSimulatorProps> = ({
  products,
  storeConfig,
}) => {
  const currentSegment = storeConfig.segmento || 'hamburgueria';
  const segmentConfig = SEGMENTOS_DISPONIVEIS.find((s) => s.id === currentSegment) || SEGMENTOS_DISPONIVEIS[0];
  const categoriasDoSegmento = CATEGORIAS_POR_SEGMENTO[currentSegment] || CATEGORIAS_POR_SEGMENTO.hamburgueria;
  const paymentConfig = storeConfig.pagamentos || {
    pixAtivo: true,
    pixTipo: 'direto',
    pixChave: '65996953036',
    pixTipoChave: 'telefone',
    pixTitular: 'MAX HAMBURGUER',
    pixCidade: 'TANGARA DA SERRA',
    pixDescontoPct: 5,
    dinheiroAtivo: true,
    perguntarTroco: true,
    cartaoEntregaAtivo: true,
    cartaoDebitoAtivo: true,
    cartaoCreditoAtivo: true,
    bandeirasAceitas: ['Visa', 'Mastercard', 'Elo'],
    valeRefeicaoAtivo: true,
    valesAceitos: ['Alelo Refeição', 'Sodexo / Pluxee', 'VR Benefícios', 'Ticket Restaurante'],
  };

  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'todos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProductModal, setActiveProductModal] = useState<Product | null>(null);

  // Customization modal state
  const [modalQuantity, setModalQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<{ [groupId: string]: string[] }>({});
  const [itemNotes, setItemNotes] = useState('');

  // Pizza special states (Meio a meio)
  const [segundoSaborPizza, setSegundoSaborPizza] = useState<string>('');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(`${storeConfig.endereco} - ${storeConfig.bairro}`);
  
  // Payment states in Cart
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CartaoCredito' | 'CartaoDebito' | 'Dinheiro' | 'ValeRefeicao'>('PIX');
  const [trocoPara, setTrocoPara] = useState('');
  const [valeSelecionado, setValeSelecionado] = useState(paymentConfig.valesAceitos[0] || 'Alelo');
  const [copiedPix, setCopiedPix] = useState(false);

  // Filter products for customer
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'todos' || p.categoria === selectedCategory;
    const matchesSearch =
      p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.descricao.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Open item customizer
  const handleOpenItem = (product: Product) => {
    if (!product.disponivel) return;

    setActiveProductModal(product);
    setModalQuantity(1);
    setItemNotes('');
    setSegundoSaborPizza('');

    const initialOptions: { [groupId: string]: string[] } = {};
    if (product.opcoes) {
      product.opcoes.forEach((grp) => {
        if (grp.tipo === 'unico' && grp.itens.length > 0) {
          initialOptions[grp.id] = [grp.itens[0].id];
        } else {
          initialOptions[grp.id] = [];
        }
      });
    }
    setSelectedOptions(initialOptions);
  };

  const handleToggleOption = (groupId: string, itemId: string, isUnique: boolean) => {
    const current = selectedOptions[groupId] || [];
    if (isUnique) {
      setSelectedOptions({ ...selectedOptions, [groupId]: [itemId] });
    } else {
      if (current.includes(itemId)) {
        setSelectedOptions({ ...selectedOptions, [groupId]: current.filter((id) => id !== itemId) });
      } else {
        setSelectedOptions({ ...selectedOptions, [groupId]: [...current, itemId] });
      }
    }
  };

  const calculateModalUnitPrice = () => {
    if (!activeProductModal) return 0;
    let price = activeProductModal.preco;

    if (activeProductModal.opcoes) {
      activeProductModal.opcoes.forEach((grp) => {
        const selectedItemIds = selectedOptions[grp.id] || [];
        grp.itens.forEach((item) => {
          if (selectedItemIds.includes(item.id)) {
            price += item.preco;
          }
        });
      });
    }
    return Math.max(0, price);
  };

  const handleAddToCart = () => {
    if (!activeProductModal) return;

    const unitPrice = calculateModalUnitPrice();
    const formattedOptions: { grupoTitulo: string; itemNome: string; itemPreco: number }[] = [];

    if (activeProductModal.opcoes) {
      activeProductModal.opcoes.forEach((grp) => {
        const selectedIds = selectedOptions[grp.id] || [];
        grp.itens.forEach((item) => {
          if (selectedIds.includes(item.id)) {
            formattedOptions.push({
              grupoTitulo: grp.titulo,
              itemNome: item.nome,
              itemPreco: item.preco,
            });
          }
        });
      });
    }

    const newItem: CartItem = {
      id: 'cart_' + Date.now(),
      produto: activeProductModal,
      quantidade: modalQuantity,
      saboresMeioAMeio: segundoSaborPizza ? [activeProductModal.nome, segundoSaborPizza] : undefined,
      opcoesSelecionadas: formattedOptions,
      observacoes: itemNotes.trim() || undefined,
      subtotal: unitPrice * modalQuantity,
    };

    setCart([...cart, newItem]);
    setActiveProductModal(null);
  };

  const updateCartQty = (index: number, delta: number) => {
    const newCart = [...cart];
    newCart[index].quantidade += delta;
    if (newCart[index].quantidade <= 0) {
      newCart.splice(index, 1);
    } else {
      const unit = newCart[index].subtotal / (newCart[index].quantidade - delta);
      newCart[index].subtotal = unit * newCart[index].quantidade;
    }
    setCart(newCart);
  };

  const cartSubtotal = cart.reduce((acc, curr) => acc + curr.subtotal, 0);
  
  // Calculate Pix discount if applicable
  const pixDiscount = paymentMethod === 'PIX' && paymentConfig.pixDescontoPct > 0
    ? (cartSubtotal * (paymentConfig.pixDescontoPct / 100))
    : 0;

  const cartTotal = cartSubtotal > 0
    ? Math.max(0, cartSubtotal - pixDiscount + storeConfig.taxaEntregaPadrao)
    : 0;

  // Pix Payload BRCode
  const pixPayloadCode = cartTotal > 0
    ? generatePixPayload({
        chave: paymentConfig.pixChave || '65996953036',
        nomeRecebedor: paymentConfig.pixTitular || storeConfig.nome,
        cidade: paymentConfig.pixCidade || storeConfig.cidade,
        valor: cartTotal,
      })
    : '';

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixPayloadCode);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  // Format message for WhatsApp
  const generateWhatsAppMessage = () => {
    let msg = `*${segmentConfig.icone} NOVO PEDIDO - ${storeConfig.nome.toUpperCase()}*\n`;
    msg += `--------------------------------\n\n`;
    msg += `*ITENS DO PEDIDO:*\n`;

    cart.forEach((item) => {
      let title = item.produto.nome;
      if (item.saboresMeioAMeio && item.saboresMeioAMeio.length === 2) {
        title = `Pizza 1/2 ${item.saboresMeioAMeio[0]} + 1/2 ${item.saboresMeioAMeio[1]}`;
      }

      msg += `*${item.quantidade}x ${title}* - R$ ${item.subtotal.toFixed(2).replace('.', ',')}\n`;
      if (item.opcoesSelecionadas.length > 0) {
        item.opcoesSelecionadas.forEach((opt) => {
          msg += `  • ${opt.itemNome}${opt.itemPreco > 0 ? ` (+R$ ${opt.itemPreco.toFixed(2)})` : ''}\n`;
        });
      }
      if (item.observacoes) {
        msg += `  Obs: _${item.observacoes}_\n`;
      }
      msg += `\n`;
    });

    msg += `--------------------------------\n`;
    msg += `*Subtotal:* R$ ${cartSubtotal.toFixed(2).replace('.', ',')}\n`;
    if (pixDiscount > 0) {
      msg += `*Desconto Pix (${paymentConfig.pixDescontoPct}%):* -R$ ${pixDiscount.toFixed(2).replace('.', ',')}\n`;
    }
    msg += `*Taxa de Entrega:* R$ ${storeConfig.taxaEntregaPadrao.toFixed(2).replace('.', ',')}\n`;
    msg += `*TOTAL A PAGAR: R$ ${cartTotal.toFixed(2).replace('.', ',')}*\n\n`;

    let pagFormatado = 'Pix';
    if (paymentMethod === 'PIX') pagFormatado = 'Pix (Chave da Loja)';
    if (paymentMethod === 'CartaoCredito') pagFormatado = 'Cartão de Crédito na Entrega (levar maquininha)';
    if (paymentMethod === 'CartaoDebito') pagFormatado = 'Cartão de Débito na Entrega (levar maquininha)';
    if (paymentMethod === 'Dinheiro') pagFormatado = `Dinheiro ${trocoPara ? `(Troco para R$ ${trocoPara})` : '(Sem troco)'}`;
    if (paymentMethod === 'ValeRefeicao') pagFormatado = `Vale Refeição / Alimentação (${valeSelecionado})`;

    msg += `*Endereço:* ${deliveryAddress}\n`;
    msg += `*Forma de Pagamento:* ${pagFormatado}\n`;
    msg += `*Tempo estimado:* ${storeConfig.tempoEntrega}\n\n`;
    msg += `Pedido enviado via cardápio online ${storeConfig.nome}!`;

    return msg;
  };

  const handleSendTestWhatsApp = () => {
    const text = encodeURIComponent(generateWhatsAppMessage());
    window.open(`https://wa.me/${storeConfig.whatsapp}?text=${text}`, '_blank');
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start justify-center max-w-7xl mx-auto py-4">
      {/* Simulation Info & Features */}
      <div className="flex-1 space-y-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2.5 text-orange-400 font-bold text-xs uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Simulador em Tempo Real do Cardápio &amp; Pagamentos</span>
          </div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>{segmentConfig.icone}</span>
            <span>Experiência de Compra &amp; Checkout do Cliente</span>
          </h2>
          <p className="text-sm text-neutral-400 mt-1 leading-relaxed">
            Veja como o checkout foi otimizado para o mercado brasileiro: geração de Pix Copia e Cola (BRCode oficial) direto na chave do lojista sem intermediários, cálculo de troco para dinheiro, cartões na maquininha e vales refeição (Alelo, Sodexo, VR, Ticket).
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-neutral-800 text-xs">
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <span className="font-bold text-emerald-400 block mb-1">Pix Sem Intermediário</span>
              <p className="text-neutral-400">0% de taxa por transação, dinheiro na hora na conta do lojista.</p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <span className="font-bold text-amber-400 block mb-1">Incentivo ao Pix</span>
              <p className="text-neutral-400">Aplica desconto automático ({paymentConfig.pixDescontoPct}%) estimulando pagamento à vista.</p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <span className="font-bold text-cyan-400 block mb-1">Maquininha &amp; Vales</span>
              <p className="text-neutral-400">Entregador já sai sabendo se precisa levar maquininha de crédito ou VR.</p>
            </div>
          </div>
        </div>

        {/* Live WhatsApp message preview if items in cart */}
        {cart.length > 0 && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4" />
                Mensagem Formatada com Forma de Pagamento para a Cozinha:
              </span>
              <button
                onClick={handleSendTestWhatsApp}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition"
              >
                <Send className="w-3 h-3" />
                Testar no WhatsApp
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
              {generateWhatsAppMessage()}
            </pre>
          </div>
        )}
      </div>

      {/* MOBILE DEVICE MOCKUP */}
      <div className="w-full max-w-[400px] mx-auto flex-shrink-0">
        <div className="relative rounded-[40px] bg-neutral-950 border-[8px] border-neutral-800 shadow-2xl overflow-hidden aspect-[9/19] flex flex-col">
          
          {/* Mobile Top Bar */}
          <div className="bg-neutral-900 text-neutral-400 px-6 pt-3 pb-2 text-[11px] font-semibold flex items-center justify-between border-b border-neutral-800 z-10">
            <span>20:28</span>
            <div className="w-16 h-3.5 bg-neutral-950 rounded-full mx-auto" />
            <span className="text-orange-400 font-bold">{segmentConfig.icone} Delivery</span>
          </div>

          {/* Delivery App Content Container */}
          <div className="flex-1 overflow-y-auto bg-neutral-950 text-white relative">
            
            {/* Header Banner */}
            <div className="relative aspect-[16/9] bg-neutral-900">
              <img
                src={products[0]?.foto || 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80'}
                alt="Banner"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent flex flex-col justify-end p-4">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500 text-white w-max mb-1">
                  {storeConfig.aberto ? 'ABERTO AGORA' : 'FECHADO'}
                </span>
                <h3 className="text-lg font-black text-white leading-tight">
                  {storeConfig.nome}
                </h3>
                <p className="text-[11px] text-neutral-300 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-orange-400" />
                  {storeConfig.bairro} • {storeConfig.cidade}
                </p>
                <p className="text-[10px] text-neutral-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-neutral-500" />
                  Entrega: {storeConfig.tempoEntrega} • Taxa R$ {storeConfig.taxaEntregaPadrao.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Quick Search inside app */}
            <div className="p-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Buscar ${segmentConfig.termoProduto.toLowerCase()}...`}
                  className="w-full pl-8 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Category horizontal scroll */}
            <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setSelectedCategory('todos')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${
                  selectedCategory === 'todos'
                    ? 'bg-orange-500 text-white'
                    : 'bg-neutral-900 text-neutral-400'
                }`}
              >
                Todos
              </button>
              {categoriasDoSegmento.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition flex items-center gap-1 ${
                    selectedCategory === cat.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-neutral-900 text-neutral-400'
                  }`}
                >
                  <span>{cat.icone}</span>
                  <span>{cat.nome.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* Product list */}
            <div className="p-3 space-y-2.5 pb-24">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleOpenItem(p)}
                  className={`p-2.5 rounded-xl bg-neutral-900 border transition flex gap-3 cursor-pointer ${
                    p.disponivel
                      ? 'border-neutral-800 hover:border-orange-500/50 active:scale-98'
                      : 'border-neutral-800/40 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-950 flex-shrink-0 relative">
                    <img
                      src={p.foto}
                      alt={p.nome}
                      className="w-full h-full object-cover"
                    />
                    {!p.disponivel && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <span className="text-[9px] font-black uppercase text-red-400">
                          Esgotado
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-white truncate">{p.nome}</h4>
                        {p.selo && (
                          <span className="text-[9px] font-black uppercase px-1 rounded bg-orange-500 text-white flex-shrink-0">
                            {p.selo}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                        {p.descricao}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-black text-emerald-400">
                          R$ {p.preco.toFixed(2).replace('.', ',')}
                          {p.unidadeMedida && p.unidadeMedida !== 'unidade' && (
                            <span className="text-[10px] text-neutral-400 font-normal"> /{p.unidadeMedida}</span>
                          )}
                        </span>
                        {p.precoPromocional && (
                          <span className="text-[9px] text-neutral-500 line-through">
                            R$ {p.precoPromocional.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>

                      {p.disponivel && (
                        <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                          {p.opcoes && p.opcoes.length > 0 ? 'Personalizar' : 'Pedir'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Floating Mobile Cart Bar */}
            {cart.length > 0 && (
              <div className="absolute bottom-2 left-2 right-2 z-20">
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="w-full py-2.5 px-3.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-2xl shadow-xl font-black text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-white text-emerald-700 flex items-center justify-center text-[10px] font-black">
                      {cart.reduce((a, c) => a + c.quantidade, 0)}
                    </span>
                    <span>Ver Carrinho &amp; Pagar</span>
                  </div>
                  <span>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                </button>
              </div>
            )}

            {/* CUSTOMIZATION MODAL */}
            {activeProductModal && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-xs z-30 flex flex-col justify-end animate-in fade-in duration-150">
                <div className="bg-neutral-900 border-t border-neutral-800 rounded-t-3xl max-h-[85%] flex flex-col overflow-hidden">
                  
                  {/* Top image & close */}
                  <div className="relative aspect-[16/8] bg-neutral-950 flex-shrink-0">
                    <img
                      src={activeProductModal.foto}
                      alt={activeProductModal.nome}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setActiveProductModal(null)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Body & Options */}
                  <div className="p-3.5 overflow-y-auto space-y-3 flex-1 text-xs">
                    <div>
                      <h3 className="text-sm font-black text-white">{activeProductModal.nome}</h3>
                      <p className="text-neutral-400 text-[11px] mt-0.5">{activeProductModal.descricao}</p>
                      <div className="text-emerald-400 font-black text-sm mt-1">
                        A partir de R$ {activeProductModal.preco.toFixed(2).replace('.', ',')}
                      </div>
                    </div>

                    {/* PIZZA EXCLUSIVE: Meio a Meio */}
                    {currentSegment === 'pizzaria' && (
                      <div className="pt-2 border-t border-neutral-800 space-y-1.5">
                        <span className="font-bold text-white block">🍕 Dividir com 2º Sabor? (Meio a Meio)</span>
                        <select
                          value={segundoSaborPizza}
                          onChange={(e) => setSegundoSaborPizza(e.target.value)}
                          className="w-full p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-[11px] outline-none"
                        >
                          <option value="">Não (Pizza inteira deste sabor)</option>
                          {products
                            .filter((p) => p.id !== activeProductModal.id && p.categoria.includes('pizza'))
                            .map((p) => (
                              <option key={p.id} value={p.nome}>
                                1/2 {p.nome}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                    {/* Standard Options groups */}
                    {activeProductModal.opcoes?.map((grp) => (
                      <div key={grp.id} className="pt-2 border-t border-neutral-800 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-white">{grp.titulo}</span>
                          {grp.obrigatorio && (
                            <span className="text-[9px] uppercase px-1 rounded bg-orange-500/20 text-orange-400 font-bold">
                              Obrigatório
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          {grp.itens.map((item) => {
                            const isSelected = (selectedOptions[grp.id] || []).includes(item.id);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleToggleOption(grp.id, item.id, grp.tipo === 'unico')}
                                className={`w-full p-2 rounded-lg border text-left flex items-center justify-between text-[11px] transition ${
                                  isSelected
                                    ? 'border-orange-500 bg-orange-500/10 text-white'
                                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-300'
                                }`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className={`w-3.5 h-3.5 rounded-${grp.tipo === 'unico' ? 'full' : 'md'} border flex items-center justify-center ${
                                      isSelected
                                        ? 'border-orange-500 bg-orange-500 text-white'
                                        : 'border-neutral-700 bg-neutral-900'
                                    }`}
                                  >
                                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                  </div>
                                  <span>{item.nome}</span>
                                </div>
                                {item.preco > 0 && (
                                  <span className="font-bold text-emerald-400">
                                    +R$ {item.preco.toFixed(2).replace('.', ',')}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Notes */}
                    <div className="pt-2 border-t border-neutral-800">
                      <label className="text-[11px] font-bold text-neutral-300 block mb-1">
                        Alguma observação para o pedido?
                      </label>
                      <input
                        type="text"
                        value={itemNotes}
                        onChange={(e) => setItemNotes(e.target.value)}
                        placeholder="Ex: Ponto da carne, sem cebola, etc."
                        className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white text-[11px] outline-none"
                      />
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-3 border-t border-neutral-800 bg-neutral-950 flex items-center gap-2">
                    <div className="flex items-center bg-neutral-800 rounded-xl p-1 gap-2">
                      <button
                        onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                        className="w-6 h-6 rounded-lg bg-neutral-700 text-white flex items-center justify-center text-xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{modalQuantity}</span>
                      <button
                        onClick={() => setModalQuantity(modalQuantity + 1)}
                        className="w-6 h-6 rounded-lg bg-neutral-700 text-white flex items-center justify-center text-xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={handleAddToCart}
                      className="flex-1 py-2 px-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold text-xs flex items-center justify-between"
                    >
                      <span>Adicionar</span>
                      <span>R$ {(calculateModalUnitPrice() * modalQuantity).toFixed(2).replace('.', ',')}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* FULL CART & CHECKOUT MODAL */}
            {isCartOpen && (
              <div className="absolute inset-0 bg-neutral-950 z-40 flex flex-col animate-in slide-in-from-bottom duration-200">
                <div className="p-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900">
                  <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-orange-400" />
                    Carrinho ({cart.length} itens)
                  </h3>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="p-1 rounded-lg text-neutral-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 overflow-y-auto flex-1 space-y-3 text-xs">
                  {/* Cart items list */}
                  <div className="space-y-2">
                    {cart.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1.5"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-white">
                            {item.saboresMeioAMeio
                              ? `1/2 ${item.saboresMeioAMeio[0]} + 1/2 ${item.saboresMeioAMeio[1]}`
                              : item.produto.nome}
                          </span>
                          <span className="font-black text-emerald-400">
                            R$ {item.subtotal.toFixed(2).replace('.', ',')}
                          </span>
                        </div>

                        {item.opcoesSelecionadas.map((opt, oIdx) => (
                          <div key={oIdx} className="text-[10px] text-neutral-400 pl-1.5 border-l border-neutral-700">
                            • {opt.itemNome}
                          </div>
                        ))}

                        {item.observacoes && (
                          <div className="text-[10px] text-amber-400/80 italic">
                            Obs: {item.observacoes}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => updateCartQty(idx, -1)}
                              className="w-5 h-5 rounded bg-neutral-800 text-white flex items-center justify-center text-[10px]"
                            >
                              -
                            </button>
                            <span className="font-bold text-xs">{item.quantidade}</span>
                            <button
                              onClick={() => updateCartQty(idx, 1)}
                              className="w-5 h-5 rounded bg-neutral-800 text-white flex items-center justify-center text-[10px]"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Address */}
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 block mb-0.5">
                      Endereço de Entrega
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-white text-xs outline-none"
                    />
                  </div>

                  {/* Payment Methods Selection */}
                  <div className="pt-2 border-t border-neutral-800 space-y-2">
                    <label className="text-[10px] font-bold text-neutral-300 uppercase block">
                      Como deseja pagar?
                    </label>

                    <div className="grid grid-cols-2 gap-1.5">
                      {paymentConfig.pixAtivo && (
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('PIX')}
                          className={`p-2 rounded-xl border text-left transition flex items-center gap-2 ${
                            paymentMethod === 'PIX'
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                              : 'border-neutral-800 bg-neutral-900 text-neutral-300'
                          }`}
                        >
                          <QrCode className="w-4 h-4 flex-shrink-0" />
                          <div>
                            <span className="font-bold text-xs block">Pix</span>
                            {paymentConfig.pixDescontoPct > 0 && (
                              <span className="text-[9px] text-emerald-400 font-bold block">
                                Ganhe {paymentConfig.pixDescontoPct}% OFF
                              </span>
                            )}
                          </div>
                        </button>
                      )}

                      {paymentConfig.cartaoCreditoAtivo && (
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('CartaoCredito')}
                          className={`p-2 rounded-xl border text-left transition flex items-center gap-2 ${
                            paymentMethod === 'CartaoCredito'
                              ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                              : 'border-neutral-800 bg-neutral-900 text-neutral-300'
                          }`}
                        >
                          <CreditCard className="w-4 h-4 flex-shrink-0" />
                          <div>
                            <span className="font-bold text-xs block">Crédito</span>
                            <span className="text-[9px] text-neutral-500 block">Na entrega</span>
                          </div>
                        </button>
                      )}

                      {paymentConfig.cartaoDebitoAtivo && (
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('CartaoDebito')}
                          className={`p-2 rounded-xl border text-left transition flex items-center gap-2 ${
                            paymentMethod === 'CartaoDebito'
                              ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                              : 'border-neutral-800 bg-neutral-900 text-neutral-300'
                          }`}
                        >
                          <CreditCard className="w-4 h-4 flex-shrink-0" />
                          <div>
                            <span className="font-bold text-xs block">Débito</span>
                            <span className="text-[9px] text-neutral-500 block">Na entrega</span>
                          </div>
                        </button>
                      )}

                      {paymentConfig.dinheiroAtivo && (
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('Dinheiro')}
                          className={`p-2 rounded-xl border text-left transition flex items-center gap-2 ${
                            paymentMethod === 'Dinheiro'
                              ? 'border-green-500 bg-green-500/10 text-green-400'
                              : 'border-neutral-800 bg-neutral-900 text-neutral-300'
                          }`}
                        >
                          <DollarSign className="w-4 h-4 flex-shrink-0" />
                          <div>
                            <span className="font-bold text-xs block">Dinheiro</span>
                            <span className="text-[9px] text-neutral-500 block">Com troco</span>
                          </div>
                        </button>
                      )}

                      {paymentConfig.valeRefeicaoAtivo && (
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('ValeRefeicao')}
                          className={`col-span-2 p-2 rounded-xl border text-left transition flex items-center gap-2 ${
                            paymentMethod === 'ValeRefeicao'
                              ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                              : 'border-neutral-800 bg-neutral-900 text-neutral-300'
                          }`}
                        >
                          <Utensils className="w-4 h-4 flex-shrink-0" />
                          <div>
                            <span className="font-bold text-xs block">Vale Refeição / Alimentação</span>
                            <span className="text-[9px] text-neutral-500 block">Alelo, Sodexo, VR, Ticket</span>
                          </div>
                        </button>
                      )}
                    </div>

                    {/* PIX COPIA E COLA BOX (When PIX selected) */}
                    {paymentMethod === 'PIX' && (
                      <div className="p-3 rounded-xl bg-neutral-900 border border-emerald-500/30 space-y-2 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-emerald-400 flex items-center gap-1">
                            <QrCode className="w-3.5 h-3.5" />
                            Pix Copia e Cola Oficial:
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyPix}
                            className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-2 py-0.5 rounded transition flex items-center gap-1"
                          >
                            {copiedPix ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedPix ? 'Copiado!' : 'Copiar Código'}</span>
                          </button>
                        </div>

                        <div className="p-2 rounded bg-neutral-950 font-mono text-[9px] text-neutral-300 break-all select-all border border-neutral-800 max-h-16 overflow-y-auto">
                          {pixPayloadCode}
                        </div>

                        <p className="text-[10px] text-neutral-400">
                          Basta abrir o app do seu banco, colar o código e confirmar. O dinheiro cai direto para <b>{paymentConfig.pixTitular}</b> sem taxas!
                        </p>
                      </div>
                    )}

                    {/* TROCO INPUT (When Dinheiro selected) */}
                    {paymentMethod === 'Dinheiro' && paymentConfig.perguntarTroco && (
                      <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                        <label className="text-[10px] font-bold text-neutral-300 block">
                          Precisa de troco para quanto?
                        </label>
                        <input
                          type="text"
                          value={trocoPara}
                          onChange={(e) => setTrocoPara(e.target.value)}
                          placeholder="Ex: R$ 50,00 ou deixe em branco se não precisar"
                          className="w-full px-2 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg text-white text-xs outline-none"
                        />
                      </div>
                    )}

                    {/* VALE SELECTOR */}
                    {paymentMethod === 'ValeRefeicao' && (
                      <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                        <label className="text-[10px] font-bold text-neutral-300 block">
                          Qual é a bandeira do seu vale?
                        </label>
                        <select
                          value={valeSelecionado}
                          onChange={(e) => setValeSelecionado(e.target.value)}
                          className="w-full p-1.5 rounded-lg bg-neutral-950 border border-neutral-700 text-white text-xs outline-none"
                        >
                          {paymentConfig.valesAceitos.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1 text-xs">
                    <div className="flex justify-between text-neutral-400">
                      <span>Subtotal</span>
                      <span>R$ {cartSubtotal.toFixed(2).replace('.', ',')}</span>
                    </div>

                    {pixDiscount > 0 && (
                      <div className="flex justify-between text-emerald-400 font-bold">
                        <span>Desconto Pix ({paymentConfig.pixDescontoPct}%)</span>
                        <span>-R$ {pixDiscount.toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-neutral-400">
                      <span>Taxa de Entrega</span>
                      <span>R$ {storeConfig.taxaEntregaPadrao.toFixed(2).replace('.', ',')}</span>
                    </div>

                    <div className="flex justify-between text-white font-black text-sm pt-1 border-t border-neutral-800">
                      <span>Total</span>
                      <span className="text-emerald-400">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                </div>

                {/* Send button */}
                <div className="p-3 border-t border-neutral-800 bg-neutral-900">
                  <button
                    onClick={handleSendTestWhatsApp}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Enviar Pedido no WhatsApp da Loja
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
