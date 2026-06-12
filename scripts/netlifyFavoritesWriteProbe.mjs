import { getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createNetlifyAdminAuthPayload } from './netlifyAdminAuth.mjs';

const action = process.argv[2];
const baseUrl = process.argv[3] || process.env.SMOKE_BASE_URL || 'https://loo-pyck.netlify.app';
const appId = process.argv[4] || process.env.FAVORITES_PROBE_APP_ID || 'default-app-id';
const query = process.argv[5] || process.env.FAVORITES_PROBE_QUERY || '남자 후드';
const favoriteId = process.argv[5] || '';

async function initDb() {
  const authPayload = await createNetlifyAdminAuthPayload();
  const app = getApps()[0];
  if (!app) {
    throw new Error('Firebase Admin app was not initialized.');
  }
  return {
    authPayload,
    db: getFirestore(app),
  };
}

async function readCount(collectionRef) {
  const snap = await collectionRef.get();
  return snap.size;
}

async function fetchProbeProduct() {
  const url = new URL('/api/realtime-search', baseUrl);
  url.searchParams.set('q', query);
  url.searchParams.set('page', '1');
  url.searchParams.set('pageSize', '1');
  url.searchParams.set('sort', 'sim');

  // The server-side aggregation budget alone is 12s; cold serverless starts
  // push first responses past 20s, so 15s here produced chronic false alarms.
  const response = await fetch(url, { signal: AbortSignal.timeout(35000) });
  if (!response.ok) {
    throw new Error(`Realtime search probe failed (${response.status})`);
  }

  const payload = await response.json();
  const product = Array.isArray(payload.products) ? payload.products[0] : null;
  if (!product?.id || !product?.source || !product?.title) {
    throw new Error('Realtime search probe did not return a valid product.');
  }

  return product;
}

function buildProbeFavorite(product) {
  const variantKey = `probe-${Date.now()}`;
  const favoriteId = `${product.source}:${product.id}:${variantKey}`;
  const params = new URLSearchParams({ source: product.source, variantKey });

  return {
    favoriteId,
    title: product.title,
    link: product.link || '',
    image: product.image || '',
    lprice: String(product.price ?? product.lprice ?? ''),
    hprice: String(product.price ?? product.hprice ?? product.lprice ?? ''),
    mallName: product.mallName || '',
    productId: product.id,
    productType: '1',
    brand: product.brand || '',
    maker: product.maker || '',
    category1: product.category1 || '',
    category2: product.category2 || '',
    category3: product.category3 || '',
    category4: product.category4 || '',
    source: product.source,
    variantKey,
    variantLabel: 'QA Probe Variant',
    deepLink: `/product/${encodeURIComponent(product.id)}?${params.toString()}`,
    createdAt: Date.now(),
  };
}

async function prepare() {
  const { authPayload, db } = await initDb();
  const collectionRef = db.collection(`artifacts/${appId}/users/${authPayload.adminUid}/favorites`);
  const beforeCount = await readCount(collectionRef);
  const product = await fetchProbeProduct();
  const favorite = buildProbeFavorite(product);
  await collectionRef.doc(favorite.favoriteId).set(favorite);
  const afterAddCount = await readCount(collectionRef);

  process.stdout.write(JSON.stringify({
    baseUrl,
    appId,
    adminUid: authPayload.adminUid,
    beforeCount,
    afterAddCount,
    favoriteId: favorite.favoriteId,
    title: favorite.title,
    deepLink: favorite.deepLink,
    source: favorite.source,
    productId: favorite.productId,
    query,
  }, null, 2));
}

async function cleanup() {
  if (!favoriteId) {
    throw new Error('cleanup requires a favoriteId argument.');
  }

  const { authPayload, db } = await initDb();
  const collectionRef = db.collection(`artifacts/${appId}/users/${authPayload.adminUid}/favorites`);
  await collectionRef.doc(favoriteId).delete();
  const afterRemoveCount = await readCount(collectionRef);

  process.stdout.write(JSON.stringify({
    baseUrl,
    appId,
    adminUid: authPayload.adminUid,
    favoriteId,
    afterRemoveCount,
  }, null, 2));
}

try {
  if (action === 'prepare') {
    await prepare();
  } else if (action === 'cleanup') {
    await cleanup();
  } else {
    throw new Error(`Unknown action: ${action}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
