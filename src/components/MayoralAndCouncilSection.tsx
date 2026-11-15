import React, { useState } from 'react';
import { CheckCircle2, Clock, PencilLine, Scale } from 'lucide-react';
import type { ElectionDataset, ElectionDatasetMode } from '../types/election';
import {
  computeCouncilResults,
  computeMayoralResults,
  formatInt,
  formatPct,
} from '../utils/electionCalculations';

interface MayoralAndCouncilSectionProps {
  dataset: ElectionDataset;
  mode: ElectionDatasetMode;
  onEditResults: (initialTab: 'mayor' | 'council') => void;
}

export const MayoralAndCouncilSection: React.FC<MayoralAndCouncilSectionProps> = ({
  dataset,
  mode,
  onEditResults,
}) => {
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('all');

  const mayorOutcome = computeMayoralResults(dataset.mayoralCandidates);
  const councilOutcome = computeCouncilResults(
    dataset.councilLists,
    dataset.electoralUnits
  );

  // Build 31 seat blocks for visual council distribution
  const seatBlocks: { color: string; shortName: string }[] = [];
  for (const list of councilOutcome.lists) {
    for (let i = 0; i < list.seatsTotal; i++) {
      seatBlocks.push({ color: list.color, shortName: list.shortName });
    }
  }
  while (seatBlocks.length < 31) {
    seatBlocks.push({ color: '#E2E8F0', shortName: 'Nedodeljeno' });
  }

  return (
    <div id="zupan-svet" className="space-y-8">
      {/* Župan Občine Slovenska Bistrica */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-slate-500">
              Občina Slovenska Bistrica · Županske volitve {dataset.year}
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Kandidati za župana
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl">
              Za izvolitev v prvem krogu je potrebna več kot 50-odstotna podpora veljavnih glasovnic. Če noben kandidat ne preseže meje, sledi drugi krog med najuspešnejšima dvema.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 no-print">
            {mode === 'lv2026' && (
              <button
                type="button"
                onClick={() => onEditResults('mayor')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#0F4C81] bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <PencilLine className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Vnesi glasove župana</span>
              </button>
            )}
          </div>
        </div>

        {/* Status banner (no thick left border, crisp hairline + explicit icon+text) */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm">
          <div className="flex items-center gap-2.5 text-slate-800 font-medium">
            {mayorOutcome.winnerFirstRound ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                <span>
                  Izvoljen v 1. krogu: {mayorOutcome.winnerFirstRound.name} (
                  {formatPct(mayorOutcome.winnerFirstRound.pct)})
                </span>
              </>
            ) : mayorOutcome.runoffPair ? (
              <>
                <Scale className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
                <span>
                  Drugi krog: {mayorOutcome.runoffPair[0].name} (
                  {formatPct(mayorOutcome.runoffPair[0].pct)}) proti{' '}
                  {mayorOutcome.runoffPair[1].name} (
                  {formatPct(mayorOutcome.runoffPair[1].pct)})
                </span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                <span>
                  Potrjeni so 4 uradni kandidati. Glasovi se prikažejo po začetku štetja po 19:00.
                </span>
              </>
            )}
          </div>

          <div className="font-mono text-xs text-slate-600 tabular-nums">
            Veljavni glasovi: {formatInt(mayorOutcome.totalValidVotes || null)}
          </div>
        </div>

        <div className="space-y-4">
          {mayorOutcome.candidates.map((candidate) => {
            const pctValue = candidate.pct ?? 0;
            const isLeader =
              mayorOutcome.hasResults && candidate.rank === 1;

            return (
              <div
                key={candidate.id}
                className="py-3 border-b last:border-b-0 border-slate-100 space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: candidate.color }}
                        aria-hidden="true"
                      />
                      <span className="text-base font-semibold text-slate-900">
                        {candidate.name}
                      </span>
                      {candidate.isIncumbent && (
                        <span className="text-xs text-slate-500">
                          · aktualni župan
                        </span>
                      )}
                      {isLeader && mayorOutcome.winnerFirstRound && (
                        <span className="text-xs font-medium text-emerald-700">
                          · zmagovalec 1. kroga
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 pl-5">
                      Predlagatelj / podpora: {candidate.proposer}
                    </p>
                  </div>

                  <div className="flex items-baseline gap-4 pl-5 sm:pl-0 shrink-0">
                    <span className="font-mono text-sm text-slate-600 tabular-nums">
                      {formatInt(candidate.votes)} glasov
                    </span>
                    <span className="font-mono text-base font-bold text-slate-900 tabular-nums w-20 text-right">
                      {formatPct(candidate.pct)}
                    </span>
                  </div>
                </div>

                {/* Progress bar with 50% threshold marker */}
                <div className="relative h-2.5 w-full bg-slate-100 rounded-sm overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${Math.min(Math.max(pctValue, 0), 100)}%`,
                      backgroundColor: candidate.color,
                    }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-px bg-slate-400/80"
                    style={{ left: '50%' }}
                    title="Meja 50 % za izvolitev v 1. krogu"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Občinski svet (31 sedežev, 4 volilne enote) */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-slate-500">
              Občinski svet Občine Slovenska Bistrica · 31 sedežev · 4 volilne enote
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Razdelitev mandatov in kandidatne liste
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl">
              {mode === 'lv2026'
                ? 'Za 31 svetniških mest kandidira 9 list (156 kandidatov) po proporcionalnem sistemu z D’Hondtovim količnikom po štirih volilnih enotah. Za absolutno večino je potrebnih 16 mandatov.'
                : 'Uradna sestava 31-članskega Občinskega sveta Občine Slovenska Bistrica iz mandata 2022–2026.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 no-print">
            {mode === 'lv2026' && (
              <button
                type="button"
                onClick={() => onEditResults('council')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#0F4C81] bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <PencilLine className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Vnesi glasove list</span>
              </button>
            )}
          </div>
        </div>

        {/* 31-seat visual bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Razporeditev 31 svetniških sedežev (večina: 16 sedežev)</span>
            <span className="font-mono tabular-nums">
              Dodeljeno: {councilOutcome.totalSeatsAllocated} / 31
            </span>
          </div>
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: 'repeat(31, minmax(0, 1fr))' }}
            role="img"
            aria-label={`Razporeditev 31 mandatov v občinskem svetu (${councilOutcome.totalSeatsAllocated} dodeljenih)`}
          >
            {seatBlocks.map((block, idx) => (
              <div
                key={idx}
                title={`${idx + 1}. sedež: ${block.shortName}`}
                className={`h-6 rounded-[2px] transition-colors ${
                  idx === 15 ? 'ring-1 ring-slate-900/40' : ''
                }`}
                style={{ backgroundColor: block.color }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>1</span>
            <span>16 (večina)</span>
            <span>31</span>
          </div>
        </div>

        {/* Filter by Electoral Unit */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setSelectedUnitFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedUnitFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vsa občina (31)
            </button>
            {dataset.electoralUnits.map((unit) => (
              <button
                key={unit.id}
                type="button"
                onClick={() => setSelectedUnitFilter(unit.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedUnitFilter === unit.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {unit.number}. VE ({unit.seats})
                {unit.includesPragerskoGaj ? ' · Pragersko–Gaj' : ''}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {selectedUnitFilter === 'all'
              ? `Skupaj glasov: ${formatInt(councilOutcome.totalVotes || null)}`
              : `Glasovi v enoti: ${formatInt(
                  councilOutcome.unitTotals[selectedUnitFilter] || null
                )}`}
          </span>
        </div>

        {/* High-Density Council Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                <th className="py-3 pr-4">Kandidatna lista</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">Glasovi</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">Delež</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">
                  {selectedUnitFilter === 'all' ? 'Mandati' : 'Mandati v VE'}
                </th>
                {selectedUnitFilter === 'all' && (
                  <>
                    <th className="py-3 px-3 text-right whitespace-nowrap hidden md:table-cell">
                      2. VE (Pragersko)
                    </th>
                    <th className="py-3 pl-3 text-right whitespace-nowrap">
                      Vs 2022
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {councilOutcome.lists.map((list) => {
                const displayVotes =
                  selectedUnitFilter === 'all'
                    ? list.totalVotes
                    : list.votesByUnit[selectedUnitFilter] ?? 0;

                const unitTotal =
                  selectedUnitFilter === 'all'
                    ? councilOutcome.totalVotes
                    : councilOutcome.unitTotals[selectedUnitFilter] ?? 0;

                const displayPct =
                  unitTotal > 0 ? (displayVotes / unitTotal) * 100 : null;

                const displaySeats =
                  selectedUnitFilter === 'all'
                    ? list.seatsTotal
                    : list.seatsByUnit[selectedUnitFilter] ?? 0;

                const showDashForSeats =
                  mode === 'lv2026' &&
                  !councilOutcome.hasVoteData &&
                  selectedUnitFilter === 'all';

                const delta = list.seatDeltaFrom2022;
                const deltaText =
                  showDashForSeats || mode === 'lv2022'
                    ? `${list.seats2022}`
                    : delta > 0
                      ? `+${delta}`
                      : `${delta}`;

                return (
                  <tr
                    key={list.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-2.5 h-2.5 rounded-xs shrink-0"
                          style={{ backgroundColor: list.color }}
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900 truncate">
                            {list.shortName}
                          </div>
                          <div className="text-xs text-slate-500 truncate max-w-md">
                            {list.fullName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700 tabular-nums">
                      {displayVotes > 0 ? formatInt(displayVotes) : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700 tabular-nums">
                      {formatPct(displayPct)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {showDashForSeats ? '—' : displaySeats}
                    </td>
                    {selectedUnitFilter === 'all' && (
                      <>
                        <td className="py-3 px-3 text-right font-mono text-slate-700 tabular-nums hidden md:table-cell">
                          {councilOutcome.hasVoteData
                            ? list.seatsByUnit['ve2'] ?? 0
                            : '—'}
                        </td>
                        <td
                          className={`py-3 pl-3 text-right font-mono tabular-nums ${
                            showDashForSeats || mode === 'lv2022'
                              ? 'text-slate-500'
                              : delta > 0
                                ? 'text-emerald-700 font-medium'
                                : delta < 0
                                  ? 'text-rose-700 font-medium'
                                  : 'text-slate-500'
                          }`}
                        >
                          {mode === 'lv2022' ? `${list.seats2022} (2022)` : deltaText}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 4 Electoral Units Reference Strip */}
        <div className="pt-4 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Razdelitev občine na 4 volilne enote (skupaj 31 mandatov)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dataset.electoralUnits.map((unit) => (
              <div
                key={unit.id}
                className={`p-4 rounded-lg border ${
                  unit.includesPragerskoGaj
                    ? 'bg-sky-50/50 border-[#0F4C81]/30'
                    : 'bg-slate-50/60 border-slate-200'
                }`}
              >
                <div className="flex items-baseline justify-between gap-2 mb-1.5">
                  <span className="text-sm font-semibold text-slate-900">
                    {unit.name}
                  </span>
                  <span className="font-mono text-xs font-semibold text-[#0F4C81] tabular-nums">
                    {unit.seats} sedežev
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {unit.communities.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
