import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  query,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Order, OrderStatus, Product, StoreConfig } from '../types';

const ORDERS_COLLECTION = 'orders';
const STORE_CONFIG_DOC = 'store_config';
const PRODUCTS_COLLECTION = 'products';

// Remove undefined properties recursively so Firestore setDoc/writeBatch never throws
function cleanUndefined<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function sanitizeId(rawId: string): string {
  const cleaned = String(rawId || 'item_' + Date.now()).replace(/[^a-zA-Z0-9_-]/g, '_');
  return cleaned.slice(0, 64) || 'item_default';
}

export function sanitizeStoreId(rawStoreId?: string | null): string {
  if (!rawStoreId || !rawStoreId.trim()) return 'default';
  const cleaned = rawStoreId.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
  return cleaned.slice(0, 48) || 'default';
}

function makeScopedProductId(rawId: string, storeId: string): string {
  const safeStore = sanitizeStoreId(storeId);
  const safeBase = sanitizeId(rawId);
  if (safeStore === 'default') return safeBase;
  const prefix = `${safeStore}_`;
  if (safeBase.startsWith(prefix)) return safeBase.slice(0, 64);
  return `${prefix}${safeBase}`.slice(0, 64);
}

// Helper to convert Firestore order payload cleanly
function sanitizeOrderForFirestore(order: Order, storeId: string = 'default'): Record<string, any> {
  const targetStoreId = sanitizeStoreId(storeId || order.storeId || 'default');
  const safeId = sanitizeId(order.id);
  return cleanUndefined({
    id: safeId,
    storeId: targetStoreId,
    numeroPedido: Number(order.numero) || 101,
    numero: Number(order.numero) || 101,
    clienteNome: (order.clienteNome || 'Cliente').slice(0, 100),
    clienteTelefone: (order.clienteTelefone || '').slice(0, 30),
    formaPagamento: order.formaPagamento || 'Pix',
    status: order.status || 'recebido',
    total: Math.max(0, Number(order.total) || 0),
    tipoEntrega: order.tipoEntrega || 'delivery',
    endereco: order.endereco || '',
    bairro: order.bairro || '',
    mesa: order.mesa || '',
    subtotal: Number(order.subtotal) || 0,
    taxaEntrega: Number(order.taxaEntrega) || 0,
    desconto: Number(order.desconto) || 0,
    observacoes: order.observacoes || '',
    tempoEstimadoMin: Number(order.tempoEstimadoMin) || 35,
    criadoEm: order.criadoEm || new Date().toISOString(),
    itens: (order.itens || []).map((item) => ({
      id: item.id || 'item_' + Date.now(),
      produtoNome: item.produto?.nome || 'Item',
      produtoPreco: Number(item.produto?.preco) || 0,
      produtoFoto: item.produto?.foto || '',
      produtoCategoria: item.produto?.categoria || 'geral',
      quantidade: Number(item.quantidade) || 1,
      saboresMeioAMeio: item.saboresMeioAMeio || [],
      observacoes: item.observacoes || '',
      subtotal: Number(item.subtotal) || 0,
      opcoesSelecionadas: item.opcoesSelecionadas || [],
    })),
  });
}

export function parseFirestoreOrder(data: any): Order {
  return {
    id: data.id,
    storeId: data.storeId || 'default',
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
        categoria: it.produtoCategoria || 'geral',
        preco: Number(it.produtoPreco) || 0,
        descricao: '',
        foto: it.produtoFoto || '',
        disponivel: true,
      },
      quantidade: Number(it.quantidade) || 1,
      saboresMeioAMeio: it.saboresMeioAMeio && it.saboresMeioAMeio.length > 0 ? it.saboresMeioAMeio : undefined,
      opcoesSelecionadas: it.opcoesSelecionadas || [],
      observacoes: it.observacoes || '',
      subtotal: Number(it.subtotal) || 0,
    })),
    subtotal: Number(data.subtotal) || 0,
    taxaEntrega: Number(data.taxaEntrega) || 0,
    desconto: Number(data.desconto) || 0,
    total: Number(data.total) || 0,
    formaPagamento: data.formaPagamento || 'Pix',
    status: (data.status as OrderStatus) || 'recebido',
    criadoEm: data.criadoEm || new Date().toISOString(),
    observacoes: data.observacoes || '',
    tempoEstimadoMin: data.tempoEstimadoMin || 35,
  };
}

