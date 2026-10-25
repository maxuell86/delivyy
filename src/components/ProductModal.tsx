import React, { useState, useEffect, useRef } from 'react';
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
  Upload,
  FileText,
  Scale,
  Users,
  Calendar,
  AlertCircle,
  DollarSign,
  FolderPlus,
} from 'lucide-react';
import { Product, CategoryId, CategoryInfo, ProductOptionGroup, SegmentId } from '../types';
import { CATEGORIAS_POR_SEGMENTO, PRESETS_OPCIONAIS, SEGMENTOS_DISPONIVEIS } from '../data/segmentData';
import { BANCO_FOTOS_SUGERIDAS } from '../data/initialProducts';

interface ProductModalProps {
  isOpen: boolean;
  currentSegment: SegmentId;
  product: Product | null;
  customCategories?: CategoryInfo[];
  onUpdateCustomCategories?: (categories: CategoryInfo[]) => void;
  onClose: () => void;
  onSave: (product: Product) => void;
}

const DIAS_SEMANA = [
  { id: 'seg', label: 'Seg', full: 'Segunda' },
  { id: 'ter', label: 'Ter', full: 'Terça' },
  { id: 'qua', label: 'Qua', full: 'Quarta' },
  { id: 'qui', label: 'Qui', full: 'Quinta' },
  { id: 'sex', label: 'Sex', full: 'Sexta' },
  { id: 'sab', label: 'Sáb', full: 'Sábado' },
  { id: 'dom', label: 'Dom', full: 'Domingo' },
];

const ALERGENOS_PADRAO = [
  'Contém Glúten',
  'Contém Lactose',
  'Zero Lactose',
  'Sem Glúten',
  'Vegetariano',
  'Vegano',
  'Levemente Picante',
  'Picante Intenso',
  'Sem Açúcar',
  'Contém Castanhas',
  '100% Artesanal',
  'Orgânico',
];

const PORCOES_SUGERIDAS = [
  'Individual (1 pessoa)',
  'Serve 2 pessoas',
  'Serve 3 a 4 pessoas',
  'Tamanho Família',
];

