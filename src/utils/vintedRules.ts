import type {
  OwnerFilter,
  ProfileName,
  RevenueSummary,
  StaleLevel,
  StatusFilter,
  VintedCondition,
  VintedItem,
} from '../types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const FORBIDDEN_BOILERPLATE_PATTERNS: RegExp[] = [
  /tierfreier\s+nichtraucherhaushalt/gi,
  /nichtraucherhaushalt/gi,
  /tierfreier\s+haushalt/gi,
  /privatverkauf[^.\n]*\.?/gi,
  /keine\s+garantie[^.\n]*\.?/gi,
  /keine\s+rücknahme[^.\n]*\.?/gi,
  /umtausch\s+ausgeschlossen[^.\n]*\.?/gi,
];

export function getDaysOnline(createdAtIso: string, now: Date = new Date()): number {
  const createdMs = new Date(createdAtIso).getTime();
  if (!Number.isFinite(createdMs)) return 0;
  const diffDays = Math.floor((now.getTime() - createdMs) / MS_PER_DAY);
  return Math.max(0, diffDays);
}

export function getStaleStatus(item: Pick<VintedItem, 'status' | 'createdAt'>, now: Date = new Date()): StaleLevel {
  if (item.status === 'sold') {
    return 'none';
  }
  const days = getDaysOnline(item.createdAt, now);
  if (days >= 60) return 'stale_60';
  if (days >= 30) return 'stale_30';
  return 'none';
}

export function calculateRevenues(items: readonly VintedItem[]): RevenueSummary {
  let dianaRevenue = 0;
  let mattiRevenue = 0;
  let dianaSoldCount = 0;
  let mattiSoldCount = 0;

  for (const item of items) {
    if (item.status !== 'sold') continue;
    const price = typeof item.soldPrice === 'number' && Number.isFinite(item.soldPrice) ? item.soldPrice : 0;
    if (item.ownerProfile === 'Diana') {
      dianaRevenue += price;
      dianaSoldCount += 1;
    } else if (item.ownerProfile === 'Matti') {
      mattiRevenue += price;
      mattiSoldCount += 1;
    }
  }

  return {
    dianaRevenue: roundCurrency(dianaRevenue),
    mattiRevenue: roundCurrency(mattiRevenue),
    totalRevenue: roundCurrency(dianaRevenue + mattiRevenue),
    dianaSoldCount,
    mattiSoldCount,
  };
}

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatEuro(amount: number): string {
  const rounded = roundCurrency(amount);
  return Number.isInteger(rounded)
    ? `${rounded}`
    : rounded.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function filterItems(
  items: readonly VintedItem[],
  ownerFilter: OwnerFilter,
  statusFilter: StatusFilter,
  searchQuery = ''
): VintedItem[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return items
    .filter((item) => {
      if (ownerFilter !== 'Alle' && item.ownerProfile !== ownerFilter) {
        return false;
      }
      if (statusFilter === 'available' && item.status !== 'available') {
        return false;
      }
      if (statusFilter === 'sold' && item.status !== 'sold') {
        return false;
      }
      if (normalizedQuery.length > 0) {
        const haystack = [
          item.title,
          item.brand,
          item.category,
          item.color,
          item.size,
          item.description,
          ...item.hashtags,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(normalizedQuery)) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function canMarkAsSold(item: Pick<VintedItem, 'ownerProfile' | 'status'>, currentProfile: ProfileName): boolean {
  return item.status === 'available' && item.ownerProfile === currentProfile;
}

export function normalizeHashtags(rawTags: readonly string[]): string[] {
  const cleaned: string[] = [];
  const seen = new Set<string>();

  for (const tag of rawTags) {
    const trimmed = tag.trim().replace(/^#+/, '').replace(/\s+/g, '');
    if (!trimmed) continue;
    const normalized = `#${trimmed.toLowerCase()}`;
    if (!seen.has(normalized)) {
      seen.add(normalized);
      cleaned.push(normalized);
    }
    if (cleaned.length >= 10) break;
  }

  return cleaned;
}

export function stripBoilerplateDisclaimers(text: string): string {
  let result = text;
  for (const pattern of FORBIDDEN_BOILERPLATE_PATTERNS) {
    result = result.replace(pattern, '');
  }
  return result.replace(/\n{3,}/g, '\n\n').replace(/\s{2,}/g, ' ').trim();
}

export function formatDescriptionWithHashtags(description: string, hashtags: readonly string[]): string {
  const cleanDescription = stripBoilerplateDisclaimers(description);
  const normalizedTags = normalizeHashtags(hashtags);

  // Avoid duplicating hashtags if already appended at the end of description
  const missingTags = normalizedTags.filter(
    (tag) => !cleanDescription.toLowerCase().includes(tag.toLowerCase())
  );

  if (missingTags.length === 0) {
    return cleanDescription;
  }

  return `${cleanDescription}\n\n${missingTags.join(' ')}`;
}

export function normalizeCondition(value: string): VintedCondition {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes('mit etikett')) return 'Neu mit Etikett';
  if (normalized.includes('ohne etikett')) return 'Neu ohne Etikett';
  if (normalized.includes('sehr gut')) return 'Sehr gut';
  if (normalized.includes('zufrieden')) return 'Zufriedenstellend';
  if (normalized.includes('gut')) return 'Gut';
  return 'Sehr gut';
}

export function validatePin(pin: string, expectedPin: string): boolean {
  return pin.trim().length >= 4 && pin.trim() === expectedPin.trim();
}