function sanitizeProductForFirestore(product: Product, storeId: string = 'default'): Record<string, any> {
  const targetStoreId = sanitizeStoreId(storeId || product.storeId || 'default');
  const safeId = makeScopedProductId(product.id, targetStoreId);
  return cleanUndefined({
    ...product,
    id: safeId,
    storeId: targetStoreId,
    nome: (product.nome || 'Produto').slice(0, 100),
    categoriaId: (product.categoria || 'geral').slice(0, 50),
    categoria: (product.categoria || 'geral').slice(0, 50),
    segmento: product.segmento || 'hamburgueria',
    preco: Math.max(0, Number(product.preco) || 0),
    precoPromocional: product.precoPromocional !== undefined ? Number(product.precoPromocional) : null,
    descricao: product.descricao || '',
    foto: product.foto || '',
    disponivel: Boolean(product.disponivel),
    destaque: Boolean(product.destaque),
    selo: product.selo || '',
    tempoPreparoMin: Number(product.tempoPreparoMin) || 20,
    unidadeMedida: product.unidadeMedida || 'unidade',
    opcoes: product.opcoes || [],
    permiteMeioAMeio: Boolean(product.permiteMeioAMeio),
    tamanhosPreco: product.tamanhosPreco || null,
    criadoEm: product.criadoEm || new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  });
}

export function parseFirestoreProduct(data: any): Product {
  return {
    id: data.id,
    storeId: data.storeId || 'default',
    nome: data.nome || 'Produto',
    categoria: data.categoria || data.categoriaId || 'geral',
    segmento: data.segmento || 'hamburgueria',
    preco: Number(data.preco) || 0,
    precoPromocional: data.precoPromocional !== null && data.precoPromocional !== undefined ? Number(data.precoPromocional) : undefined,
    descricao: data.descricao || '',
    foto: data.foto || '',
    disponivel: data.disponivel !== undefined ? Boolean(data.disponivel) : true,
    destaque: Boolean(data.destaque),
    selo: data.selo || undefined,
    tempoPreparoMin: data.tempoPreparoMin ? Number(data.tempoPreparoMin) : undefined,
    unidadeMedida: data.unidadeMedida || 'unidade',
    opcoes: Array.isArray(data.opcoes) ? data.opcoes : [],
    permiteMeioAMeio: Boolean(data.permiteMeioAMeio),
    tamanhosPreco: data.tamanhosPreco || undefined,
    criadoEm: data.criadoEm || undefined,
    atualizadoEm: data.atualizadoEm || undefined,
  };
}

// 1. ORDERS SUBSCRIPTION & MUTATION (ISOLATED BY STORE_ID)
export function subscribeToOrders(
  onUpdate: (orders: Order[]) => void,
  onError?: (err: Error) => void,
  storeId: string = 'default'
): () => void {
  const targetStoreId = sanitizeStoreId(storeId);
  try {
    const ordersCol = collection(db, ORDERS_COLLECTION);
    const q = query(ordersCol, limit(150));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedOrders: Order[] = [];
        snapshot.forEach((docSnap) => {
          if (docSnap.exists()) {
            const raw = docSnap.data();
            const docStoreId = sanitizeStoreId(raw.storeId || 'default');
            if (docStoreId === targetStoreId) {
              loadedOrders.push(parseFirestoreOrder(raw));
            }
          }
        });

        loadedOrders.sort((a, b) => {
          const tA = Date.parse(a.criadoEm) || 0;
          const tB = Date.parse(b.criadoEm) || 0;
          return tB - tA;
        });
        onUpdate(loadedOrders);
      },
      (error) => {
        console.warn('Firestore orders listener warning:', error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.warn('Failed to subscribe to orders:', error);
    return () => {};
  }
}

export async function syncOrderToFirestore(order: Order, storeId: string = 'default'): Promise<void> {
  const payload = sanitizeOrderForFirestore(order, storeId);
  try {
    const orderDocRef = doc(db, ORDERS_COLLECTION, payload.id);
    await setDoc(orderDocRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${ORDERS_COLLECTION}/${payload.id}`);
  }
}

export async function updateOrderStatusInFirestore(orderId: string, status: OrderStatus): Promise<void> {
  const safeId = sanitizeId(orderId);
  try {
    const orderDocRef = doc(db, ORDERS_COLLECTION, safeId);
    await updateDoc(orderDocRef, {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COLLECTION}/${safeId}`);
  }
}

export function subscribeToSingleOrder(
  orderId: string,
  onUpdate: (order: Order | null) => void
): () => void {
  const safeId = sanitizeId(orderId);
  try {
    const orderDocRef = doc(db, ORDERS_COLLECTION, safeId);
    return onSnapshot(
      orderDocRef,
      (snap) => {
        if (snap.exists()) {
          onUpdate(parseFirestoreOrder(snap.data()));
        } else {
          onUpdate(null);
        }
      },
      (err) => {
        console.warn('Single order subscription warning:', err);
      }
    );
  } catch (err) {
    console.warn('Failed to subscribe to single order:', err);
    return () => {};
  }
}

export async function clearAllOrdersInFirestore(storeId: string = 'default'): Promise<void> {
  const targetStoreId = sanitizeStoreId(storeId);
  try {
    const existingSnap = await getDocs(collection(db, ORDERS_COLLECTION));
    if (existingSnap.empty) return;
    const batch = writeBatch(db);
    existingSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const docStoreId = sanitizeStoreId(data.storeId || 'default');
      if (docStoreId === targetStoreId) {
        batch.delete(docSnap.ref);
      }
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, ORDERS_COLLECTION);
  }
}

