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
  Filter, 
  ChevronRight,
  ArrowRight,
  XCircle,
  Receipt,
  User,
  ShoppingBag,
  Volume2,
  VolumeX,
  Sparkles,
  Trash2
} from 'lucide-react';
import { Order, OrderStatus, StoreConfig, CartItem, Product } from '../types';
import { useTheme } from '../context/ThemeContext';
import { playOrderChime, testKitchenChime, isSoundMuted, setSoundMuted } from '../utils/soundAlert';
import { subscribeToOrders, syncOrderToFirestore, updateOrderStatusInFirestore, clearAllOrdersInFirestore } from '../services/firestoreSync';

interface OrdersKdsViewProps {
  storeConfig: StoreConfig;
  products: Product[];
  onOpenKitchenReceipt: (cartItems: CartItem[], customerName: string, customerAddress: string, paymentMethod: string) => void;
  showToast: (msg: string) => void;
}

export const OrdersKdsView: React.FC<OrdersKdsViewProps> = ({
  storeConfig,
  products,
  onOpenKitchenReceipt,
  showToast,
}) => {
  // Mock inicial de pedidos realistas para demonstração imediata
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      if (localStorage.getItem('omni_kds_orders_cleared') === 'true') {
        const saved = localStorage.getItem('omni_kds_orders');
        return saved ? JSON.parse(saved) : [];
      }
      const saved = localStorage.getItem('omni_kds_orders');
      if (saved) return JSON.parse(saved);
    } catch (e) {}

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
        criadoEm: 'Há 5 minutos',
        tempoEstimadoMin: 35,
      },
      {
        id: 'ord_102',
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
        criadoEm: 'Há 18 minutos',
        tempoEstimadoMin: 25,
      },
      {
        id: 'ord_103',
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
        criadoEm: 'Há 32 minutos',
        tempoEstimadoMin: 5,
      },
      {
        id: 'ord_104',
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
        criadoEm: 'Há 50 minutos',
      },
    ];
  });

  const { isDark } = useTheme();
  const [muted, setMuted] = useState<boolean>(() => isSoundMuted());
  const [recentOrderId, setRecentOrderId] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'delivery' | 'retirada'>('todos');

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    setSoundMuted(next);
    if (!next) {
      playOrderChime(true);
      showToast('🔊 Campainha sonora da cozinha ativada!');
    } else {
      showToast('🔇 Campainha da cozinha silenciada.');
    }
  };

  const handleTestChime = () => {
    testKitchenChime();
    showToast('🔔 Campainha da cozinha testada com sucesso!');
  };

  useEffect(() => {
    // 1. Sincronização em tempo real via Firebase Firestore
    const unsubscribeFirestore = subscribeToOrders((cloudOrders) => {
      if (cloudOrders && cloudOrders.length > 0) {
        setOrders((prev) => {
          const hasNewOrder = cloudOrders.some(co => !prev.some(po => po.id === co.id));
          if (hasNewOrder && prev.length > 0) {
            playOrderChime();
            const newest = cloudOrders[0];
            setRecentOrderId(newest.id);
            showToast(`🔔 Novo Pedido #${newest.numero} sincronizado via Nuvem!`);
          }
          return cloudOrders;
        });

        try {
          localStorage.setItem('omni_kds_orders', JSON.stringify(cloudOrders));
        } catch {}
      } else if (cloudOrders && cloudOrders.length === 0 && localStorage.getItem('omni_kds_orders_cleared') === 'true') {
        setOrders([]);
      }
    });

    const handleNewOrderEvent = (e: Event) => {
      const customEvent = e as CustomEvent<Order>;
      if (customEvent.detail) {
        const order = customEvent.detail;
        setOrders((prev) => {
          if (prev.some(o => o.id === order.id)) return prev;
          return [order, ...prev];
        });
        setRecentOrderId(order.id);
        playOrderChime();
        showToast(`🔔 Novo Pedido #${order.numero} recebido da mesa/delivery!`);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'omni_kds_orders' && e.newValue) {
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
  }, []);

  const saveOrders = (newOrders: Order[]) => {
    setOrders(newOrders);
    try {
      localStorage.setItem('omni_kds_orders', JSON.stringify(newOrders));
    } catch (e) {}
  };

  const handleChangeStatus = (orderId: string, nextStatus: OrderStatus) => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o));
    saveOrders(updated);
    
    // Atualiza no Firestore em nuvem para todos os dispositivos
    updateOrderStatusInFirestore(orderId, nextStatus).catch((err) => {
      console.warn('Atualização offline no Firestore:', err);
    });

    showToast(`Pedido atualizado para: ${getStatusLabel(nextStatus)}`);
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

  // Simular novo pedido manual
  const handleCreateMockOrder = () => {
    const newNum = Math.floor(105 + Math.random() * 50);
    const prod = products[Math.floor(Math.random() * products.length)] || products[0];
    const newOrder: Order = {
      id: 'ord_' + Date.now(),
      numero: newNum,
      clienteNome: 'Cliente Balcão ' + newNum,
      clienteTelefone: storeConfig.whatsapp,
      tipoEntrega: 'delivery',
      endereco: 'Rua Central, ' + (100 + newNum),
      bairro: 'Jd. Buritis',
      itens: [
        {
          id: 'item_' + Date.now(),
          produto: prod,
          quantidade: 1,
          opcoesSelecionadas: [],
          subtotal: prod.preco,
        },
      ],
      subtotal: prod.preco,
      taxaEntrega: storeConfig.taxaEntregaPadrao,
      desconto: 0,
      total: prod.preco + storeConfig.taxaEntregaPadrao,
      formaPagamento: 'PIX (Chave da Loja)',
      status: 'recebido',
      criadoEm: new Date().toISOString(),
      tempoEstimadoMin: 40,
    };

    saveOrders([newOrder, ...orders]);
    syncOrderToFirestore(newOrder).catch((err) => {
      console.warn('Sincronização de pedido KDS em modo local:', err);
    });
    setRecentOrderId(newOrder.id);
    playOrderChime();
    showToast(`🔔 Novo pedido #${newNum} sincronizado na nuvem!`);
  };

  const filteredOrders = orders.filter((o) => {
    if (filtroTipo === 'todos') return true;
    return o.tipoEntrega === filtroTipo;
  });

  const pedidosRecebidos = filteredOrders.filter((o) => o.status === 'recebido');
  const pedidosPreparo = filteredOrders.filter((o) => o.status === 'preparo');
  const pedidosRota = filteredOrders.filter((o) => o.status === 'rota');
  const pedidosConcluidos = filteredOrders.filter((o) => o.status === 'concluido');

  // Notificar cliente no WhatsApp
  const handleNotifyWhatsapp = (order: Order) => {
    let msg = `Olá ${order.clienteNome}! `;
    if (order.status === 'recebido') {
      msg += `Confirmamos seu pedido #${order.numero} na ${storeConfig.nome}. Já estamos preparando com muito capricho! Tempo estimado: ~${order.tempoEstimadoMin || 35} minutos.`;
    } else if (order.status === 'preparo') {
      msg += `Seu pedido #${order.numero} já está na cozinha sendo finalizado!`;
    } else if (order.status === 'rota') {
      msg += `Oba! Seu pedido #${order.numero} saiu para entrega e logo chega no seu endereço!`;
    } else {
      msg += `Seu pedido #${order.numero} foi entregue com sucesso! Bom apetite e obrigado pela preferência!`;
    }

    const url = `https://wa.me/${order.clienteTelefone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  const handleClearOrders = async () => {
    setOrders([]);
    try {
      localStorage.setItem('omni_kds_orders_cleared', 'true');
      localStorage.setItem('omni_kds_orders', JSON.stringify([]));
    } catch {}
    await clearAllOrdersInFirestore().catch((err) => {
      console.warn('Erro ao limpar pedidos no Firestore:', err);
    });
    showToast('Painel KDS zerado! Pronto para receber pedidos reais.');
  };

  const cardSurfaceClass = isDark
    ? 'bg-neutral-900 border-neutral-800 text-white'
    : 'bg-white border-neutral-200 text-neutral-900 shadow-sm';

  const filterBtnInactive = isDark
    ? 'text-neutral-400 hover:text-white'
    : 'text-neutral-600 hover:text-neutral-900';

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className={`${cardSurfaceClass} border rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors duration-200`}>
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-500 uppercase tracking-wider">
            <ChefHat className="w-4 h-4" />
            <span>Departamento de Pedidos &amp; KDS em Tempo Real</span>
          </div>
          <h2 className={`text-xl font-black mt-0.5 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            Gestão de Pedidos da Cozinha e Despacho
          </h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
            Controle do fluxo de preparo, campainha de alta atenção e notificações automáticas para clientes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Audio Chime Controls */}
          <button
            onClick={toggleSound}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
              muted
                ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
            }`}
            title={muted ? 'Campainha silenciada. Clique para reativar som' : 'Campainha ativa! Clique para silenciar'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
            <span>{muted ? 'Campainha Muta' : 'Campainha Ativa'}</span>
          </button>

          <button
            onClick={handleTestChime}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
              isDark 
                ? 'bg-neutral-800 hover:bg-neutral-700 text-amber-300 border-neutral-700' 
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
            }`}
            title="Tocar som da campainha para testar o volume da caixa de som"
          >
            <Bell className="w-3.5 h-3.5 text-amber-500" />
            <span>Testar Campainha</span>
          </button>

          {/* Filtro Canal */}
          <div className={`flex items-center p-1 rounded-xl text-xs font-bold border ${isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-100 border-neutral-200'}`}>
            <button
              onClick={() => setFiltroTipo('todos')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filtroTipo === 'todos' ? 'bg-orange-500 text-white' : filterBtnInactive
              }`}
            >
              Todos ({orders.length})
            </button>
            <button
              onClick={() => setFiltroTipo('delivery')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filtroTipo === 'delivery' ? 'bg-orange-500 text-white' : filterBtnInactive
              }`}
            >
              Delivery
            </button>
            <button
              onClick={() => setFiltroTipo('retirada')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filtroTipo === 'retirada' ? 'bg-orange-500 text-white' : filterBtnInactive
              }`}
            >
              Balcão
            </button>
          </div>

          <button
            onClick={handleCreateMockOrder}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
              isDark 
                ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700' 
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300 shadow-xs'
            }`}
            title="Simula a chegada de um novo pedido de cliente com som de campainha"
          >
            <Plus className="w-4 h-4 text-emerald-500" />
            <span>+ Pedido Balcão</span>
          </button>

          {orders.length > 0 && (
            <button
              onClick={handleClearOrders}
              className="px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Zerar pedidos de demonstração para iniciar turno real"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Zerar Painel</span>
            </button>
          )}
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
            <span className="text-[10px] text-amber-500 font-semibold">Aguardando Cozinha</span>
          </div>

          <div className="space-y-3">
            {pedidosRecebidos.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
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
                onNext={() => handleChangeStatus(order.id, 'preparo')}
                nextLabel="Iniciar Preparo"
                nextIcon={<ChefHat className="w-3.5 h-3.5" />}
              />
            ))}

            {pedidosRecebidos.length === 0 && (
              <div className="py-8 text-center text-neutral-400 text-xs">
                Nenhum pedido novo no momento.
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
                onNext={() => handleChangeStatus(order.id, 'rota')}
                nextLabel={order.tipoEntrega === 'delivery' ? 'Despachar (Rota)' : 'Pronto para Retirada'}
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
                onNext={() => handleChangeStatus(order.id, 'concluido')}
                nextLabel="Marcar Entregue"
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
                  <span className={isDark ? 'text-neutral-500' : 'text-neutral-400'}>{order.criadoEm}</span>
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
    </div>
  );
};

