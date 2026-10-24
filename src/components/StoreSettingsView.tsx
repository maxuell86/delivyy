import React, { useState, useEffect, useMemo } from 'react';
import { 
  Store, 
  MapPin, 
  Clock, 
  Truck, 
  Zap, 
  Save, 
  Plus, 
  Trash2, 
  Check,
  Building2,
  Calendar,
  Search,
  Layers,
  Navigation,
  Power,
  RefreshCw,
  CheckCircle2,
  PauseCircle
} from 'lucide-react';
import { StoreConfig, DeliveryZone, NeighborhoodDeliveryFee } from '../types';

interface StoreSettingsViewProps {
  storeConfig: StoreConfig;
  onSaveConfig: (updated: StoreConfig) => void;
  showToast: (msg: string) => void;
}

const DIAS_SEMANA = [
  { id: '0', nome: 'Domingo' },
  { id: '1', nome: 'Segunda-feira' },
  { id: '2', nome: 'Terça-feira' },
  { id: '3', nome: 'Quarta-feira' },
  { id: '4', nome: 'Quinta-feira' },
  { id: '5', nome: 'Sexta-feira' },
  { id: '6', nome: 'Sábado' },
];

const DEFAULT_FAIXAS: DeliveryZone[] = [
  { nome: 'Região Próxima / Central', preco: 7, tempo: '20-30 min', bairros: ['Jd Buritis', 'Bela Vista', 'Centro', 'Tarumã'], ativo: true },
  { nome: 'Região Intermediária', preco: 10, tempo: '30-45 min', bairros: ['Vila Alta', 'Jardim dos Ipês', 'Morada do Sol'], ativo: true },
  { nome: 'Região Afastada', preco: 15, tempo: '45-60 min', bairros: ['Distrito Industrial', 'Zona Rural Próxima'], ativo: true },
];

function buildInitialTaxasBairros(config: StoreConfig, zones: DeliveryZone[]): NeighborhoodDeliveryFee[] {
  if (config.taxasBairros && Array.isArray(config.taxasBairros) && config.taxasBairros.length > 0) {
    return config.taxasBairros.map((item, idx) => ({
      id: item.id || `nb_${idx}_${Date.now()}`,
      bairro: item.bairro || '',
      regiao: item.regiao || 'Região Geral',
      preco: typeof item.preco === 'number' ? item.preco : Number(item.preco) || config.taxaEntregaPadrao || 7,
      tempo: item.tempo || config.tempoEntrega || '30-45 min',
      ativo: item.ativo !== false,
    }));
  }

  const derived: NeighborhoodDeliveryFee[] = [];
  const seen = new Set<string>();

  zones.forEach((zone, zIdx) => {
    const zoneActive = zone.ativo !== false;
    (zone.bairros || []).forEach((bName, bIdx) => {
      const clean = bName.trim();
      if (!clean) return;
      const key = clean.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);

      derived.push({
        id: `nb_${zIdx}_${bIdx}_${clean.replace(/\s+/g, '_').toLowerCase()}`,
        bairro: clean,
        regiao: zone.nome || 'Região Padrão',
        preco: Number(zone.preco) || config.taxaEntregaPadrao || 7,
        tempo: zone.tempo || config.tempoEntrega || '30-45 min',
        ativo: zoneActive,
      });
    });
  });

  return derived;
}