const ICONES_CATEGORIA = ['🍔', '🍕', '🍟', '🥤', '🍰', '🍣', '🥗', '🥩', '🍺', '🍨', '🥟', '🌮', '🥐', '🍱', '🔥', '⭐'];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  currentSegment,
  product,
  customCategories = [],
  onUpdateCustomCategories,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'dados' | 'ficha' | 'foto' | 'opcoes'>('dados');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const segmentConfig = SEGMENTOS_DISPONIVEIS.find((s) => s.id === currentSegment) || SEGMENTOS_DISPONIVEIS[0];
  const categoriasBase = CATEGORIAS_POR_SEGMENTO[currentSegment] || CATEGORIAS_POR_SEGMENTO.hamburgueria;

  // Merge base segment categories with custom categories created by the store manager
  const todasCategorias: CategoryInfo[] = React.useMemo(() => {
    const map = new Map<string, CategoryInfo>();
    categoriasBase.forEach((c) => map.set(c.id, c));
    customCategories.forEach((c) => map.set(c.id, c));
    return Array.from(map.values());
  }, [categoriasBase, customCategories]);

  // Basic data states
  const [nome, setNome] = useState('');
  const [codigoPdv, setCodigoPdv] = useState('');
  const [categoria, setCategoria] = useState<CategoryId>(todasCategorias[0]?.id || 'padrao');
  const [preco, setPreco] = useState('');
  const [precoPromocional, setPrecoPromocional] = useState('');
  const [custoUnitario, setCustoUnitario] = useState('');
  const [descricao, setDescricao] = useState('');
  const [foto, setFoto] = useState('');
  const [selo, setSelo] = useState('');
  const [tempoPreparoMin, setTempoPreparoMin] = useState('20');
  const [unidadeMedida, setUnidadeMedida] = useState('unidade');
  const [disponivel, setDisponivel] = useState(true);
  const [destaque, setDestaque] = useState(false);
  const [permiteMeioAMeio, setPermiteMeioAMeio] = useState(false);

  // Technical sheet, stock & days states
  const [pesoGramas, setPesoGramas] = useState('');
  const [porcaoPessoas, setPorcaoPessoas] = useState('Individual (1 pessoa)');
  const [alergenos, setAlergenos] = useState<string[]>([]);
  const [diasDisponiveis, setDiasDisponiveis] = useState<string[]>(DIAS_SEMANA.map((d) => d.id));
  const [controlarEstoque, setControlarEstoque] = useState(true);
  const [estoqueAtual, setEstoqueAtual] = useState('25');
  const [estoqueMinimo, setEstoqueMinimo] = useState('5');

  // Custom Category inline creator state
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [novaCatNome, setNovaCatNome] = useState('');
  const [novaCatIcone, setNovaCatIcone] = useState('🍔');

  // Photo Upload states
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Options states
  const [opcoes, setOpcoes] = useState<ProductOptionGroup[]>([]);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (product) {
      setNome(product.nome);
      setCodigoPdv(product.codigoPdv || '');
      setCategoria(product.categoria);
      setPreco(product.preco.toString());
      setPrecoPromocional(product.precoPromocional ? product.precoPromocional.toString() : '');
      setCustoUnitario(product.custoUnitario ? product.custoUnitario.toString() : '');
      setDescricao(product.descricao);
      setFoto(product.foto);
      setSelo(product.selo || '');
      setTempoPreparoMin(product.tempoPreparoMin ? product.tempoPreparoMin.toString() : '20');
      setUnidadeMedida(product.unidadeMedida || 'unidade');
      setDisponivel(product.disponivel);
      setDestaque(!!product.destaque);
      setPermiteMeioAMeio(!!product.permiteMeioAMeio);
      setPesoGramas(product.pesoGramas || '');
      setPorcaoPessoas(product.porcaoPessoas || 'Individual (1 pessoa)');
      setAlergenos(product.alergenos ? [...product.alergenos] : []);
      setDiasDisponiveis(
        product.diasDisponiveis && product.diasDisponiveis.length > 0
          ? [...product.diasDisponiveis]
          : DIAS_SEMANA.map((d) => d.id)
      );
      setControlarEstoque(product.controlarEstoque !== undefined ? product.controlarEstoque : true);
      setEstoqueAtual(product.estoqueAtual !== undefined ? String(product.estoqueAtual) : '25');
      setEstoqueMinimo(product.estoqueMinimo !== undefined ? String(product.estoqueMinimo) : '5');
      setOpcoes(product.opcoes ? JSON.parse(JSON.stringify(product.opcoes)) : []);
      setUploadedFileName(product.foto?.startsWith('data:image') ? 'Foto enviada do dispositivo' : null);
    } else {
      setNome('');
      setCodigoPdv('');
      setCategoria(todasCategorias[0]?.id || 'padrao');
      setPreco('');
      setPrecoPromocional('');
      setCustoUnitario('');
      setDescricao('');
      setFoto('');
      setSelo('');
      setTempoPreparoMin('20');
      setUnidadeMedida(currentSegment === 'confeitaria' ? 'kg' : 'unidade');
      setDisponivel(true);
      setDestaque(false);
      setPermiteMeioAMeio(currentSegment === 'pizzaria');
      setPesoGramas('');
      setPorcaoPessoas('Individual (1 pessoa)');
      setAlergenos([]);
      setDiasDisponiveis(DIAS_SEMANA.map((d) => d.id));
      setControlarEstoque(true);
      setEstoqueAtual('25');
      setEstoqueMinimo('5');
      setUploadedFileName(null);

      const preset = PRESETS_OPCIONAIS[currentSegment];
      if (preset && preset.length > 0) {
        setOpcoes(JSON.parse(JSON.stringify(preset)));
      } else {
        setOpcoes([]);
      }
    }
    setIsCreatingCategory(false);
    setActiveTab('dados');
    setErro('');
  }, [product, isOpen, currentSegment]);

  if (!isOpen) return null;

  // Compress and convert uploaded image file from computer or mobile phone into optimized Data URL
  const processUploadedFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErro('Selecione um arquivo de imagem válido (JPG, PNG ou WEBP) do seu computador ou celular.');
      return;
    }

    setIsCompressingPhoto(true);
    setErro('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 800;
        const maxHeight = 600;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#111827';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setFoto(compressedDataUrl);
          setUploadedFileName(file.name);
        }
        setIsCompressingPhoto(false);
      };
      img.onerror = () => {
        setErro('Não foi possível processar a imagem selecionada. Tente outra foto.');
        setIsCompressingPhoto(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setErro('Falha ao ler o arquivo do dispositivo.');
      setIsCompressingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleDropFile = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  // Create custom category inline
  const handleCreateCustomCategory = () => {
    const trimmed = novaCatNome.trim();
    if (!trimmed) {
      setErro('Digite o nome da nova categoria personalizada.');
      return;
    }
    const newId =
      trimmed
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '') || 'cat_' + Date.now();

    const newCat: CategoryInfo = {
      id: newId,
      nome: trimmed,
      icone: novaCatIcone || '🍔',
      descricao: `Categoria personalizada de ${trimmed}`,
      segmento: currentSegment,
    };

    const updatedCustom = [...customCategories.filter((c) => c.id !== newId), newCat];
    if (onUpdateCustomCategories) {
      onUpdateCustomCategories(updatedCustom);
    }
    setCategoria(newId);
    setNovaCatNome('');
    setIsCreatingCategory(false);
    setErro('');
  };

  const handleDeleteCustomCategory = (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedCustom = customCategories.filter((c) => c.id !== catId);
    if (onUpdateCustomCategories) {
      onUpdateCustomCategories(updatedCustom);
    }
    if (categoria === catId) {
      setCategoria(categoriasBase[0]?.id || 'padrao');
    }
  };

  const handleGenerateDescription = () => {
    if (!nome.trim()) {
      setErro('Digite o nome do item primeiro para gerar a descrição!');
      return;
    }

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

  const toggleAlergeno = (tag: string) => {
    if (alergenos.includes(tag)) {
      setAlergenos(alergenos.filter((a) => a !== tag));
    } else {
      setAlergenos([...alergenos, tag]);
    }
  };

  const toggleDiaDisponivel = (diaId: string) => {
    if (diasDisponiveis.includes(diaId)) {
      if (diasDisponiveis.length === 1) return; // Keep at least 1 day active
      setDiasDisponiveis(diasDisponiveis.filter((d) => d !== diaId));
    } else {
      setDiasDisponiveis([...diasDisponiveis, diaId]);
    }
  };

  // Option group templates for fast creation
  const handleAddTemplateGroup = (
    templateType: 'tamanho' | 'ponto' | 'borda' | 'adicionais' | 'molhos' | 'livre'
  ) => {
    const ts = Date.now();
    let newGroup: ProductOptionGroup;

    if (templateType === 'tamanho') {
      newGroup = {
        id: 'grp_tam_' + ts,
        titulo: 'Escolha o Tamanho / Variação',
        tipo: 'unico',
        obrigatorio: true,
        minimo: 1,
        maximo: 1,
        itens: [
          { id: `it_${ts}_1`, nome: 'Tradicional / Médio', preco: 0, disponivel: true },
          { id: `it_${ts}_2`, nome: 'Grande / Duplo', preco: 12, disponivel: true },
          { id: `it_${ts}_3`, nome: 'Tamanho Família / Combo', preco: 24, disponivel: true },
        ],
      };
    } else if (templateType === 'ponto') {
      newGroup = {
        id: 'grp_ponto_' + ts,
        titulo: 'Ponto da Carne',
        tipo: 'unico',
        obrigatorio: true,
        minimo: 1,
        maximo: 1,
        itens: [
          { id: `it_${ts}_1`, nome: 'Ao Ponto (Suculento)', preco: 0, disponivel: true },
          { id: `it_${ts}_2`, nome: 'Bem Passado', preco: 0, disponivel: true },
          { id: `it_${ts}_3`, nome: 'Mal Passado', preco: 0, disponivel: true },
        ],
      };
    } else if (templateType === 'borda') {
      newGroup = {
        id: 'grp_borda_' + ts,
        titulo: 'Escolha a Borda',
        tipo: 'unico',
        obrigatorio: false,
        minimo: 0,
        maximo: 1,
        itens: [
          { id: `it_${ts}_1`, nome: 'Borda Tradicional (Sem recheio)', preco: 0, disponivel: true },
          { id: `it_${ts}_2`, nome: 'Borda Recheada de Catupiry Original', preco: 12, disponivel: true },
          { id: `it_${ts}_3`, nome: 'Borda Recheada de Cheddar Cremoso', preco: 12, disponivel: true },
          { id: `it_${ts}_4`, nome: 'Borda Vulcão Especial', preco: 18, disponivel: true },
        ],
      };
    } else if (templateType === 'adicionais') {
      newGroup = {
        id: 'grp_adic_' + ts,
        titulo: 'Adicionais & Extras Pagos',
        tipo: 'multiplo',
        obrigatorio: false,
        minimo: 0,
        maximo: 5,
        itens: [
          { id: `it_${ts}_1`, nome: 'Bacon Crocante Extra', preco: 6, disponivel: true },
          { id: `it_${ts}_2`, nome: 'Queijo Cheddar / Mussarela Extra', preco: 5, disponivel: true },
          { id: `it_${ts}_3`, nome: 'Hambúrguer / Proteína Extra', preco: 12, disponivel: true },
          { id: `it_${ts}_4`, nome: 'Cebola Caramelizada', preco: 4, disponivel: true },
        ],
      };
    } else if (templateType === 'molhos') {
      newGroup = {
        id: 'grp_molho_' + ts,
        titulo: 'Escolha os Molhos / Acompanhamentos',
        tipo: 'multiplo',
        obrigatorio: false,
        minimo: 0,
        maximo: 2,
        itens: [
          { id: `it_${ts}_1`, nome: 'Maionese Verde Artesanal da Casa', preco: 0, disponivel: true },
          { id: `it_${ts}_2`, nome: 'Molho Barbecue Defumado', preco: 0, disponivel: true },
          { id: `it_${ts}_3`, nome: 'Maionese de Bacon', preco: 3, disponivel: true },
        ],
      };
    } else {
      newGroup = {
        id: 'grupo_' + ts,
        titulo: 'Novo Grupo de Opções',
        tipo: 'multiplo',
        obrigatorio: false,
        minimo: 0,
        maximo: 3,
        itens: [{ id: 'item_' + ts, nome: 'Opção 1', preco: 0, disponivel: true }],
      };
    }

    setOpcoes([...opcoes, newGroup]);
  };

  const handleLoadSegmentPreset = () => {
    const preset = PRESETS_OPCIONAIS[currentSegment];
    if (preset) {
      setOpcoes(JSON.parse(JSON.stringify(preset)));
    }
  };

  const handleRemoveGroup = (index: number) => {
    const list = [...opcoes];
    list.splice(index, 1);
    setOpcoes(list);
  };

  const handleAddItemToGroup = (groupIndex: number) => {
    const list = [...opcoes];
    list[groupIndex].itens.push({
      id: 'item_' + Date.now() + Math.random().toString(36).slice(2, 6),
      nome: 'Novo item / adicional',
      preco: 0,
      disponivel: true,
    });
    setOpcoes(list);
  };

  const handleRemoveItemFromGroup = (groupIndex: number, itemIndex: number) => {
    const list = [...opcoes];
    list[groupIndex].itens.splice(itemIndex, 1);
    setOpcoes(list);
  };

  // Profit Margin Calculation
  const precoNumPreview = parseFloat(preco.replace(',', '.')) || 0;
  const promoNumPreview = parseFloat(precoPromocional.replace(',', '.')) || 0;
  const custoNumPreview = parseFloat(custoUnitario.replace(',', '.')) || 0;
  const vendaEfetiva = promoNumPreview > 0 && promoNumPreview < precoNumPreview ? promoNumPreview : precoNumPreview;
  const lucroBruto = vendaEfetiva > 0 && custoNumPreview > 0 ? vendaEfetiva - custoNumPreview : null;
  const margemPct =
    lucroBruto !== null && vendaEfetiva > 0 ? Math.round((lucroBruto / vendaEfetiva) * 100) : null;

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
    const custoNum = custoUnitario ? parseFloat(custoUnitario.replace(',', '.')) : undefined;

    const savedProduct: Product = {
      id: product?.id || 'prod_' + Date.now(),
      nome: nome.trim(),
      codigoPdv: codigoPdv.trim() || undefined,
      categoria,
      segmento: currentSegment,
      preco: precoNum,
      precoPromocional: precoPromoNum && !isNaN(precoPromoNum) ? precoPromoNum : undefined,
      custoUnitario: custoNum && !isNaN(custoNum) ? custoNum : undefined,
      descricao:
        descricao.trim() || `${segmentConfig.termoProduto} preparado com ingredientes selecionados.`,
      foto: foto.trim() || BANCO_FOTOS_SUGERIDAS[0].url,
      disponivel,
      destaque,
      selo: selo.trim() || undefined,
      tempoPreparoMin: parseInt(tempoPreparoMin) || 20,
      unidadeMedida,
      pesoGramas: pesoGramas.trim() || undefined,
      porcaoPessoas: porcaoPessoas.trim() || undefined,
      alergenos: alergenos.length > 0 ? alergenos : undefined,
      diasDisponiveis: diasDisponiveis.length > 0 ? diasDisponiveis : undefined,
      controlarEstoque,
      estoqueAtual: controlarEstoque ? Math.max(0, parseInt(estoqueAtual) || 0) : undefined,
      estoqueMinimo: controlarEstoque ? Math.max(0, parseInt(estoqueMinimo) || 5) : undefined,
      permiteMeioAMeio: currentSegment === 'pizzaria' ? permiteMeioAMeio : undefined,
      opcoes,
      atualizadoEm: new Date().toISOString(),
    };

    onSave(savedProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-lg font-black">
              {segmentConfig.icone}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {product
                  ? `Ficha Completa: ${product.nome}`
                  : `Cadastrar Novo ${segmentConfig.termoProduto}`}
              </h2>
              <p className="text-xs text-neutral-400">
                Cadastro detalhado do estabelecimento • Segmento:{' '}
                <strong className="text-orange-400">{segmentConfig.nome}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-5 pt-2.5 border-b border-neutral-800 flex gap-1.5 overflow-x-auto scrollbar-none bg-neutral-950/40">
          <button
            type="button"
            onClick={() => setActiveTab('dados')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'dados'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>1. Dados &amp; Categoria</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ficha')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'ficha'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>2. Ficha Técnica &amp; Dias</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('foto')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'foto'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>3. Foto (Upload Direto)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('opcoes')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'opcoes'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>4. Variações &amp; Opcionais ({opcoes.length})</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {erro && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {/* TAB 1: DADOS BÁSICOS & CATEGORIA PERSONALIZADA */}
          {activeTab === 'dados' && (
            <div className="space-y-4">
              {/* Product Name & PDV Code */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-9">
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Nome do Produto / Item *
                  </label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder={`Ex: ${
                      currentSegment === 'pizzaria'
                        ? 'Pizza Calabresa Artesanal com Cebola Roxa'
                        : currentSegment === 'confeitaria'
                        ? 'Bolo Ninho Trufado com Morangos Frescos'
                        : currentSegment === 'restaurante'
                        ? 'Executivo Picanha Grelhada na Brasa'
                        : 'Burger Duplo Cheddar & Bacon Artesanal'
                    }`}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 focus:border-orange-500 rounded-xl text-white text-sm outline-none transition"
                    required
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Código PDV / SKU
                  </label>
                  <input
                    type="text"
                    value={codigoPdv}
                    onChange={(e) => setCodigoPdv(e.target.value)}
                    placeholder="Ex: COD-01"
                    className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 focus:border-orange-500 rounded-xl text-white text-sm font-mono outline-none transition"
                  />
                </div>
              </div>

              {/* Category Picker + Inline Custom Category Creator */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider">
                    Categoria no Cardápio *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                    className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 bg-orange-500/10 hover:bg-orange-500/20 px-2.5 py-1 rounded-lg border border-orange-500/30 transition cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>{isCreatingCategory ? 'Cancelar Nova Categoria' : '+ Criar Categoria Personalizada'}</span>
                  </button>
                </div>

                {isCreatingCategory && (
                  <div className="p-3.5 rounded-xl bg-neutral-950 border border-orange-500/40 space-y-3">
                    <div className="text-xs font-bold text-orange-400">
                      Nova Categoria Exclusiva do Seu Estabelecimento
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={novaCatNome}
                        onChange={(e) => setNovaCatNome(e.target.value)}
                        placeholder="Ex: Combos Família, Promoções de Quarta, Artesanais..."
                        className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-white text-xs outline-none focus:border-orange-500"
                      />
                      <button
                        type="button"
                        onClick={handleCreateCustomCategory}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap"
                      >
                        Adicionar &amp; Selecionar
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-neutral-400 mr-1">Ícone:</span>
                      {ICONES_CATEGORIA.map((ic) => (
                        <button
                          key={ic}
                          type="button"
                          onClick={() => setNovaCatIcone(ic)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm border transition cursor-pointer ${
                            novaCatIcone === ic
                              ? 'border-orange-500 bg-orange-500/20'
                              : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                          }`}
                        >
                          {ic}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {todasCategorias.map((cat) => {
                    const isCustom = customCategories.some((c) => c.id === cat.id);
                    return (
                      <div
                        key={cat.id}
                        onClick={() => setCategoria(cat.id)}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 text-xs font-bold cursor-pointer ${
                          categoria === cat.id
                            ? 'border-orange-500 bg-orange-500/15 text-orange-300 shadow-xs'
                            : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base shrink-0">{cat.icone}</span>
                          <span className="truncate">{cat.nome}</span>
                        </div>
                        {isCustom && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomCategory(cat.id, e)}
                            className="text-neutral-500 hover:text-red-400 p-0.5 shrink-0"
                            title="Remover categoria personalizada"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Price, Promo, Cost & Prep Time Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Preço Venda (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-neutral-400 text-xs font-bold">R$</span>
                    <input
                      type="text"
                      value={preco}
                      onChange={(e) => setPreco(e.target.value)}
                      placeholder="35.00"
                      className="w-full pl-9 pr-3 py-2.5 bg-neutral-950 border border-neutral-700 focus:border-orange-500 rounded-xl text-white text-sm font-bold font-mono tabular-nums outline-none transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Preço Promo (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-neutral-400 text-xs font-bold">R$</span>
                    <input
                      type="text"
                      value={precoPromocional}
                      onChange={(e) => setPrecoPromocional(e.target.value)}
                      placeholder="29.90"
                      className="w-full pl-9 pr-3 py-2.5 bg-neutral-950 border border-neutral-800 focus:border-orange-500 rounded-xl text-emerald-400 text-sm font-bold font-mono tabular-nums outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Custo Ficha (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-neutral-500 text-xs font-bold">R$</span>
                    <input
                      type="text"
                      value={custoUnitario}
                      onChange={(e) => setCustoUnitario(e.target.value)}
                      placeholder="12.50"
                      className="w-full pl-9 pr-3 py-2.5 bg-neutral-950 border border-neutral-800 focus:border-orange-500 rounded-xl text-neutral-300 text-sm font-mono tabular-nums outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-orange-400" />
                    Preparo Médio
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={tempoPreparoMin}
                      onChange={(e) => setTempoPreparoMin(e.target.value)}
                      placeholder="20"
                      className="w-full pl-3 pr-11 py-2.5 bg-neutral-950 border border-neutral-700 focus:border-orange-500 rounded-xl text-white text-sm font-mono tabular-nums outline-none transition"
                    />
                    <span className="absolute right-3 top-2.5 text-neutral-400 text-xs font-bold">min</span>
                  </div>
                </div>
              </div>

              {/* Automatic Profit Margin Calculation Bar */}
              {lucroBruto !== null && margemPct !== null && (
                <div
                  className={`px-3.5 py-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                    margemPct >= 50
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : margemPct >= 30
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-semibold">
                    <DollarSign className="w-4 h-4 shrink-0" />
                    <span>
                      Simulador de Margem &amp; CMV (sobre R$ {vendaEfetiva.toFixed(2).replace('.', ',')}):
                    </span>
                  </span>
                  <div className="flex flex-wrap items-center gap-2 font-mono tabular-nums font-bold">
                    <span>Lucro: R$ {lucroBruto.toFixed(2).replace('.', ',')}</span>
                    <span>•</span>
                    <span>Margem: {margemPct}%</span>
                    <span>•</span>
                    <span>CMV: {Math.max(0, 100 - margemPct)}%</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        margemPct >= 50
                          ? 'bg-emerald-500 text-neutral-950'
                          : margemPct >= 30
                          ? 'bg-amber-500 text-neutral-950'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {margemPct >= 50 ? 'Margem Saudável' : margemPct >= 30 ? 'Atenção CMV' : 'Margem Baixa'}
                    </span>
                  </div>
                </div>
              )}

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
                </div>
              )}

              {/* Tag / Selo, Unit of measure & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                <div className="sm:col-span-5">
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Selo de Destaque (Opcional)
                  </label>
                  <input
                    type="text"
                    value={selo}
                    onChange={(e) => setSelo(e.target.value)}
                    placeholder="Ex: Mais Pedido, Chef, Novo"
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 focus:border-orange-500 rounded-xl text-white text-sm outline-none transition"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Unidade Venda
                  </label>
                  <select
                    value={unidadeMedida}
                    onChange={(e) => setUnidadeMedida(e.target.value)}
                    className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-700 focus:border-orange-500 rounded-xl text-white text-sm outline-none"
                  >
                    <option value="unidade">Unidade</option>
                    <option value="porção">Porção</option>
                    <option value="combo">Combo</option>
                    <option value="fatia">Fatia</option>
                    <option value="kg">Quilo (kg)</option>
                    <option value="500ml">Copo / 500ml</option>
                  </select>
                </div>

                <div className="sm:col-span-4 flex items-center gap-4 pt-4 sm:pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-200">
                    <input
                      type="checkbox"
                      checked={disponivel}
                      onChange={(e) => setDisponivel(e.target.checked)}
                      className="w-4 h-4 rounded text-orange-500 focus:ring-0 bg-neutral-950 border-neutral-700"
                    />
                    <span>Ativo Hoje</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-400">
                    <input
                      type="checkbox"
                      checked={destaque}
                      onChange={(e) => setDestaque(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-neutral-950 border-neutral-700"
                    />
                    <span>Destaque ⭐</span>
                  </label>
                </div>
              </div>

              {/* Description & Generator */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                    Descrição Detalhada dos Ingredientes
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 bg-orange-500/10 hover:bg-orange-500/20 px-2.5 py-1 rounded-lg border border-orange-500/30 transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Sugerir Descrição Atraente</span>
                  </button>
                </div>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                  placeholder="Descreva os ingredientes, modo de preparo e diferenciais do produto..."
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 focus:border-orange-500 rounded-xl text-white text-sm outline-none transition resize-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 2: FICHA TÉCNICA DETALHADA (PESO, PORÇÃO, ALÉRGENOS E DIAS DISPONÍVEIS) */}
          {activeTab === 'ficha' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Peso / Volume */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                  <label className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-orange-400" />
                    <span>Peso ou Volume Aproximado</span>
                  </label>
                  <input
                    type="text"
                    value={pesoGramas}
                    onChange={(e) => setPesoGramas(e.target.value)}
                    placeholder="Ex: 350g, 500ml, 1.2kg"
                    className="w-full px-3.5 py-2 bg-neutral-900 border border-neutral-700 focus:border-orange-500 rounded-xl text-white text-sm outline-none"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['180g', '250g', '350g', '500g', '350ml', '500ml', '1L', '2L'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPesoGramas(preset)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                          pesoGramas === preset
                            ? 'border-orange-500 bg-orange-500/20 text-orange-300'
                            : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Porção / Rendimento */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                  <label className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-orange-400" />
                    <span>Porção / Rendimento</span>
                  </label>
                  <input
                    type="text"
                    value={porcaoPessoas}
                    onChange={(e) => setPorcaoPessoas(e.target.value)}
                    placeholder="Ex: Serve 2 pessoas"
                    className="w-full px-3.5 py-2 bg-neutral-900 border border-neutral-700 focus:border-orange-500 rounded-xl text-white text-sm outline-none"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {PORCOES_SUGERIDAS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPorcaoPessoas(p)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                          porcaoPessoas === p
                            ? 'border-orange-500 bg-orange-500/20 text-orange-300'
                            : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Alérgenos e Restrições Alimentares */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div>
                  <label className="text-xs font-bold text-neutral-200 uppercase tracking-wider block">
                    Avisos de Alérgenos &amp; Classificação Alimentar
                  </label>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Selecione as características para informar o cliente no cardápio digital:
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {ALERGENOS_PADRAO.map((tag) => {
                    const active = alergenos.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleAlergeno(tag)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer ${
                          active
                            ? 'border-orange-500 bg-orange-500/20 text-orange-300'
                            : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                        }`}
                      >
                        {active && <Check className="w-3.5 h-3.5 text-orange-400" />}
                        <span>{tag}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Controle de Estoque & Pausa Automática */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-neutral-200 uppercase tracking-wider block">
                      Controle de Estoque e Baixa Automática
                    </label>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Quando o estoque chega a zero, o item é pausado automaticamente no cardápio.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-orange-400">
                    <input
                      type="checkbox"
                      checked={controlarEstoque}
                      onChange={(e) => setControlarEstoque(e.target.checked)}
                      className="w-4 h-4 rounded text-orange-500 focus:ring-0 bg-neutral-900 border-neutral-700"
                    />
                    <span>Controlar Estoque deste Item</span>
                  </label>
                </div>

                {controlarEstoque && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-neutral-400 mb-1">
                        Quantidade Atual em Estoque ({unidadeMedida})
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={estoqueAtual}
                        onChange={(e) => setEstoqueAtual(e.target.value)}
                        className="w-full px-3.5 py-2 bg-neutral-900 border border-neutral-700 focus:border-orange-500 rounded-xl text-white text-sm font-mono font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-400 mb-1">
                        Alerta de Estoque Mínimo ({unidadeMedida})
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={estoqueMinimo}
                        onChange={(e) => setEstoqueMinimo(e.target.value)}
                        className="w-full px-3.5 py-2 bg-neutral-900 border border-neutral-700 focus:border-orange-500 rounded-xl text-amber-400 text-sm font-mono font-bold outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Disponibilidade por Dia da Semana */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-orange-400" />
                      <span>Disponibilidade por Dia da Semana</span>
                    </label>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Defina em quais dias este produto aparece ativo para pedidos:
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDiasDisponiveis(DIAS_SEMANA.map((d) => d.id))}
                      className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[11px] font-bold text-neutral-300 cursor-pointer"
                    >
                      Todos os Dias
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiasDisponiveis(['sex', 'sab', 'dom'])}
                      className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[11px] font-bold text-neutral-300 cursor-pointer"
                    >
                      Sexta a Domingo
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {DIAS_SEMANA.map((dia) => {
                    const isSelected = diasDisponiveis.includes(dia.id);
                    return (
                      <button
                        key={dia.id}
                        type="button"
                        onClick={() => toggleDiaDisponivel(dia.id)}
                        className={`py-2.5 px-2 rounded-xl border text-center text-xs font-black transition cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                            : 'border-neutral-800 bg-neutral-900 text-neutral-500 hover:border-neutral-700'
                        }`}
                        title={dia.full}
                      >
                        {dia.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FOTO DO PRODUTO (EXCLUSIVAMENTE UPLOAD DIRETO DO COMPUTADOR OU CELULAR) */}
          {activeTab === 'foto' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Drag and Drop / Direct Device File Upload Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(true);
                }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={handleDropFile}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                  isDraggingOver
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-neutral-700 hover:border-orange-500 bg-neutral-950/70'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-orange-500/15 text-orange-400 flex items-center justify-center">
                  <Upload className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <p className="text-sm sm:text-base font-black text-white">
                    {isCompressingPhoto
                      ? 'Otimizando foto do seu dispositivo...'
                      : 'Clique para enviar uma foto do seu Computador ou Celular'}
                  </p>
                  <p className="text-xs text-neutral-400 max-w-md mx-auto">
                    Selecione direto da galeria do celular, tire uma foto na hora ou arraste o arquivo de imagem (JPG, PNG, WEBP) do seu computador.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="mt-1 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black flex items-center gap-2 transition cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Escolher Arquivo de Imagem no Dispositivo</span>
                </button>
              </div>

              {/* Current Uploaded Photo Preview */}
              {foto ? (
                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-full sm:w-44 h-36 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-700 shrink-0">
                    <img
                      src={foto}
                      alt={nome || 'Prévia do produto'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-xs font-bold">
                        Foto Anexada ao Produto
                      </span>
                      {uploadedFileName && (
                        <span className="text-xs text-neutral-400 truncate max-w-[200px]">
                          ({uploadedFileName})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400">
                      Esta imagem foi otimizada automaticamente e será exibida no cardápio digital exclusivo do seu estabelecimento.
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition cursor-pointer"
                      >
                        Substituir Foto
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFoto('');
                          setUploadedFileName(null);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold transition cursor-pointer"
                      >
                        Remover Foto
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 text-center text-xs text-neutral-400">
                  Nenhuma foto enviada ainda. Clique no botão acima para anexar uma imagem do seu computador ou celular.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: VARIAÇÕES, TAMANHOS, BORDAS & OPCIONAIS COM MÍN/MÁX */}
          {activeTab === 'opcoes' && (
            <div className="space-y-4">
              {/* Quick Variation Templates Bar */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                    Adicionar Grupo Rápido de Variações ou Complementos:
                  </span>
                  <button
                    type="button"
                    onClick={handleLoadSegmentPreset}
                    className="text-[11px] font-bold text-neutral-400 hover:text-white underline cursor-pointer"
                  >
                    Carregar sugestões padrão de {segmentConfig.nome}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddTemplateGroup('tamanho')}
                    className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-white flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-orange-400" />
                    <span>Variação de Tamanho</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddTemplateGroup('ponto')}
                    className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-white flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-orange-400" />
                    <span>Ponto da Carne</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddTemplateGroup('borda')}
                    className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-white flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-orange-400" />
                    <span>Bordas Recheadas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddTemplateGroup('adicionais')}
                    className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-white flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Adicionais Pagos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddTemplateGroup('molhos')}
                    className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-white flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-orange-400" />
                    <span>Molhos / Guarnições</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddTemplateGroup('livre')}
                    className="px-3 py-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-xs font-bold text-orange-300 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Grupo em Branco</span>
                  </button>
                </div>
              </div>

              {/* Option Groups List */}
              <div className="space-y-4">
                {opcoes.map((grupo, gIdx) => (
                  <div
                    key={grupo.id}
                    className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3"
                  >
                    {/* Group Header & Rules */}
                    <div className="space-y-2.5 pb-3 border-b border-neutral-800">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={grupo.titulo}
                          onChange={(e) => {
                            const list = [...opcoes];
                            list[gIdx].titulo = e.target.value;
                            setOpcoes(list);
                          }}
                          placeholder="Título do Grupo (Ex: Escolha o Tamanho)"
                          className="font-bold text-sm bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded-lg text-white outline-none focus:border-orange-500 flex-1"
                        />

                        <button
                          type="button"
                          onClick={() => handleRemoveGroup(gIdx)}
                          className="text-neutral-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-neutral-900 transition cursor-pointer"
                          title="Excluir este grupo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Selection Type, Mandatory & Min/Max Controls */}
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <select
                          value={grupo.tipo}
                          onChange={(e) => {
                            const list = [...opcoes];
                            const novoTipo = e.target.value as 'unico' | 'multiplo';
                            list[gIdx].tipo = novoTipo;
                            if (novoTipo === 'unico') {
                              list[gIdx].maximo = 1;
                            }
                            setOpcoes(list);
                          }}
                          className="bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-lg px-2.5 py-1.5 font-semibold outline-none"
                        >
                          <option value="unico">Escolha Única (1 opção)</option>
                          <option value="multiplo">Múltipla Escolha (Vários itens)</option>
                        </select>

                        <label className="flex items-center gap-1.5 text-neutral-300 font-bold cursor-pointer bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded-lg">
                          <input
                            type="checkbox"
                            checked={grupo.obrigatorio}
                            onChange={(e) => {
                              const list = [...opcoes];
                              list[gIdx].obrigatorio = e.target.checked;
                              if (e.target.checked && (!list[gIdx].minimo || list[gIdx].minimo === 0)) {
                                list[gIdx].minimo = 1;
                              }
                              setOpcoes(list);
                            }}
                            className="rounded bg-neutral-800 text-orange-500 focus:ring-0"
                          />
                          <span>Obrigatório</span>
                        </label>

                        <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-lg">
                          <span className="text-neutral-400">Mín:</span>
                          <input
                            type="number"
                            min={0}
                            max={20}
                            value={grupo.minimo ?? (grupo.obrigatorio ? 1 : 0)}
                            onChange={(e) => {
                              const list = [...opcoes];
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              list[gIdx].minimo = val;
                              if (val > 0) list[gIdx].obrigatorio = true;
                              setOpcoes(list);
                            }}
                            className="w-12 bg-neutral-950 border border-neutral-700 rounded px-1.5 py-0.5 text-white font-mono text-center outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-lg">
                          <span className="text-neutral-400">Máx:</span>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={grupo.maximo ?? (grupo.tipo === 'unico' ? 1 : 10)}
                            onChange={(e) => {
                              const list = [...opcoes];
                              list[gIdx].maximo = Math.max(1, parseInt(e.target.value) || 1);
                              setOpcoes(list);
                            }}
                            className="w-12 bg-neutral-950 border border-neutral-700 rounded px-1.5 py-0.5 text-white font-mono text-center outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Items inside this group */}
                    <div className="space-y-2">
                      {grupo.itens.map((item, iIdx) => {
                        const isItemActive = item.disponivel !== false;
                        return (
                          <div key={item.id} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={item.nome}
                              onChange={(e) => {
                                const list = [...opcoes];
                                list[gIdx].itens[iIdx].nome = e.target.value;
                                setOpcoes(list);
                              }}
                              placeholder="Nome da opção / adicional"
                              className={`flex-1 px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs outline-none focus:border-orange-500 ${
                                isItemActive ? 'text-white' : 'text-neutral-500 line-through'
                              }`}
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
                                className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-800 text-emerald-400 font-bold font-mono tabular-nums rounded-lg text-xs outline-none focus:border-orange-500"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const list = [...opcoes];
                                list[gIdx].itens[iIdx].disponivel = !isItemActive;
                                setOpcoes(list);
                              }}
                              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer whitespace-nowrap ${
                                isItemActive
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                  : 'bg-red-500/15 border-red-500/30 text-red-400'
                              }`}
                              title="Ativar ou pausar este opcional"
                            >
                              {isItemActive ? 'Ativo' : 'Pausado'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveItemFromGroup(gIdx, iIdx)}
                              className="text-neutral-500 hover:text-red-400 p-1 cursor-pointer"
                              title="Remover item"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => handleAddItemToGroup(gIdx)}
                        className="text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 pt-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar Opção neste Grupo</span>
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => handleAddTemplateGroup('livre')}
                  className="w-full py-3 rounded-xl border border-dashed border-neutral-700 hover:border-orange-500 text-neutral-400 hover:text-orange-400 font-bold text-xs flex items-center justify-center gap-2 transition bg-neutral-950/40 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Novo Grupo de Opcionais Personalizado</span>
                </button>
              </div>
            </div>
          )}

          {/* Modal Actions Footer */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-between gap-3">
            <div className="text-[11px] text-neutral-400 hidden sm:block">
              Sincronização imediata com o cardápio exclusivo do estabelecimento
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-neutral-700 text-neutral-300 text-xs sm:text-sm font-semibold hover:bg-neutral-800 transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-orange-500/25 transition active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Produto no Cardápio</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
