import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Clock, 
  Printer, 
  CheckCircle2, 
  ChefHat, 
  Bike, 
  Phone, 
  MapPin, 
  Plus, 
  Minus,
  Search,
  XCircle,
  Volume2,
  VolumeX,
  Trash2,
  RotateCcw,
  Utensils,
  Store,
  X,
  ShoppingBag
} from 'lucide-react';
import { Order, OrderStatus, StoreConfig, CartItem, Product } from '../types';
import { useTheme } from '../context/ThemeContext';
import { playOrderChime, testKitchenChime, isSoundMuted, setSoundMuted } from '../utils/soundAlert';
import {
  subscribeToOrders,
  syncOrderToFirestore,
  updateOrderStatusInFirestore,
  clearAllOrdersInFirestore,
  deductStockForOrder,
} from '../services/firestoreSync';

interface OrdersKdsViewProps {
  storeId?: string;
  storeConfig: StoreConfig;
  products: Product[];
  onProductsUpdated?: (products: Product[]) => void;
  onOpenKitchenReceipt: (cartItems: CartItem[], customerName: string, customerAddress: string, paymentMethod: string) => void;
  showToast: (msg: string) => void;
}

export const OrdersKdsView: React.FC<OrdersKdsViewProps> = ({
  storeId,
  storeConfig,
  products,
  onProductsUpdated,
  onOpenKitchenReceipt,
  showToast,
}) => {
  const effectiveStoreId = storeId || storeConfig.id || 'default';
  const storageKeyOrders = `omni_kds_orders_${effectiveStoreId}`;
  const storageKeyCleared = `omni_kds_orders_cleared_${effectiveStoreId}`;

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      if (
        localStorage.getItem(storageKeyCleared) === 'true' ||
        (effectiveStoreId === 'default' && localStorage.getItem('omni_kds_orders_cleared') === 'true')
      ) {
        const saved = localStorage.getItem(storageKeyOrders);
        return saved ? JSON.parse(saved) : [];
      }
      const saved =
        localStorage.getItem(storageKeyOrders) ||
        (effectiveStoreId === 'default' ? localStorage.getItem('omni_kds_orders') : null);
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    if (effectiveStoreId !== 'default') {
      return [];
    }

    const sampleProduct1 = products[0] || {
      id: 'p1',
      nome: 'X-Burger Especial da Casa',
      preco: 32.90,
      categoria: 'hamburgueres',
      descricao: 'Blend artesanal, queijo cheddar e bacon.',
      foto: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
      disponivel: true,
    };

    const sampleProduct2 = products[1] || {
      id: 'p2',
      nome: 'Batata Rústica com Páprica',
      preco: 18.00,
      categoria: 'porcoes',
      descricao: 'Batatas crocantes com alecrim e maionese artesanal.',
      foto: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500',
      disponivel: true,
    };

    const sampleProduct3 = products[2] || {
      id: 'p3',
      nome: 'Coca-Cola Zero Lata 350ml',
      preco: 6.50,
      categoria: 'bebidas',
      descricao: 'Refrigerante gelado.',
      foto: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500',
      disponivel: true,
    };

    return [
      {
        id: 'ord_101',
        storeId: 'default',
        numero: 101,
        clienteNome: 'Mariana Ferreira',
        clienteTelefone: '5565999881122',
        tipoEntrega: 'delivery',
        endereco: 'Rua das Flores, 452 - Apto 301',
        bairro: 'Jd. Buritis',
        itens: [
          {
            id: 'item_1',
            produto: sampleProduct1,
            quantidade: 2,
            opcoesSelecionadas: [{ grupoTitulo: 'Ponto da Carne', itemNome: 'Ao Ponto', itemPreco: 0 }],
            observacoes: 'Sem cebola em um dos lanches',
            subtotal: 65.80,
          },
          {
            id: 'item_2',
            produto: sampleProduct3,
            quantidade: 2,
            opcoesSelecionadas: [],
            subtotal: 13.00,
          },
        ],
        subtotal: 78.80,
        taxaEntrega: storeConfig.taxaEntregaPadrao || 7.00,
        desconto: 0,
        total: 85.80,
        formaPagamento: 'PIX (Chave da Loja)',
        status: 'recebido',
        criadoEm: new Date(Date.now() - 5 * 60000).toISOString(),
        tempoEstimadoMin: 35,
      },
      {
        id: 'ord_102',
        storeId: 'default',
        numero: 102,
        clienteNome: 'Carlos Eduardo Mendes',
        clienteTelefone: '5565984443322',
        tipoEntrega: 'delivery',
        endereco: 'Av. Brasil, 1280 - Casa',
        bairro: 'Centro',
        itens: [
          {
            id: 'item_3',
            produto: sampleProduct1,
            quantidade: 1,
            opcoesSelecionadas: [{ grupoTitulo: 'Ponto da Carne', itemNome: 'Bem Passado', itemPreco: 0 }],
            subtotal: 32.90,
          },
          {
            id: 'item_4',
            produto: sampleProduct2,
            quantidade: 1,
            opcoesSelecionadas: [],
            subtotal: 18.00,
          },
        ],
        subtotal: 50.90,
        taxaEntrega: 5.00,
        desconto: 0,
        total: 55.90,
        formaPagamento: 'Cartão de Crédito na Entrega',
        status: 'preparo',
        criadoEm: new Date(Date.now() - 18 * 60000).toISOString(),
        tempoEstimadoMin: 25,
      },
      {
        id: 'ord_103',
        storeId: 'default',
        numero: 103,
        clienteNome: 'Rodrigo Alcantara',
        clienteTelefone: '5565992225544',
        tipoEntrega: 'retirada',
        endereco: 'Retirada no Balcão da Loja',
        bairro: 'Balcão',
        itens: [
          {
            id: 'item_5',
            produto: sampleProduct1,
            quantidade: 1,
            opcoesSelecionadas: [],
            subtotal: 32.90,
          },
        ],
        subtotal: 32.90,
        taxaEntrega: 0,
        desconto: 5.00,
        total: 27.90,
        formaPagamento: 'Dinheiro (Troco para R$ 50)',
        status: 'rota',
        criadoEm: new Date(Date.now() - 32 * 60000).toISOString(),
        tempoEstimadoMin: 5,
      },
      {
        id: 'ord_104',
        storeId: 'default',
        numero: 104,
        clienteNome: 'Beatriz Vasconcelos',
        clienteTelefone: '5565993338877',
        tipoEntrega: 'delivery',
        endereco: 'Rua São Paulo, 89',
        bairro: 'Vila Alta',
        itens: [
          {
            id: 'item_6',
            produto: sampleProduct2,
            quantidade: 2,
            opcoesSelecionadas: [],
            subtotal: 36.00,
          },
        ],
        subtotal: 36.00,
        taxaEntrega: 8.00,
        desconto: 0,
        total: 44.00,
        formaPagamento: 'PIX (Chave da Loja)',
        status: 'concluido',
        criadoEm: new Date(Date.now() - 50 * 60000).toISOString(),
      },
    ];
  });

  const { isDark } = useTheme();
  const [muted, setMuted] = useState<boolean>(() => isSoundMuted());
  const [recentOrderId, setRecentOrderId] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'delivery' | 'retirada' | 'mesa'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  // Manual POS / Counter Order Modal State
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const [posSearch, setPosSearch] = useState('');
  const [posCart, setPosCart] = useState<{ product: Product; qty: number; obs: string }[]>([]);
  const [posCustomerName, setPosCustomerName] = useState('');
  const [posCustomerPhone, setPosCustomerPhone] = useState('');
  const [posTipoEntrega, setPosTipoEntrega] = useState<'retirada' | 'mesa' | 'delivery'>('retirada');
  const [posEndereco, setPosEndereco] = useState('');
  const [posBairro, setPosBairro] = useState(storeConfig.bairro || 'Centro');
  const [posMesa, setPosMesa] = useState('01');
  const [posPagamento, setPosPagamento] = useState('PIX (Chave da Loja)');

  // Refresh SLA elapsed timer every 30s
  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    setSoundMuted(next);
    if (!next) {
      playOrderChime(true);
      showToast('Campainha sonora da cozinha ativada!');
    } else {
      showToast('Campainha da cozinha silenciada.');
    }
  };

  const handleTestChime = () => {
    testKitchenChime();
    showToast('Campainha da cozinha testada com sucesso!');
  };

  useEffect(() => {
    const unsubscribeFirestore = subscribeToOrders(
      (cloudOrders) => {
        if (cloudOrders && cloudOrders.length > 0) {
          setOrders((prev) => {
            const hasNewOrder = cloudOrders.some((co) => !prev.some((po) => po.id === co.id));
            if (hasNewOrder && prev.length > 0) {
              playOrderChime();
              const newest = cloudOrders[0];
              setRecentOrderId(newest.id);
              showToast(`Novo Pedido #${newest.numero} (${newest.clienteNome}) recebido!`);
            }
            return cloudOrders;
          });

          try {
            localStorage.setItem(storageKeyOrders, JSON.stringify(cloudOrders));
          } catch {}
        } else if (cloudOrders && cloudOrders.length === 0) {
          if (
            effectiveStoreId !== 'default' ||
            localStorage.getItem(storageKeyCleared) === 'true' ||
            localStorage.getItem('omni_kds_orders_cleared') === 'true'
          ) {
            setOrders([]);
          }
        }
      },
      undefined,
      effectiveStoreId
    );

    const handleNewOrderEvent = (e: Event) => {
      const customEvent = e as CustomEvent<Order>;
      if (customEvent.detail) {
        const order = customEvent.detail;
        if ((order.storeId || 'default') !== effectiveStoreId) return;
        setOrders((prev) => {
          if (prev.some((o) => o.id === order.id)) return prev;
          return [order, ...prev];
        });
        setRecentOrderId(order.id);
        playOrderChime();
        showToast(`Novo Pedido #${order.numero} recebido!`);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKeyOrders && e.newValue) {
        try {
          const parsed: Order[] = JSON.parse(e.newValue);
          setOrders(parsed);
        } catch {}
      }
    };

    window.addEventListener('new_order_placed', handleNewOrderEvent);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      unsubscribeFirestore();
      window.removeEventListener('new_order_placed', handleNewOrderEvent);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [effectiveStoreId, storageKeyOrders, storageKeyCleared]);

  const saveOrders = (newOrders: Order[]) => {
    setOrders(newOrders);
    try {
      localStorage.setItem(storageKeyOrders, JSON.stringify(newOrders));
    } catch (e) {}
  };

  const handleChangeStatus = (orderId: string, nextStatus: OrderStatus) => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o));
    saveOrders(updated);

    updateOrderStatusInFirestore(orderId, nextStatus).catch((err) => {
      console.warn('Atualização local de status:', err);
    });

    showToast(`Pedido atualizado para: ${getStatusLabel(nextStatus)}`);
  };

  const handleCancelOrder = (order: Order) => {
    if (!window.confirm(`Deseja realmente cancelar o Pedido #${order.numero} de ${order.clienteNome}?`)) {
      return;
    }
    handleChangeStatus(order.id, 'cancelado');
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'recebido':
        return 'Novo / Recebido';
      case 'preparo':
        return 'Em Preparo';
      case 'rota':
        return 'Pronto / Em Rota';
      case 'concluido':
        return 'Concluído';
      case 'cancelado':
        return 'Cancelado';
    }
  };

  // Add item to manual POS cart
  const handleAddPosItem = (product: Product) => {
    setPosCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id);
      if (idx >= 0) {
        const clone = [...prev];
        clone[idx] = { ...clone[idx], qty: clone[idx].qty + 1 };
        return clone;
      }
      return [...prev, { product, qty: 1, obs: '' }];
    });
  };

  const handleUpdatePosQty = (productId: string, delta: number) => {
    setPosCart((prev) =>
      prev
        .map((item) => (item.product.id === productId ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const posSubtotal = posCart.reduce(
    (acc, item) => acc + (item.product.precoPromocional || item.product.preco) * item.qty,
    0
  );
  const posDeliveryFee = posTipoEntrega === 'delivery' ? storeConfig.taxaEntregaPadrao || 7 : 0;
  const posTotal = posSubtotal + posDeliveryFee;

  const handleSubmitPosOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (posCart.length === 0) {
      showToast('Adicione pelo menos 1 produto ao pedido.');
      return;
    }

    const newNum = Math.floor(105 + Math.random() * 890);
    const cartItems: CartItem[] = posCart.map((entry, idx) => {
      const unitPrice = entry.product.precoPromocional || entry.product.preco;
      return {
        id: `pos_item_${Date.now()}_${idx}`,
        produto: entry.product,
        quantidade: entry.qty,
        opcoesSelecionadas: [],
        observacoes: entry.obs.trim() || undefined,
        subtotal: unitPrice * entry.qty,
      };
    });

    const newOrder: Order = {
      id: 'ord_' + Date.now(),
      storeId: effectiveStoreId,
      numero: newNum,
      clienteNome:
        posCustomerName.trim() ||
        (posTipoEntrega === 'mesa' ? `Mesa ${posMesa || '01'}` : `Cliente Balcão #${newNum}`),
      clienteTelefone: posCustomerPhone.trim() || storeConfig.whatsapp,
      tipoEntrega: posTipoEntrega,
      endereco:
        posTipoEntrega === 'delivery'
          ? posEndereco.trim() || 'Endereço informado no atendimento'
          : posTipoEntrega === 'mesa'
          ? `Consumo no Local — Mesa ${posMesa || '01'}`
          : 'Retirada no Balcão da Loja',
      bairro:
        posTipoEntrega === 'delivery'
          ? posBairro.trim() || storeConfig.bairro
          : posTipoEntrega === 'mesa'
          ? `Mesa ${posMesa || '01'}`
          : 'Balcão',
      mesa: posTipoEntrega === 'mesa' ? posMesa || '01' : undefined,
      itens: cartItems,
      subtotal: posSubtotal,
      taxaEntrega: posDeliveryFee,
      desconto: 0,
      total: posTotal,
      formaPagamento: posPagamento,
      status: 'recebido',
      criadoEm: new Date().toISOString(),
      tempoEstimadoMin: posTipoEntrega === 'delivery' ? 40 : 20,
    };

    saveOrders([newOrder, ...orders]);
    syncOrderToFirestore(newOrder, effectiveStoreId).catch(() => {});

    // Deduct stock automatically
    const updatedProds = await deductStockForOrder(newOrder, products, effectiveStoreId);
    if (onProductsUpdated) {
      onProductsUpdated(updatedProds);
    }

    setRecentOrderId(newOrder.id);
    playOrderChime();
    setIsPosModalOpen(false);
    setPosCart([]);
    setPosCustomerName('');
    setPosCustomerPhone('');
    setPosEndereco('');
    showToast(`Pedido #${newNum} lançado com sucesso na cozinha!`);
  };

  const filteredOrders = orders.filter((o) => {
    if (o.status === 'cancelado') return false;
    if (filtroTipo !== 'todos' && o.tipoEntrega !== filtroTipo) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchName = o.clienteNome.toLowerCase().includes(q);
      const matchNum = String(o.numero).includes(q);
      const matchBairro = (o.bairro || '').toLowerCase().includes(q);
      if (!matchName && !matchNum && !matchBairro) return false;
    }
    return true;
  });

  const pedidosRecebidos = filteredOrders.filter((o) => o.status === 'recebido');
  const pedidosPreparo = filteredOrders.filter((o) => o.status === 'preparo');
  const pedidosRota = filteredOrders.filter((o) => o.status === 'rota');
  const pedidosConcluidos = filteredOrders.filter((o) => o.status === 'concluido');

  const handleNotifyWhatsapp = (order: Order) => {
    let msg = `Olá ${order.clienteNome}! `;
    if (order.status === 'recebido') {
      msg += `Confirmamos seu pedido #${order.numero} na ${storeConfig.nome}. Já estamos preparando com muito capricho! Tempo estimado: ~${order.tempoEstimadoMin || 35} minutos.`;
    } else if (order.status === 'preparo') {
      msg += `Seu pedido #${order.numero} já está na cozinha sendo preparado!`;
    } else if (order.status === 'rota') {
      msg +=
        order.tipoEntrega === 'delivery'
          ? `Oba! Seu pedido #${order.numero} saiu para entrega e logo chega no seu endereço!`
          : `Seu pedido #${order.numero} está pronto para retirada no balcão!`;
    } else {
      msg += `Seu pedido #${order.numero} foi concluído! Bom apetite e obrigado pela preferência!`;
    }

    const url = `https://wa.me/${order.clienteTelefone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  const handleClearOrders = async () => {
    if (
      !window.confirm(
        `Tem certeza que deseja zerar os pedidos do painel KDS de "${storeConfig.nome}"? Essa ação limpa os pedidos atuais do turno.`
      )
    ) {
      return;
    }
    setOrders([]);
    try {
      localStorage.setItem(storageKeyCleared, 'true');
      localStorage.setItem(storageKeyOrders, JSON.stringify([]));
      if (effectiveStoreId === 'default') {
        localStorage.setItem('omni_kds_orders_cleared', 'true');
        localStorage.setItem('omni_kds_orders', JSON.stringify([]));
      }
    } catch {}
    await clearAllOrdersInFirestore(effectiveStoreId).catch((err) => {
      console.warn('Erro ao limpar pedidos no Firestore:', err);
    });
    showToast('Painel KDS zerado! Pronto para receber novos pedidos.');
  };

  const cardSurfaceClass = isDark
    ? 'bg-neutral-900 border-neutral-800 text-white'
    : 'bg-white border-neutral-200 text-neutral-900 shadow-sm';

  const filterBtnInactive = isDark
    ? 'text-neutral-400 hover:text-white'
    : 'text-neutral-600 hover:text-neutral-900';

  const availablePosProducts = products.filter(
    (p) =>
      p.disponivel &&
      (p.nome.toLowerCase().includes(posSearch.toLowerCase()) ||
        p.categoria.toLowerCase().includes(posSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className={`${cardSurfaceClass} border rounded-2xl p-5 shadow-lg flex flex-col gap-4 transition-colors duration-200`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-orange-500 uppercase tracking-wider">
              <ChefHat className="w-4 h-4" />
              <span>Departamento de Pedidos &amp; KDS em Tempo Real</span>
            </div>
            <h2 className={`text-xl font-black mt-0.5 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Monitor da Cozinha, PDV Balcão &amp; Despacho
            </h2>
            <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
              Controle de tempo de espera (SLA), lançamento de pedidos presenciais/telefone e aviso no WhatsApp em 1 clique.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Audio Chime Controls */}
            <button
              onClick={toggleSound}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                muted
                  ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
              title={muted ? 'Campainha silenciada. Clique para reativar som' : 'Campainha ativa! Clique para silenciar'}
            >
              {muted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
              <span>{muted ? 'Som Mudo' : 'Campainha Ativa'}</span>
            </button>

            <button
              onClick={handleTestChime}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                isDark 
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-amber-300 border-neutral-700' 
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
              }`}
              title="Tocar som da campainha para testar o volume"
            >
              <Bell className="w-3.5 h-3.5 text-amber-500" />
              <span>Testar Som</span>
            </button>

            <button
              onClick={() => setIsPosModalOpen(true)}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
              title="Lançar pedido presencial de balcão, mesa ou telefone"
            >
              <Plus className="w-4 h-4" />
              <span>+ Novo Pedido Balcão / PDV</span>
            </button>

            {orders.length > 0 && (
              <button
                onClick={handleClearOrders}
                className="px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Zerar pedidos do turno atual"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Zerar Painel</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Channel Filter Bar */}
        <div
          className={`pt-3 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${
            isDark ? 'border-neutral-800' : 'border-neutral-200'
          }`}
        >
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por #número, nome do cliente ou bairro..."
              className={`w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs outline-none focus:border-orange-500 ${
                isDark
                  ? 'bg-neutral-950 border-neutral-800 text-white placeholder-neutral-500'
                  : 'bg-neutral-100 border-neutral-300 text-neutral-900 placeholder-neutral-400'
              }`}
            />
          </div>

          <div
            className={`flex items-center p-1 rounded-xl text-xs font-bold border self-start sm:self-auto ${
              isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-100 border-neutral-200'
            }`}
          >
            <button
              onClick={() => setFiltroTipo('todos')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filtroTipo === 'todos' ? 'bg-orange-500 text-white' : filterBtnInactive
              }`}
            >
              Todos ({orders.filter((o) => o.status !== 'cancelado').length})
            </button>
            <button
              onClick={() => setFiltroTipo('delivery')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filtroTipo === 'delivery' ? 'bg-orange-500 text-white' : filterBtnInactive
              }`}
            >
              Delivery
            </button>
            <button
              onClick={() => setFiltroTipo('retirada')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filtroTipo === 'retirada' ? 'bg-orange-500 text-white' : filterBtnInactive
              }`}
            >
              Balcão
            </button>
            <button
              onClick={() => setFiltroTipo('mesa')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filtroTipo === 'mesa' ? 'bg-orange-500 text-white' : filterBtnInactive
              }`}
            >
              Mesa
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className={`${cardSurfaceClass} border rounded-xl p-3.5 flex items-center justify-between transition-colors`}>
          <div>
            <span className={isDark ? 'text-neutral-400' : 'text-neutral-500'}>Novos Recebidos</span>
            <p className="text-xl font-black text-amber-500 mt-0.5">{pedidosRecebidos.length}</p>
          </div>
          <Bell className="w-5 h-5 text-amber-500/60" />
        </div>

        <div className={`${cardSurfaceClass} border rounded-xl p-3.5 flex items-center justify-between transition-colors`}>
          <div>
            <span className={isDark ? 'text-neutral-400' : 'text-neutral-500'}>Na Cozinha (Preparo)</span>
            <p className="text-xl font-black text-blue-500 mt-0.5">{pedidosPreparo.length}</p>
          </div>
          <ChefHat className="w-5 h-5 text-blue-500/60" />
        </div>

        <div className={`${cardSurfaceClass} border rounded-xl p-3.5 flex items-center justify-between transition-colors`}>
          <div>
            <span className={isDark ? 'text-neutral-400' : 'text-neutral-500'}>Pronto / Em Rota</span>
            <p className="text-xl font-black text-purple-500 mt-0.5">{pedidosRota.length}</p>
          </div>
          <Bike className="w-5 h-5 text-purple-500/60" />
        </div>

        <div className={`${cardSurfaceClass} border rounded-xl p-3.5 flex items-center justify-between transition-colors`}>
          <div>
            <span className={isDark ? 'text-neutral-400' : 'text-neutral-500'}>Concluídos Hoje</span>
            <p className="text-xl font-black text-emerald-500 mt-0.5">{pedidosConcluidos.length}</p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-500/60" />
        </div>
      </div>

      {/* Kanban Board (4 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {/* COLUNA 1: RECEBIDOS */}
        <div className={`${isDark ? 'bg-neutral-900/80 border-neutral-800' : 'bg-neutral-100/90 border-neutral-200'} border rounded-2xl p-3.5 space-y-3 transition-colors`}>
          <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <h3 className={`font-bold text-xs uppercase tracking-wider ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                1. Recebidos ({pedidosRecebidos.length})
              </h3>
            </div>
            <span className="text-[10px] text-amber-500 font-semibold">Aguardando Aceite</span>
          </div>

          <div className="space-y-3">
            {pedidosRecebidos.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                nowTick={nowTick}
                isDark={isDark}
                isRecent={order.id === recentOrderId}
                onPrint={() =>
                  onOpenKitchenReceipt(
                    order.itens,
                    order.clienteNome,
                    order.endereco || 'Balcão',
                    order.formaPagamento
                  )
                }
                onNotify={() => handleNotifyWhatsapp(order)}
                onCancel={() => handleCancelOrder(order)}
                onNext={() => handleChangeStatus(order.id, 'preparo')}
                nextLabel="Aceitar & Iniciar Preparo"
                nextIcon={<ChefHat className="w-3.5 h-3.5" />}
              />
            ))}

            {pedidosRecebidos.length === 0 && (
              <div className="py-8 text-center text-neutral-400 text-xs">
                Nenhum pedido novo aguardando aceite.
              </div>
            )}
          </div>
        </div>

        {/* COLUNA 2: EM PREPARO */}
        <div className={`${isDark ? 'bg-neutral-900/80 border-neutral-800' : 'bg-neutral-100/90 border-neutral-200'} border rounded-2xl p-3.5 space-y-3 transition-colors`}>
          <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <h3 className={`font-bold text-xs uppercase tracking-wider ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                2. Na Cozinha ({pedidosPreparo.length})
              </h3>
            </div>
            <span className="text-[10px] text-blue-500 font-semibold">Em Produção</span>
          </div>

          <div className="space-y-3">
            {pedidosPreparo.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                nowTick={nowTick}
                isDark={isDark}
                isRecent={order.id === recentOrderId}
                onPrint={() =>
                  onOpenKitchenReceipt(
                    order.itens,
                    order.clienteNome,
                    order.endereco || 'Balcão',
                    order.formaPagamento
                  )
                }
                onNotify={() => handleNotifyWhatsapp(order)}
                onPrev={() => handleChangeStatus(order.id, 'recebido')}
                onCancel={() => handleCancelOrder(order)}
                onNext={() => handleChangeStatus(order.id, 'rota')}
                nextLabel={
                  order.tipoEntrega === 'delivery'
                    ? 'Despachar (Em Rota)'
                    : order.tipoEntrega === 'mesa'
                    ? 'Levar à Mesa'
                    : 'Pronto p/ Retirada'
                }
                nextIcon={<Bike className="w-3.5 h-3.5" />}
              />
            ))}

            {pedidosPreparo.length === 0 && (
              <div className="py-8 text-center text-neutral-400 text-xs">
                Cozinha livre no momento.
              </div>
            )}
          </div>
        </div>

        {/* COLUNA 3: SAIU PARA ENTREGA / PRONTO */}
        <div className={`${isDark ? 'bg-neutral-900/80 border-neutral-800' : 'bg-neutral-100/90 border-neutral-200'} border rounded-2xl p-3.5 space-y-3 transition-colors`}>
          <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <h3 className={`font-bold text-xs uppercase tracking-wider ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                3. Em Rota / Pronto ({pedidosRota.length})
              </h3>
            </div>
            <span className="text-[10px] text-purple-500 font-semibold">Com Motoboy / Balcão</span>
          </div>

          <div className="space-y-3">
            {pedidosRota.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                nowTick={nowTick}
                isDark={isDark}
                isRecent={order.id === recentOrderId}
                onPrint={() =>
                  onOpenKitchenReceipt(
                    order.itens,
                    order.clienteNome,
                    order.endereco || 'Balcão',
                    order.formaPagamento
                  )
                }
                onNotify={() => handleNotifyWhatsapp(order)}
                onPrev={() => handleChangeStatus(order.id, 'preparo')}
                onCancel={() => handleCancelOrder(order)}
                onNext={() => handleChangeStatus(order.id, 'concluido')}
                nextLabel="Marcar Concluído"
                nextIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              />
            ))}

            {pedidosRota.length === 0 && (
              <div className="py-8 text-center text-neutral-400 text-xs">
                Nenhum pedido em rota de entrega.
              </div>
            )}
          </div>
        </div>

        {/* COLUNA 4: CONCLUÍDOS */}
        <div className={`${isDark ? 'bg-neutral-900/80 border-neutral-800' : 'bg-neutral-100/90 border-neutral-200'} border rounded-2xl p-3.5 space-y-3 transition-colors`}>
          <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className={`font-bold text-xs uppercase tracking-wider ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                4. Concluídos ({pedidosConcluidos.length})
              </h3>
            </div>
            <span className="text-[10px] text-emerald-500 font-semibold">Finalizados</span>
          </div>

          <div className="space-y-3">
            {pedidosConcluidos.map((order) => (
              <div
                key={order.id}
                className={`border rounded-xl p-3 text-xs space-y-2 opacity-80 hover:opacity-100 transition ${
                  isDark ? 'bg-neutral-950/80 border-neutral-800' : 'bg-white border-neutral-200 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>#{order.numero} · {order.clienteNome}</span>
                  <span className="text-emerald-500 font-bold">R$ {order.total.toFixed(2).replace('.', ',')}</span>
                </div>
                <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  {order.itens.length} {order.itens.length === 1 ? 'item' : 'itens'} · {order.formaPagamento}
                </p>
                <div className={`pt-2 border-t flex items-center justify-between text-[11px] ${isDark ? 'border-neutral-800/60' : 'border-neutral-200'}`}>
                  <button
                    onClick={() => handleChangeStatus(order.id, 'rota')}
                    className="text-neutral-400 hover:text-orange-500 flex items-center gap-1 cursor-pointer"
                    title="Reabrir pedido para Em Rota"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reabrir</span>
                  </button>
                  <span className="text-emerald-500 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Entregue
                  </span>
                </div>
              </div>
            ))}

            {pedidosConcluidos.length === 0 && (
              <div className="py-8 text-center text-neutral-400 text-xs">
                Nenhum pedido concluído ainda.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MANUAL POS / COUNTER ORDER MODAL */}
      {isPosModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div
            className={`w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
              isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
            }`}
          >
            {/* Header */}
            <div
              className={`px-5 py-4 border-b flex items-center justify-between ${
                isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black">Lançar Novo Pedido — PDV Balcão / Telefone / Mesa</h3>
                  <p className="text-xs text-neutral-400">
                    Selecione os itens do cardápio para enviar imediatamente ao monitor da cozinha.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPosModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-current cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPosOrder} className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
              {/* Left: Product Selector */}
              <div className="lg:col-span-7 space-y-3 flex flex-col">
                <div className="relative">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={posSearch}
                    onChange={(e) => setPosSearch(e.target.value)}
                    placeholder="Buscar produto para adicionar..."
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border outline-none focus:border-orange-500 ${
                      isDark
                        ? 'bg-neutral-950 border-neutral-800 text-white'
                        : 'bg-neutral-100 border-neutral-300 text-neutral-900'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                  {availablePosProducts.map((p) => {
                    const effectivePrice = p.precoPromocional || p.preco;
                    const inCart = posCart.find((i) => i.product.id === p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleAddPosItem(p)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition cursor-pointer ${
                          inCart
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : isDark
                            ? 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                            : 'border-neutral-200 bg-neutral-50 hover:border-neutral-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-bold truncate">{p.nome}</p>
                          <p className="text-emerald-500 font-black font-mono tabular-nums">
                            R$ {effectivePrice.toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                        <span className="px-2 py-1 rounded-lg bg-orange-500 text-white font-black shrink-0">
                          {inCart ? `${inCart.qty}x` : '+'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: Order Details & Cart Summary */}
              <div className="lg:col-span-5 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Delivery Type */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPosTipoEntrega('retirada')}
                      className={`py-2 px-2 rounded-xl border font-bold flex items-center justify-center gap-1 cursor-pointer ${
                        posTipoEntrega === 'retirada'
                          ? 'border-orange-500 bg-orange-500/15 text-orange-400'
                          : isDark
                          ? 'border-neutral-800 bg-neutral-950 text-neutral-400'
                          : 'border-neutral-200 bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Balcão</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosTipoEntrega('mesa')}
                      className={`py-2 px-2 rounded-xl border font-bold flex items-center justify-center gap-1 cursor-pointer ${
                        posTipoEntrega === 'mesa'
                          ? 'border-orange-500 bg-orange-500/15 text-orange-400'
                          : isDark
                          ? 'border-neutral-800 bg-neutral-950 text-neutral-400'
                          : 'border-neutral-200 bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      <span>Mesa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosTipoEntrega('delivery')}
                      className={`py-2 px-2 rounded-xl border font-bold flex items-center justify-center gap-1 cursor-pointer ${
                        posTipoEntrega === 'delivery'
                          ? 'border-orange-500 bg-orange-500/15 text-orange-400'
                          : isDark
                          ? 'border-neutral-800 bg-neutral-950 text-neutral-400'
                          : 'border-neutral-200 bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      <Bike className="w-3.5 h-3.5" />
                      <span>Delivery</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={posCustomerName}
                      onChange={(e) => setPosCustomerName(e.target.value)}
                      placeholder="Nome do Cliente"
                      className={`px-3 py-2 rounded-xl border outline-none ${
                        isDark ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                      }`}
                    />
                    <input
                      type="text"
                      value={posCustomerPhone}
                      onChange={(e) => setPosCustomerPhone(e.target.value)}
                      placeholder="WhatsApp (Opcional)"
                      className={`px-3 py-2 rounded-xl border outline-none ${
                        isDark ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                      }`}
                    />
                  </div>

                  {posTipoEntrega === 'mesa' && (
                    <input
                      type="text"
                      value={posMesa}
                      onChange={(e) => setPosMesa(e.target.value)}
                      placeholder="Número da Mesa / Comanda (Ex: 04)"
                      className={`w-full px-3 py-2 rounded-xl border outline-none ${
                        isDark ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                      }`}
                    />
                  )}

                  {posTipoEntrega === 'delivery' && (
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={posEndereco}
                        onChange={(e) => setPosEndereco(e.target.value)}
                        placeholder="Rua e Número"
                        className={`col-span-2 px-3 py-2 rounded-xl border outline-none ${
                          isDark ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                        }`}
                      />
                      <input
                        type="text"
                        value={posBairro}
                        onChange={(e) => setPosBairro(e.target.value)}
                        placeholder="Bairro"
                        className={`px-3 py-2 rounded-xl border outline-none ${
                          isDark ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                        }`}
                      />
                    </div>
                  )}

                  <select
                    value={posPagamento}
                    onChange={(e) => setPosPagamento(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border font-bold outline-none ${
                      isDark ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                    }`}
                  >
                    <option value="PIX (Chave da Loja)">PIX (Chave da Loja)</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>

                  {/* Selected Items */}
                  <div
                    className={`p-3 rounded-xl border space-y-2 max-h-40 overflow-y-auto ${
                      isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                    }`}
                  >
                    {posCart.length === 0 ? (
                      <p className="text-neutral-400 text-center py-4">
                        Clique nos produtos ao lado para adicionar ao pedido.
                      </p>
                    ) : (
                      posCart.map((item) => (
                        <div key={item.product.id} className="flex items-center justify-between gap-2">
                          <span className="font-bold truncate">
                            {item.qty}x {item.product.nome}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUpdatePosQty(item.product.id, -1)}
                              className="p-1 rounded bg-neutral-800 text-white cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdatePosQty(item.product.id, 1)}
                              className="p-1 rounded bg-neutral-800 text-white cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-neutral-800/60">
                  <div className="flex items-center justify-between text-sm font-black">
                    <span>Total do Pedido:</span>
                    <span className="text-emerald-500 font-mono tabular-nums">
                      R$ {posTotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm transition cursor-pointer"
                  >
                    Lançar Pedido na Cozinha Agora
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface OrderCardProps {
  order: Order;
  nowTick: number;
  isDark: boolean;
  isRecent?: boolean;
  onPrint: () => void;
  onNotify: () => void;
  onPrev?: () => void;
  onCancel?: () => void;
  onNext: () => void;
  nextLabel: string;
  nextIcon: React.ReactNode;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  nowTick,
  isDark,
  isRecent,
  onPrint,
  onNotify,
  onPrev,
  onCancel,
  onNext,
  nextLabel,
  nextIcon,
}) => {
  // Compute elapsed minutes for SLA badge
  const elapsedMinutes = (() => {
    if (!order.criadoEm) return 0;
    const parsed = Date.parse(order.criadoEm);
    if (!isNaN(parsed)) {
      return Math.max(0, Math.floor((nowTick - parsed) / 60000));
    }
    const match = order.criadoEm.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  })();

  const slaColor =
    elapsedMinutes >= (order.tempoEstimadoMin || 35)
      ? 'bg-red-500/20 text-red-400 border-red-500/40'
      : elapsedMinutes >= 20
      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';

  return (
    <div
      className={`border rounded-xl p-3.5 space-y-3 shadow-md transition ${
        isRecent ? 'ring-2 ring-emerald-500 shadow-emerald-500/20' : ''
      } ${
        isDark
          ? 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-white'
          : 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-900'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`px-2 py-0.5 rounded font-mono font-black text-xs shrink-0 ${
              isDark ? 'bg-neutral-800 text-white' : 'bg-neutral-200 text-neutral-900'
            }`}
          >
            #{order.numero}
          </span>
          <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            {order.clienteNome}
          </span>
        </div>

        <span
          className={`text-[10px] px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 tabular-nums shrink-0 ${slaColor}`}
          title={`Tempo estimado: ${order.tempoEstimadoMin || 35} min`}
        >
          <Clock className="w-3 h-3" />
          {elapsedMinutes === 0 ? 'Agora' : `Há ${elapsedMinutes} min`}
        </span>
      </div>

      {/* Address & Delivery type */}
      <div className={`text-[11px] space-y-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
            <span className="truncate">{order.endereco}</span>
          </div>
          <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 shrink-0 ml-1">
            {order.tipoEntrega === 'delivery' ? 'Delivery' : order.tipoEntrega === 'mesa' ? `Mesa ${order.mesa || ''}` : 'Balcão'}
          </span>
        </div>
        {order.bairro && <p className="pl-4 text-[10px] opacity-80">Bairro: {order.bairro}</p>}
      </div>

      {/* Items list */}
      <div
        className={`p-2.5 rounded-lg border space-y-1.5 text-xs ${
          isDark ? 'bg-neutral-900 border-neutral-800/80' : 'bg-neutral-50 border-neutral-200'
        }`}
      >
        {order.itens.map((item, idx) => (
          <div key={idx} className="space-y-0.5">
            <div className={`flex justify-between font-bold text-[11px] ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              <span>
                {item.quantidade}x{' '}
                {item.saboresMeioAMeio && item.saboresMeioAMeio.length === 2
                  ? `1/2 ${item.saboresMeioAMeio[0]} + 1/2 ${item.saboresMeioAMeio[1]}`
                  : item.produto.nome}
              </span>
              <span className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>
                R$ {item.subtotal.toFixed(2).replace('.', ',')}
              </span>
            </div>
            {item.opcoesSelecionadas.map((opt, oIdx) => (
              <p key={oIdx} className={`text-[10px] pl-2 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                • {opt.itemNome}
              </p>
            ))}
            {item.observacoes && (
              <p className="text-[10px] text-amber-500 font-semibold italic pl-2">
                Obs: {item.observacoes}
              </p>
            )}
          </div>
        ))}
        {order.observacoes && (
          <p className="text-[10px] text-orange-400 font-bold pt-1 border-t border-neutral-800/50">
            Nota do Pedido: {order.observacoes}
          </p>
        )}
      </div>

      {/* Financial row */}
      <div
        className={`flex items-center justify-between text-xs pt-1 border-t ${
          isDark ? 'border-neutral-800/80 text-neutral-400' : 'border-neutral-200 text-neutral-600'
        }`}
      >
        <span className="text-[11px] truncate max-w-[140px]">{order.formaPagamento}</span>
        <span className={`font-black font-mono tabular-nums ${isDark ? 'text-white' : 'text-neutral-900'}`}>
          R$ {order.total.toFixed(2).replace('.', ',')}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-1.5 pt-1">
        <button
          onClick={onPrint}
          className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
            isDark
              ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-700'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300 shadow-xs'
          }`}
          title="Imprimir comanda térmica 80mm"
        >
          <Printer className="w-3 h-3 text-orange-500" />
          <span>Comanda</span>
        </button>

        <button
          onClick={onNotify}
          className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
            isDark
              ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-700'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300 shadow-xs'
          }`}
          title="Avisar status no WhatsApp do cliente"
        >
          <Phone className="w-3 h-3 text-emerald-500" />
          <span>WhatsApp</span>
        </button>
      </div>

      {/* Advance Status + Revert / Cancel Row */}
      <div className="flex items-center gap-1.5">
        {onPrev && (
          <button
            onClick={onPrev}
            className={`p-2 rounded-lg border text-xs font-bold transition cursor-pointer ${
              isDark
                ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border-neutral-700'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border-neutral-300'
            }`}
            title="Voltar para a etapa anterior"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={onNext}
          className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1.5 shadow transition active:scale-95 cursor-pointer"
        >
          {nextIcon}
          <span>{nextLabel}</span>
        </button>

        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition cursor-pointer"
            title="Cancelar pedido"
          >
            <XCircle className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
