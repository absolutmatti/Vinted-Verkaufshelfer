import React from 'react';
import { ImageOff } from 'lucide-react';
import type { VintedItem } from '../types';
import { formatEuro, getDaysOnline, getStaleStatus } from '../utils/vintedRules';

interface ItemCardProps {
  item: VintedItem;
  onSelect: (item: VintedItem) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onSelect }) => {
  const staleStatus = getStaleStatus(item);
  const daysOnline = getDaysOnline(item.createdAt);
  const previewImage = item.images[0];

  return (
    <article className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col hover:border-slate-300 transition-colors">
      <button
        type="button"
        onClick={() => onSelect(item)}
        aria-label={`Details für ${item.title} öffnen`}
        className="text-left flex flex-col flex-1 w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#007782]"
      >
        <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
          {previewImage ? (
            <img
              src={previewImage}
              alt={item.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
              <ImageOff className="w-6 h-6" />
              <span className="text-xs">Kein Foto</span>
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1 justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-medium text-slate-700">{item.ownerProfile}</span>
              <span aria-hidden="true">·</span>
              <span>{item.brand}</span>
              <span aria-hidden="true">·</span>
              <span>Gr. {item.size}</span>
              <span aria-hidden="true">·</span>
              <span>{daysOnline === 0 ? 'Heute' : `vor ${daysOnline} T.`}</span>
            </div>

            <h3 className="text-base font-semibold text-slate-900 leading-snug line-clamp-2">
              {item.title}
            </h3>
          </div>

          <div className="space-y-2 pt-1">
            {item.status === 'sold' ? (
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-base font-bold text-[#007782] tabular-nums">
                  Verkauft für {formatEuro(item.soldPrice ?? 0)} €
                </span>
                <span className="text-xs font-medium text-slate-500">Verkauft</span>
              </div>
            ) : (
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-base font-bold text-slate-900 tabular-nums">
                  {formatEuro(item.priceBargain)} € – {formatEuro(item.priceHigh)} €
                </span>
                <span className="text-xs text-slate-500 tabular-nums">
                  Fair: {formatEuro(item.priceFair)} €
                </span>
              </div>
            )}

            {staleStatus === 'stale_30' && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-xs font-medium text-amber-900">
                ⏳ &gt; 1 Monat online – Preis senken?
              </div>
            )}

            {staleStatus === 'stale_60' && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-900">
                🔥 &gt; 2 Monate online – Schnäppchenpreis ansetzen!
              </div>
            )}
          </div>
        </div>
      </button>
    </article>
  );
};
