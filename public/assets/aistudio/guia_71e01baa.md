Pré-requisitos
Uma conta gratuita no Supabase

Uma conta no Mercado Pago (para receber por cartão/Pix no app)

Uma conta em uma plataforma de hospedagem estática (como GitHub, Netlify ou Vercel)

Um editor de código (como o VS Code) instalado no seu computador

💻 Passo 1: Preparar os Arquivos e Executar Localmente
Antes de enviar qualquer arquivo para a nuvem, você deve rodar o projeto localmente para entender o funcionamento.

Organização da Pasta:

Crie uma pasta no seu computador para a nova loja (ex: delivery-restaurante-x).

Copie todos os arquivos e pastas do template para dentro dela.

Abrir no Terminal / Prompt de Comando:

Abra o terminal ou cmd dentro dessa pasta.

Subir o Servidor Local:

Execute o comando do Python para servir arquivos estáticos:

Bash
python -m http.server 8000
Visualizar no Navegador:

Acesse http://localhost:8000 no seu navegador.

O app carregará com a identidade visual e dados da Sabore In Casa (padrão do config.js).

🗄️ Passo 2: Configurar o Banco de Dados no Supabase
O Supabase gerencia o cardápio em tempo real, registra os pedidos/vendas e armazena as configurações salvas pelo painel do lojista.

Criar o Projeto:

Acesse o painel do Supabase, clique em New Project, dê um nome e crie uma senha para o banco.

Executar a Estrutura do App (config_loja):

No menu lateral do Supabase, clique em SQL Editor.

Clique em New Query.

Abra o arquivo supabase/config-loja.sql do seu projeto local, copie todo o código contido nele, cole no editor do Supabase e clique no botão Run.

Configurar as Tabelas de Produtos/Vendas:

Verifique se as tabelas do cardápio ao vivo (pizzas, tamanhos, sabores, bebidas) estão criadas e com permissão de leitura pública (RLS - Read access para anon), permitindo que o integracao-sistema.js leia os itens.

Coletar as Chaves de Acesso:

No menu lateral do Supabase, vá em Project Settings > API.

Anote a Project URL (URL do projeto) e a anon public key (Chave pública de API).

⚙️ Passo 3: Preencher as Configurações Iniciais em config.js
Edite o arquivo config.js no seu editor de código para definir os parâmetros base do restaurante.

Dados do Restaurante e WhatsApp:

Atualize o nome da marca, slogan, endereço físico e número do WhatsApp com DDD (onde os pedidos serão recebidos).

Inserir as Chaves do Supabase:

No bloco integracoes, preencha:

JavaScript
supabaseUrl: 'https://seusuperprojeto.supabase.co',
supabaseAnonKey: 'sua-chave-anon-publica-aqui',
Inserir Chaves de Pagamento:

Cole a sua chave pública do Mercado Pago em mercadoPagoPublicKey.

Digite a chave Pix principal do estabelecimento em pixChave.

Ajustar Taxas de Entrega e Horários:

Configure os dias/horários de funcionamento.

Adicione os bairros com suas respectivas taxas fixas de entrega e o valor mínimo para regra de Frete Grátis.

SEO e Domínio:

Em seo.baseUrl, insira o link web onde o site ficará hospedado (ex: [https://meurestaurante.netlify.app](https://meurestaurante.netlify.app)).

🎨 Passo 4: Substituir Mídias e Identidade Visual
Fotos e Banners (Pasta /imagens):

logo.png / logo.jpg: Substitua pelo logotipo oficial do restaurante.

Banners: Troque as mídias em destaque para as promoções atuais da loja.

Ícones PWA: Atualize os ícones nos tamanhos 192x192 e 512x512 para a logo da nova marca.

Personalizar o Manifest (manifest.json):

Edite manifest.json e troque name e short_name pelo nome oficial do restaurante.

Ajuste a propriedade theme_color e background_color para bater com a paleta de cores do restaurante.

🌐 Passo 5: Publicar o Aplicativo (Hospedagem)
Como o app é estático (PWA puramente no front-end), a hospedagem é gratuita e imediata.

Opção A: Vercel ou Netlify (Recomendado — Método "Arrastar e Soltar")
Crie uma conta no Netlify.

No painel inicial, acesse Sites e vá até a área de Drag and Drop.

Arraste a pasta inteira do seu projeto e solte no navegador.

Em poucos segundos, o Netlify gerará uma URL pública (ex: [https://nome-da-loja.netlify.app](https://nome-da-loja.netlify.app)).

Opção B: GitHub Pages
Crie um repositório público ou privado no GitHub.

Envie todos os arquivos do projeto para o repositório (git push).

Vá em Settings > Pages do repositório, selecione a branch main/master e clique em Save.

O app estará disponível na URL do GitHub Pages em minutos.

🔐 Passo 6: Validar o Painel do Lojista (customizar.html)
O aplicativo possui um painel administrativo que permite ao lojista alterar cores, taxas e avisos sem programar.

Acessar o Painel:

No navegador, abra a URL publicada acrescentando /customizar.html (ou clique no link em admin.html).

Fazer Login:

Insira a senha inicial do template: sabore2024.

Alterar a Senha Inicial (Importante):

Vá até a aba Avançado, defina uma nova senha administrativa segura e salve.

Testar a Sincronização:

Mude uma cor ou texto na aba Marca & Contato e clique em Salvar e publicar.

Abra a página principal do app em uma guia anônima e confirme se as mudanças foram aplicadas em tempo real.

🧪 Passo 7: Teste do Pedido de Ponta a Ponta (Checklist Final)
Faça uma simulação completa como se fosse um cliente final:

[ ] Seleção de Produtos: Selecione uma pizza com 2 sabores (meio a meio), escolha a borda e adicione uma bebida ao carrinho.

[ ] Carrinho e Frete: Digite o bairro de entrega e valide se a taxa cobrada corresponde ao valor configurado.

[ ] Cupom de Desconto: Aplique um cupom de teste para verificar a dedução do total.

[ ] Envio via WhatsApp: Clique em enviar pedido pelo WhatsApp e confirme se a mensagem formatada chega corretamente com os dados do produto, endereço e forma de pagamento.

[ ] Pagamento no App (Pix / Cartão): Verifique se o QR Code do Pix e a tela de cartão de crédito do Mercado Pago abrem normalmente.

[ ] Instalação PWA: Abra o site no celular pelo navegador (Chrome/Safari) e teste a opção "Adicionar à Tela Inicial" para garantir que ele é instalado como um app nativo.