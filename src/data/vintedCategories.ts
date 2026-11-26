export const VINTED_CATEGORY_TREE_TEXT = `
1. Damen / Herren (Struktur gilt jeweils für "Damen > ..." und "Herren > ..."):
   - Kleidung:
     - Damen > Kleidung > Pullover & Strickjacken (Hoodies, Cardigans, Rollkragen)
     - Damen > Kleidung > Oberteile & T-Shirts (Blusen, Tops, Poloshirts)
     - Damen > Kleidung > Hosen & Jeans (High-Waist, Skinny, Stoffhosen, Leggings, Shorts)
     - Damen > Kleidung > Kleider (Mini, Midi, Maxi, Abendkleider, Sommerkleider)
     - Damen > Kleidung > Jacken & Mäntel (Winterjacken, Jeansjacken, Lederjacken, Trenchcoats, Westen)
     - Damen > Kleidung > Röcke
     - Damen > Kleidung > Anzüge & Blazer
     - Damen > Kleidung > Sportbekleidung
     - Damen > Kleidung > Bademode
     - Damen > Kleidung > Unterwäsche & Nachtwäsche
     (Analog für Herren > Kleidung > ...)
   - Schuhe:
     - Damen > Schuhe > Sneaker / Stiefel & Boots / Absatzschuhe / Sandalen / Hausschuhe / Halbschuhe & Loafer / Sportschuhe
     - Herren > Schuhe > Sneaker / Stiefel & Boots / Sandalen / Hausschuhe / Halbschuhe & Loafer / Sportschuhe
   - Taschen:
     - Damen > Taschen > Handtaschen / Rucksäcke / Umhängetaschen / Clutches / Reisetaschen / Bauchtaschen
     - Herren > Taschen > Rucksäcke / Umhängetaschen / Reisetaschen / Bauchtaschen
   - Accessoires:
     - Damen / Herren > Accessoires > Schmuck / Uhren / Gürtel / Schals & Tücher / Mützen & Caps / Sonnenbrillen
   - Kosmetik:
     - Damen / Herren > Kosmetik > Parfüm / Make-up / Gesichtspflege / Haarpflege
2. Kinder:
   - Kinder > Mädchenkleidung > [Kleidungsart / Größe]
   - Kinder > Jungenkleidung > [Kleidungsart / Größe]
   - Kinder > Babys > [Kleidung / Ausstattung]
   - Kinder > Kinderschuhe > [Schuhart]
   - Kinder > Spielzeug > [Spielzeugart]
   - Kinder > Kinderwagen & Autositze > [Modell/Typ]
   - Kinder > Schulbedarf > [Ranzen / Zubehör]
3. Home:
   - Home > Textilien > Bettwäsche / Kissen / Decken / Handtücher / Vorhänge
   - Home > Dekoration > Vasen / Kerzenhalter / Bilderrahmen / Spiegel / Pflanzenübertöpfe
   - Home > Geschirr & Besteck > [Artikel]
   - Home > Küchenzubehör > [Artikel]
   - Home > Aufbewahrung > [Artikel]
4. Entertainment:
   - Entertainment > Bücher > Romane / Sachbücher / Manga / Kinderbücher
   - Entertainment > Videospiele & Konsolen > [Plattform / Spiel]
   - Entertainment > Musik > CDs / Vinyl
   - Entertainment > Filme > DVDs / Blu-ray
   - Entertainment > Brettspiele & Puzzles > [Art]
5. Haustiere:
   - Haustiere > Hunde > Leinen / Kleidung / Spielzeug / Betten
   - Haustiere > Katzen > [Zubehör / Spielzeug]
   - Haustiere > Kleintiere > [Zubehör]
`.trim();

export const VINTED_CATEGORY_SUGGESTIONS: readonly string[] = [
  'Damen > Kleidung > Kleider',
  'Damen > Kleidung > Pullover & Strickjacken',
  'Damen > Kleidung > Oberteile & T-Shirts',
  'Damen > Kleidung > Hosen & Jeans',
  'Damen > Kleidung > Jacken & Mäntel',
  'Damen > Kleidung > Röcke',
  'Damen > Kleidung > Anzüge & Blazer',
  'Damen > Kleidung > Sportbekleidung',
  'Damen > Schuhe > Sneaker',
  'Damen > Schuhe > Stiefel & Boots',
  'Damen > Schuhe > Sandalen',
  'Damen > Taschen > Handtaschen',
  'Damen > Taschen > Umhängetaschen',
  'Damen > Accessoires > Schmuck',
  'Damen > Accessoires > Sonnenbrillen',
  'Herren > Kleidung > Pullover & Strickjacken',
  'Herren > Kleidung > Oberteile & T-Shirts',
  'Herren > Kleidung > Hosen & Jeans',
  'Herren > Kleidung > Jacken & Mäntel',
  'Herren > Kleidung > Anzüge & Blazer',
  'Herren > Kleidung > Sportbekleidung',
  'Herren > Schuhe > Sneaker',
  'Herren > Schuhe > Stiefel & Boots',
  'Herren > Schuhe > Halbschuhe & Loafer',
  'Herren > Taschen > Rucksäcke',
  'Herren > Accessoires > Mützen & Caps',
  'Kinder > Mädchenkleidung > Oberteile & Kleider',
  'Kinder > Jungenkleidung > Pullover & Hosen',
  'Kinder > Babys > Babykleidung',
  'Kinder > Kinderschuhe > Sneaker',
  'Kinder > Spielzeug > Spiele & Baukästen',
  'Home > Textilien > Kissen & Decken',
  'Home > Dekoration > Vasen & Kerzenhalter',
  'Home > Geschirr & Besteck > Tassen & Teller',
  'Entertainment > Bücher > Romane',
  'Entertainment > Videospiele & Konsolen > Spiele',
  'Entertainment > Brettspiele & Puzzles > Brettspiele',
  'Haustiere > Hunde > Leinen & Geschirre',
];
