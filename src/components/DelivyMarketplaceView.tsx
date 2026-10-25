import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  MapPin,
  Star,
  Clock,
  Bike,
  Flame,
  Sparkles,
  Store,
  ChevronRight,
  Smartphone,
  ShieldCheck,
  Utensils,
  Sun,
  Moon,
  LogIn,
} from 'lucide-react';
import { StoreConfig, SegmentId } from '../types';
import { SEGMENTOS_DISPONIVEIS } from '../data/segmentData';

interface DelivyMarketplaceViewProps {
  stores: StoreConfig[];
  onSelectStoreToOrder: (storeId: string) => void;
  onOpenAdminLogin: () => void;
}

export const DelivyMarketplaceView: React.FC<DelivyMarketplaceViewProps> = ({
  stores,
  onSelectStoreToOrder,
  onOpenAdminLogin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<SegmentId | 'todos'>('todos');
  const [selectedCity, setSelectedCity] = useState<string>('todas');
  const [onlyOpen, setOnlyOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallTip, setShowInstallTip] = useState(false);

  const isDark = theme === 'dark';

  // Capture PWA beforeinstallprompt event so customer can install Delivy App in 1 click
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      setShowInstallTip(true);
    }
  };

  // Only show stores that are NOT suspended/blocked for non-payment
  const activePlatformStores = useMemo(() => {
    return stores.filter((s) => s.statusLicenca !== 'suspenso');
  }, [stores]);

  const availableCities = useMemo(() => {
    const set = new Set<string>();
    activePlatformStores.forEach((s) => {
      if (s.cidade && s.cidade.trim()) set.add(s.cidade.trim());
    });
    return Array.from(set);
  }, [activePlatformStores]);

  const filteredStores = useMemo(() => {
    return activePlatformStores.filter((s) => {
      if (selectedSegment !== 'todos' && s.segmento !== selectedSegment) return false;
      if (selectedCity !== 'todas' && (s.cidade || '').trim() !== selectedCity) return false;
      if (onlyOpen && !s.aberto) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (s.nome || '').toLowerCase().includes(q) ||
        (s.slogan || '').toLowerCase().includes(q) ||
        (s.bairro || '').toLowerCase().includes(q) ||
        (s.segmento || '').toLowerCase().includes(q)
      );
    });
  }, [activePlatformStores, selectedSegment, selectedCity, onlyOpen, searchQuery]);

  const getStoreRating = (s: StoreConfig): string => {
    if (s.avaliacoes && s.avaliacoes.length > 0) {
      const avg =
        s.avaliacoes.reduce((acc, r) => acc + (Number(r.nota) || 5), 0) / s.avaliacoes.length;
      return avg.toFixed(1);
    }
    return '4.9';
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDark ? 'bg-neutral-950 text-white' : 'bg-neutral-50 text-neutral-900'
      }`}
    >
      {/* TOP BAR MARKETPLACE DELIVY */}
      <header
        className={`sticky top-0 z-30 border-b backdrop-blur-md ${
          isDark
            ? 'bg-neutral-900/95 border-neutral-800'
            : 'bg-white/95 border-neutral-200 shadow-xs'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-orange-500/20">
              D
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
                  Delivy
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500/15 text-orange-400 border border-orange-500/30">
                  APP
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 hidden sm:block">
                Seus restaurantes favoritos em um só lugar
              </p>
            </div>
          </div>

          {/* City Selector + Actions */}
          <div className="flex items-center gap-2">
            {availableCities.length > 0 && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                  isDark
                    ? 'bg-neutral-950 border-neutral-800 text-neutral-200'
                    : 'bg-neutral-100 border-neutral-300 text-neutral-800'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="bg-transparent outline-none cursor-pointer text-xs font-bold"
                >
                  <option value="todas" className="bg-neutral-900 text-white">
                    Todas as Cidades
                  </option>
                  {availableCities.map((c) => (
                    <option key={c} value={c} className="bg-neutral-900 text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={handleInstallApp}
              className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer whitespace-nowrap"
              title="Instalar Aplicativo Delivy no Celular"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Baixar App</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isDark
                  ? 'bg-neutral-800 border-neutral-700 text-amber-400'
                  : 'bg-neutral-100 border-neutral-300 text-neutral-700'
              }`}
              title="Alternar tema"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onOpenAdminLogin}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                isDark
                  ? 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300'
                  : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700'
              }`}
              title="Área do Restaurante Parceiro / Gerente"
            >
              <LogIn className="w-3.5 h-3.5 text-orange-500" />
              <span className="hidden md:inline">Sou Parceiro</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO BANNER & SEARCH */}
      <div className="bg-gradient-to-br from-orange-600 via-red-600 to-amber-600 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/25 backdrop-blur-xs text-xs font-black">
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span>Peça direto do seu restaurante favorito sem taxas ocultas</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            O que você quer pedir hoje no Delivy?
          </h1>

          {/* Search Input */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar restaurante, hamburgueria, pizzaria, açaí, bairro..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white text-neutral-900 placeholder:text-neutral-400 text-sm font-semibold shadow-xl outline-none"
            />
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">
        {/* CATEGORY CAROUSEL (iFood Style) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-orange-500 flex items-center gap-1.5">
              <Utensils className="w-4 h-4" />
              <span>Categorias Gastronômicas</span>
            </h2>

            <button
              type="button"
              onClick={() => setOnlyOpen((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer ${
                onlyOpen
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : isDark
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-300'
                  : 'bg-white border-neutral-300 text-neutral-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  onlyOpen ? 'bg-white' : 'bg-emerald-500'
                }`}
              />
              <span>Abertos Agora</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedSegment('todos')}
              className={`px-4 py-3 rounded-2xl border flex flex-col items-center justify-center gap-1 min-w-[92px] transition cursor-pointer shrink-0 ${
                selectedSegment === 'todos'
                  ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                  : isDark
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300 shadow-xs'
              }`}
            >
              <span className="text-2xl">🍽️</span>
              <span className="text-xs font-black">Todos</span>
            </button>

            {SEGMENTOS_DISPONIVEIS.map((seg) => (
              <button
                key={seg.id}
                type="button"
                onClick={() => setSelectedSegment(seg.id)}
                className={`px-4 py-3 rounded-2xl border flex flex-col items-center justify-center gap-1 min-w-[100px] transition cursor-pointer shrink-0 ${
                  selectedSegment === seg.id
                    ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                    : isDark
                    ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300 shadow-xs'
                }`}
              >
                <span className="text-2xl">{seg.icone}</span>
                <span className="text-xs font-bold whitespace-nowrap">{seg.nome}</span>
              </button>
            ))}
          </div>
        </div>

        {/* STORES GRID */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black">
              Estabelecimentos Disponíveis ({filteredStores.length})
            </h3>
          </div>

          {filteredStores.length === 0 ? (
            <div
              className={`p-10 rounded-3xl border text-center space-y-3 ${
                isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
              }`}
            >
              <Store className="w-10 h-10 text-orange-500 mx-auto" />
              <p className="text-base font-black">Nenhum restaurante encontrado</p>
              <p className="text-xs text-neutral-400">
                Tente limpar o filtro de categoria ou buscar por outro termo.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedSegment('todos');
                  setSelectedCity('todas');
                  setOnlyOpen(false);
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-black cursor-pointer"
              >
                Mostrar Todos os Restaurantes
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStores.map((store) => {
                const storeId = store.id || 'default';
                const segInfo =
                  SEGMENTOS_DISPONIVEIS.find((s) => s.id === store.segmento) ||
                  SEGMENTOS_DISPONIVEIS[0];
                const rating = getStoreRating(store);
                const fee = Number(store.taxaEntregaPadrao) || 0;

                return (
                  <div
                    key={storeId}
                    onClick={() => onSelectStoreToOrder(storeId)}
                    className={`group rounded-3xl border overflow-hidden transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-xl ${
                      isDark
                        ? 'bg-neutral-900 border-neutral-800 hover:border-orange-500/50'
                        : 'bg-white border-neutral-200 hover:border-orange-500 shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Store Cover Header */}
                      <div
                        className="h-24 p-4 flex items-start justify-between relative"
                        style={{
                          background: `linear-gradient(135deg, ${
                            store.corTema || '#f97316'
                          }, #171717)`,
                        }}
                      >
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md ${
                            store.aberto
                              ? 'bg-emerald-500 text-neutral-950'
                              : 'bg-neutral-900/80 text-red-300 border border-red-500/30'
                          }`}
                        >
                          {store.aberto ? '● Aberto Agora' : 'Fechado no Momento'}
                        </span>

                        <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-amber-300 text-xs font-black flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {rating}
                        </span>
                      </div>

                      {/* Store Avatar + Details */}
                      <div className="px-5 pt-0 pb-4 -mt-7 relative">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg border-4 mb-3"
                          style={{
                            backgroundColor: store.corTema || '#f97316',
                            borderColor: isDark ? '#171717' : '#ffffff',
                          }}
                        >
                          {segInfo.icone}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-base font-black truncate group-hover:text-orange-500 transition">
                              {store.nome}
                            </h4>
                          </div>

                          <p className="text-xs text-orange-500 font-bold">
                            {segInfo.nome} • {store.bairro || store.cidade || 'Centro'}
                          </p>

                          <p
                            className={`text-xs line-clamp-2 ${
                              isDark ? 'text-neutral-400' : 'text-neutral-600'
                            }`}
                          >
                            {store.slogan || 'Peça online com entrega rápida e acompanhamento ao vivo.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer Delivery Meta & CTA */}
                    <div
                      className={`px-5 py-3.5 border-t flex items-center justify-between text-xs ${
                        isDark
                          ? 'border-neutral-800/80 bg-neutral-950/50'
                          : 'border-neutral-100 bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-neutral-400 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-orange-500" />
                          {store.tempoEntrega || '35-50 min'}
                        </span>

                        <span
                          className={`flex items-center gap-1 font-bold ${
                            fee === 0 ? 'text-emerald-500' : 'text-neutral-300'
                          }`}
                        >
                          <Bike className="w-3.5 h-3.5 text-emerald-500" />
                          {fee === 0
                            ? 'Entrega Grátis'
                            : `R$ ${fee.toFixed(2).replace('.', ',')}`}
                        </span>
                      </div>

                      <span className="font-black text-orange-500 flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                        <span>Cardápio</span>
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* INSTALL APP MODAL / GUIDE */}
      {showInstallTip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-3xl border p-6 space-y-4 shadow-2xl ${
              isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black text-lg">
                D
              </div>
              <div>
                <h3 className="text-base font-black">Instalar Aplicativo Delivy</h3>
                <p className="text-xs text-neutral-400">
                  Tenha todos os restaurantes na tela inicial do seu celular
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs leading-relaxed">
              <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <p className="font-bold text-orange-400 mb-1">📱 No Android (Chrome):</p>
                <p className="text-neutral-300">
                  Toque nos <strong>3 pontinhos (⋮)</strong> no canto superior do navegador e selecione{' '}
                  <strong>&quot;Instalar aplicativo&quot;</strong> ou <strong>&quot;Adicionar à tela inicial&quot;</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <p className="font-bold text-emerald-400 mb-1">🍏 No iPhone / iOS (Safari):</p>
                <p className="text-neutral-300">
                  Toque no botão <strong>Compartilhar (ícone com seta para cima)</strong> na barra inferior e escolha{' '}
                  <strong>&quot;Adicionar à Tela de Início&quot;</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInstallTip(false)}
              className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black cursor-pointer"
            >
              Entendi!
            </button>
          </div>
        </div>
      )}

      {/* DELIVY BRAND FOOTER */}
      <footer
        className={`border-t py-6 text-xs ${
          isDark
            ? 'border-neutral-800 bg-neutral-900/70 text-neutral-400'
            : 'border-neutral-200 bg-white text-neutral-600'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-white font-black flex items-center justify-center text-xs">
              D
            </span>
            <span className={`font-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Delivy
            </span>
            <span>• Aplicativo &amp; Plataforma Multi-Estabelecimentos de Delivery</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-500 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Pedido Seguro Direto com o Restaurante
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
