import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Order, OrderStatus, Product, StoreConfig } from '../types';

const ORDERS_COLLECTION = 'orders';
const STORE_CONFIG_DOC = 'store_config';
const PRODUCTS_COLLECTION = 'products';

// Helper to convert Firestore dates/numbers cleanly
function sanitizeOrderForFirestore(order: Order): Record<string, any> {
  return {
    id: order.id,
    numeroPedido: order.numero,
    clienteNome: order.clienteNome || 'Cliente',
    clienteTelefone: order.clienteTelefone || '',
    formaPagamento: order.formaPagamento || 'Pix',
    status: order.status || 'pendente',
    total: Number(order.total) || 0,
    tipoEntrega: order.tipoEntrega || 'delivery',
    endereco: order.endereco || '',
    bairro: order.bairro || '',
    mesa: order.mesa || '',
    subtotal: Number(order.subtotal) || 0,
    taxaEntrega: Number(order.taxaEntrega) || 0,
    desconto: Number(order.desconto) || 0,
    observacoes: order.observacoes || '',
    criadoEm: order.criadoEm || new Date().toISOString(),
    itens: order.itens.map(item => ({
      id: item.id,
      produtoNome: item.produto?.nome || 'Item',
      produtoPreco: item.produto?.preco || 0,
      quantidade: item.quantidade,
      observacoes: item.observacoes || '',
      subtotal: item.subtotal,
      opcoesSelecionadas: item.opcoesSelecionadas || []
    }))
  };
}

export function parseFirestoreOrder(data: any): Order {
  return {
    id: data.id,
    numero: data.numeroPedido || data.numero || 1,
    clienteNome: data.clienteNome || 'Cliente',
    clienteTelefone: data.clienteTelefone || '',
    tipoEntrega: data.tipoEntrega || 'delivery',
    endereco: data.endereco || '',
    bairro: data.bairro || '',
    mesa: data.mesa || '',
    itens: (data.itens || []).map((it: any) => ({
      id: it.id || String(Math.random()),
      produto: {
        id: it.id || 'p',
        nome: it.produtoNome || 'Item',
        categoria: 'geral',
        preco: it.produtoPreco || 0,
        descricao: '',
        foto: '',
        disponivel: true
      },
      quantidade: it.quantidade || 1,
      opcoesSelecionadas: it.opcoesSelecionadas || [],
      observacoes: it.observacoes || '',
      subtotal: it.subtotal || 0
    })),
    subtotal: data.subtotal || 0,
    taxaEntrega: data.taxaEntrega || 0,
    desconto: data.desconto || 0,
    total: data.total || 0,
    formaPagamento: data.formaPagamento || 'Pix',
    status: (data.status as OrderStatus) || 'recebido',
    criadoEm: data.criadoEm || new Date().toISOString(),
    observacoes: data.observacoes || ''
  };
}

// 1. ORDERS SUBSCRIPTION & MUTATION
export function subscribeToOrders(
  onUpdate: (orders: Order[]) => void, 
  onError?: (err: Error) => void
): () => void {
  try {
    const ordersCol = collection(db, ORDERS_COLLECTION);
    const q = query(ordersCol, limit(100));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedOrders: Order[] = [];
        snapshot.forEach((docSnap) => {
          if (docSnap.exists()) {
            loadedOrders.push(parseFirestoreOrder(docSnap.data()));
          }
        });

        // Ordena pelos mais recentes
        loadedOrders.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
        onUpdate(loadedOrders);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, ORDERS_COLLECTION);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, ORDERS_COLLECTION);
    return () => {};
  }
}

export async function syncOrderToFirestore(order: Order): Promise<void> {
  const payload = sanitizeOrderForFirestore(order);
  try {
    const orderDocRef = doc(db, ORDERS_COLLECTION, order.id);
    await setDoc(orderDocRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${ORDERS_COLLECTION}/${order.id}`);
  }
}

export async function updateOrderStatusInFirestore(orderId: string, status: OrderStatus): Promise<void> {
  try {
    const orderDocRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(orderDocRef, {
      status,
      atualizadoEm: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COLLECTION}/${orderId}`);
  }
}

// 2. STORE CONFIG SUBSCRIPTION & SYNC
export function subscribeToStoreConfig(
  onUpdate: (config: StoreConfig) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const configDocRef = doc(db, STORE_CONFIG_DOC, 'default');
    const unsubscribe = onSnapshot(
      configDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onUpdate(snapshot.data() as StoreConfig);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `${STORE_CONFIG_DOC}/default`);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${STORE_CONFIG_DOC}/default`);
    return () => {};
  }
}

export async function syncStoreConfigToFirestore(config: StoreConfig): Promise<void> {
  try {
    const configDocRef = doc(db, STORE_CONFIG_DOC, 'default');
    await setDoc(configDocRef, {
      ...config,
      atualizadoEm: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${STORE_CONFIG_DOC}/default`);
  }
}

// 3. PRODUCTS SYNC
export function subscribeToProducts(
  onUpdate: (products: Product[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const productsCol = collection(db, PRODUCTS_COLLECTION);
    const unsubscribe = onSnapshot(
      productsCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded: Product[] = [];
          snapshot.forEach(docSnap => {
            loaded.push(docSnap.data() as Product);
          });
          onUpdate(loaded);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, PRODUCTS_COLLECTION);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, PRODUCTS_COLLECTION);
    return () => {};
  }
}

export async function syncProductToFirestore(product: Product): Promise<void> {
  try {
    const productDocRef = doc(db, PRODUCTS_COLLECTION, product.id);
    await setDoc(productDocRef, {
      id: product.id,
      nome: product.nome,
      categoriaId: product.categoria,
      categoria: product.categoria,
      preco: Number(product.preco) || 0,
      precoPromocional: product.precoPromocional ? Number(product.precoPromocional) : null,
      descricao: product.descricao || '',
      foto: product.foto || '',
      disponivel: Boolean(product.disponivel),
      destaque: Boolean(product.destaque),
      selo: product.selo || '',
      tempoPreparoMin: product.tempoPreparoMin || 20,
      atualizadoEm: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${PRODUCTS_COLLECTION}/${product.id}`);
  }
}
