import levisImg from '../assets/images/seed_levis_jeans_1795684263495.jpg';
import hoodieImg from '../assets/images/seed_carhartt_hoodie_1795684263262.jpg';
import dressImg from '../assets/images/seed_sage_dress_1795684263048.jpg';
import sneakerImg from '../assets/images/seed_white_sneakers_1795684265259.jpg';
import type { VintedItem } from '../types';

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export const SEED_ITEMS: VintedItem[] = [
  {
    id: 'seed-levis-501',
    title: "Vintage Levi's 501 Jeans Blau W28/L30",
    description:
      'Klassische Levi’s 501 Straight-Fit Jeans in zeitloser mittelblauer Waschung mit typischer Knopfleiste. Sitzt angenehm hoch in der Taille und hat einen schönen Vintage-Fade an den Taschen. Keine Löcher oder Flecken.',
    hashtags: ['#levis501', '#vintagejeans', '#denim', '#straightfit', '#momjeans', '#secondhand'],
    category: 'Damen > Kleidung > Hosen & Jeans',
    brand: "Levi's",
    size: 'W28 / L30',
    material: '100% Baumwolle',
    color: 'Mittelblau',
    condition: 'Sehr gut',
    priceBargain: 28,
    priceFair: 42,
    priceHigh: 58,
    images: [levisImg],
    ownerProfile: 'Diana',
    authorUid: 'local-diana',
    memberUids: ['local-matti', 'local-diana'],
    status: 'available',
    createdAt: daysAgoIso(68),
    updatedAt: daysAgoIso(68),
  },
  {
    id: 'seed-carhartt-hoodie',
    title: 'Carhartt WIP Heavyweight Hoodie Anthrazit L',
    description:
      'Dicker Kapuzenpullover von Carhartt WIP aus schwerer Baumwolle in dunklem Anthrazit. Weiche Innenseite, Kängurutasche vorne und robuster Rippstrick an den Bündchen. Minimal verwaschen im coolen Vintage-Look.',
    hashtags: ['#carharttwip', '#hoodie', '#streetwear', '#anthrazit', '#heavyweight', '#herrenmode'],
    category: 'Herren > Kleidung > Pullover & Strickjacken',
    brand: 'Carhartt WIP',
    size: 'L',
    material: '100% Baumwolle',
    color: 'Anthrazit',
    condition: 'Gut',
    priceBargain: 32,
    priceFair: 48,
    priceHigh: 65,
    images: [hoodieImg],
    ownerProfile: 'Matti',
    authorUid: 'local-matti',
    memberUids: ['local-matti', 'local-diana'],
    status: 'available',
    createdAt: daysAgoIso(35),
    updatedAt: daysAgoIso(35),
  },
  {
    id: 'seed-zara-dress',
    title: 'Zara Leinen-Midikleid mit Bindegürtel Salbei S',
    description:
      'Luftiges Midikleid in Salbeigrün mit V-Ausschnitt, lockerem Gürtel in der Taille und Volantsaum. Perfekt für Frühling und Sommer. Einmal getragen, frisch gewaschen und ohne Mängel.',
    hashtags: ['#zara', '#midikleid', '#leinenkleid', '#salbeigrün', '#sommerkleid', '#boho'],
    category: 'Damen > Kleidung > Kleider',
    brand: 'Zara',
    size: 'S / 36',
    material: '55% Leinen, 45% Viskose',
    color: 'Salbeigrün',
    condition: 'Sehr gut',
    priceBargain: 18,
    priceFair: 28,
    priceHigh: 38,
    images: [dressImg],
    ownerProfile: 'Diana',
    authorUid: 'local-diana',
    memberUids: ['local-matti', 'local-diana'],
    status: 'sold',
    soldPrice: 28,
    soldAt: daysAgoIso(6),
    createdAt: daysAgoIso(21),
    updatedAt: daysAgoIso(6),
  },
  {
    id: 'seed-nb-sneaker',
    title: 'New Balance 574 Classic Sneaker Weiß/Grau 43',
    description:
      'Bequeme Retro-Sneaker aus Leder- und Mesh-Mix in Off-White und Hellgrau. Sohle noch sehr gut erhalten, leichte normale Tragespuren an der Spitze, frisch gereinigt.',
    hashtags: ['#newbalance', '#nb574', '#sneaker', '#retro', '#weiß', '#herrenschuhe'],
    category: 'Herren > Schuhe > Sneaker',
    brand: 'New Balance',
    size: '43',
    material: 'Leder & Textil',
    color: 'Weiß / Hellgrau',
    condition: 'Gut',
    priceBargain: 30,
    priceFair: 45,
    priceHigh: 60,
    images: [sneakerImg],
    ownerProfile: 'Matti',
    authorUid: 'local-matti',
    memberUids: ['local-matti', 'local-diana'],
    status: 'sold',
    soldPrice: 44,
    soldAt: daysAgoIso(3),
    createdAt: daysAgoIso(18),
    updatedAt: daysAgoIso(3),
  },
];