// 2. STORE CONFIG SUBSCRIPTION & MULTI-STORE REGISTRY
export function subscribeToAllStores(
  onUpdate: (stores: StoreConfig[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const storesCol = collection(db, STORE_CONFIG_DOC);
    return onSnapshot(
      storesCol,
      (snapshot) => {
        const list: StoreConfig[] = [];
        snapshot.forEach((docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as StoreConfig;
            list.push({
              ...data,
              id: docSnap.id,
            });
          }
        });
        onUpdate(list);
      },
      (error) => {
        console.warn('Erro ao listar estabelecimentos:', error);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    console.warn('Falha ao assinar lista de estabelecimentos:', error);
    return () => {};
  }
}

export function subscribeToStoreConfig(
  onUpdate: (config: StoreConfig | null, exists: boolean) => void,
  onError?: (err: Error) => void,
  storeId: string = 'default'
): () => void {
  const targetStoreId = sanitizeStoreId(storeId);
  try {
    const configDocRef = doc(db, STORE_CONFIG_DOC, targetStoreId);
    const unsubscribe = onSnapshot(
      configDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as StoreConfig;
          onUpdate({ ...data, id: targetStoreId }, true);
        } else {
          onUpdate(null, false);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `${STORE_CONFIG_DOC}/${targetStoreId}`);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${STORE_CONFIG_DOC}/${targetStoreId}`);
    return () => {};
  }
}

export async function syncStoreConfigToFirestore(config: StoreConfig, storeId?: string): Promise<void> {
  const targetStoreId = sanitizeStoreId(storeId || config.id || 'default');
  try {
    const configDocRef = doc(db, STORE_CONFIG_DOC, targetStoreId);
    const sanitized = cleanUndefined({
      ...config,
      id: targetStoreId,
      nome: (config.nome || 'Estabelecimento').slice(0, 100),
      whatsapp: (config.whatsapp || '5565999999999').slice(0, 20),
      atualizadoEm: new Date().toISOString(),
    });
    await setDoc(configDocRef, sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${STORE_CONFIG_DOC}/${targetStoreId}`);
  }
}

// 3. PRODUCTS SUBSCRIPTION, SINGLE SYNC, BATCH SYNC & DELETE (ISOLATED BY STORE_ID)
export function subscribeToProducts(
  onUpdate: (products: Product[], isEmpty: boolean) => void,
  onError?: (err: Error) => void,
  storeId: string = 'default'
): () => void {
  const targetStoreId = sanitizeStoreId(storeId);
  try {
    const productsCol = collection(db, PRODUCTS_COLLECTION);
    const unsubscribe = onSnapshot(
      productsCol,
      (snapshot) => {
        const loaded: Product[] = [];
        snapshot.forEach((docSnap) => {
          if (docSnap.exists()) {
            const raw = docSnap.data();
            const docStoreId = sanitizeStoreId(raw.storeId || 'default');
            if (docStoreId === targetStoreId) {
              loaded.push(parseFirestoreProduct(raw));
            }
          }
        });
        if (loaded.length === 0) {
          onUpdate([], true);
          return;
        }
        onUpdate(loaded, false);
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

export async function syncProductToFirestore(product: Product, storeId: string = 'default'): Promise<void> {
  const payload = sanitizeProductForFirestore(product, storeId);
  try {
    const productDocRef = doc(db, PRODUCTS_COLLECTION, payload.id);
    await setDoc(productDocRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${PRODUCTS_COLLECTION}/${payload.id}`);
  }
}

export async function deleteProductFromFirestore(productId: string, storeId: string = 'default'): Promise<void> {
  const safeId = makeScopedProductId(productId, storeId);
  try {
    const productDocRef = doc(db, PRODUCTS_COLLECTION, safeId);
    await deleteDoc(productDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${PRODUCTS_COLLECTION}/${safeId}`);
  }
}

export async function syncProductsBatchToFirestore(
  products: Product[],
  replaceAll: boolean = false,
  storeId: string = 'default'
): Promise<void> {
  const targetStoreId = sanitizeStoreId(storeId);
  try {
    const batch = writeBatch(db);
    const newIds = new Set<string>();

    products.forEach((product) => {
      const payload = sanitizeProductForFirestore(product, targetStoreId);
      newIds.add(payload.id);
      const ref = doc(db, PRODUCTS_COLLECTION, payload.id);
      batch.set(ref, payload, { merge: true });
    });

    if (replaceAll) {
      const existingSnap = await getDocs(collection(db, PRODUCTS_COLLECTION));
      existingSnap.forEach((docSnap) => {
        const raw = docSnap.data();
        const docStoreId = sanitizeStoreId(raw.storeId || 'default');
        if (docStoreId === targetStoreId && !newIds.has(docSnap.id)) {
          batch.delete(docSnap.ref);
        }
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, PRODUCTS_COLLECTION);
  }
}

