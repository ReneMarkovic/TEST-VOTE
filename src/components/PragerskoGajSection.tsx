import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  MapPin,
  PencilLine,
  Plus,
  Search,
  UserCheck,
} from 'lucide-react';
import type { ElectionDataset, ElectionDatasetMode } from '../types/election';
import {
  computeKsResults,
  formatInt,
  formatPct,
} from '../utils/electionCalculations';

interface PragerskoGajSectionProps {
  dataset: ElectionDataset;
  mode: ElectionDatasetMode;
  onEditKs: () => void;
  onQuickAddCandidate: (name: string, proposer: string) => void;
}

export const PragerskoGajSection: React.FC<PragerskoGajSectionProps> = ({
  dataset,
  mode,
  onEditKs,
  onQuickAddCandidate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newProposer, setNewProposer] = useState('Skupina volivcev');

  const ksOutcome = useMemo(
    () => computeKsResults(dataset.ksCandidates, dataset.ksSeatsTotal),
    [dataset.ksCandidates, dataset.ksSeatsTotal]
  );

  const filteredCandidates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return ksOutcome.candidates;
    return ksOutcome.candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.proposer.toLowerCase().includes(q) ||
        c.residence.toLowerCase().includes(q)
    );
  }, [ksOutcome.candidates, searchQuery]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newName.trim();
    if (!trimmedName) return;
    onQuickAddCandidate(trimmedName, newProposer.trim() || 'Skupina volivcev');
    setNewName('');
    setNewProposer('Skupina volivcev');
    setShowAddForm(false);
  };

  return (
    <section
      id="pragersko-gaj"
      className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-slate-500">
            Krajevna skupnost Pragersko – Gaj · 2. volilna enota · {dataset.ksSeatsTotal} članov sveta KS
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Svet Krajevne skupnosti Pragersko – Gaj
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl">
            {dataset.ksPollingStation.systemNote}. Na občinski ravni krajani Pragerskega–Gaja skupaj s Spodnjo in Zgornjo Polskavo ter KS Alfonz Šarh volijo 9 članov občinskega sveta v 2. volilni enoti.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 no-print">
          {mode === 'lv2026' && (
            <>
              <button
                type="button"
                onClick={() => setShowAddForm((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Dodaj kandidata</span>
              </button>
              <button
                type="button"
                onClick={onEditKs}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#0F4C81] bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <PencilLine className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Vnesi glasove KS</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Polling station and headquarters information strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm">
        <div className="flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-[#0F4C81] mt-0.5 shrink-0" aria-hidden="true" />
          <div className="space-y-0.5">
            <div className="font-medium text-slate-900">
              Volišče: {dataset.ksPollingStation.name}
            </div>
            <div className="text-xs text-slate-600">
              {dataset.ksPollingStation.address}
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <UserCheck className="w-4 h-4 text-[#0F4C81] mt-0.5 shrink-0" aria-hidden="true" />
          <div className="space-y-0.5">
            <div className="font-medium text-slate-900">
              Sedež KS Pragersko – Gaj
            </div>
            <div className="text-xs text-slate-600">
              {dataset.ksPollingStation.headquarters} · Večinski sistem (izvoljenih prvih 7)
            </div>
          </div>
        </div>
      </div>

      {showAddForm && mode === 'lv2026' && (
        <form
          onSubmit={handleAddSubmit}
          className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
        >
          <div className="flex-1 space-y-1">
            <label
              htmlFor="ks-new-name"
              className="block text-xs font-medium text-slate-700"
            >
              Ime in priimek kandidata
            </label>
            <input
              id="ks-new-name"
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="npr. Janez Novak"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label
              htmlFor="ks-new-proposer"
              className="block text-xs font-medium text-slate-700"
            >
              Predlagatelj
            </label>
            <input
              id="ks-new-proposer"
              type="text"
              value={newProposer}
              onChange={(e) => setNewProposer(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-[#0F4C81] hover:bg-[#0c3d68] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Shrani kandidata
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Prekliči
            </button>
          </div>
        </form>
      )}

      {mode === 'lv2022' ? (
        <div className="py-8 text-center border border-dashed border-slate-200 rounded-lg space-y-2">
          <p className="text-sm font-medium text-slate-800">
            Arhivski podrobni glasovi za Svet KS Pragersko – Gaj (LV 2022) v tem pregledu niso naloženi.
          </p>
          <p className="text-xs text-slate-500">
            Preklopite na <span className="font-medium text-slate-700">Lokalne volitve 2026</span> za seznam uradno potrjenih kandidatov za Svet KS Pragersko–Gaj in vnos glasov.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-xs w-full">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Išči kandidata ali predlagatelja..."
                aria-label="Išči kandidata za Svet KS Pragersko–Gaj"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
              />
            </div>

            <div className="text-xs text-slate-500 font-mono tabular-nums">
              {ksOutcome.hasResults
                ? `Oddani glasovi kandidatom: ${formatInt(ksOutcome.totalVotesCast)}`
                : `Potrjenih kandidatov: ${dataset.ksCandidates.length} · Prostih mest: ${dataset.ksSeatsTotal}`}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                  <th className="py-3 pr-3 whitespace-nowrap">
                    {ksOutcome.hasResults ? 'Uvrstitev' : 'Zap. št.'}
                  </th>
                  <th className="py-3 px-3">Kandidat / kandidatka</th>
                  <th className="py-3 px-3 hidden md:table-cell">Predlagatelj</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Glasovi</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Delež</th>
                  <th className="py-3 pl-3 text-right whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredCandidates.map((candidate) => (
                  <tr
                    key={candidate.id}
                    className={`transition-colors ${
                      candidate.elected
                        ? 'bg-emerald-50/40 hover:bg-emerald-50/70'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3 pr-3 font-mono text-slate-600 tabular-nums">
                      {ksOutcome.hasResults
                        ? `${candidate.rank}.`
                        : `${candidate.ballotNumber}.`}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-900">
                        {candidate.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {candidate.residence}
                        {candidate.birthYear ? ` · roj. ${candidate.birthYear}` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-600 hidden md:table-cell">
                      {candidate.proposer}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-900 tabular-nums">
                      {formatInt(candidate.votes)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                      {formatPct(candidate.pctOfBallots)}
                    </td>
                    <td className="py-3 pl-3 text-right whitespace-nowrap">
                      {candidate.elected ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Izvoljen/a</span>
                        </span>
                      ) : ksOutcome.hasResults ? (
                        <span className="text-xs text-slate-500">
                          Ni izvoljen/a
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">
                          Potrjen kandidat
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredCandidates.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-sm text-slate-500"
                    >
                      Noben kandidat ne ustreza iskalnemu pogoju.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
};
