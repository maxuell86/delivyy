import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Tag,
  Plus,
  Trash2,
  Save,
  Users,
  MessageCircle,
  Clock,
  AlertCircle,
  Search,
  UserPlus,
  Sparkles,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { StoreConfig, LoyaltyTier, CouponItem, Order, CrmCustomer, Product } from '../types';
import { subscribeToOrders } from '../services/firestoreSync';
import { buildExclusiveMenuUrl } from './ExclusiveMenuLinkModal';

interface LoyaltyCouponsViewProps {
  storeId?: string;
  storeConfig: StoreConfig;
  products?: Product[];
  onSaveConfig: (updated: StoreConfig) => void;
  showToast: (msg: string) => void;
}

export const LoyaltyCouponsView: React.FC<LoyaltyCouponsViewProps> = ({
  storeId = 'default',
  storeConfig,
  products = [],
  onSaveConfig,
  showToast,
}) => {
  const effectiveStoreId = storeId || storeConfig.id || 'default';

  const [boasVindasPct, setBoasVindasPct] = useState(
    storeConfig.fidelidade?.boasVindasPct?.toString() || '15'
  );

  const [niveis, setNiveis] = useState<LoyaltyTier[]>(
    storeConfig.fidelidade?.niveis || [
      { id: 'bronze', nome: 'Bronze', cor: '#cd7f32', minimo: 0, descontoPct: 0, desc: 'Gaste R$ 200 para virar Prata!' },
      { id: 'prata', nome: 'Prata', cor: '#c0c0c0', minimo: 200, descontoPct: 5, desc: '5% de desconto nos pedidos!' },
      { id: 'ouro', nome: 'Ouro', cor: '#ffd700', minimo: 500, descontoPct: 10, desc: '10% de desconto automático no carrinho!' },
      { id: 'diamante', nome: 'Diamante', cor: '#7df9ff', minimo: 1000, descontoPct: 15, desc: '15% OFF + prioridade na entrega!' },
    ]
  );

  const [cupons, setCupons] = useState<CouponItem[]>(
    storeConfig.cupons || [
      { codigo: 'SAUDADE15', desconto: 15, tipo: 'livre', msg: '15% OFF especial para matar a saudade!' },
      { codigo: 'PRIMEIRACOMPRA', desconto: 15, tipo: 'livre', msg: '15% de boas-vindas!' },
      { codigo: 'CLIENTEOURO', desconto: 10, tipo: 'nivel', minimo: 500, msg: '10% off para Cliente Ouro!' },
      { codigo: 'ANIVERSARIO', desconto: 10, tipo: 'aniversario', msg: 'Parabéns! 10% off no seu aniversário!' },
    ]
  );

  // CRM State
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [diasInatividade, setDiasInatividade] = useState<number>(storeConfig.diasAlertaInatividade || 15);
  const [crmFilter, setCrmFilter] = useState<'todos' | 'inativos' | 'vips' | 'ativos'>('inativos');
  const [crmSearch, setCrmSearch] = useState('');
  const [selectedReactivationCoupon, setSelectedReactivationCoupon] = useState<string>(
    cupons[0]?.codigo || 'SAUDADE15'
  );

  // Manual Customer Modal / Form
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustDish, setNewCustDish] = useState('');
  const [newCustDaysAgo, setNewCustDaysAgo] = useState('22');
  const [newCustTotalSpent, setNewCustTotalSpent] = useState('185.00');
  const [newCustOrdersCount, setNewCustOrdersCount] = useState('3');

  // Seeded realistic CRM customers per store so manager can immediately test WhatsApp reactivation
  const defaultSeededCustomers: CrmCustomer[] = useMemo(() => {
    const p1 = products[0]?.nome || 'Combo Artesanal Duplo';
    const p2 = products[1]?.nome || 'Especial da Casa';
    const p3 = products[2]?.nome || 'Porção Suprema';
    return [
      {
        id: 'crm_seed_1',
        storeId: effectiveStoreId,
        nome: 'Carlos Eduardo Silva',
        telefone: '5565999123456',
        totalPedidos: 6,
        totalGasto: 412.5,
        ultimoPedidoEm: new Date(Date.now() - 86400000 * 24).toISOString(), // 24 dias atrás (Inativo)
        pratoFavorito: p1,
      },
      {
        id: 'crm_seed_2',
        storeId: effectiveStoreId,
        nome: 'Juliana Martins',
        telefone: '5565998765432',
        totalPedidos: 4,
        totalGasto: 268.0,
        ultimoPedidoEm: new Date(Date.now() - 86400000 * 19).toISOString(), // 19 dias atrás (Inativo)
        pratoFavorito: p2,
      },
      {
        id: 'crm_seed_3',
        storeId: effectiveStoreId,
        nome: 'Roberto Almeida',
        telefone: '5565996543210',
        totalPedidos: 3,
        totalGasto: 194.9,
        ultimoPedidoEm: new Date(Date.now() - 86400000 * 32).toISOString(), // 32 dias atrás (Inativo)
        pratoFavorito: p3,
      },
      {
        id: 'crm_seed_4',
        storeId: effectiveStoreId,
        nome: 'Fernanda Souza',
        telefone: '5565992345678',
        totalPedidos: 11,
        totalGasto: 785.0,
        ultimoPedidoEm: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 dias atrás (VIP Ativo)
        pratoFavorito: p1,
      },
      {
        id: 'crm_seed_5',
        storeId: effectiveStoreId,
        nome: 'Marcos Vinícius',
        telefone: '5565993456789',
        totalPedidos: 8,
        totalGasto: 540.0,
        ultimoPedidoEm: new Date(Date.now() - 86400000 * 16).toISOString(), // 16 dias atrás (VIP Inativo)
        pratoFavorito: p2,
      },
    ];
  }, [effectiveStoreId, products]);

  const [manualCustomers, setManualCustomers] = useState<CrmCustomer[]>(
    storeConfig.clientesCrm && storeConfig.clientesCrm.length > 0
      ? storeConfig.clientesCrm
      : defaultSeededCustomers
  );

  useEffect(() => {
    if (storeConfig.clientesCrm && storeConfig.clientesCrm.length > 0) {
      setManualCustomers(storeConfig.clientesCrm);
    } else {
      setManualCustomers(defaultSeededCustomers);
    }
  }, [storeConfig.clientesCrm, defaultSeededCustomers]);

  useEffect(() => {
    const unsubscribe = subscribeToOrders(
      (orders) => {
        setLiveOrders(orders);
      },
      undefined,
      effectiveStoreId
    );
    return () => unsubscribe();
  }, [effectiveStoreId]);

  // Consolidate CRM customers from both manualCustomers and liveOrders
  const consolidatedCustomers = useMemo(() => {
    const map = new Map<string, CrmCustomer>();

    manualCustomers.forEach((c) => {
      const cleanPhone = c.telefone.replace(/\D/g, '') || c.nome.toLowerCase();
      map.set(cleanPhone, { ...c });
    });

    liveOrders
      .filter((o) => o.status !== 'cancelado')
      .forEach((order) => {
        const cleanPhone = (order.clienteTelefone || '').replace(/\D/g, '') || order.clienteNome.toLowerCase();
        const existing = map.get(cleanPhone);
        const firstDish = order.itens?.[0]?.produto?.nome || 'Pedido Especial';

        if (existing) {
          const orderDate = Date.parse(order.criadoEm) || 0;
          const existingDate = Date.parse(existing.ultimoPedidoEm) || 0;
          map.set(cleanPhone, {
            ...existing,
            totalPedidos: existing.totalPedidos + 1,
            totalGasto: existing.totalGasto + (Number(order.total) || 0),
            ultimoPedidoEm: orderDate > existingDate ? order.criadoEm : existing.ultimoPedidoEm,
            pratoFavorito: existing.pratoFavorito || firstDish,
          });
        } else {
          map.set(cleanPhone, {
            id: 'crm_ord_' + order.id,
            storeId: effectiveStoreId,
            nome: order.clienteNome,
            telefone: order.clienteTelefone || '5565999999999',
            totalPedidos: 1,
            totalGasto: Number(order.total) || 0,
            ultimoPedidoEm: order.criadoEm || new Date().toISOString(),
            pratoFavorito: firstDish,
          });
        }
      });

    const now = Date.now();
    return Array.from(map.values())
      .map((cust) => {
        const lastMs = Date.parse(cust.ultimoPedidoEm) || now;
        const diasSemComprar = Math.max(0, Math.floor((now - lastMs) / 86400000));
        const isInativo = diasSemComprar >= diasInatividade;
        const isVip = cust.totalGasto >= 350 || cust.totalPedidos >= 5;
        return {
          ...cust,
          diasSemComprar,
          isInativo,
          isVip,
        };
      })
      .sort((a, b) => b.diasSemComprar - a.diasSemComprar);
  }, [manualCustomers, liveOrders, diasInatividade, effectiveStoreId]);

  const filteredCrmList = useMemo(() => {
    return consolidatedCustomers.filter((c) => {
      const matchesSearch =
        c.nome.toLowerCase().includes(crmSearch.toLowerCase()) ||
        c.telefone.includes(crmSearch) ||
        (c.pratoFavorito && c.pratoFavorito.toLowerCase().includes(crmSearch.toLowerCase()));

      if (!matchesSearch) return false;
      if (crmFilter === 'inativos') return c.isInativo;
      if (crmFilter === 'vips') return c.isVip;
      if (crmFilter === 'ativos') return !c.isInativo;
      return true;
    });
  }, [consolidatedCustomers, crmSearch, crmFilter]);

  const countInativos = consolidatedCustomers.filter((c) => c.isInativo).length;
  const countVips = consolidatedCustomers.filter((c) => c.isVip).length;
  const countAtivos = consolidatedCustomers.filter((c) => !c.isInativo).length;

  const handleAddManualCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      showToast('Preencha o nome e o WhatsApp do cliente.');
      return;
    }
    const daysAgo = Math.max(0, parseInt(newCustDaysAgo) || 0);
    const lastOrderIso = new Date(Date.now() - daysAgo * 86400000).toISOString();
    const newCust: CrmCustomer = {
      id: 'crm_' + Date.now(),
      storeId: effectiveStoreId,
      nome: newCustName.trim(),
      telefone: newCustPhone.replace(/\D/g, ''),
      totalPedidos: Math.max(1, parseInt(newCustOrdersCount) || 1),
      totalGasto: Math.max(0, parseFloat(newCustTotalSpent.replace(',', '.')) || 0),
      ultimoPedidoEm: lastOrderIso,
      pratoFavorito: newCustDish.trim() || products[0]?.nome || 'Especial da Casa',
    };

    const updatedCustomers = [newCust, ...manualCustomers];
    setManualCustomers(updatedCustomers);

    const updatedConfig: StoreConfig = {
      ...storeConfig,
      clientesCrm: updatedCustomers,
      diasAlertaInatividade: diasInatividade,
    };
    onSaveConfig(updatedConfig);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustDish('');
    setIsNewCustomerOpen(false);
    showToast(`Cliente "${newCust.nome}" cadastrado no CRM da loja!`);
  };

  const handleRemoveCustomer = (id: string) => {
    const updated = manualCustomers.filter((c) => c.id !== id);
    setManualCustomers(updated);
    onSaveConfig({
      ...storeConfig,
      clientesCrm: updated,
    });
    showToast('Registro removido do CRM.');
  };

  const handleSendWhatsAppReactivation = (
    cust: CrmCustomer & { diasSemComprar: number; isInativo: boolean; isVip: boolean }
  ) => {
    const cleanPhone = cust.telefone.replace(/\D/g, '');
    const phoneWithDdi = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const chosenCoupon =
      cupons.find((c) => c.codigo === selectedReactivationCoupon) ||
      cupons[0] || { codigo: 'VOLTA15', desconto: 15 };
    const menuUrl = buildExclusiveMenuUrl(effectiveStoreId, storeConfig);

    const greeting = cust.isInativo
      ? `Olá, *${cust.nome}*! Tudo bem? Faz *${cust.diasSemComprar} dias* que não vemos você por aqui no *${storeConfig.nome}* e estamos com saudade!`
      : `Olá, *${cust.nome}*! Tudo bem? Passando para agradecer por ser nosso cliente especial no *${storeConfig.nome}*!`;

    const dishMention = cust.pratoFavorito
      ? `\n\nSabemos que você adora o nosso *${cust.pratoFavorito}*, então liberamos um presente exclusivo para você pedir hoje:`
      : `\n\nPreparamos um presente exclusivo para o seu pedido de hoje:`;

    const couponBlock = `\n🎁 Cupom: *${chosenCoupon.codigo}* (${chosenCoupon.desconto}% OFF)\n📲 Peça direto no nosso Cardápio Digital exclusivo:\n${menuUrl}`;

    const fullText = encodeURIComponent(`${greeting}${dishMention}${couponBlock}`);
    const link = document.createElement('a');
    link.href = `https://wa.me/${phoneWithDdi}?text=${fullText}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
    showToast(`Disparo de recuperação aberto no WhatsApp para ${cust.nome}!`);
  };

  const handleAddCupom = () => {
    setCupons([
      ...cupons,
      { codigo: 'NOVOCUPOM', desconto: 10, tipo: 'livre', msg: '10% de desconto especial!' },
    ]);
  };

  const handleRemoveCupom = (index: number) => {
    const list = [...cupons];
    list.splice(index, 1);
    setCupons(list);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: StoreConfig = {
      ...storeConfig,
      fidelidade: {
        boasVindasPct: parseFloat(boasVindasPct) || 15,
        niveis,
      },
      cupons,
      clientesCrm: manualCustomers,
      diasAlertaInatividade: diasInatividade,
    };

    onSaveConfig(updated);
    showToast('CRM, Fidelidade e Cupons salvos e sincronizados com sucesso!');
  };

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-6">
      {/* Top Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>CRM de Retenção, Reativação no WhatsApp &amp; Fidelidade</span>
          </div>
          <h2 className="text-2xl font-black text-white">
            CRM de Clientes Inativos &amp; Clube de Cupons — {storeConfig.nome}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Identifique clientes sumidos automaticamente, dispare cupons de recuperação em 1 clique no WhatsApp e configure níveis de fidelidade.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-orange-500/25 transition active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <Save className="w-4 h-4" />
          <span>Salvar Configurações</span>
        </button>
      </div>

      {/* SECTION 0: CRM DE CLIENTES INATIVOS COM DISPARO RÁPIDO NO WHATSAPP */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-lg space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-black text-white">
                Radar CRM de Clientes Inativos &amp; Disparo Rápido no WhatsApp
              </h3>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Clientes que não compram há mais de <strong>{diasInatividade} dias</strong> entram em alerta de recuperação com mensagem personalizada e link do cardápio.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Inactivity days selector */}
            <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-xl text-xs">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-neutral-400 font-semibold">Alerta após:</span>
              <select
                value={diasInatividade}
                onChange={(e) => setDiasInatividade(Number(e.target.value))}
                className="bg-transparent text-white font-black outline-none cursor-pointer"
              >
                <option value={7} className="bg-neutral-900">7 dias sem pedir</option>
                <option value={15} className="bg-neutral-900">15 dias sem pedir</option>
                <option value={30} className="bg-neutral-900">30 dias sem pedir</option>
              </select>
            </div>

            {/* Coupon selector for WhatsApp message */}
            <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-xl text-xs">
              <Tag className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-neutral-400 font-semibold">Cupom do Disparo:</span>
              <select
                value={selectedReactivationCoupon}
                onChange={(e) => setSelectedReactivationCoupon(e.target.value)}
                className="bg-transparent text-emerald-400 font-black outline-none cursor-pointer"
              >
                {cupons.map((c, idx) => (
                  <option key={idx} value={c.codigo} className="bg-neutral-900 text-white">
                    {c.codigo} ({c.desconto}% OFF)
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsNewCustomerOpen(!isNewCustomerOpen)}
              className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black flex items-center gap-1.5 transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Cadastrar Cliente</span>
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-xl bg-neutral-950 border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase text-amber-400 block">
                Clientes Sumidos / Inativos (+{diasInatividade}d)
              </span>
              <span className="text-2xl font-black text-white font-mono tabular-nums mt-1 block">
                {countInativos} clientes
              </span>
              <span className="text-[11px] text-neutral-400">
                Prontos para reativação via WhatsApp
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase text-purple-400 block">
                Clientes VIPs / Recorrentes
              </span>
              <span className="text-2xl font-black text-white font-mono tabular-nums mt-1 block">
                {countVips} clientes
              </span>
              <span className="text-[11px] text-neutral-400">
                5+ pedidos ou gasto acima de R$ 350
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase text-emerald-400 block">
                Clientes Ativos (&lt; {diasInatividade} dias)
              </span>
              <span className="text-2xl font-black text-white font-mono tabular-nums mt-1 block">
                {countAtivos} clientes
              </span>
              <span className="text-[11px] text-neutral-400">
                Compraram recentemente na loja
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Manual Customer Add Form */}
        {isNewCustomerOpen && (
          <form
            onSubmit={handleAddManualCustomer}
            className="p-4 rounded-2xl bg-neutral-950 border border-orange-500/40 space-y-3 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-orange-400 uppercase tracking-wider">
                Adicionar Cliente Manualmente ao CRM da Loja
              </span>
              <button
                type="button"
                onClick={() => setIsNewCustomerOpen(false)}
                className="text-neutral-400 hover:text-white text-xs"
              >
                Fechar
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
              <div>
                <label className="block text-neutral-400 font-bold mb-1">Nome do Cliente *</label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="Ex: Rodrigo Lima"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-neutral-400 font-bold mb-1">WhatsApp (com DDD) *</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="65999887766"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-mono outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-neutral-400 font-bold mb-1">Prato Favorito</label>
                <input
                  type="text"
                  value={newCustDish}
                  onChange={(e) => setNewCustDish(e.target.value)}
                  placeholder={products[0]?.nome || 'Ex: X-Bacon Artesanal'}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-neutral-400 font-bold mb-1">Dias sem comprar</label>
                <input
                  type="number"
                  value={newCustDaysAgo}
                  onChange={(e) => setNewCustDaysAgo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-mono outline-none"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black cursor-pointer"
                >
                  Salvar no CRM
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Filter Bar & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setCrmFilter('inativos')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                crmFilter === 'inativos'
                  ? 'bg-amber-500 text-neutral-950 font-black'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Inativos / Sumidos ({countInativos})
            </button>
            <button
              type="button"
              onClick={() => setCrmFilter('vips')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                crmFilter === 'vips'
                  ? 'bg-purple-500 text-white font-black'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              VIPs ({countVips})
            </button>
            <button
              type="button"
              onClick={() => setCrmFilter('ativos')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                crmFilter === 'ativos'
                  ? 'bg-emerald-500 text-neutral-950 font-black'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Ativos ({countAtivos})
            </button>
            <button
              type="button"
              onClick={() => setCrmFilter('todos')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                crmFilter === 'todos'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Todos ({consolidatedCustomers.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={crmSearch}
              onChange={(e) => setCrmSearch(e.target.value)}
              placeholder="Buscar cliente, telefone ou prato..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* CRM Customers Table */}
        <div className="overflow-x-auto border border-neutral-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 uppercase font-bold">
              <tr>
                <th className="py-3 px-4">Cliente &amp; WhatsApp</th>
                <th className="py-3 px-4">Status / Última Compra</th>
                <th className="py-3 px-4">Item Favorito</th>
                <th className="py-3 px-4 text-center">Pedidos</th>
                <th className="py-3 px-4 text-right">Total Gasto</th>
                <th className="py-3 px-4 text-right">Ação de Recuperação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {filteredCrmList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500">
                    Nenhum cliente encontrado neste filtro.
                  </td>
                </tr>
              ) : (
                filteredCrmList.map((cust) => (
                  <tr key={cust.id} className="hover:bg-neutral-800/30 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{cust.nome}</span>
                        {cust.isVip && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-black">
                            VIP
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-400 font-mono">{cust.telefone}</span>
                    </td>

                    <td className="py-3 px-4">
                      {cust.isInativo ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-[11px]">
                          <Clock className="w-3 h-3" />
                          Sumido há {cust.diasSemComprar} dias
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[11px]">
                          Ativo ({cust.diasSemComprar === 0 ? 'Hoje' : `há ${cust.diasSemComprar}d`})
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-neutral-300 font-medium">
                      {cust.pratoFavorito || 'Cardápio Geral'}
                    </td>

                    <td className="py-3 px-4 text-center font-mono tabular-nums font-bold text-neutral-200">
                      {cust.totalPedidos}
                    </td>

                    <td className="py-3 px-4 text-right font-mono tabular-nums font-black text-emerald-400">
                      R$ {cust.totalGasto.toFixed(2).replace('.', ',')}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSendWhatsAppReactivation(cust)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer whitespace-nowrap"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Enviar Cupom {selectedReactivationCoupon}</span>
                        </button>
                        {cust.id.startsWith('crm_') && !cust.id.startsWith('crm_ord_') && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomer(cust.id)}
                            className="p-1.5 text-neutral-500 hover:text-red-400 cursor-pointer"
                            title="Remover do CRM"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: BOAS-VINDAS & CUPONS */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-orange-400" />
                <span>1. Cupons Ativos no Delivery &amp; Campanhas de WhatsApp</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Cupons livres (qualquer um usa), por gasto acumulado, recuperação de inativos ou aniversário.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddCupom}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-neutral-700 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-orange-400" />
              <span>+ Criar Cupom</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cupons.map((cupom, cIdx) => (
              <div
                key={cIdx}
                className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={cupom.codigo}
                    onChange={(e) => {
                      const list = [...cupons];
                      list[cIdx].codigo = e.target.value.toUpperCase();
                      setCupons(list);
                    }}
                    placeholder="CÓDIGO"
                    className="font-black text-white bg-neutral-900 border border-neutral-700 px-2 py-1 rounded tracking-wider uppercase text-xs font-mono"
                  />

                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={cupom.desconto}
                      onChange={(e) => {
                        const list = [...cupons];
                        list[cIdx].desconto = parseFloat(e.target.value) || 0;
                        setCupons(list);
                      }}
                      className="w-14 px-1.5 py-1 bg-neutral-900 border border-neutral-700 rounded text-emerald-400 font-bold text-right text-xs font-mono tabular-nums"
                    />
                    <span className="text-emerald-400 font-bold">% OFF</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveCupom(cIdx)}
                    className="text-neutral-500 hover:text-red-400 p-1 cursor-pointer"
                    title="Excluir cupom"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={cupom.tipo}
                    onChange={(e) => {
                      const list = [...cupons];
                      list[cIdx].tipo = e.target.value as any;
                      setCupons(list);
                    }}
                    className="flex-1 p-1.5 bg-neutral-900 border border-neutral-800 rounded text-neutral-300 text-[11px]"
                  >
                    <option value="livre">Livre (qualquer cliente)</option>
                    <option value="nivel">Exige Gasto Mínimo</option>
                    <option value="aniversario">Mês de Aniversário</option>
                  </select>

                  {cupom.tipo === 'nivel' && (
                    <div className="flex items-center gap-1">
                      <span className="text-neutral-400 text-[11px]">Mín: R$</span>
                      <input
                        type="number"
                        value={cupom.minimo || 0}
                        onChange={(e) => {
                          const list = [...cupons];
                          list[cIdx].minimo = parseFloat(e.target.value) || 0;
                          setCupons(list);
                        }}
                        className="w-16 p-1 bg-neutral-900 border border-neutral-800 rounded text-white text-[11px] font-mono tabular-nums"
                      />
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  value={cupom.msg}
                  onChange={(e) => {
                    const list = [...cupons];
                    list[cIdx].msg = e.target.value;
                    setCupons(list);
                  }}
                  placeholder="Mensagem exibida ao cliente"
                  className="w-full px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-neutral-300 text-[11px]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: NÍVEIS DE FIDELIDADE */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-neutral-800/80 pb-3">
            <Award className="w-4 h-4 text-amber-400" />
            <span>2. Níveis de Fidelidade (Gamificação do Cliente)</span>
          </h3>

          <div className="space-y-3">
            {niveis.map((nivel, nIdx) => (
              <div
                key={nivel.id}
                className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-black"
                    style={{ backgroundColor: nivel.cor }}
                  >
                    ★
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm" style={{ color: nivel.cor }}>
                      {nivel.nome}
                    </span>
                    <p className="text-[11px] text-neutral-400">{nivel.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-neutral-400 text-[11px]">Gasto: R$</span>
                    <input
                      type="number"
                      value={nivel.minimo}
                      onChange={(e) => {
                        const list = [...niveis];
                        list[nIdx].minimo = parseFloat(e.target.value) || 0;
                        setNiveis(list);
                      }}
                      className="w-16 px-1.5 py-1 bg-neutral-900 border border-neutral-700 rounded text-white font-bold text-xs font-mono tabular-nums"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-neutral-400 text-[11px]">Desconto:</span>
                    <input
                      type="number"
                      value={nivel.descontoPct}
                      onChange={(e) => {
                        const list = [...niveis];
                        list[nIdx].descontoPct = parseFloat(e.target.value) || 0;
                        setNiveis(list);
                      }}
                      className="w-12 px-1.5 py-1 bg-neutral-900 border border-neutral-700 rounded text-emerald-400 font-bold text-xs font-mono tabular-nums"
                    />
                    <span className="text-neutral-400 text-[11px]">%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save button footer */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-sm font-black flex items-center gap-2 shadow-lg shadow-orange-500/25 transition active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar CRM, Fidelidade &amp; Cupons</span>
          </button>
        </div>
      </form>
    </div>
  );
};
