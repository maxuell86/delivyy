import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Image as ImageIcon, 
  Layers, 
  Plus, 
  Trash2, 
  Save, 
  Clock, 
  Tag, 
  Check,
  CheckCircle2
} from 'lucide-react';
import { Product, CategoryId, ProductOptionGroup, SegmentId } from '../types';
import { CATEGORIAS_POR_SEGMENTO, PRESETS_OPCIONAIS, SEGMENTOS_DISPONIVEIS } from '../data/segmentData';
import { BANCO_FOTOS_SUGERIDAS } from '../data/initialProducts';

interface ProductModalProps {
  isOpen: boolean;
  currentSegment: SegmentId;
  product: Product | null;
  onClose: () => void;
  onSave: (product: Product) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  currentSegment,
  product,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'dados' | 'foto' | 'opcoes'>('dados');

  const segmentConfig = SEGMENTOS_DISPONIVEIS.find((s) => s.id === currentSegment) || SEGMENTOS_DISPONIVEIS[0];
  const categoriasDoSegmento = CATEGORIAS_POR_SEGMENTO[currentSegment] || CATEGORIAS_POR_SEGMENTO.hamburgueria;

  // Form states
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<CategoryId>(categoriasDoSegmento[0]?.id || 'padrao');
  const [preco, setPreco] = useState('');
  const [precoPromocional, setPrecoPromocional] = useState('');
  const [descricao, setDescricao] = useState('');
  const [foto, setFoto] = useState('');
  const [selo, setSelo] = useState('');
  const [tempoPreparoMin, setTempoPreparoMin] = useState('20');
  const [unidadeMedida, setUnidadeMedida] = useState('unidade');
  const [disponivel, setDisponivel] = useState(true);
  const [destaque, setDestaque] = useState(false);
  const [permiteMeioAMeio, setPermiteMeioAMeio] = useState(false);
  const [opcoes, setOpcoes] = useState<ProductOptionGroup[]>([]);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (product) {
      setNome(product.nome);
      setCategoria(product.categoria);
      setPreco(product.preco.toString());
      setPrecoPromocional(product.precoPromocional ? product.precoPromocional.toString() : '');
      setDescricao(product.descricao);
      setFoto(product.foto);
      setSelo(product.selo || '');
      setTempoPreparoMin(product.tempoPreparoMin ? product.tempoPreparoMin.toString() : '20');
      setUnidadeMedida(product.unidadeMedida || 'unidade');
      setDisponivel(product.disponivel);
      setDestaque(!!product.destaque);
      setPermiteMeioAMeio(!!product.permiteMeioAMeio);
      setOpcoes(product.opcoes ? JSON.parse(JSON.stringify(product.opcoes)) : []);
    } else {
      // New Product Defaults based on active segment
      setNome('');
      setCategoria(categoriasDoSegmento[0]?.id || 'padrao');
      setPreco('');
      setPrecoPromocional('');
      setDescricao('');
      setFoto(BANCO_FOTOS_SUGERIDAS[0]?.url || '');
      setSelo('');
      setTempoPreparoMin('20');
      setUnidadeMedida(currentSegment === 'confeitaria' ? 'kg' : 'unidade');
      setDisponivel(true);
      setDestaque(false);
      setPermiteMeioAMeio(currentSegment === 'pizzaria');

      // Load default options from segment preset
      const preset = PRESETS_OPCIONAIS[currentSegment];
      if (preset && preset.length > 0) {
        setOpcoes(JSON.parse(JSON.stringify(preset)));
      } else {
        setOpcoes([]);
      }
    }
    setActiveTab('dados');
    setErro('');
  }, [product, isOpen, currentSegment]);

  if (!isOpen) return null;

  // AI-like text generator adapted to the business niche
  const handleGenerateDescription = () => {
    if (!nome.trim()) {
      setErro('Digite o nome do item primeiro para gerar a descrição!');
      return;
    }

    const n = nome.toLowerCase();
    let desc = '';

    if (currentSegment === 'pizzaria') {
      desc = `Massa artesanal de fermentação lenta aberta na hora, molho de tomate pelati italiano fresco, mussarela especial gratinada, orégano aromático e azeitonas pretas assadas no forno a lenha.`;
    } else if (currentSegment === 'hamburgueria') {
      desc = `Pão brioche selado na manteiga, blend bovino artesanal grelhado na brasa suculento, queijo derretido no ponto perfeito e molho especial da casa.`;
    } else if (currentSegment === 'restaurante') {
      desc = `Refeição completa e saborosa preparada com ingredientes frescos do dia: arroz soltinho, feijão temperado com alho e louro, proteína suculenta e guarnições caprichadas.`;
    } else if (currentSegment === 'confeitaria') {
      desc = `Massa artesanal fofinha e aveludada, recheio generoso preparado com ingredientes nobres, cobertura delicada e acabamento impecável.`;
    } else if (currentSegment === 'padaria') {
      desc = `Produzido artesanalmente todos os dias com ingredientes de primeira linha, fresquinho, quentinho e com aroma inconfundível.`;
    } else if (currentSegment === 'acaiteria') {
      desc = `Açaí puro de altíssima qualidade, textura ultra cremosa, batido no ponto ideal e acompanhado das melhores frutas frescas e complementos.`;
    } else if (currentSegment === 'japones') {
      desc = `Peixe fresco selecionado cortado com precisão artesanal, arroz temperado com vinagre de arroz suave, cream cheese e toque especial do chef.`;
    } else {
      desc = `Item especial preparado com receitas exclusivas e os melhores ingredientes para proporcionar uma experiência gastronômica inesquecível.`;
    }

    setDescricao(desc);
    setErro('');
  };

  // Load niche default presets
  const handleLoadSegmentPreset = () => {
    const preset = PRESETS_OPCIONAIS[currentSegment];
    if (preset) {
      setOpcoes(JSON.parse(JSON.stringify(preset)));
    }
  };

  // Add new custom option group
  const handleAddGroup = () => {
    const newGroup: ProductOptionGroup = {
      id: 'grupo_' + Date.now(),
      titulo: 'Novo Grupo de Opções',
      tipo: 'multiplo',
      obrigatorio: false,
      itens: [
        { id: 'item_' + Date.now(), nome: 'Opção 1', preco: 0 },
      ],
    };
    setOpcoes([...opcoes, newGroup]);
  };

  const handleRemoveGroup = (index: number) => {
    const list = [...opcoes];
    list.splice(index, 1);
    setOpcoes(list);
  };

  const handleAddItemToGroup = (groupIndex: number) => {
    const list = [...opcoes];
    list[groupIndex].itens.push({
      id: 'item_' + Date.now() + Math.random().toString(36).substr(2, 4),
      nome: 'Novo adicional',
      preco: 0,
    });
    setOpcoes(list);
  };

  const handleRemoveItemFromGroup = (groupIndex: number, itemIndex: number) => {
    const list = [...opcoes];
    list[groupIndex].itens.splice(itemIndex, 1);
    setOpcoes(list);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      setErro('Por favor, informe o nome do produto.');
      setActiveTab('dados');
      return;
    }

    const precoNum = parseFloat(preco.replace(',', '.'));
    if (isNaN(precoNum) || precoNum <= 0) {
      setErro('Por favor, informe um preço de venda válido.');
      setActiveTab('dados');
      return;
    }

    const precoPromoNum = precoPromocional ? parseFloat(precoPromocional.replace(',', '.')) : undefined;

    const savedProduct: Product = {
      id: product?.id || 'prod_' + Date.now(),
      nome: nome.trim(),
      categoria,
      segmento: currentSegment,
      preco: precoNum,
      precoPromocional: precoPromoNum,
      descricao: descricao.trim() || `${segmentConfig.termoProduto} preparado com ingredientes selecionados.`,
      foto: foto.trim() || BANCO_FOTOS_SUGERIDAS[0].url,
      disponivel,
      destaque,
      selo: selo.trim() || undefined,
      tempoPreparoMin: parseInt(tempoPreparoMin) || 20,
      unidadeMedida,
      permiteMeioAMeio: currentSegment === 'pizzaria' ? permiteMeioAMeio : undefined,
      opcoes,
      atualizadoEm: new Date().toISOString(),
    };

    onSave(savedProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-black">
              {segmentConfig.icone}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {product ? `Editar ${segmentConfig.termoProduto}` : `Cadastrar ${segmentConfig.termoProduto}`}
              </h2>
              <p className="text-xs text-neutral-400">
                Segmento ativo: <b className="text-orange-400">{segmentConfig.nome}</b>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-neutral-800 flex gap-2 bg-neutral-950/40">
          <button
            type="button"
            onClick={() => setActiveTab('dados')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'dados'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>1. Informações Básicas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('foto')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'foto'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>2. Foto do Item</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('opcoes')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'opcoes'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>3. Complementos &amp; Opcionais ({opcoes.length})</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {erro && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              {erro}
            </div>
          )}

          {/* TAB 1: DADOS BÁSICOS */}
          {activeTab === 'dados' && (
            <div className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Nome do Item / Produto *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder={`Ex: ${
                    currentSegment === 'pizzaria'
                      ? 'Pizza Calabresa Especial com Cebola Roxa'
                      : currentSegment === 'confeitaria'
                      ? 'Bolo Ninho com Morangos Frescos'
                      : currentSegment === 'restaurante'
                      ? 'Almoço Executivo Bife Acebolado'
                      : 'Burger Cheddar & Bacon Especial'
                  }`}
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 focus:border-orange-500 rounded-xl text-white text-sm outline-none transition"
                  required
                />
              </div>

              {/* Category Picker based on current segment */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Categoria no Cardápio de {segmentConfig.nome} *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categoriasDoSegmento.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoria(cat.id)}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 text-xs font-bold ${
                        categoria === cat.id
                          ? 'border-orange-500 bg-orange-500/10 text-orange-300 shadow-sm'
                          : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <span className="text-base">{cat.icone}</span>
                      <span className="truncate">{cat.nome}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Preço de Venda (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-neutral-400 text-sm font-bold">R$</span>
                    <input
                      type="text"
                      value={preco}
                      onChange={(e) => setPreco(e.target.value)}
                      placeholder="35.00"
                      className="w-full pl-10 pr-3 py-2.5 bg-neutral-950 border border-neutral-700 focus:border-orange-500 rounded-xl text-white text-sm font-bold outline-none transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Preço Promo / De (Opcional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-neutral-400 text-sm font-bold">R$</span>
                    <input
                      type="text"
                      value={precoPromocional}
                      onChange={(e) => setPrecoPromocional(e.target.value)}
                      placeholder="42.00"
                      className="w-full pl-10 pr-3 py-2.5 bg-neutral-950 border border-neutral-800 focus:border-orange-500 rounded-xl text-neutral-300 text-sm outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-orange-400" />
                    Tempo Estimado
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={tempoPreparoMin}
                      onChange={(e) => setTempoPreparoMin(e.target.value)}
                      placeholder="20"
                      className="w-full pl-3 pr-12 py-2.5 bg-neutral-950 border border-neutral-700 focus:border-orange-500 rounded-xl text-white text-sm outline-none transition"
                    />
                    <span className="absolute right-3 top-2.5 text-neutral-400 text-xs font-bold">min</span>
                  </div>
                </div>
              </div>

              {/* Pizza specific: Meio a meio */}
              {currentSegment === 'pizzaria' && (
                <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-800/40 space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white">
                    <input
                      type="checkbox"
                      checked={permiteMeioAMeio}
                      onChange={(e) => setPermiteMeioAMeio(e.target.checked)}
                      className="w-4 h-4 rounded text-orange-500 focus:ring-0 bg-neutral-950 border-neutral-700"
                    />
                    <span>🍕 Permitir que este sabor seja dividido em Pizza Meio a Meio</span>
                  </label>
                  <p className="text-[11px] text-neutral-400 pl-6">
                    Quando ativado, os clientes poderão combinar esta pizza com outro sabor no app de delivery.
                  </p>
                </div>
              )}

              {/* Tag / Selo and Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Selo de Destaque Visual (Opcional)
                  </label>
                  <input
                    type="text"
                    value={selo}
                    onChange={(e) => setSelo(e.target.value)}
                    placeholder="Ex: Mais Pedido, Artesanal, Novidade, Especial"
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 focus:border-orange-500 rounded-xl text-white text-sm outline-none transition"
                  />
                </div>

                <div className="flex items-center gap-4 pt-4 sm:pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-neutral-300">
                    <input
                      type="checkbox"
                      checked={disponivel}
                      onChange={(e) => setDisponivel(e.target.checked)}
                      className="w-4 h-4 rounded text-orange-500 focus:ring-0 bg-neutral-950 border-neutral-700"
                    />
                    <span>Disponível Hoje</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-amber-400">
                    <input
                      type="checkbox"
                      checked={destaque}
                      onChange={(e) => setDestaque(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-neutral-950 border-neutral-700"
                    />
                    <span>Destaque no Topo ⭐</span>
                  </label>
                </div>
              </div>

              {/* Description & AI Generator */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                    Descrição do Item
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 bg-orange-500/10 hover:bg-orange-500/20 px-2.5 py-1 rounded-lg border border-orange-500/30 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Gerar Descrição Atraente
                  </button>
                </div>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                  placeholder="Descreva os ingredientes de forma apetitosa para despertar o desejo do cliente..."
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 focus:border-orange-500 rounded-xl text-white text-sm outline-none transition resize-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 2: FOTO DO PRODUTO */}
          {activeTab === 'foto' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Link Direto da Imagem (URL)
                </label>
                <input
                  type="text"
                  value={foto}
                  onChange={(e) => setFoto(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 focus:border-orange-500 rounded-xl text-white text-sm outline-none transition"
                />
              </div>

              {/* Current Preview */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                <div className="w-24 h-20 rounded-lg overflow-hidden bg-neutral-900 border border-neutral-700 flex-shrink-0">
                  <img
                    src={foto}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = BANCO_FOTOS_SUGERIDAS[0].url;
                    }}
                  />
                </div>
                <div className="text-xs text-neutral-400">
                  <p className="font-bold text-neutral-200">Prévia da Foto Atual</p>
                  <p>Fotos atraentes aumentam as vendas em qualquer delivery.</p>
                </div>
              </div>

              {/* Preset Photos Bank */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                  Ou escolha uma Foto de Alta Resolução da Galeria:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1">
                  {BANCO_FOTOS_SUGERIDAS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFoto(item.url)}
                      className={`group relative aspect-[4/3] rounded-xl overflow-hidden border transition text-left ${
                        foto === item.url
                          ? 'border-orange-500 ring-2 ring-orange-500'
                          : 'border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <img
                        src={item.url}
                        alt={item.nome}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                        <span className="text-[10px] font-bold text-white leading-tight truncate">
                          {item.nome}
                        </span>
                      </div>
                      {foto === item.url && (
                        <div className="absolute top-1 right-1 p-0.5 bg-orange-500 rounded-full text-white">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMPLEMENTOS & OPCIONAIS */}
          {activeTab === 'opcoes' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs">
                <div>
                  <span className="font-bold text-orange-400 block">
                    Complementos Sugeridos para {segmentConfig.nome}:
                  </span>
                  <span className="text-neutral-400">
                    Defina tamanhos, bordas, adicionais pagos ou escolhas obrigatórias.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLoadSegmentPreset}
                  className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg font-bold text-xs transition border border-neutral-700"
                >
                  Restaurar Presets do Nicho
                </button>
              </div>

              {/* Option Groups List */}
              <div className="space-y-4">
                {opcoes.map((grupo, gIdx) => (
                  <div
                    key={grupo.id}
                    className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3"
                  >
                    {/* Group Header */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-neutral-800/80">
                      <div className="flex-1 flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={grupo.titulo}
                          onChange={(e) => {
                            const list = [...opcoes];
                            list[gIdx].titulo = e.target.value;
                            setOpcoes(list);
                          }}
                          className="font-bold text-sm bg-neutral-900 border border-neutral-700 px-2 py-1 rounded text-white outline-none focus:border-orange-500 flex-1 min-w-[160px]"
                        />

                        {/* Group Type Selector */}
                        <select
                          value={grupo.tipo}
                          onChange={(e) => {
                            const list = [...opcoes];
                            list[gIdx].tipo = e.target.value as 'unico' | 'multiplo';
                            setOpcoes(list);
                          }}
                          className="text-xs bg-neutral-900 border border-neutral-700 text-neutral-300 rounded px-2 py-1 outline-none"
                        >
                          <option value="unico">Escolha Única (Ex: Tamanho / Ponto / Massa)</option>
                          <option value="multiplo">Múltipla Escolha (Ex: Adicionais / Bordas)</option>
                        </select>

                        {/* Mandatory toggle */}
                        <label className="flex items-center gap-1 text-xs text-neutral-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={grupo.obrigatorio}
                            onChange={(e) => {
                              const list = [...opcoes];
                              list[gIdx].obrigatorio = e.target.checked;
                              setOpcoes(list);
                            }}
                            className="rounded bg-neutral-800 text-orange-500 focus:ring-0"
                          />
                          <span>Obrigatório</span>
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveGroup(gIdx)}
                        className="text-neutral-500 hover:text-red-400 p-1 transition"
                        title="Remover grupo de opções"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Items inside this group */}
                    <div className="space-y-2">
                      {grupo.itens.map((item, iIdx) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item.nome}
                            onChange={(e) => {
                              const list = [...opcoes];
                              list[gIdx].itens[iIdx].nome = e.target.value;
                              setOpcoes(list);
                            }}
                            placeholder="Nome do opcional"
                            className="flex-1 px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 text-white rounded-lg text-xs outline-none focus:border-orange-500"
                          />

                          <div className="flex items-center gap-1 w-28">
                            <span className="text-xs text-neutral-500">+R$</span>
                            <input
                              type="number"
                              step="0.5"
                              value={item.preco}
                              onChange={(e) => {
                                const list = [...opcoes];
                                list[gIdx].itens[iIdx].preco = parseFloat(e.target.value) || 0;
                                setOpcoes(list);
                              }}
                              className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-800 text-emerald-400 font-bold rounded-lg text-xs outline-none focus:border-orange-500"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromGroup(gIdx, iIdx)}
                            className="text-neutral-500 hover:text-red-400 p-1"
                            title="Remover item"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => handleAddItemToGroup(gIdx)}
                        className="text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 pt-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Adicionar Item neste grupo
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddGroup}
                  className="w-full py-3 rounded-xl border border-dashed border-neutral-700 hover:border-orange-500 text-neutral-400 hover:text-orange-400 font-bold text-xs flex items-center justify-center gap-2 transition bg-neutral-950/40"
                >
                  <Plus className="w-4 h-4" />
                  Criar Novo Grupo de Opcionais Personalizado
                </button>
              </div>
            </div>
          )}

          {/* Modal Actions Footer */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-neutral-700 text-neutral-300 text-xs sm:text-sm font-semibold hover:bg-neutral-800 transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-orange-500/25 transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Salvar no Cardápio</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
