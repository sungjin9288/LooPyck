import { Product } from '@/types/product';

const FAVORITES_KEY = 'fashion-favorites';
const RECENT_SEARCHES_KEY = 'fashion-recent-searches';
const PRICE_ALERTS_KEY = 'fashion-price-alerts';

// 찜 목록 관련 함수
export function getFavorites(): Product[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addFavorite(product: Product): void {
  const favorites = getFavorites();
  const exists = favorites.some((item) => item.productId === product.productId);
  if (!exists) {
    favorites.unshift(product);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
}

export function removeFavorite(productId: string): void {
  const favorites = getFavorites();
  const filtered = favorites.filter((item) => item.productId !== productId);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
}

export function isFavorite(productId: string): boolean {
  const favorites = getFavorites();
  return favorites.some((item) => item.productId === productId);
}

// 최근 검색어 관련 함수
export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(RECENT_SEARCHES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(query: string): void {
  let searches = getRecentSearches();
  searches = searches.filter((item) => item !== query);
  searches.unshift(query);
  searches = searches.slice(0, 10); // 최대 10개까지만 저장
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
}

export function clearRecentSearches(): void {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

// 가격 알림 관련 타입 및 함수
export interface PriceAlert {
  productId: string;
  productTitle: string;
  productImage: string;
  targetPrice: number;
  currentPrice: number;
  createdAt: string;
}

export function getPriceAlerts(): PriceAlert[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(PRICE_ALERTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addPriceAlert(alert: PriceAlert): void {
  const alerts = getPriceAlerts();
  const exists = alerts.some((item) => item.productId === alert.productId);
  if (!exists) {
    alerts.push(alert);
    localStorage.setItem(PRICE_ALERTS_KEY, JSON.stringify(alerts));
  }
}

export function removePriceAlert(productId: string): void {
  const alerts = getPriceAlerts();
  const filtered = alerts.filter((item) => item.productId !== productId);
  localStorage.setItem(PRICE_ALERTS_KEY, JSON.stringify(filtered));
}

export function updatePriceAlert(productId: string, currentPrice: number): boolean {
  const alerts = getPriceAlerts();
  const alert = alerts.find((item) => item.productId === productId);

  if (alert && currentPrice <= alert.targetPrice) {
    // 가격이 목표가 이하로 떨어졌음
    return true;
  }

  return false;
}
