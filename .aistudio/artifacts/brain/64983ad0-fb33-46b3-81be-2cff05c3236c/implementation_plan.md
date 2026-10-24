# Plano de Implementação: Cadastro Avançado de Produtos & Link Exclusivo do Cardápio

## 1. Visão Geral do Que Será Construído
Aprimoraremos o painel operacional e de cardápio do **Gerente do Estabelecimento** para oferecer controle total sobre o cadastro de produtos e a divulgação do cardápio digital exclusivo da loja:

1. **Upload Direto de Fotos do Dispositivo (Computador ou Celular)**:
   - Substituição do seletor de URLs externas por uma área dedicada de **Upload de Arquivo Local** (`input type="file"` com suporte a câmera mobile e arrastar-e-soltar).
   - Compressão e redimensionamento inteligente em Canvas client-side (otimizando a imagem em WebP/JPEG leve para armazenamento instantâneo e sincronização rápida com o banco de dados).

2. **Ficha Técnica Detalhada e Disponibilidade por Dia**:
   - Novos campos na ficha do produto: **Peso/Volume** (ex: `350g`, `500ml`), **Serve quantas pessoas** (ex: `1 pessoa`, `2 pessoas`, `Família`), **Tags Dietéticas e Alérgenos** (ex: `Sem Glúten`, `Sem Lactose`, `Vegetariano`, `Vegano`, `Contém Amendoim`, `Picante`), **Código PDV/SKU** e **Custo Estimado (R$)** com cálculo automático de margem de lucro.
   - **Disponibilidade por Dia da Semana**: seleção dos dias em que o item aparece ativo no cardápio (ex: `Seg`, `Ter`, `Qua`, `Qui`, `Sex`, `Sáb`, `Dom`), ideal para pratos do dia ou promoções específicas.

3. **Criação de Categorias Personalizadas pelo Gerente**:
   - Além das categorias padrão do segmento, o gerente poderá **criar, editar e excluir categorias personalizadas** (com nome, ícone e descrição) diretamente no modal de produto ou na aba de Cardápio, salvas na configuração do seu estabelecimento (`categoriasCustomizadas`).

4. **Grupos de Opcionais, Tamanhos, Bordas e Adicionais com Limites Mín/Máx**:
   - Configuração completa de grupos **Obrigatórios** ou **Opcionais**, escolha **Única** ou **Múltipla**, com definição de **Quantidade Mínima** e **Quantidade Máxima** de escolhas por grupo.
   - Suporte a variações de tamanho, ponto da carne, bordas recheadas, adicionais pagos e disponibilidade individual por item opcional.
   - Validação rigorosa no Cardápio Digital Público (`PublicMenuView`) respeitando os limites mínimo/máximo e exibindo os dados da ficha técnica (peso, porção, alérgenos) para o cliente final.

5. **Link Exclusivo do Cardápio com Nome Personalizado (Slug), QR Code e WhatsApp**:
   - Configuração de identificador personalizado do estabelecimento (`slug`, ex: `?modo=cardapio&loja=burger-house-centro`) que resolve automaticamente para o cardápio daquela loja.
   - **Central de Divulgação do Cardápio**: modal/painel com cópia em 1 clique do link exclusivo, **geração de QR Code** pronto para impressão (mesas, balcão e embalagens) e botão de **Compartilhar direto no WhatsApp** com mensagem formatada.

---

## 2. Principais Fluxos de Experiência (UX)
- **Fluxo de Cadastro de Produto (`ProductModal.tsx`)**:
  - **Aba 1 — Dados & Categoria**: Nome, seletor de categoria com botão `+ Nova Categoria Personalizada`, preço de venda, preço promocional, custo para cálculo de margem, selo de destaque e descrição (com gerador inteligente).
  - **Aba 2 — Foto do Produto (Upload Direto)**: Área de seleção/captura de foto direto do celular ou computador, pré-visualização imediata em alta nitidez, botão para trocar ou remover foto.
  - **Aba 3 — Ficha Técnica & Dias Ativos**: Peso/gramatura, tamanho da porção (quantas pessoas serve), tempo de preparo, seleção de restrições/alérgenos e dias da semana disponíveis.
  - **Aba 4 — Variações, Tamanhos & Complementos**: Gerenciador de grupos com controles de Obrigatório/Opcional, Mínimo e Máximo de itens, atalhos rápidos para adicionar grupos de Tamanho, Ponto, Borda ou Adicionais, e preços individuais.
- **Fluxo do Link Exclusivo (`StoreManagerOperationView.tsx` & `MenuTableView.tsx`)**:
  - Card destacado com o link personalizado da loja, edição rápida do identificador (slug), botão de compartilhamento via WhatsApp e visualização/download do QR Code da loja.

---

## 3. Arquivos e Componentes Envolvidos
- `src/types/index.ts`: Expansão das interfaces `Product`, `ProductOptionGroup`, `ProductOptionItem` e `StoreConfig` (incluindo `slug`, `categoriasCustomizadas`, ficha técnica, alérgenos e dias disponíveis).
- `src/components/ProductModal.tsx`: Reformulação completa com as 4 abas estruturadas, upload direto de foto com compressão client-side, criador de categorias personalizadas, ficha técnica e limites mín/máx de opcionais.
- `src/components/MenuTableView.tsx`: Integração das categorias personalizadas do gerente, exibição de indicadores de ficha técnica/opções e acesso rápido ao compartilhamento do link/QR Code do cardápio.
- `src/components/StoreManagerOperationView.tsx`: Painel aprimorado do Link Exclusivo do Cardápio com personalização de slug, QR Code para impressão e envio via WhatsApp.
- `src/components/PublicMenuView.tsx` & `src/App.tsx`: Resolução do link por `slug` personalizado ou `storeId`, exibição de peso/porção/alérgenos e validação de limites mínimo/máximo nos grupos de complementos.
- `firestore.rules` & `firebase-blueprint.json`: Atualização de esquema se necessário para garantir persistência segura dos novos campos.
