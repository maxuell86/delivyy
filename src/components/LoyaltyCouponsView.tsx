import React, { useState } from 'react';
import { 
  Award, 
  Tag, 
  Gift, 
  Plus, 
  Trash2, 
  Save, 
  Percent, 
  Sparkles,
  Truck
} from 'lucide-react';
import { StoreConfig, LoyaltyTier, CouponItem } from '../types';

interface LoyaltyCouponsViewProps {
  storeConfig: StoreConfig;
  onSaveConfig: (updated: StoreConfig) => void;
  showToast: (msg: string) => void;
}

export const LoyaltyCouponsView: React.FC<LoyaltyCouponsViewProps> = ({
  storeConfig,
  onSaveConfig,
  showToast,
}) => {
  const [boasVindasPct, setBoasVindasPct] = useState(
    storeConfig.fidelidade?.boasVindasPct?.toString() || '15'
  );

  const [niveis, setNiveis] = useState<LoyaltyTier[]>(
    storeConfig.fidelidade?.niveis || [
      { id: 'bronze', nome: 'Bronze', cor: '#cd7f32', minimo: 0, descontoPct: 0, desc: 'Gaste R$ 200 para virar Prata!' },
      { id: 'prata', nome: 'Prata', cor: '#c0c0c0', minimo: 200, descontoPct: 0, desc: 'Frete grátis 1x desbloqueado!' },
      { id: 'ouro', nome: 'Ouro', cor: '#ffd700', minimo: 500, descontoPct: 10, desc: '10% de desconto automático no carrinho!' },
      { id: 'diamante', nome: 'Diamante', cor: '#7df9ff', minimo: 1000, descontoPct: 15, desc: '15% OFF + frete grátis sempre!' },
    ]
  );

  const [cupons, setCupons] = useState<CouponItem[]>(
    storeConfig.cupons || [
      { codigo: 'PRIMEIRACOMPRA', desconto: 15, tipo: 'livre', msg: '15% de boas-vindas!' },
      { codigo: 'CLIENTEOURO', desconto: 10, tipo: 'nivel', minimo: 500, msg: '10% off para Cliente Ouro!' },
      { codigo: 'ANIVERSARIO', desconto: 10, tipo: 'aniversario', msg: 'Parabéns! 10% off no seu aniversário!' },
      { codigo: 'DELIVERYMAX', desconto: 5, tipo: 'livre', msg: '5% off especial no delivery!' },
    ]
  );

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
    };

    onSaveConfig(updated);
    showToast('Fidelidade e Cupons salvos com sucesso!');
  };

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      {/* Top Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>Retenção &amp; Fidelidade do Cliente</span>
          </div>
          <h2 className="text-2xl font-black text-white">
            Programa de Fidelidade &amp; Cupons
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Recompense clientes recorrentes, incentive a primeira compra e crie cupons promocionais.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-orange-500/25 transition active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>Salvar Fidelidade</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* SECTION 1: BOAS-VINDAS & CUPONS */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-orange-400" />
                <span>1. Cupons Ativos no Delivery</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Cupons livres (qualquer um usa), por gasto acumulado ou de aniversário.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddCupom}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-neutral-700 transition"
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
                    className="font-black text-white bg-neutral-900 border border-neutral-700 px-2 py-1 rounded tracking-wider uppercase text-xs"
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
                      className="w-14 px-1.5 py-1 bg-neutral-900 border border-neutral-700 rounded text-emerald-400 font-bold text-right text-xs"
                    />
                    <span className="text-emerald-400 font-bold">% OFF</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveCupom(cIdx)}
                    className="text-neutral-500 hover:text-red-400 p-1"
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
                        className="w-16 p-1 bg-neutral-900 border border-neutral-800 rounded text-white text-[11px]"
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
                      className="w-16 px-1.5 py-1 bg-neutral-900 border border-neutral-700 rounded text-white font-bold text-xs"
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
                      className="w-12 px-1.5 py-1 bg-neutral-900 border border-neutral-700 rounded text-emerald-400 font-bold text-xs"
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
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-sm font-black flex items-center gap-2 shadow-lg shadow-orange-500/25 transition active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Fidelidade &amp; Cupons</span>
          </button>
        </div>
      </form>
    </div>
  );
};
