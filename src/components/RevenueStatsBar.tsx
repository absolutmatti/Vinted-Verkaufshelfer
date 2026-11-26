import React from 'react';
import type { RevenueSummary } from '../types';
import { formatEuro } from '../utils/vintedRules';

interface RevenueStatsBarProps {
  summary: RevenueSummary;
}

export const RevenueStatsBar: React.FC<RevenueStatsBarProps> = ({ summary }) => {
  return (
    <section
      aria-label="Verkaufserlöse"
      className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 sm:divide-x sm:divide-slate-100">
        <div className="flex items-center justify-between sm:block sm:pr-4">
          <span className="text-sm text-slate-600">Dianas Einnahmen: </span>
          <span
            data-testid="revenue-diana"
            className="text-base sm:text-lg font-semibold text-slate-900 tabular-nums"
          >
            {formatEuro(summary.dianaRevenue)} €
          </span>
        </div>

        <div className="flex items-center justify-between sm:block sm:px-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <span className="text-sm text-slate-600">Mattis Einnahmen: </span>
          <span
            data-testid="revenue-matti"
            className="text-base sm:text-lg font-semibold text-slate-900 tabular-nums"
          >
            {formatEuro(summary.mattiRevenue)} €
          </span>
        </div>

        <div className="flex items-center justify-between sm:block sm:pl-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <span className="text-sm font-medium text-[#007782]">Gesamt: </span>
          <span
            data-testid="revenue-total"
            className="text-base sm:text-lg font-bold text-[#007782] tabular-nums"
          >
            {formatEuro(summary.totalRevenue)} €
          </span>
        </div>
      </div>
    </section>
  );
};
