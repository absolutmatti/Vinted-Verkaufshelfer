import React, { useState } from 'react';
import { CheckCircle2, Trash2, X } from 'lucide-react';
import type { ProfileName, VintedItem } from '../types';
import {
  canMarkAsSold,
  formatDescriptionWithHashtags,
  formatEuro,
  getDaysOnline,
  getStaleStatus,
} from '../utils/vintedRules';
import { CopyButton } from './CopyButton';

interface ItemDetailModalProps {
  item: VintedItem;
  currentProfile: ProfileName;
  onClose: () => void;
  onMarkSold: (itemId: string, soldPrice: number) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  currentProfile,
  onClose,
  onMarkSold,
  onDelete,
}) => {
  const [showSoldPrompt, setShowSoldPrompt] = useState(false);
  const [soldPriceInput, setSoldPriceInput] = useState(String(item.priceFair || ''));
  const [soldError, setSoldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const staleStatus = getStaleStatus(item);
  const daysOnline = getDaysOnline(item.createdAt);
  const canSell = canMarkAsSold(item, currentProfile);
  const isOwner = item.ownerProfile === currentProfile;
  const fullDescriptionText = formatDescriptionWithHashtags(item.description, item.hashtags);

  const handleConfirmSold = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(soldPriceInput.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100000) {
      setSoldError('Bitte gib einen gültigen Verkaufspreis größer als 0 € ein.');
      return;
    }
    setSoldError(null);
    setIsSubmitting(true);
    try {
      await onMarkSold(item.id, Math.round(parsed * 100) / 100);
      setShowSoldPrompt(false);
      onClose();
    } catch (err) {
      setSoldError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await onDelete(item.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
    >
      <div className="bg-white w-full sm:max-w-2xl max-h-[92vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-xl">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0">
            <span className="font-semibold text-slate-800">{item.ownerProfile}</span>
            <span aria-hidden="true">·</span>
            <span>{item.status === 'sold' ? 'Verkauft' : `Online seit ${daysOnline} Tagen`}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Detailansicht schließen"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto p-5 space-y-5 flex-1">
          {/* Images */}
          {item.images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {item.images.map((src, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl overflow-hidden bg-slate-100 aspect-[4/3] ${
                    idx === 0 && item.images.length === 1 ? 'col-span-2 sm:col-span-3 max-h-72' : ''
                  }`}
                >
                  <img
                    src={src}
                    alt={`${item.title} Foto ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Ladenhüter notice */}
          {staleStatus === 'stale_30' && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2.5 text-sm font-medium text-amber-900">
              ⏳ &gt; 1 Monat online – Preis senken?
            </div>
          )}
          {staleStatus === 'stale_60' && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm font-medium text-red-900">
              🔥 &gt; 2 Monate online – Schnäppchenpreis ansetzen!
            </div>
          )}

          {/* Title + One-Click-Copy */}
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">Titel</p>
                <h2 id="detail-modal-title" className="text-xl font-bold text-slate-900 mt-0.5">
                  {item.title}
                </h2>
              </div>
              <CopyButton text={item.title} label="Titel kopieren" compact />
            </div>
          </div>

          {/* Description + Hashtags + One-Click-Copy */}
          <div className="space-y-2 bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-slate-600">Beschreibung &amp; Hashtags</p>
              <CopyButton text={fullDescriptionText} label="Beschreibung kopieren" compact />
            </div>
            <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
              {fullDescriptionText}
            </p>
          </div>

          {/* Vinted Mandatory Fields */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div className="bg-white border border-slate-200 rounded-xl p-3 col-span-2 sm:col-span-3">
              <p className="text-xs text-slate-500">Vinted-Kategorie</p>
              <p className="font-medium text-slate-900 mt-0.5">{item.category}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <p className="text-xs text-slate-500">Marke</p>
              <p className="font-medium text-slate-900 mt-0.5">{item.brand}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <p className="text-xs text-slate-500">Größe</p>
              <p className="font-medium text-slate-900 mt-0.5">{item.size}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <p className="text-xs text-slate-500">Material</p>
              <p className="font-medium text-slate-900 mt-0.5">{item.material}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <p className="text-xs text-slate-500">Farbe</p>
              <p className="font-medium text-slate-900 mt-0.5">{item.color}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 col-span-2 sm:col-span-2">
              <p className="text-xs text-slate-500">Zustand</p>
              <p className="font-medium text-slate-900 mt-0.5">{item.condition}</p>
            </div>
          </div>

          {/* 3 Price Suggestions */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-600">KI-Preisorientierung</p>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                <p className="text-xs text-slate-500">Schnäppchen</p>
                <p className="text-base font-bold text-slate-900 tabular-nums mt-0.5">
                  {formatEuro(item.priceBargain)} €
                </p>
              </div>
              <div className="rounded-xl border border-[#007782]/30 bg-[#E6F4F5]/60 p-3 text-center">
                <p className="text-xs font-medium text-[#005F68]">Fairer Preis</p>
                <p className="text-base font-bold text-[#005F68] tabular-nums mt-0.5">
                  {formatEuro(item.priceFair)} €
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                <p className="text-xs text-slate-500">Wucher / VB</p>
                <p className="text-base font-bold text-slate-900 tabular-nums mt-0.5">
                  {formatEuro(item.priceHigh)} €
                </p>
              </div>
            </div>
          </div>

          {/* Sold Price Modal / Prompt */}
          {showSoldPrompt && canSell && (
            <form
              onSubmit={handleConfirmSold}
              className="rounded-2xl border border-[#007782]/40 bg-[#E6F4F5]/50 p-4 space-y-3"
            >
              <label htmlFor="sold-price-input" className="block text-sm font-semibold text-slate-900">
                Für wie viel Euro wurde der Artikel verkauft?
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="sold-price-input"
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={soldPriceInput}
                  onChange={(e) => setSoldPriceInput(e.target.value)}
                  className="flex-1 min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 text-base font-semibold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#007782]"
                />
                <span className="text-base font-semibold text-slate-700">€</span>
              </div>
              {soldError && (
                <p role="alert" className="text-xs font-medium text-red-700">
                  {soldError}
                </p>
              )}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowSoldPrompt(false)}
                  className="flex-1 min-h-[44px] rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 min-h-[44px] rounded-xl bg-[#007782] text-sm font-semibold text-white hover:bg-[#005F68] cursor-pointer disabled:opacity-60"
                >
                  Verkauf bestätigen
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Bottom Footer Actions */}
        <div className="border-t border-slate-100 p-4 flex items-center justify-between gap-3 bg-white shrink-0">
          {isOwner ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              aria-label={`Artikel ${item.title} löschen`}
              className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 text-sm font-medium text-red-700 hover:bg-red-50 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Löschen</span>
            </button>
          ) : (
            <p className="text-xs text-slate-500">
              Eingestellt von {item.ownerProfile}
            </p>
          )}

          {item.status === 'sold' ? (
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#007782] tabular-nums">
              <CheckCircle2 className="w-5 h-5" />
              <span>Verkauft für {formatEuro(item.soldPrice ?? 0)} €</span>
            </div>
          ) : canSell && !showSoldPrompt ? (
            <button
              type="button"
              onClick={() => setShowSoldPrompt(true)}
              className="min-h-[44px] flex-1 sm:flex-none rounded-xl bg-[#007782] px-5 text-sm font-semibold text-white hover:bg-[#005F68] transition-colors cursor-pointer"
            >
              Als verkauft markieren
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
