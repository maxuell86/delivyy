import React from 'react';
import { X, Printer, CheckCircle2, Clock, MapPin, Phone } from 'lucide-react';
import { StoreConfig, CartItem } from '../types';

interface KitchenReceiptModalProps {
  isOpen: boolean;
  storeConfig: StoreConfig;
  cartItems: CartItem[];
  customerName?: string;
  customerAddress?: string;
  paymentMethod?: string;
  onClose: () => void;
}

export const KitchenReceiptModal: React.FC<KitchenReceiptModalProps> = ({
  isOpen,
  storeConfig,
  cartItems,
  customerName = 'João Silva',
  customerAddress = 'Rua B, 378 - Jd Buritis',
  paymentMethod = 'PIX (Chave da Loja)',
  onClose,
}) => {
  if (!isOpen) return null;

  const orderNum = Math.floor(100 + Math.random() * 900);
  const orderTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const orderDate = new Date().toLocaleDateString('pt-BR');

  const subtotal = cartItems.reduce((acc, curr) => acc + curr.subtotal, 0);
  const total = subtotal + storeConfig.taxaEntregaPadrao;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-orange-400" />
            <h2 className="text-base font-black text-white">
              Comanda Térmica para Cozinha (80mm)
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Ticket Content */}
        <div className="p-5 overflow-y-auto max-h-[70vh] bg-neutral-950 flex justify-center">
          <div 
            id="comandaTermica"
            className="w-full max-w-[320px] bg-white text-black p-4 rounded-lg shadow-inner font-mono text-xs leading-relaxed border border-neutral-300 print:shadow-none print:border-none print:w-full print:p-0"
          >
            {/* Header */}
            <div className="text-center border-b-2 border-dashed border-black pb-3 mb-3">
              <h3 className="text-base font-black uppercase tracking-wider">{storeConfig.nome}</h3>
              <p className="text-[11px] font-bold">{storeConfig.slogan}</p>
              <p className="text-[10px] mt-1">{storeConfig.endereco} - {storeConfig.bairro}</p>
              <p className="text-[10px]">Tel: {storeConfig.whatsappExibicao}</p>
            </div>

            {/* Order Badge */}
            <div className="text-center py-1.5 bg-neutral-200 font-black text-sm uppercase mb-3">
              PEDIDO #{orderNum} • DELIVERY
            </div>

            <div className="text-[11px] space-y-0.5 mb-3 border-b border-dashed border-black pb-2">
              <p><b>Data:</b> {orderDate} às {orderTime}</p>
              <p><b>Cliente:</b> {customerName}</p>
              <p><b>Endereço:</b> {customerAddress}</p>
            </div>

            {/* Items */}
            <div className="space-y-2 mb-3 border-b-2 border-dashed border-black pb-3">
              <p className="font-black uppercase text-[11px]">ITENS DO PEDIDO:</p>
              {cartItems.length === 0 ? (
                <div className="p-2 bg-neutral-100 rounded text-[11px]">
                  <p className="font-bold">1x Burger Cheddar &amp; Bacon</p>
                  <p className="text-[10px] pl-2">• Ao ponto</p>
                  <p className="text-[10px] pl-2">• Pão Brioche Dourado</p>
                  <p className="text-[10px] pl-2">• Bacon Crocante Extra (+R$ 4,50)</p>
                  <p className="text-[10px] pl-2 italic">Obs: Caprichar no molho da casa</p>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div key={idx} className="border-b border-neutral-200 pb-1.5">
                    <div className="flex justify-between font-black text-[11px]">
                      <span>{item.quantidade}x {item.produto.nome}</span>
                      <span>R$ {item.subtotal.toFixed(2).replace('.', ',')}</span>
                    </div>

                    {item.opcoesSelecionadas.map((opt, oIdx) => (
                      <p key={oIdx} className="text-[10px] pl-2 text-neutral-700">
                        • {opt.itemNome}
                      </p>
                    ))}

                    {item.observacoes && (
                      <p className="text-[10px] pl-2 italic font-semibold">
                        Obs: {item.observacoes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Financial Summary */}
            <div className="space-y-1 text-[11px] border-b-2 border-dashed border-black pb-3 mb-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>R$ {(cartItems.length > 0 ? subtotal : 34.9).toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxa de Entrega:</span>
                <span>R$ {storeConfig.taxaEntregaPadrao.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between font-black text-sm pt-1 border-t border-black">
                <span>TOTAL:</span>
                <span>R$ {(cartItems.length > 0 ? total : 41.9).toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            {/* Payment & Footer */}
            <div className="text-[11px] mb-3">
              <p><b>Pagamento:</b> {paymentMethod}</p>
            </div>

            <div className="text-center text-[10px] border-t border-dashed border-black pt-2">
              <p className="font-bold">Obrigado pela preferência!</p>
              <p>Produzido com Plataforma Delivery Multi-Segmento</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-xs print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-neutral-400 hover:text-white"
          >
            Fechar
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-black flex items-center gap-2 shadow-lg shadow-orange-500/25 transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir na Impressora Térmica</span>
          </button>
        </div>
      </div>
    </div>
  );
};
