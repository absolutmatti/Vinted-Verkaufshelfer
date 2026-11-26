import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRevenues,
  canMarkAsSold,
  filterItems,
  formatDescriptionWithHashtags,
  formatEuro,
  getStaleStatus,
  normalizeCondition,
  normalizeHashtags,
  stripBoilerplateDisclaimers,
  validatePin,
} from './vintedRules';
import type { VintedItem } from '../types';

function makeItem(overrides: Partial<VintedItem> = {}): VintedItem {
  return {
    id: 'item-1',
    title: 'Test Artikel',
    description: 'Schöner Pullover in gutem Zustand.',
    hashtags: ['#vintage', '#pullover', '#streetwear', '#herbst', '#secondhand'],
    category: 'Damen > Kleidung > Pullover & Strickjacken',
    brand: 'Zara',
    size: 'M',
    material: 'Baumwolle',
    color: 'Schwarz',
    condition: 'Sehr gut',
    priceBargain: 10,
    priceFair: 16,
    priceHigh: 22,
    images: ['data:image/jpeg;base64,abc'],
    ownerProfile: 'Matti',
    authorUid: 'local-matti',
    memberUids: ['local-matti'],
    status: 'available',
    createdAt: '2026-11-20T10:00:00.000Z',
    updatedAt: '2026-11-20T10:00:00.000Z',
    ...overrides,
  };
}

test('getStaleStatus flags 30+ days and 60+ days only on available items', () => {
  const now = new Date('2026-11-26T10:00:00.000Z');
  assert.equal(getStaleStatus(makeItem({ createdAt: '2026-11-10T10:00:00.000Z' }), now), 'none');
  assert.equal(getStaleStatus(makeItem({ createdAt: '2026-10-25T10:00:00.000Z' }), now), 'stale_30');
  assert.equal(getStaleStatus(makeItem({ createdAt: '2026-09-20T10:00:00.000Z' }), now), 'stale_60');
  assert.equal(
    getStaleStatus(makeItem({ status: 'sold', soldPrice: 20, createdAt: '2026-08-01T10:00:00.000Z' }), now),
    'none'
  );
});

test('calculateRevenues sums only sold items per owner and total', () => {
  const items: VintedItem[] = [
    makeItem({ id: '1', ownerProfile: 'Diana', status: 'sold', soldPrice: 45 }),
    makeItem({ id: '2', ownerProfile: 'Diana', status: 'sold', soldPrice: 12.5 }),
    makeItem({ id: '3', ownerProfile: 'Diana', status: 'available', priceFair: 100 }),
    makeItem({ id: '4', ownerProfile: 'Matti', status: 'sold', soldPrice: 62 }),
    makeItem({ id: '5', ownerProfile: 'Matti', status: 'available', priceFair: 50 }),
  ];

  const summary = calculateRevenues(items);
  assert.equal(summary.dianaRevenue, 57.5);
  assert.equal(summary.mattiRevenue, 62);
  assert.equal(summary.totalRevenue, 119.5);
  assert.equal(summary.dianaSoldCount, 2);
  assert.equal(summary.mattiSoldCount, 1);
  assert.equal(formatEuro(summary.dianaRevenue), '57,50');
  assert.equal(formatEuro(summary.mattiRevenue), '62');
});

test('filterItems combines owner, status, and search filters', () => {
  const items: VintedItem[] = [
    makeItem({ id: '1', ownerProfile: 'Matti', status: 'available', title: 'Carhartt Hoodie' }),
    makeItem({ id: '2', ownerProfile: 'Diana', status: 'available', title: 'Levis 501 Jeans' }),
    makeItem({ id: '3', ownerProfile: 'Matti', status: 'sold', soldPrice: 50, title: 'Nike Sneaker' }),
  ];

  assert.equal(filterItems(items, 'Matti', 'available').length, 1);
  assert.equal(filterItems(items, 'Alle', 'available').length, 2);
  assert.equal(filterItems(items, 'Diana', 'sold').length, 0);
  assert.equal(filterItems(items, 'Alle', 'all', 'jeans')[0].id, '2');
});

test('canMarkAsSold strictly enforces ownership and available status', () => {
  const mattiAvailable = makeItem({ ownerProfile: 'Matti', status: 'available' });
  const dianaAvailable = makeItem({ ownerProfile: 'Diana', status: 'available' });
  const mattiSold = makeItem({ ownerProfile: 'Matti', status: 'sold', soldPrice: 20 });

  assert.equal(canMarkAsSold(mattiAvailable, 'Matti'), true);
  assert.equal(canMarkAsSold(mattiAvailable, 'Diana'), false);
  assert.equal(canMarkAsSold(dianaAvailable, 'Matti'), false);
  assert.equal(canMarkAsSold(mattiSold, 'Matti'), false);
});

test('stripBoilerplateDisclaimers and formatDescriptionWithHashtags enforce clean Vinted copy', () => {
  const raw = 'Tolles Leinenkleid in Salbeigrün. Tierfreier Nichtraucherhaushalt. Privatverkauf, keine Rücknahme.';
  const cleaned = stripBoilerplateDisclaimers(raw);
  assert.equal(cleaned.includes('Nichtraucherhaushalt'), false);
  assert.equal(cleaned.includes('Privatverkauf'), false);

  const formatted = formatDescriptionWithHashtags(raw, ['Sommerkleid', '#leinen', 'leinen', '#zara']);
  assert.ok(formatted.endsWith('#sommerkleid #leinen #zara'));
  assert.deepEqual(normalizeHashtags(['#a', 'a', 'b c']), ['#a', '#bc']);
});

test('normalizeCondition and validatePin handle variants safely', () => {
  assert.equal(normalizeCondition('neu mit etikett'), 'Neu mit Etikett');
  assert.equal(normalizeCondition('Gut'), 'Gut');
  assert.equal(validatePin('2026', '2026'), true);
  assert.equal(validatePin('0000', '2026'), false);
  assert.equal(validatePin('', '2026'), false);
});
