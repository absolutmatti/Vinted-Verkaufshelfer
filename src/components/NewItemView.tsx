import React, { useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, ScanSearch, Trash2 } from 'lucide-react';
import { VINTED_CATEGORY_SUGGESTIONS } from '../data/vintedCategories';
import {
  analyzeItemImages,
  processUploadedImage,
  type CompressedImage,
} from '../services/geminiService';
import { VINTED_CONDITIONS, type ProfileName, type VintedCondition, type VintedItem } from '../types';
import { formatDescriptionWithHashtags, normalizeHashtags } from '../utils/vintedRules';
import { CopyButton } from './CopyButton';

interface NewItemViewProps {
  currentProfile: ProfileName;
  onSaveItem: (item: Omit<VintedItem, 'id' | 'authorUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export const NewItemView: React.FC<NewItemViewProps> = ({ currentProfile, onSaveItem }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<CompressedImage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hashtagsText, setHashtagsText] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState('');
  const [material, setMaterial] = useState('');
  const [color, setColor] = useState('');
  const [condition, setCondition] = useState<VintedCondition>('Sehr gut');
  const [priceBargain, setPriceBargain] = useState('');
  const [priceFair, setPriceFair] = useState('');
  const [priceHigh, setPriceHigh] = useState('');

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setAnalyzeError(null);
    const remainingSlots = Math.max(0, 4 - images.length);
    const selected = Array.from(files).slice(0, remainingSlots);
    try {
      const processed = await Promise.all(selected.map((file) => processUploadedImage(file)));
      setImages((prev) => [...prev, ...processed].slice(0, 4));
    } catch (err) {
      setAnalyzeError(
        err instanceof Error ? err.message : 'Fotos konnten nicht verarbeitet werden.'
      );
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAnalyze = async () => {
    if (images.length === 0) {
      setAnalyzeError('Bitte lade zuerst mindestens ein Foto hoch.');
      return;
    }
    setIsAnalyzing(true);
    setAnalyzeError(null);
    try {
      const result = await analyzeItemImages(images);
      setTitle(result.title);
      setDescription(result.description);
      setHashtagsText(result.hashtags.join(' '));
      setCategory(result.category);
      setBrand(result.brand);
      setSize(result.size);
      setMaterial(result.material);
      setColor(result.color);
      setCondition(result.condition);
      setPriceBargain(String(result.priceBargain));
      setPriceFair(String(result.priceFair));
      setPriceHigh(String(result.priceHigh));
    } catch (err) {
      setAnalyzeError(
        err instanceof Error ? err.message : 'Die KI-Analyse konnte nicht durchgeführt werden.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const parsedHashtags = normalizeHashtags(
    hashtagsText
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  );

  const fullDescriptionForCopy = formatDescriptionWithHashtags(description, parsedHashtags);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    if (images.length === 0) {
      setSaveError('Bitte füge mindestens ein Artikelfoto hinzu.');
      return;
    }
    if (!title.trim() || !description.trim() || !category.trim()) {
      setSaveError('Bitte fülle Titel, Beschreibung und Vinted-Kategorie aus.');
      return;
    }

    const bargain = Number(priceBargain.replace(',', '.'));
    const fair = Number(priceFair.replace(',', '.'));
    const high = Number(priceHigh.replace(',', '.'));

    if (!Number.isFinite(fair) || fair <= 0) {
      setSaveError('Bitte gib mindestens einen gültigen fairen Preis in Euro ein.');
      return;
    }

    setIsSaving(true);
    try {
      await onSaveItem({
        title: title.trim(),
        description: description.trim(),
        hashtags: parsedHashtags,
        category: category.trim(),
        brand: brand.trim() || 'Keine Marke',
        size: size.trim() || 'One Size',
        material: material.trim() || 'Unbekannt',
        color: color.trim() || 'Mehrfarbig',
        condition,
        priceBargain: Number.isFinite(bargain) && bargain > 0 ? bargain : Math.max(1, Math.round(fair * 0.7)),
        priceFair: fair,
        priceHigh: Number.isFinite(high) && high > 0 ? high : Math.round(fair * 1.4),
        images: images.map((img) => img.thumbnailDataUrl),
        ownerProfile: currentProfile,
        status: 'available',
      });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Artikel konnte nicht gespeichert werden.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left column: Photo upload + AI trigger */}
      <section className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900">1. Artikel-Fotos hochladen</h2>
          <p className="text-sm text-[#005F68] bg-[#E6F4F5] rounded-xl px-3.5 py-2.5 font-medium">
            Tipp: Fotografiere auch das Größen-/Markenetikett für beste Ergebnisse
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="hidden"
        />

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={images.length >= 4}
            className="min-h-[48px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Camera className="w-4 h-4 text-[#007782]" />
            <span>Kamera</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= 4}
            className="min-h-[48px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <ImagePlus className="w-4 h-4 text-[#007782]" />
            <span>Galerie ({images.length}/4)</span>
          </button>
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200"
              >
                <img
                  src={img.thumbnailDataUrl}
                  alt={`Vorschau ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  aria-label={`Foto ${idx + 1} entfernen`}
                  className="absolute top-1.5 right-1.5 min-h-[36px] min-w-[36px] rounded-lg bg-black/65 text-white flex items-center justify-center hover:bg-black/85 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isAnalyzing || images.length === 0}
          className={`w-full min-h-[48px] rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            images.length === 0
              ? 'bg-slate-200 text-slate-600 cursor-not-allowed'
              : 'bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-70'
          }`}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Gemini analysiert Fotos &amp; Etiketten...</span>
            </>
          ) : (
            <>
              <ScanSearch className="w-4 h-4" />
              <span>Mit Gemini Vision analysieren</span>
            </>
          )}
        </button>

        {analyzeError && (
          <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
            {analyzeError}
          </p>
        )}
      </section>

      {/* Right column: Editable Vinted template + One-Click-Copy + Save */}
      <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">2. Vinted-Vorlage prüfen &amp; kopieren</h2>

        {/* Title with One-Click-Copy */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="item-title" className="text-sm font-medium text-slate-800">
              Titel
            </label>
            <CopyButton text={title} label="Titel kopieren" compact />
          </div>
          <input
            id="item-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z.B. Levi's 501 Vintage Jeans Blau W28"
            className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007782]"
          />
        </div>

        {/* Description with One-Click-Copy */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="item-description" className="text-sm font-medium text-slate-800">
              Beschreibung
            </label>
            <CopyButton text={fullDescriptionForCopy} label="Beschreibung + Hashtags kopieren" compact />
          </div>
          <textarea
            id="item-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beschreibung inklusive Passform und Details (ohne Standard-Floskeln)..."
            className="w-full rounded-xl border border-slate-300 p-3.5 text-sm text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#007782]"
          />
        </div>

        {/* Hashtags */}
        <div className="space-y-1.5">
          <label htmlFor="item-hashtags" className="block text-sm font-medium text-slate-800">
            Hashtags (5–10 reichweitenstarke Tags)
          </label>
          <input
            id="item-hashtags"
            type="text"
            value={hashtagsText}
            onChange={(e) => setHashtagsText(e.target.value)}
            placeholder="#vintage #zara #sommerkleid #secondhand #preloved"
            className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007782]"
          />
        </div>

        {/* Vinted Category */}
        <div className="space-y-1.5">
          <label htmlFor="item-category" className="block text-sm font-medium text-slate-800">
            Vinted-Kategorie
          </label>
          <input
            id="item-category"
            type="text"
            list="vinted-category-list"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Hauptkategorie > Unterkategorie > Spezifische Kategorie"
            className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007782]"
          />
          <datalist id="vinted-category-list">
            {VINTED_CATEGORY_SUGGESTIONS.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>

        {/* Vinted Mandatory Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label htmlFor="item-brand" className="block text-xs font-medium text-slate-700">
              Marke
            </label>
            <input
              id="item-brand"
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="z.B. Zara oder Keine Marke"
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007782]"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="item-size" className="block text-xs font-medium text-slate-700">
              Größe
            </label>
            <input
              id="item-size"
              type="text"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="z.B. M / 38"
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007782]"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="item-material" className="block text-xs font-medium text-slate-700">
              Material
            </label>
            <input
              id="item-material"
              type="text"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="z.B. 100% Baumwolle"
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007782]"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="item-color" className="block text-xs font-medium text-slate-700">
              Farbe
            </label>
            <input
              id="item-color"
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="z.B. Salbeigrün"
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007782]"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="item-condition" className="block text-xs font-medium text-slate-700">
              Zustand (Vinted-Standard)
            </label>
            <select
              id="item-condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value as VintedCondition)}
              className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007782]"
            >
              {VINTED_CONDITIONS.map((cond) => (
                <option key={cond} value={cond}>
                  {cond}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3 Price Suggestions */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label htmlFor="price-bargain" className="block text-xs font-medium text-slate-700">
              Schnäppchen (€)
            </label>
            <input
              id="price-bargain"
              type="number"
              step="0.5"
              min="1"
              value={priceBargain}
              onChange={(e) => setPriceBargain(e.target.value)}
              placeholder="15"
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm font-semibold tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007782]"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="price-fair" className="block text-xs font-semibold text-[#005F68]">
              Fairer Preis (€)
            </label>
            <input
              id="price-fair"
              type="number"
              step="0.5"
              min="1"
              value={priceFair}
              onChange={(e) => setPriceFair(e.target.value)}
              placeholder="22"
              className="w-full min-h-[44px] rounded-xl border border-[#007782] bg-[#E6F4F5]/30 px-3 text-sm font-semibold tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007782]"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="price-high" className="block text-xs font-medium text-slate-700">
              Wucher / VB (€)
            </label>
            <input
              id="price-high"
              type="number"
              step="0.5"
              min="1"
              value={priceHigh}
              onChange={(e) => setPriceHigh(e.target.value)}
              placeholder="30"
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm font-semibold tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007782]"
            />
          </div>
        </div>

        {saveError && (
          <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
            {saveError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full min-h-[48px] rounded-xl bg-[#007782] text-white text-sm font-semibold hover:bg-[#005F68] transition-colors cursor-pointer disabled:opacity-60"
        >
          {isSaving ? 'Speichere Artikel...' : 'Artikel speichern / Als hochgeladen markieren'}
        </button>
      </section>
    </form>
  );
};