interface OrderCardProps {
  order: Order;
  isDark: boolean;
  isRecent?: boolean;
  onPrint: () => void;
  onNotify: () => void;
  onNext: () => void;
  nextLabel: string;
  nextIcon: React.ReactNode;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  isDark,
  isRecent,
  onPrint,
  onNotify,
  onNext,
  nextLabel,
  nextIcon,
}) => {
  return (
    <div className={`border rounded-xl p-3.5 space-y-3 shadow-md transition ${
      isRecent ? 'ring-2 ring-emerald-500 shadow-emerald-500/20' : ''
    } ${
      isDark 
        ? 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-white' 
        : 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-900'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded font-mono font-black text-xs ${
            isDark ? 'bg-neutral-800 text-white' : 'bg-neutral-200 text-neutral-900'
          }`}>
            #{order.numero}
          </span>
          <span className={`text-xs font-bold truncate max-w-[120px] ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            {order.clienteNome}
          </span>
        </div>

        <span className="text-[11px] text-orange-500 font-semibold flex items-center gap-1 tabular-nums">
          <Clock className="w-3 h-3" />
          {order.criadoEm && order.criadoEm.includes('T')
            ? new Date(order.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            : order.criadoEm}
        </span>
      </div>

      {/* Address & Delivery type */}
      <div className={`text-[11px] space-y-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
          <span className="truncate">{order.endereco}</span>
        </div>
        <p className="pl-4 text-[10px] opacity-80">Bairro: {order.bairro}</p>
      </div>

      {/* Items list */}
      <div className={`p-2.5 rounded-lg border space-y-1.5 text-xs ${
        isDark ? 'bg-neutral-900 border-neutral-800/80' : 'bg-neutral-50 border-neutral-200'
      }`}>
        {order.itens.map((item, idx) => (
          <div key={idx} className="space-y-0.5">
            <div className={`flex justify-between font-bold text-[11px] ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              <span>{item.quantidade}x {item.produto.nome}</span>
              <span className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>R$ {item.subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
            {item.opcoesSelecionadas.map((opt, oIdx) => (
              <p key={oIdx} className={`text-[10px] pl-2 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                • {opt.itemNome}
              </p>
            ))}
            {item.observacoes && (
              <p className="text-[10px] text-amber-500 italic pl-2">
                Obs: {item.observacoes}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Financial row */}
      <div className={`flex items-center justify-between text-xs pt-1 border-t ${
        isDark ? 'border-neutral-800/80 text-neutral-400' : 'border-neutral-200 text-neutral-600'
      }`}>
        <span className="text-[11px]">{order.formaPagamento}</span>
        <span className={`font-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>
          Total: R$ {order.total.toFixed(2).replace('.', ',')}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={onPrint}
          className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1 transition ${
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
          className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1 transition ${
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

      {/* Advance Status Button */}
      <button
        onClick={onNext}
        className="w-full py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1.5 shadow transition active:scale-95"
      >
        {nextIcon}
        <span>{nextLabel}</span>
      </button>
    </div>
  );
};
