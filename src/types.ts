export type ProfileName = 'Matti' | 'Diana';

export type ItemStatus = 'available' | 'sold';

export type VintedCondition =
  | 'Neu mit Etikett'
  | 'Neu ohne Etikett'
  | 'Sehr gut'
  | 'Gut'
  | 'Zufriedenstellend';

export const VINTED_CONDITIONS: readonly VintedCondition[] = [
  'Neu mit Etikett',
  'Neu ohne Etikett',
  'Sehr gut',
  'Gut',
  'Zufriedenstellend',
];

export interface VintedItem {
  id: string;
  title: string;
  description: string;
  hashtags: string[];
  category: string;
  brand: string;
  size: string;
  material: string;
  color: string;
  condition: VintedCondition;
  priceBargain: number;
  priceFair: number;
  priceHigh: number;
  images: string[];
  ownerProfile: ProfileName;
  authorUid: string;
  memberUids: string[];
  status: ItemStatus;
  soldPrice?: number;
  soldAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GeminiAnalysisResult {
  title: string;
  description: string;
  hashtags: string[];
  category: string;
  brand: string;
  size: string;
  material: string;
  color: string;
  condition: VintedCondition;
  priceBargain: number;
  priceFair: number;
  priceHigh: number;
}

export type OwnerFilter = 'Alle' | ProfileName;
export type StatusFilter = 'available' | 'sold' | 'all';

export type StaleLevel = 'none' | 'stale_30' | 'stale_60';

export interface RevenueSummary {
  dianaRevenue: number;
  mattiRevenue: number;
  totalRevenue: number;
  dianaSoldCount: number;
  mattiSoldCount: number;
}

export interface SessionState {
  profile: ProfileName;
  loggedInAt: string;
}
