import React from 'react';
import { ExternalLink, PencilLine } from 'lucide-react';
import type { ElectionDataset, ElectionDatasetMode } from '../types/election';
import { DVK_LV2026_URL } from '../data/slovenskaBistricaData';
import { formatPct } from '../utils/electionCalculations';

interface TurnoutSectionProps {
  dataset: ElectionDataset;
  mode: ElectionDatasetMode;
  onEditTurnout: () => void;
}

export const TurnoutSection: React.FC<TurnoutSectionProps> = ({
  dataset,
  mode,
  onEditTurnout,
}) => {
  const baseline2022Municipality = 42.8;
  const baseline2022Slovenia = 47.59;

  return (
    <section
      id="udelezba"
      className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-slate-500">
            Volilna udeležba · {dataset.dateLabel}
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Primerjava volilne udeležbe po urah
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl">
            {mode === 'lv2026'
              ? 'Občina Slovenska Bistrica je do 11. ure zabeležila 11,56 % udeležbo (2.351 od 20.335 volilnih upravičencev; Slovenija 12,85 %). Do 16. ure je bila udeležba v Sloveniji 36,77 %.'
              : 'Uradna končna volilna udeležba na lokalnih volitvah 20. novembra 2022 za Občino Slovenska Bistrica in državno povprečje.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 no-print">
          <a
            href={DVK_LV2026_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <span>DVK udeležba v živo</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
          {mode === 'lv2026' && (
            <button
              type="button"
              onClick={onEditTurnout}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#0F4C81] bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <PencilLine className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Vnesi udeležbo</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {dataset.turnout.map((checkpoint) => {
          const hasAny =
            checkpoint.municipalityPct !== null ||
            checkpoint.pragerskoPct !== null ||
            checkpoint.sloveniaPct !== null;

          const rows = [
            {
              label: 'Občina Slovenska Bistrica',
              sub:
                checkpoint.municipalityVoters && checkpoint.municipalityEligible
                  ? `${checkpoint.municipalityVoters.toLocaleString('sl-SI')} / ${checkpoint.municipalityEligible.toLocaleString('sl-SI')} volivcev`
                  : null,
              pct: checkpoint.municipalityPct,
              barClass: 'bg-[#0F4C81]',
            },
            {
              label: 'KS Pragersko–Gaj (volišče)',
              sub: null,
              pct: checkpoint.pragerskoPct,
              barClass: 'bg-emerald-700',
            },
            {
              label: 'Slovenija (povprečje)',
              sub: null,
              pct: checkpoint.sloveniaPct,
              barClass: 'bg-slate-400',
            },
          ];

          return (
            <div
              key={checkpoint.time}
              className="py-2 sm:px-2 flex flex-col justify-between space-y-4 border-b lg:border-b-0 lg:border-r last:border-0 border-slate-100 lg:pr-6"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-base font-semibold text-slate-900">
                  {checkpoint.label}
                </h3>
                <span className="font-mono text-xs text-slate-500 tabular-nums">
                  {checkpoint.time}
                </span>
              </div>

              <div className="space-y-3.5">
                {rows.map((row) => {
                  const widthPct =
                    row.pct !== null ? Math.min(Math.max(row.pct, 0), 100) : 0;
                  return (
                    <div key={row.label} className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-2 text-sm">
                        <div className="min-w-0">
                          <span className="text-slate-700 truncate block">
                            {row.label}
                          </span>
                          {row.sub && (
                            <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                              {row.sub}
                            </span>
                          )}
                        </div>
                        <span className="font-mono font-semibold text-slate-900 tabular-nums shrink-0">
                          {formatPct(row.pct)}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-sm overflow-hidden">
                        {row.pct !== null ? (
                          <div
                            className={`h-full ${row.barClass} transition-all duration-300`}
                            style={{ width: `${widthPct}%` }}
                          />
                        ) : (
                          <div className="h-full w-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {!hasAny && (
                <p className="text-xs text-slate-500 pt-1">
                  Podatek še ni objavljen s strani DVK.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
        <div>
          Referenca LV 2022 (končna udeležba): Občina Slovenska Bistrica{' '}
          <span className="font-mono font-medium text-slate-700 tabular-nums">
            {formatPct(baseline2022Municipality)}
          </span>{' '}
          · Slovenija{' '}
          <span className="font-mono font-medium text-slate-700 tabular-nums">
            {formatPct(baseline2022Slovenia)}
          </span>
        </div>
        <div>Volišča so odprta od 07:00 do 19:00</div>
      </div>
    </section>
  );
};
