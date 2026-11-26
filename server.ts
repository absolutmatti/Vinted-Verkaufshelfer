import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { VINTED_CATEGORY_TREE_TEXT } from './src/data/vintedCategories.js';
import {
  normalizeCondition,
  normalizeHashtags,
  stripBoilerplateDisclaimers,
} from './src/utils/vintedRules.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

app.use(express.json({ limit: '15mb' }));

interface IncomingImagePart {
  mimeType: string;
  data: string;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY ist auf dem Server nicht konfiguriert.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const SYSTEM_INSTRUCTION = `Du bist ein erfahrener Vinted-Verkaufsprofi. Analysiere alle hochgeladenen Fotos eines Artikels (inklusive eventueller Größen-, Marken- oder Materialetiketten) und erstelle eine sofort verkaufsfertige Vinted-Anzeige auf Deutsch.

REGELN:
1. Titel: Kurz, prägnant, marken- und suchbegrifforientiert im typischen Vinted-Stil (max. 80 Zeichen).
2. Beschreibung: Freundlicher, ehrlicher, verkaufsfördernder Fließtext mit Nennung optischer Details, Schnitt/Passform und eventueller sichtbarer Mängel. KEINE Standard-Floskeln oder Disclaimer wie "Tierfreier Nichtraucherhaushalt", "Privatverkauf", "Keine Garantie" oder "Keine Rücknahme".
3. Hashtags: 5 bis 10 passende, reichweitenstarke deutsche/internationale Vinted-Hashtags (z.B. "#vintage", "#zara", "#sommerkleid") als Array.
4. Kategorie: Ordne den Artikel ZWINGEND in den exakten Vinted-Kategoriepfad im Format "Hauptkategorie > Unterkategorie > Spezifische Kategorie" ein. Nutze ausschließlich diese Wissensbasis:
${VINTED_CATEGORY_TREE_TEXT}
5. Pflichtfelder:
   - brand: Marke vom Etikett ablesen oder "Keine Marke", wenn nicht erkennbar.
   - size: Größe vom Etikett ablesen oder realistisch schätzen (z.B. "M", "38", "W30/L32", "42", "One Size").
   - material: Material vom Etikett ablesen oder optisch schätzen (z.B. "100% Baumwolle", "Leinen-Mix", "Leder").
   - color: Hauptfarbe auf Deutsch (z.B. "Salbeigrün", "Dunkelblau", "Anthrazit").
   - condition: Exakt einer dieser 5 Vinted-Werte: "Neu mit Etikett", "Neu ohne Etikett", "Sehr gut", "Gut", "Zufriedenstellend".
6. Preise (in Euro als ganze oder halbe Zahlen):
   - priceBargain: Schnäppchen-Preis für extrem schnellen Verkauf.
   - priceFair: Realistischer Vinted-Marktwert.
   - priceHigh: Verhandlungsbasis / Wucher-Preis (ca. +30-50% über dem fairen Preis, aber noch realistisch für Preisvorschläge).`;

app.post('/api/analyze-item', async (req, res) => {
  try {
    const body = req.body as { images?: IncomingImagePart[] };
    const images = Array.isArray(body?.images) ? body.images : [];

    if (images.length === 0) {
      res.status(400).json({ error: 'Bitte lade mindestens ein Foto des Artikels hoch.' });
      return;
    }

    if (images.length > 6) {
      res.status(400).json({ error: 'Es können maximal 6 Fotos gleichzeitig analysiert werden.' });
      return;
    }

    const ai = getGeminiClient();

    const parts = images.map((img) => ({
      inlineData: {
        mimeType: img.mimeType || 'image/jpeg',
        data: img.data.replace(/^data:[^;]+;base64,/, ''),
      },
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: {
        parts: [
          ...parts,
          {
            text: 'Analysiere diese Produktfotos und Etiketten für ein Vinted-Inserat und gib das Ergebnis exakt als JSON zurück.',
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Kurzer Vinted-Titel mit Marke und Artikelart.' },
            description: {
              type: Type.STRING,
              description: 'Verkaufsfördernde Beschreibung ohne Disclaimer und ohne Hashtags am Ende.',
            },
            hashtags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '5 bis 10 passende Hashtags inklusive #.',
            },
            category: {
              type: Type.STRING,
              description: 'Exakter Pfad: Hauptkategorie > Unterkategorie > Spezifische Kategorie',
            },
            brand: { type: Type.STRING },
            size: { type: Type.STRING },
            material: { type: Type.STRING },
            color: { type: Type.STRING },
            condition: {
              type: Type.STRING,
              description:
                'Einer der Werte: Neu mit Etikett, Neu ohne Etikett, Sehr gut, Gut, Zufriedenstellend',
            },
            priceBargain: { type: Type.NUMBER },
            priceFair: { type: Type.NUMBER },
            priceHigh: { type: Type.NUMBER },
          },
          required: [
            'title',
            'description',
            'hashtags',
            'category',
            'brand',
            'size',
            'material',
            'color',
            'condition',
            'priceBargain',
            'priceFair',
            'priceHigh',
          ],
        },
      },
    });

    const rawText = (response.text ?? '{}').trim();
    const parsed = JSON.parse(rawText) as Record<string, unknown>;

    const priceFair = Math.max(1, Math.round(Number(parsed.priceFair) || 15));
    const priceBargain = Math.max(1, Math.round(Number(parsed.priceBargain) || Math.round(priceFair * 0.7)));
    const priceHigh = Math.max(
      priceFair + 1,
      Math.round(Number(parsed.priceHigh) || Math.round(priceFair * 1.4))
    );

    const hashtags = normalizeHashtags(
      Array.isArray(parsed.hashtags) ? parsed.hashtags.map((t) => String(t)) : []
    );

    res.json({
      title: String(parsed.title || 'Vinted Artikel').slice(0, 140),
      description: stripBoilerplateDisclaimers(String(parsed.description || '')),
      hashtags:
        hashtags.length >= 5
          ? hashtags
          : normalizeHashtags([...hashtags, '#vinted', '#secondhand', '#fashion', '#preloved', '#style']),
      category: String(parsed.category || 'Damen > Kleidung > Oberteile & T-Shirts'),
      brand: String(parsed.brand || 'Keine Marke'),
      size: String(parsed.size || 'One Size'),
      material: String(parsed.material || 'Unbekannt'),
      color: String(parsed.color || 'Mehrfarbig'),
      condition: normalizeCondition(String(parsed.condition || 'Sehr gut')),
      priceBargain,
      priceFair,
      priceHigh,
    });
  } catch (err) {
    console.error('Gemini vision analysis error:', err);
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler bei der KI-Analyse.';
    res.status(500).json({ error: message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.use((_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Vinted-Verkaufshelfer server running at http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
