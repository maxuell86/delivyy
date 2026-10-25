import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Lock,
  Unlock,
  Trash2,
  DollarSign,
  Calendar,
  Building2,
  AlertTriangle,
  MessageCircle,
  Plus,
  Search,
  ExternalLink,
  Crown,
} from 'lucide-react';
import { StoreConfig } from '../types';
import { useTheme } from '../context/ThemeContext';
import { SEGMENTOS_DISPONIVEIS } from '../data/segmentData';

interface SaasBillingViewProps {
  stores: StoreConfig[];
  activeStoreId: string;
  onUpdateStoreConfig: (updatedConfig: StoreConfig, targetStoreId: string) => Promise<void> | void;
  onDeleteStore: (targetStoreId: string, storeName: string) => Promise<void>;
  onSelectStore: (storeId: string) => void;
  onOpenOnboarding: () => void;
  onOpenMarketplace: () => void;
  showToast: (msg: string) => void;
}

export const SaasBillingView: React.FC<SaasBillingViewProps> = ({
  stores,
  activeStoreId,
  onUpdateStoreConfig,
  onDeleteStore,
  onSelectStore,
  onOpenOnboarding,
  onOpenMarketplace,
  showToast,
}) => {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'atrasado' | 'suspenso'>('todos');
  const [confirmDeleteStore, setConfirmDeleteStore] = useState<StoreConfig | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Editing monthly fee / due day inline state
  const [editingValues, setEditingValues] = useState<
    Record<string, { valor: string; vencimento: string; motivo: string }>
  >({});

  const getStoreStatus = (s: StoreConfig): 'ativo' | 'atrasado' | 'suspenso' => {
    if (s.statusLicenca === 'suspenso') return 'suspenso';
    if (s.statusLicenca === 'atrasado') return 'atrasado';
    return 'ativo';
  };

  const totalStores = stores.length;
  const activeStoresCount = stores.filter((s) => getStoreStatus(s) === 'ativo').length;
  const overdueStoresCount = stores.filter((s) => getStoreStatus(s) === 'atrasado').length;
  const blockedStoresCount = stores.filter((s) => getStoreStatus(s) === 'suspenso').length;

  const totalMrr = stores
    .filter((s) => getStoreStatus(s) !== 'suspenso')
    .reduce((acc, s) => acc + (Number(s.valorMensalidade) || 149.9), 0);

  const filteredStores = stores.filter((s) => {
    const st = getStoreStatus(s);
    if (statusFilter !== 'todos' && st !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.nome || '').toLowerCase().includes(q) ||
      (s.cidade || '').toLowerCase().includes(q) ||
      (s.gerenteEmail || '').toLowerCase().includes(q) ||
      (s.gerenteNome || '').toLowerCase().includes(q) ||
      (s.id || '').toLowerCase().includes(q)
    );
  });

  const handleChangeStatus = async (
    store: StoreConfig,
    newStatus: 'ativo' | 'atrasado' | 'suspenso'
  ) => {
    const storeId = store.id || 'default';
    const editState = editingValues[storeId];
    const updated: StoreConfig = {
      ...store,
      id: storeId,
      statusLicenca: newStatus,
      aberto: newStatus === 'suspenso' ? false : store.aberto,
      valorMensalidade: editState
        ? parseFloat(editState.valor) || store.valorMensalidade || 149.9
        : store.valorMensalidade || 149.9,
      diaVencimento: editState
        ? parseInt(editState.vencimento, 10) || store.diaVencimento || 10
        : store.diaVencimento || 10,
      motivoBloqueio:
        newStatus === 'suspenso'
          ? editState?.motivo ||
            store.motivoBloqueio ||
            'Mensalidade de uso da plataforma Delivy em aberto.'
          : '',
    };

    await onUpdateStoreConfig(updated, storeId);

    if (newStatus === 'suspenso') {
      showToast(`Acesso do estabelecimento "${store.nome}" BLOQUEADO por inadimplência!`);
    } else if (newStatus === 'atrasado') {
      showToast(`Estabelecimento "${store.nome}" marcado como Pagamento em Atraso.`);
    } else {
      showToast(`Acesso do estabelecimento "${store.nome}" LIBERADO com sucesso!`);
    }
  };

  const handleSaveBillingDetails = async (store: StoreConfig) => {
    const storeId = store.id || 'default';
    const editState = editingValues[storeId];
    if (!editState) return;

    const updated: StoreConfig = {
      ...store,
      id: storeId,
      valorMensalidade: parseFloat(editState.valor) || 149.9,
      diaVencimento: Math.min(31, Math.max(1, parseInt(editState.vencimento, 10) || 10)),
      motivoBloqueio: editState.motivo,
    };

    await onUpdateStoreConfig(updated, storeId);
    showToast(`Dados de mensalidade de "${store.nome}" salvos!`);
  };

  const handleSendBillingWhatsApp = (store: StoreConfig) => {
    const phone = (store.whatsapp || '').replace(/\D/g, '');
    if (!phone) {
      showToast('Este estabelecimento não possui WhatsApp cadastrado.');
      return;
    }
    const valor = (Number(store.valorMensalidade) || 149.9).toFixed(2).replace('.', ',');
    const venc = store.diaVencimento || 10;
    const status = getStoreStatus(store);

    const msg =
      status === 'suspenso'
        ? `Olá ${store.gerenteNome || store.nome}! Aqui é da administração da plataforma *Delivy*. Identificamos que a mensalidade do estabelecimento *${store.nome}* (R$ ${valor}, vencimento dia ${venc}) encontra-se pendente e o acesso ao painel/cardápio foi temporariamente suspenso. Assim que realizar o pagamento, nos envie o comprovante por aqui para liberarmos seu acesso imediatamente!`
        : `Olá ${store.gerenteNome || store.nome}! Tudo bem? Aqui é da plataforma *Delivy*. Passando para lembrar sobre a mensalidade de uso da plataforma referente ao estabelecimento *${store.nome}* no valor de *R$ ${valor}* (vencimento dia ${venc}). Qualquer dúvida estamos à disposição!`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteStore) return;
    const storeId = confirmDeleteStore.id || 'default';
    if (storeId === 'default' && stores.length <= 1) {
      showToast('Não é possível excluir o único estabelecimento padrão da demonstração.');
      return;
    }

    setIsDeleting(true);
    try {
      await onDeleteStore(storeId, confirmDeleteStore.nome);
      setConfirmDeleteStore(null);
      setDeleteConfirmationText('');
    } finally {
      setIsDeleting(false);
    }
  };

  const cardBg = isDark
    ? 'bg-neutral-900 border-neutral-800 text-white'
    : 'bg-white border-neutral-200 text-neutral-900 shadow-xs';
  const innerBg = isDark
    ? 'bg-neutral-950 border-neutral-800 text-white'
    : 'bg-neutral-50 border-neutral-200 text-neutral-900';

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div
        className={`p-6 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${cardBg}`}
      >
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-500 text-xs font-black uppercase tracking-wider">
            <Crown className="w-3.5 h-3.5" />
            <span>Central Financeira SaaS • Delivy</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            Controle de Mensalidades, Bloqueio &amp; Exclusão de Lojas
          </h2>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
            Bloqueie o acesso de estabelecimentos inadimplentes com 1 clique ou exclua definitivamente lojas encerradas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenMarketplace}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Abrir App Marketplace Delivy</span>
          </button>

          <button
            type="button"
            onClick={onOpenOnboarding}
            className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Estabelecimento</span>
          </button>
        </div>
      </div>

      {/* SAAS KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between text-xs text-neutral-400 font-bold mb-1">
            <span>Receita Recorrente (MRR)</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-500">
            R$ {totalMrr.toFixed(2).replace('.', ',')}
          </p>
          <span className="text-[11px] text-neutral-400">
            Soma das mensalidades das lojas ativas
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between text-xs text-neutral-400 font-bold mb-1">
            <span>Lojas Ativas (Em Dia)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black">{activeStoresCount}</p>
          <span className="text-[11px] text-emerald-500 font-semibold">
            de {totalStores} estabelecimentos cadastrados
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between text-xs text-neutral-400 font-bold mb-1">
            <span>Pagamento em Atraso</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-500">{overdueStoresCount}</p>
          <span className="text-[11px] text-neutral-400">
            Aviso de cobrança exibido ao gerente
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between text-xs text-neutral-400 font-bold mb-1">
            <span>Bloqueados (Inadimplentes)</span>
            <Lock className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-black text-red-500">{blockedStoresCount}</p>
          <span className="text-[11px] text-red-400 font-semibold">
            Painel e cardápio suspensos
          </span>
        </div>
      </div>

      {/* SEARCH & STATUS FILTERS */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${cardBg}`}>
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar estabelecimento por nome, cidade, gerente ou e-mail..."
            className={`w-full pl-10 pr-4 py-2 rounded-xl border text-xs outline-none focus:border-orange-500 ${innerBg}`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'todos', label: `Todos (${totalStores})` },
              { id: 'ativo', label: `Ativos (${activeStoresCount})` },
              { id: 'atrasado', label: `Em Atraso (${overdueStoresCount})` },
              { id: 'suspenso', label: `Bloqueados (${blockedStoresCount})` },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                statusFilter === f.id
                  ? 'bg-orange-500 text-white border-orange-500'
                  : isDark
                  ? 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  : 'bg-neutral-100 border-neutral-200 text-neutral-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ESTABLISHMENTS LIST */}
      <div className="space-y-4">
        {filteredStores.length === 0 ? (
          <div className={`p-8 rounded-2xl border text-center text-sm text-neutral-400 ${cardBg}`}>
            Nenhum estabelecimento encontrado para este filtro.
          </div>
        ) : (
          filteredStores.map((store) => {
            const storeId = store.id || 'default';
            const status = getStoreStatus(store);
            const segInfo =
              SEGMENTOS_DISPONIVEIS.find((s) => s.id === store.segmento) ||
              SEGMENTOS_DISPONIVEIS[0];

            const currentEdit = editingValues[storeId] || {
              valor: String(store.valorMensalidade ?? 149.9),
              vencimento: String(store.diaVencimento ?? 10),
              motivo:
                store.motivoBloqueio ||
                'Mensalidade de uso da plataforma Delivy em aberto.',
            };

            return (
              <div
                key={storeId}
                className={`p-5 rounded-2xl border transition ${cardBg} ${
                  status === 'suspenso'
                    ? 'border-red-500/50 bg-red-500/5'
                    : status === 'atrasado'
                    ? 'border-amber-500/50'
                    : ''
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Store Identity */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: store.corTema || '#f97316' }}
                    >
                      {segInfo.icone}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black truncate">{store.nome}</h3>
                        <span className="text-xs text-orange-500 font-bold">
                          · {segInfo.nome}
                        </span>
                        {status === 'ativo' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            ACESSO LIBERADO
                          </span>
                        )}
                        {status === 'atrasado' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            MENSALIDADE EM ATRASO
                          </span>
                        )}
                        {status === 'suspenso' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1 animate-pulse">
                            <Lock className="w-3 h-3" />
                            ACESSO BLOQUEADO (INADIMPLENTE)
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400">
                        <span>
                          <strong>ID:</strong> <code>{storeId}</code>
                        </span>
                        <span>
                          <strong>Cidade:</strong> {store.cidade || 'Não informada'}
                        </span>
                        <span>
                          <strong>Gerente:</strong>{' '}
                          {store.gerenteNome || store.gerenteEmail || 'Não vinculado'}
                          {store.gerenteEmail ? ` (${store.gerenteEmail})` : ''}
                        </span>
                        <span>
                          <strong>WhatsApp:</strong> {store.whatsappExibicao || store.whatsapp}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Status Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {status !== 'ativo' && (
                      <button
                        type="button"
                        onClick={() => handleChangeStatus(store, 'ativo')}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        title="Confirmar pagamento e liberar acesso do estabelecimento"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Liberar Acesso</span>
                      </button>
                    )}

                    {status !== 'atrasado' && (
                      <button
                        type="button"
                        onClick={() => handleChangeStatus(store, 'atrasado')}
                        className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        title="Exibir aviso de mensalidade vencida no painel do gerente"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Marcar Atraso</span>
                      </button>
                    )}

                    {status !== 'suspenso' && (
                      <button
                        type="button"
                        onClick={() => handleChangeStatus(store, 'suspenso')}
                        className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        title="Bloquear imediatamente o acesso do gerente e suspender a loja"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Bloquear Loja</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSendBillingWhatsApp(store)}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${innerBg}`}
                      title="Enviar lembrete ou cobrança da mensalidade via WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Cobrar WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDeleteStore(store);
                        setDeleteConfirmationText('');
                      }}
                      className="p-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition cursor-pointer"
                      title="Excluir estabelecimento e todos os seus dados definitivamente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Billing Parameters Row (Monthly Fee, Due Day & Block Reason) */}
                <div
                  className={`mt-4 pt-3.5 border-t grid grid-cols-1 sm:grid-cols-12 gap-3 items-end ${
                    isDark ? 'border-neutral-800/80' : 'border-neutral-200'
                  }`}
                >
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                      Mensalidade Delivy (R$)
                    </label>
                    <div className="relative">
                      <DollarSign className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        step="0.10"
                        value={currentEdit.valor}
                        onChange={(e) =>
                          setEditingValues((prev) => ({
                            ...prev,
                            [storeId]: { ...currentEdit, valor: e.target.value },
                          }))
                        }
                        className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs font-bold outline-none focus:border-orange-500 ${innerBg}`}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                      Dia de Vencimento
                    </label>
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={currentEdit.vencimento}
                        onChange={(e) =>
                          setEditingValues((prev) => ({
                            ...prev,
                            [storeId]: { ...currentEdit, vencimento: e.target.value },
                          }))
                        }
                        className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs font-bold outline-none focus:border-orange-500 ${innerBg}`}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                      Mensagem / Motivo exibido em caso de bloqueio
                    </label>
                    <input
                      type="text"
                      value={currentEdit.motivo}
                      onChange={(e) =>
                        setEditingValues((prev) => ({
                          ...prev,
                          [storeId]: { ...currentEdit, motivo: e.target.value },
                        }))
                      }
                      placeholder="Ex: Mensalidade vencida. Entre em contato com o suporte Delivy."
                      className={`w-full px-3 py-1.5 rounded-xl border text-xs outline-none focus:border-orange-500 ${innerBg}`}
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveBillingDetails(store)}
                      className="w-full py-1.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Salvar Dados
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DEFINITIVA DO ESTABELECIMENTO */}
      {confirmDeleteStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl space-y-4 ${cardBg}`}
          >
            <div className="flex items-center gap-3 text-red-500">
              <div className="w-11 h-11 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black">Excluir Estabelecimento Definitivamente?</h3>
                <p className="text-xs text-neutral-400">
                  Esta ação apagará a loja, o cardápio, os pedidos e os logins vinculados.
                </p>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border text-xs space-y-1 ${innerBg}`}>
              <p>
                <strong>Estabelecimento:</strong> {confirmDeleteStore.nome}
              </p>
              <p>
                <strong>ID no Banco:</strong> <code>{confirmDeleteStore.id}</code>
              </p>
              <p>
                <strong>Gerente:</strong> {confirmDeleteStore.gerenteEmail || 'Não informado'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                Para confirmar, digite <span className="text-red-400 font-black">EXCLUIR</span> abaixo:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Digite EXCLUIR"
                className={`w-full px-3.5 py-2 rounded-xl border text-xs font-black uppercase outline-none focus:border-red-500 ${innerBg}`}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmDeleteStore(null);
                  setDeleteConfirmationText('');
                }}
                className="px-4 py-2 rounded-xl border border-neutral-700 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={
                  deleteConfirmationText.trim().toUpperCase() !== 'EXCLUIR' || isDeleting
                }
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