export const StoreSettingsView: React.FC<StoreSettingsViewProps> = ({
  storeConfig,
  onSaveConfig,
  showToast,
}) => {
  // Brand & Contact
  const [nome, setNome] = useState(storeConfig.nome);
  const [slogan, setSlogan] = useState(storeConfig.slogan);
  const [whatsapp, setWhatsapp] = useState(storeConfig.whatsapp);
  const [whatsappExibicao, setWhatsappExibicao] = useState(storeConfig.whatsappExibicao);
  
  // Address
  const [endereco, setEndereco] = useState(storeConfig.endereco);
  const [bairro, setBairro] = useState(storeConfig.bairro);
  const [cidade, setCidade] = useState(storeConfig.cidade);
  const [taxaEntregaPadrao, setTaxaEntregaPadrao] = useState(storeConfig.taxaEntregaPadrao.toString());
  const [tempoEntrega, setTempoEntrega] = useState(storeConfig.tempoEntrega);
  const [aberto, setAberto] = useState(storeConfig.aberto);

  // Delivery Zones (Regiões / Faixas)
  const initialZones = storeConfig.faixasEntrega && storeConfig.faixasEntrega.length > 0
    ? storeConfig.faixasEntrega.map((z) => ({ ...z, ativo: z.ativo !== false }))
    : DEFAULT_FAIXAS;

  const [faixas, setFaixas] = useState<DeliveryZone[]>(initialZones);

  // Individual Neighborhood Fees (Taxas por Bairro)
  const [taxasBairros, setTaxasBairros] = useState<NeighborhoodDeliveryFee[]>(() =>
    buildInitialTaxasBairros(storeConfig, initialZones)
  );

  // Delivery Manager UI Controls
  const [deliveryViewMode, setDeliveryViewMode] = useState<'bairros' | 'regioes'>('bairros');
  const [searchBairro, setSearchBairro] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativos' | 'pausados'>('todos');
  const [regiaoFilter, setRegiaoFilter] = useState<string>('todas');

  // New Neighborhood Quick-Add Form
  const [novoBairroNome, setNovoBairroNome] = useState('');
  const [novoBairroRegiao, setNovoBairroRegiao] = useState(initialZones[0]?.nome || 'Região Próxima / Central');
  const [novoBairroPreco, setNovoBairroPreco] = useState('7.00');
  const [novoBairroTempo, setNovoBairroTempo] = useState('25-35 min');

  // Quick-add neighborhood inside a specific region card
  const [novoBairroPorFaixa, setNovoBairroPorFaixa] = useState<{ [idx: number]: string }>({});

  // Happy Hour / Relâmpago
  const [hhAtivo, setHhAtivo] = useState(storeConfig.happyHour?.ativo ?? true);
  const [hhInicio, setHhInicio] = useState(storeConfig.happyHour?.inicio?.toString() || '18');
  const [hhFim, setHhFim] = useState(storeConfig.happyHour?.fim?.toString() || '19');
  const [hhDescontoPct, setHhDescontoPct] = useState(storeConfig.happyHour?.descontoPct?.toString() || '5');
  const [hhTexto, setHhTexto] = useState(storeConfig.happyHour?.texto || 'Happy Hour: 5% OFF por tempo limitado!');

  // Horários semanais
  const [horariosGrade, setHorariosGrade] = useState<{ [dia: string]: { abre: number; fecha: number } | null }>(
    storeConfig.horariosGrade || {
      '0': { abre: 18, fecha: 24 },
      '1': null, // Fechado às segundas
      '2': { abre: 18, fecha: 24 },
      '3': { abre: 18, fecha: 24 },
      '4': { abre: 18, fecha: 24 },
      '5': { abre: 18, fecha: 24 },
      '6': { abre: 18, fecha: 24 },
    }
  );

  // Sync local state when switching between stores
  useEffect(() => {
    setNome(storeConfig.nome);
    setSlogan(storeConfig.slogan);
    setWhatsapp(storeConfig.whatsapp);
    setWhatsappExibicao(storeConfig.whatsappExibicao);
    setEndereco(storeConfig.endereco);
    setBairro(storeConfig.bairro);
    setCidade(storeConfig.cidade);
    setTaxaEntregaPadrao(storeConfig.taxaEntregaPadrao.toString());
    setTempoEntrega(storeConfig.tempoEntrega);
    setAberto(storeConfig.aberto);

    const zones =
      storeConfig.faixasEntrega && storeConfig.faixasEntrega.length > 0
        ? storeConfig.faixasEntrega.map((z) => ({ ...z, ativo: z.ativo !== false }))
        : DEFAULT_FAIXAS;
    setFaixas(zones);
    setTaxasBairros(buildInitialTaxasBairros(storeConfig, zones));
    if (zones[0]?.nome) {
      setNovoBairroRegiao(zones[0].nome);
    }
  }, [storeConfig.id]);

  // Available region names for dropdowns
  const availableRegionNames = useMemo(() => {
    const names = new Set<string>();
    faixas.forEach((f) => {
      if (f.nome.trim()) names.add(f.nome.trim());
    });
    taxasBairros.forEach((b) => {
      if (b.regiao.trim()) names.add(b.regiao.trim());
    });
    if (names.size === 0) names.add('Região Geral');
    return Array.from(names);
  }, [faixas, taxasBairros]);

  // Delivery KPIs
  const deliveryStats = useMemo(() => {
    const total = taxasBairros.length;
    const ativos = taxasBairros.filter((b) => b.ativo).length;
    const pausados = total - ativos;
    const activePrices = taxasBairros.filter((b) => b.ativo).map((b) => b.preco);
    const minFee = activePrices.length > 0 ? Math.min(...activePrices) : parseFloat(taxaEntregaPadrao) || 0;
    const maxFee = activePrices.length > 0 ? Math.max(...activePrices) : parseFloat(taxaEntregaPadrao) || 0;
    return {
      total,
      ativos,
      pausados,
      regioesCount: faixas.length,
      minFee,
      maxFee,
    };
  }, [taxasBairros, faixas, taxaEntregaPadrao]);

  // Filtered neighborhoods for individual table
  const filteredBairros = useMemo(() => {
    return taxasBairros.filter((item) => {
      const matchesSearch =
        item.bairro.toLowerCase().includes(searchBairro.toLowerCase()) ||
        item.regiao.toLowerCase().includes(searchBairro.toLowerCase());
      const matchesStatus =
        statusFilter === 'todos'
          ? true
          : statusFilter === 'ativos'
          ? item.ativo
          : !item.ativo;
      const matchesRegiao =
        regiaoFilter === 'todas' ? true : item.regiao.toLowerCase() === regiaoFilter.toLowerCase();
      return matchesSearch && matchesStatus && matchesRegiao;
    });
  }, [taxasBairros, searchBairro, statusFilter, regiaoFilter]);

  // Add individual neighborhood
  const handleAddNeighborhood = () => {
    const cleanNome = novoBairroNome.trim();
    if (!cleanNome) {
      showToast('Informe o nome do bairro para adicionar.');
      return;
    }

    const exists = taxasBairros.some((b) => b.bairro.trim().toLowerCase() === cleanNome.toLowerCase());
    if (exists) {
      showToast(`O bairro "${cleanNome}" já está cadastrado na lista.`);
      return;
    }

    const parsedPreco = parseFloat(novoBairroPreco.replace(',', '.')) || 0;
    const cleanRegiao = novoBairroRegiao.trim() || 'Região Geral';
    const cleanTempo = novoBairroTempo.trim() || tempoEntrega || '30-45 min';

    const newEntry: NeighborhoodDeliveryFee = {
      id: `nb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      bairro: cleanNome,
      regiao: cleanRegiao,
      preco: parsedPreco,
      tempo: cleanTempo,
      ativo: true,
    };

    setTaxasBairros((prev) => [newEntry, ...prev]);

    // Also ensure region exists and includes this neighborhood
    setFaixas((prev) => {
      const regIdx = prev.findIndex((f) => f.nome.trim().toLowerCase() === cleanRegiao.toLowerCase());
      if (regIdx >= 0) {
        const updated = [...prev];
        if (!updated[regIdx].bairros.some((b) => b.toLowerCase() === cleanNome.toLowerCase())) {
          updated[regIdx] = {
            ...updated[regIdx],
            bairros: [...updated[regIdx].bairros, cleanNome],
          };
        }
        return updated;
      } else {
        return [
          ...prev,
          {
            nome: cleanRegiao,
            preco: parsedPreco,
            tempo: cleanTempo,
            bairros: [cleanNome],
            ativo: true,
          },
        ];
      }
    });

    setNovoBairroNome('');
    showToast(`Bairro "${cleanNome}" adicionado com taxa R$ ${parsedPreco.toFixed(2).replace('.', ',')}!`);
  };

  // When selecting a region in the quick-add bar, prefill its default price & time
  const handleSelectQuickAddRegiao = (regiaoNome: string) => {
    setNovoBairroRegiao(regiaoNome);
    const matchingZone = faixas.find((f) => f.nome.trim().toLowerCase() === regiaoNome.trim().toLowerCase());
    if (matchingZone) {
      setNovoBairroPreco(matchingZone.preco.toFixed(2));
      setNovoBairroTempo(matchingZone.tempo);
    }
  };

  const handleUpdateNeighborhood = (id: string, patch: Partial<NeighborhoodDeliveryFee>) => {
    setTaxasBairros((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const handleRemoveNeighborhood = (id: string) => {
    const target = taxasBairros.find((b) => b.id === id);
    setTaxasBairros((prev) => prev.filter((b) => b.id !== id));
    if (target) {
      setFaixas((prev) =>
        prev.map((f) => ({
          ...f,
          bairros: f.bairros.filter((b) => b.trim().toLowerCase() !== target.bairro.trim().toLowerCase()),
        }))
      );
    }
  };

  // Region / Zone handlers
  const handleAddFaixa = () => {
    const novaFaixaNome = `Região ${faixas.length + 1}`;
    setFaixas([
      ...faixas,
      { nome: novaFaixaNome, preco: 12, tempo: '35-50 min', bairros: [], ativo: true },
    ]);
  };

  const handleRemoveFaixa = (index: number) => {
    const removed = faixas[index];
    const list = [...faixas];
    list.splice(index, 1);
    setFaixas(list);
    if (removed) {
      showToast(`Região "${removed.nome}" removida.`);
    }
  };

  const handleApplyZoneToNeighborhoods = (faixa: DeliveryZone) => {
    const zoneBairrosSet = new Set(faixa.bairros.map((b) => b.trim().toLowerCase()).filter(Boolean));
    setTaxasBairros((prev) => {
      const updated = prev.map((item) => {
        if (
          item.regiao.trim().toLowerCase() === faixa.nome.trim().toLowerCase() ||
          zoneBairrosSet.has(item.bairro.trim().toLowerCase())
        ) {
          return {
            ...item,
            regiao: faixa.nome,
            preco: faixa.preco,
            tempo: faixa.tempo,
            ativo: faixa.ativo !== false,
          };
        }
        return item;
      });

      // Also add any neighborhoods listed in faixa.bairros that aren't in taxasBairros yet
      const existingNames = new Set(updated.map((u) => u.bairro.trim().toLowerCase()));
      const additions: NeighborhoodDeliveryFee[] = [];
      faixa.bairros.forEach((bName, idx) => {
        const clean = bName.trim();
        if (clean && !existingNames.has(clean.toLowerCase())) {
          existingNames.add(clean.toLowerCase());
          additions.push({
            id: `nb_sync_${Date.now()}_${idx}`,
            bairro: clean,
            regiao: faixa.nome,
            preco: faixa.preco,
            tempo: faixa.tempo,
            ativo: faixa.ativo !== false,
          });
        }
      });

      return [...updated, ...additions];
    });

    showToast(`Taxa R$ ${faixa.preco.toFixed(2).replace('.', ',')} e tempo (${faixa.tempo}) aplicados aos bairros da região "${faixa.nome}"!`);
  };

  const handleAddBairroToFaixa = (fIdx: number) => {
    const raw = (novoBairroPorFaixa[fIdx] || '').trim();
    if (!raw) return;

    const targetFaixa = faixas[fIdx];
    if (!targetFaixa) return;

    const newNames = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedFaixas = [...faixas];
    const currentBairros = [...updatedFaixas[fIdx].bairros];

    newNames.forEach((n) => {
      if (!currentBairros.some((b) => b.toLowerCase() === n.toLowerCase())) {
        currentBairros.push(n);
      }
    });

    updatedFaixas[fIdx] = { ...updatedFaixas[fIdx], bairros: currentBairros };
    setFaixas(updatedFaixas);

    // Also add or update in taxasBairros
    setTaxasBairros((prev) => {
      const next = [...prev];
      newNames.forEach((n, idx) => {
        const existingIdx = next.findIndex((b) => b.bairro.trim().toLowerCase() === n.toLowerCase());
        if (existingIdx >= 0) {
          next[existingIdx] = {
            ...next[existingIdx],
            regiao: targetFaixa.nome,
            preco: targetFaixa.preco,
            tempo: targetFaixa.tempo,
          };
        } else {
          next.unshift({
            id: `nb_zone_${Date.now()}_${idx}`,
            bairro: n,
            regiao: targetFaixa.nome,
            preco: targetFaixa.preco,
            tempo: targetFaixa.tempo,
            ativo: targetFaixa.ativo !== false,
          });
        }
      });
      return next;
    });

    setNovoBairroPorFaixa((prev) => ({ ...prev, [fIdx]: '' }));
    showToast(`${newNames.length > 1 ? 'Bairros adicionados' : `Bairro "${newNames[0]}" adicionado`} à região "${targetFaixa.nome}"!`);
  };

  const handleUpdateBairrosText = (index: number, text: string) => {
    const list = [...faixas];
    const parsedBairros = text.split('\n').map((s) => s.trim()).filter(Boolean);
    list[index] = { ...list[index], bairros: parsedBairros };
    setFaixas(list);
  };

  const handleToggleDiaAberto = (diaId: string) => {
    setHorariosGrade((prev) => {
      const atual = prev[diaId];
      return {
        ...prev,
        [diaId]: atual ? null : { abre: 18, fecha: 24 },
      };
    });
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();

    // Synchronize faixasEntrega with taxasBairros so both structures remain 100% consistent
    const syncedFaixas: DeliveryZone[] = faixas.map((f) => {
      const linkedBairros = taxasBairros
        .filter((b) => b.regiao.trim().toLowerCase() === f.nome.trim().toLowerCase())
        .map((b) => b.bairro.trim());
      const mergedBairros = Array.from(new Set([...f.bairros.map((b) => b.trim()).filter(Boolean), ...linkedBairros]));
      return {
        ...f,
        bairros: mergedBairros,
        ativo: f.ativo !== false,
      };
    });

    // Ensure any custom region assigned on a neighborhood also exists in syncedFaixas
    taxasBairros.forEach((b) => {
      const rName = b.regiao.trim() || 'Região Geral';
      const exists = syncedFaixas.some((f) => f.nome.trim().toLowerCase() === rName.toLowerCase());
      if (!exists) {
        syncedFaixas.push({
          nome: rName,
          preco: b.preco,
          tempo: b.tempo,
          bairros: [b.bairro.trim()],
          ativo: true,
        });
      }
    });

    const updated: StoreConfig = {
      ...storeConfig,
      nome: nome.trim(),
      slogan: slogan.trim(),
      whatsapp: whatsapp.replace(/\D/g, ''),
      whatsappExibicao: whatsappExibicao.trim(),
      endereco: endereco.trim(),
      bairro: bairro.trim(),
      cidade: cidade.trim(),
      taxaEntregaPadrao: parseFloat(taxaEntregaPadrao.replace(',', '.')) || 7.0,
      tempoEntrega: tempoEntrega.trim(),
      aberto,
      faixasEntrega: syncedFaixas,
      taxasBairros: taxasBairros.map((b) => ({
        ...b,
        bairro: b.bairro.trim(),
        regiao: b.regiao.trim() || 'Região Geral',
        preco: Number(b.preco) || 0,
        tempo: b.tempo.trim() || tempoEntrega.trim() || '30-45 min',
        ativo: b.ativo !== false,
      })),
      happyHour: {
        ativo: hhAtivo,
        inicio: parseInt(hhInicio) || 18,
        fim: parseInt(hhFim) || 19,
        descontoPct: parseFloat(hhDescontoPct) || 5,
        texto: hhTexto.trim(),
      },
      horariosGrade,
    };

    setFaixas(syncedFaixas);
    onSaveConfig(updated);
    showToast('Configurações da loja e taxas por bairro/região salvas com sucesso!');
  };

  return (
    <div className="max-w-5xl mx-auto py-4 space-y-6">
      {/* Top Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Store className="w-4 h-4" />
            <span>Painel do Estabelecimento</span>
          </div>
          <h2 className="text-2xl font-black text-white">
            Configurações da Loja, Horários &amp; Taxas de Entrega
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Defina taxas específicas por bairro ou por região/zona, tempo estimado e disponibilidade de entrega em tempo real.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-orange-500/25 transition active:scale-95 whitespace-nowrap"
        >
          <Save className="w-4 h-4" />
          <span>Salvar Alterações</span>
        </button>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        
        {/* SECTION 1: MARCA & CONTATO */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-neutral-800/80 pb-3">
            <Building2 className="w-4 h-4 text-orange-400" />
            <span>1. Dados da Empresa &amp; WhatsApp do Delivery</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-xs font-bold text-neutral-300 uppercase block mb-1.5">
                Nome Comercial da Loja *
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Max Hamburguer"
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white outline-none focus:border-orange-500 font-bold"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 uppercase block mb-1.5">
                Slogan / Especialidade
              </label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="Ex: Hambúrgueres Artesanais na Brasa"
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 uppercase block mb-1.5">
                WhatsApp que Recebe os Pedidos (só dígitos com DDI 55) *
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="5565996953036"
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white font-mono tabular-nums outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 uppercase block mb-1.5">
                WhatsApp Formatado para o Cliente Ver
              </label>
              <input
                type="text"
                value={whatsappExibicao}
                onChange={(e) => setWhatsappExibicao(e.target.value)}
                placeholder="(65) 99695-3036"
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white font-mono tabular-nums outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: ENDEREÇO & STATUS DE ABERTURA */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-400" />
              <span>2. Localização &amp; Taxa de Entrega Geral</span>
            </h3>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-300">
                {aberto ? 'Loja Aberta Agora' : 'Loja Fechada'}
              </span>
              <button
                type="button"
                onClick={() => setAberto(!aberto)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  aberto ? 'bg-emerald-500' : 'bg-neutral-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    aberto ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-neutral-300 uppercase block mb-1.5">
                Endereço Físico (Rua e Número)
              </label>
              <input
                type="text"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua B (Lot Bela Vista) Nº 378"
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 uppercase block mb-1.5">
                Bairro Sede
              </label>
              <input
                type="text"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                placeholder="Jd Buritis"
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 uppercase block mb-1.5">
                Cidade e Estado (UF)
              </label>
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Tangará da Serra (MT)"
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 uppercase block mb-1.5">
                Taxa de Entrega Padrão / Fallback (R$)
              </label>
              <input
                type="text"
                value={taxaEntregaPadrao}
                onChange={(e) => setTaxaEntregaPadrao(e.target.value)}
                placeholder="7.00"
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-emerald-400 font-mono tabular-nums font-bold outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 uppercase block mb-1.5">
                Tempo Médio Padrão
              </label>
              <input
                type="text"
                value={tempoEntrega}
                onChange={(e) => setTempoEntrega(e.target.value)}
                placeholder="35-50 min"
                className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white font-mono tabular-nums outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: GERENCIADOR HÍBRIDO DE TAXAS POR BAIRRO E REGIÃO/ZONA */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-5">
          {/* Header & Mode Switcher */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-orange-400" />
                <h3 className="text-base font-black text-white">
                  3. Taxas de Entrega por Bairro &amp; Região / Zona
                </h3>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Cadastre taxas individualmente por bairro ou agrupe por regiões. Bairros pausados ficam ocultos no checkout do cliente.
              </p>
            </div>

            {/* Segmented Mode Toggle */}
            <div className="inline-flex p-1 rounded-xl bg-neutral-950 border border-neutral-800 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setDeliveryViewMode('bairros')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
                  deliveryViewMode === 'bairros'
                    ? 'bg-orange-500 text-white shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Por Bairro ({taxasBairros.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryViewMode('regioes')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
                  deliveryViewMode === 'regioes'
                    ? 'bg-orange-500 text-white shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Por Região / Zona ({faixas.length})</span>
              </button>
            </div>
          </div>

          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block">
                Bairros Ativos
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-black text-emerald-400 font-mono tabular-nums">
                  {deliveryStats.ativos}
                </span>
                <span className="text-[11px] text-neutral-500 font-mono tabular-nums">
                  de {deliveryStats.total}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block">
                Bairros Pausados
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-black text-amber-400 font-mono tabular-nums">
                  {deliveryStats.pausados}
                </span>
                <span className="text-[11px] text-neutral-500">
                  {deliveryStats.pausados === 0 ? '100% liberados' : 'Entrega suspensa'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block">
                Regiões / Zonas
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-black text-white font-mono tabular-nums">
                  {deliveryStats.regioesCount}
                </span>
                <span className="text-[11px] text-neutral-500">Faixas configuradas</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block">
                Menor / Maior Taxa
              </span>
              <div className="mt-1 flex items-baseline gap-1.5 font-mono tabular-nums">
                <span className="text-base font-black text-emerald-400">
                  R$ {deliveryStats.minFee.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-neutral-600">—</span>
                <span className="text-base font-black text-orange-400">
                  R$ {deliveryStats.maxFee.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>

          {/* VIEW MODE 1: INDIVIDUAL BY NEIGHBORHOOD */}
          {deliveryViewMode === 'bairros' && (
            <div className="space-y-4">
              {/* Quick-Add Neighborhood Bar */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-orange-400" />
                    Cadastrar Novo Bairro Individualmente
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    Ao escolher uma região existente, a taxa e o tempo são sugeridos automaticamente
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs">
                  <div className="sm:col-span-4">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">
                      Nome do Bairro *
                    </label>
                    <input
                      type="text"
                      value={novoBairroNome}
                      onChange={(e) => setNovoBairroNome(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNeighborhood();
                        }
                      }}
                      placeholder="Ex: Jardim Europa"
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">
                      Região / Zona
                    </label>
                    <input
                      type="text"
                      list="store-regions-datalist"
                      value={novoBairroRegiao}
                      onChange={(e) => handleSelectQuickAddRegiao(e.target.value)}
                      placeholder="Ex: Região Central"
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white outline-none focus:border-orange-500"
                    />
                    <datalist id="store-regions-datalist">
                      {availableRegionNames.map((rName) => (
                        <option key={rName} value={rName} />
                      ))}
                    </datalist>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">
                      Taxa (R$)
                    </label>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      value={novoBairroPreco}
                      onChange={(e) => setNovoBairroPreco(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-emerald-400 font-mono tabular-nums font-bold outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="sm:col-span-3 flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">
                        Tempo Estimado
                      </label>
                      <input
                        type="text"
                        value={novoBairroTempo}
                        onChange={(e) => setNovoBairroTempo(e.target.value)}
                        placeholder="25-35 min"
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white font-mono tabular-nums outline-none focus:border-orange-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddNeighborhood}
                      className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition whitespace-nowrap h-[34px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchBairro}
                    onChange={(e) => setSearchBairro(e.target.value)}
                    placeholder="Buscar bairro ou região..."
                    className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={regiaoFilter}
                    onChange={(e) => setRegiaoFilter(e.target.value)}
                    className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 outline-none focus:border-orange-500"
                  >
                    <option value="todas">Todas as Regiões ({availableRegionNames.length})</option>
                    {availableRegionNames.map((rName) => (
                      <option key={rName} value={rName}>
                        {rName}
                      </option>
                    ))}
                  </select>

                  <div className="inline-flex p-0.5 rounded-xl bg-neutral-950 border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setStatusFilter('todos')}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                        statusFilter === 'todos' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Todos ({taxasBairros.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('ativos')}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                        statusFilter === 'ativos' ? 'bg-emerald-500/20 text-emerald-400' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Ativos ({deliveryStats.ativos})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('pausados')}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                        statusFilter === 'pausados' ? 'bg-amber-500/20 text-amber-400' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Pausados ({deliveryStats.pausados})
                    </button>
                  </div>
                </div>
              </div>

              {/* Neighborhoods Table */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden">
                <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-neutral-900/90 border-b border-neutral-800 text-[11px] uppercase tracking-wider text-neutral-400 sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3 font-bold">Bairro</th>
                        <th className="py-2.5 px-3 font-bold">Região / Zona</th>
                        <th className="py-2.5 px-3 font-bold">Taxa (R$)</th>
                        <th className="py-2.5 px-3 font-bold">Tempo Estimado</th>
                        <th className="py-2.5 px-3 font-bold text-center">Status de Entrega</th>
                        <th className="py-2.5 px-3 font-bold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/70">
                      {filteredBairros.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-neutral-500">
                            Nenhum bairro encontrado com os filtros selecionados.
                          </td>
                        </tr>
                      ) : (
                        filteredBairros.map((item) => (
                          <tr
                            key={item.id}
                            className={`transition hover:bg-neutral-900/50 ${
                              !item.ativo ? 'opacity-60 bg-neutral-950/60' : ''
                            }`}
                          >
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={item.bairro}
                                onChange={(e) =>
                                  handleUpdateNeighborhood(item.id, { bairro: e.target.value })
                                }
                                className="w-full min-w-[140px] px-2.5 py-1 bg-neutral-900 border border-neutral-800 focus:border-orange-500 rounded-lg text-white font-bold outline-none"
                              />
                            </td>

                            <td className="py-2 px-3">
                              <input
                                type="text"
                                list="store-regions-datalist"
                                value={item.regiao}
                                onChange={(e) =>
                                  handleUpdateNeighborhood(item.id, { regiao: e.target.value })
                                }
                                className="w-full min-w-[130px] px-2.5 py-1 bg-neutral-900 border border-neutral-800 focus:border-orange-500 rounded-lg text-neutral-300 outline-none"
                              />
                            </td>

                            <td className="py-2 px-3">
                              <div className="flex items-center gap-1">
                                <span className="text-neutral-500 font-mono">R$</span>
                                <input
                                  type="number"
                                  step="0.50"
                                  min="0"
                                  value={item.preco}
                                  onChange={(e) =>
                                    handleUpdateNeighborhood(item.id, {
                                      preco: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="w-20 px-2 py-1 bg-neutral-900 border border-neutral-800 focus:border-orange-500 rounded-lg text-emerald-400 font-mono tabular-nums font-bold outline-none"
                                />
                              </div>
                            </td>

                            <td className="py-2 px-3">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                                <input
                                  type="text"
                                  value={item.tempo}
                                  onChange={(e) =>
                                    handleUpdateNeighborhood(item.id, { tempo: e.target.value })
                                  }
                                  placeholder="25-35 min"
                                  className="w-28 px-2 py-1 bg-neutral-900 border border-neutral-800 focus:border-orange-500 rounded-lg text-white font-mono tabular-nums outline-none"
                                />
                              </div>
                            </td>

                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateNeighborhood(item.id, { ativo: !item.ativo })
                                }
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition whitespace-nowrap ${
                                  item.ativo
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                    : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white'
                                }`}
                                title={
                                  item.ativo
                                    ? 'Clique para pausar entregas neste bairro'
                                    : 'Clique para reativar entregas neste bairro'
                                }
                              >
                                {item.ativo ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Ativo</span>
                                  </>
                                ) : (
                                  <>
                                    <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Pausado</span>
                                  </>
                                )}
                              </button>
                            </td>

                            <td className="py-2 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveNeighborhood(item.id)}
                                className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-900 transition"
                                title="Excluir bairro"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: BY REGION / ZONE */}
          {deliveryViewMode === 'regioes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-400">
                  Agrupe bairros por faixa ou zona geográfica e aplique preços e prazos em lote para todos os bairros da região.
                </p>
                <button
                  type="button"
                  onClick={handleAddFaixa}
                  className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-neutral-700 transition whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5 text-orange-400" />
                  <span>Nova Região / Zona</span>
                </button>
              </div>

              <div className="space-y-4">
                {faixas.map((faixa, fIdx) => {
                  const zoneActive = faixa.ativo !== false;
                  return (
                    <div
                      key={fIdx}
                      className={`p-4 rounded-xl bg-neutral-950 border transition space-y-3.5 ${
                        zoneActive ? 'border-neutral-800' : 'border-neutral-800/50 opacity-70'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <input
                            type="text"
                            value={faixa.nome}
                            onChange={(e) => {
                              const oldName = faixa.nome;
                              const newName = e.target.value;
                              const list = [...faixas];
                              list[fIdx] = { ...list[fIdx], nome: newName };
                              setFaixas(list);
                              setTaxasBairros((prev) =>
                                prev.map((b) =>
                                  b.regiao.trim().toLowerCase() === oldName.trim().toLowerCase()
                                    ? { ...b, regiao: newName }
                                    : b
                                )
                              );
                            }}
                            placeholder="Nome da Região"
                            className="px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs font-bold text-white outline-none focus:border-orange-500"
                          />

                          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1">
                            <span className="text-xs text-neutral-400 font-mono">Taxa R$</span>
                            <input
                              type="number"
                              step="0.50"
                              min="0"
                              value={faixa.preco}
                              onChange={(e) => {
                                const list = [...faixas];
                                list[fIdx] = {
                                  ...list[fIdx],
                                  preco: parseFloat(e.target.value) || 0,
                                };
                                setFaixas(list);
                              }}
                              className="w-16 bg-transparent text-xs font-mono tabular-nums font-bold text-emerald-400 outline-none"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1">
                            <Clock className="w-3.5 h-3.5 text-neutral-500" />
                            <input
                              type="text"
                              value={faixa.tempo}
                              onChange={(e) => {
                                const list = [...faixas];
                                list[fIdx] = { ...list[fIdx], tempo: e.target.value };
                                setFaixas(list);
                              }}
                              placeholder="Ex: 20-30 min"
                              className="w-24 bg-transparent text-xs font-mono tabular-nums text-white outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const list = [...faixas];
                              const nextActive = !zoneActive;
                              list[fIdx] = { ...list[fIdx], ativo: nextActive };
                              setFaixas(list);
                              setTaxasBairros((prev) =>
                                prev.map((b) =>
                                  b.regiao.trim().toLowerCase() === faixa.nome.trim().toLowerCase()
                                    ? { ...b, ativo: nextActive }
                                    : b
                                )
                              );
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 transition whitespace-nowrap ${
                              zoneActive
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-neutral-900 border-neutral-700 text-neutral-400'
                            }`}
                          >
                            <Power className="w-3 h-3" />
                            <span>{zoneActive ? 'Região Ativa' : 'Região Pausada'}</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleApplyZoneToNeighborhoods(faixa)}
                            className="px-2.5 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-300 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition whitespace-nowrap"
                            title="Atualizar todos os bairros desta região com esta taxa e tempo estimado"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Aplicar aos Bairros da Região</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveFaixa(fIdx)}
                            className="text-neutral-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-neutral-900 transition"
                            title="Remover região"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Quick add neighborhood inside this region */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={novoBairroPorFaixa[fIdx] || ''}
                          onChange={(e) =>
                            setNovoBairroPorFaixa((prev) => ({ ...prev, [fIdx]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddBairroToFaixa(fIdx);
                            }
                          }}
                          placeholder="Adicionar bairro(s) nesta região (separe por vírgula)..."
                          className="flex-1 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white outline-none focus:border-orange-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddBairroToFaixa(fIdx)}
                          className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition whitespace-nowrap"
                        >
                          <Plus className="w-3.5 h-3.5 text-orange-400" />
                          <span>Incluir na Região</span>
                        </button>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-neutral-400 block mb-1">
                          Bairros inclusos nesta faixa (um por linha):
                        </label>
                        <textarea
                          rows={2}
                          value={faixa.bairros.join('\n')}
                          onChange={(e) => handleUpdateBairrosText(fIdx, e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 text-xs outline-none focus:border-orange-500"
                          placeholder="Bairro 1&#10;Bairro 2&#10;Bairro 3"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: HORÁRIOS SEMANAIS & HAPPY HOUR */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-base font-black text-white flex items-center gap-2 border-b border-neutral-800/80 pb-3">
            <Calendar className="w-4 h-4 text-orange-400" />
            <span>4. Grade Semanal de Horários &amp; Promoção Relâmpago</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Days grid */}
            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-neutral-300 block mb-2">Funcionamento por Dia da Semana:</span>
              {DIAS_SEMANA.map((dia) => {
                const j = horariosGrade[dia.id];
                const isAberto = j !== null && j !== undefined;
                return (
                  <div
                    key={dia.id}
                    className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleDiaAberto(dia.id)}
                      className="flex items-center gap-2 font-bold text-white hover:text-orange-400"
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                          isAberto ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-neutral-700'
                        }`}
                      >
                        {isAberto && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span>{dia.nome}</span>
                    </button>

                    {isAberto ? (
                      <span className="text-[11px] text-emerald-400 font-mono tabular-nums font-bold">
                        {j.abre}h às {j.fecha === 24 ? '00h' : `${j.fecha}h`}
                      </span>
                    ) : (
                      <span className="text-[11px] text-neutral-500 italic">Fechado</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Happy hour box */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Promoção Relâmpago / Happy Hour
                </span>
                <button
                  type="button"
                  onClick={() => setHhAtivo(!hhAtivo)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    hhAtivo ? 'bg-amber-500' : 'bg-neutral-700'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      hhAtivo ? 'translate-x-4' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {hhAtivo && (
                <div className="space-y-2.5 pt-1">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">Início</label>
                      <input
                        type="number"
                        value={hhInicio}
                        onChange={(e) => setHhInicio(e.target.value)}
                        className="w-full px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs font-mono tabular-nums text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">Fim</label>
                      <input
                        type="number"
                        value={hhFim}
                        onChange={(e) => setHhFim(e.target.value)}
                        className="w-full px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs font-mono tabular-nums text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">Desconto</label>
                      <div className="flex items-center gap-0.5">
                        <input
                          type="number"
                          value={hhDescontoPct}
                          onChange={(e) => setHhDescontoPct(e.target.value)}
                          className="w-full px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs font-mono tabular-nums text-amber-400 font-bold"
                        />
                        <span className="text-neutral-400 text-[10px]">%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">Texto do Banner</label>
                    <input
                      type="text"
                      value={hhTexto}
                      onChange={(e) => setHhTexto(e.target.value)}
                      className="w-full px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Save button footer */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-sm font-black flex items-center gap-2 shadow-lg shadow-orange-500/25 transition active:scale-95 whitespace-nowrap"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Todas as Configurações da Loja</span>
          </button>
        </div>
      </form>
    </div>
  );
};
