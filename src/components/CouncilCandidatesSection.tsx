import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import type {
  CouncilCandidate,
  ElectionDataset,
  ElectionDatasetMode,
} from '../types/election';
import { OVK_LISTS_URL } from '../data/slovenskaBistricaData';
import {
  computeCouncilCandidateOutcomes,
  parseCouncilCandidatesText,
} from '../utils/electionCalculations';

interface CouncilCandidatesSectionProps {
  dataset: ElectionDataset;
  mode: ElectionDatasetMode;
  onUpdateCandidates: (updated: CouncilCandidate[]) => void;
}

export const CouncilCandidatesSection: React.FC<CouncilCandidatesSectionProps> = ({
  dataset,
  mode,
  onUpdateCandidates,
}) => {
  const [viewMode, setViewMode] = useState<'lists' | 'table'>('lists');
  const [selectedListId, setSelectedListId] = useState<string>('all');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('all');
  const [onlyElected, setOnlyElected] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddPanel, setShowAddPanel] = useState<boolean>(false);
  const [addMode, setAddMode] = useState<'single' | 'paste'>('single');

  const [formListId, setFormListId] = useState<string>('sls');
  const [formUnitId, setFormUnitId] = useState<string>('ve2');
  const [formName, setFormName] = useState<string>('');
  const [formBirthYear, setFormBirthYear] = useState<string>('');
  const [formResidence, setFormResidence] = useState<string>('');
  const [formOrder, setFormOrder] = useState<string>('1');
  const [pasteText, setPasteText] = useState<string>('');

  const computedCandidates = useMemo(
    () =>
      computeCouncilCandidateOutcomes(
        dataset.councilCandidates ?? [],
        dataset.councilLists,
        dataset.electoralUnits
      ),
    [dataset.councilCandidates, dataset.councilLists, dataset.electoralUnits]
  );

  const filteredCandidates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return computedCandidates.filter((c) => {
      if (selectedListId !== 'all' && c.listId !== selectedListId) return false;
      if (selectedUnitId !== 'all' && c.unitId !== selectedUnitId) return false;
      if (onlyElected && !c.projectedElected) return false;
      if (q) {
        const hay = `${c.name} ${c.residence ?? ''} ${c.birthYear ?? ''} ${c.listShortName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    computedCandidates,
    selectedListId,
    selectedUnitId,
    onlyElected,
    searchQuery,
  ]);

  const electedCount = useMemo(
    () => computedCandidates.filter((c) => c.projectedElected).length,
    [computedCandidates]
  );

  const handlePrefVotesChange = (id: string, rawVal: string) => {
    const trimmed = rawVal.trim();
    const parsed =
      trimmed === '' ? null : Math.max(0, parseInt(trimmed, 10) || 0);
    const next = (dataset.councilCandidates ?? []).map((c) =>
      c.id === id ? { ...c, preferentialVotes: parsed } : c
    );
    onUpdateCandidates(next);
  };

  const handleToggleManualElected = (id: string) => {
    const next = (dataset.councilCandidates ?? []).map((c) =>
      c.id === id ? { ...c, manualElected: !c.manualElected } : c
    );
    onUpdateCandidates(next);
  };

  const handleRemoveCandidate = (id: string) => {
    const next = (dataset.councilCandidates ?? []).filter((c) => c.id !== id);
    onUpdateCandidates(next);
  };

  const handleOpenAddForList = (listId: string, unitId?: string) => {
    setFormListId(listId);
    if (unitId) setFormUnitId(unitId);
    setShowAddPanel(true);
  };

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formName.trim();
    if (!cleanName) return;

    const existingInSlot = (dataset.councilCandidates ?? []).filter(
      (c) => c.listId === formListId && c.unitId === formUnitId
    );
    const orderNum = parseInt(formOrder, 10) || existingInSlot.length + 1;
    const birthNum = parseInt(formBirthYear, 10);

    const created: CouncilCandidate = {
      id: `cc-${formListId}-${formUnitId}-${Date.now()}`,
      listId: formListId,
      unitId: formUnitId,
      ballotOrder: orderNum,
      name: cleanName,
      birthYear:
        !Number.isNaN(birthNum) && birthNum > 1920 && birthNum < 2010
          ? birthNum
          : undefined,
      residence: formResidence.trim() || undefined,
      preferentialVotes: null,
    };

    onUpdateCandidates([...(dataset.councilCandidates ?? []), created]);
    setFormName('');
    setFormBirthYear('');
    setFormResidence('');
    setFormOrder(String(orderNum + 1));
  };

  const handleImportPaste = () => {
    const existingInSlot = (dataset.councilCandidates ?? []).filter(
      (c) => c.listId === formListId && c.unitId === formUnitId
    );
    const parsed = parseCouncilCandidatesText(
      pasteText,
      formListId,
      formUnitId,
      existingInSlot.length + 1
    );
    if (parsed.length === 0) return;
    onUpdateCandidates([...(dataset.councilCandidates ?? []), ...parsed]);
    setPasteText('');
    setShowAddPanel(false);
  };

  return (
    <section
      id="kandidati-svet"
      className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-slate-500">
            Sestava list kandidatov · Občinski svet Občine Slovenska Bistrica · 9 list (156 mest na listah)
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Seznam list kandidatov za občinski svet
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl">
            Pregled sestave vseh 9 potrjenih kandidatnih list po štirih volilnih enotah (vključno z 2. volilno enoto za KS Pragersko–Gaj) ter sledenje preferenčnim glasovom in izvolitvi občinskih svetnikov.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 no-print">
          <a
            href={OVK_LISTS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <span>Uradni seznami OVK</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>

          {mode === 'lv2026' && (
            <button
              type="button"
              onClick={() => setShowAddPanel((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-[#0F4C81] hover:bg-[#0c3d68] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Dodaj / uvozi kandidate</span>
            </button>
          )}
        </div>
      </div>

      {mode === 'lv2022' ? (
        <div className="py-8 text-center border border-dashed border-slate-200 rounded-lg space-y-2">
          <p className="text-sm font-medium text-slate-800">
            Poimenski seznam kandidatov za leto 2022 v tem arhivu ni naložen.
          </p>
          <p className="text-xs text-slate-500">
            Preklopite na <span className="font-medium text-slate-700">Lokalne volitve 2026</span> za spremljanje sestave vseh 9 kandidatnih list po štirih volilnih enotah.
          </p>
        </div>
      ) : (
        <>
          {/* View Mode & Unit Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setViewMode('lists')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    viewMode === 'lists'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Po listah (9 list)
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tabela in preferenčni glasovi ({computedCandidates.length})
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500 font-mono tabular-nums">
              Vpisanih kandidatov: {computedCandidates.length} · Izvoljenih:{' '}
              {electedCount} / 31
            </div>
          </div>

          {/* Add / Paste Panel */}
          {showAddPanel && (
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg space-y-4 no-print">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-1 p-1 bg-slate-200/75 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setAddMode('single')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      addMode === 'single'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Posamezen kandidat
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddMode('paste')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      addMode === 'paste'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Prilepi celoten seznam liste
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <select
                    aria-label="Izberi listo"
                    value={formListId}
                    onChange={(e) => setFormListId(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  >
                    {dataset.councilLists.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.shortName}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Izberi volilno enoto"
                    value={formUnitId}
                    onChange={(e) => setFormUnitId(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  >
                    {dataset.electoralUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                        {u.includesPragerskoGaj ? ' (Pragersko–Gaj)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {addMode === 'single' ? (
                <form
                  onSubmit={handleAddSingle}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                >
                  <div className="sm:col-span-2 space-y-1">
                    <label
                      htmlFor="cc-order"
                      className="block text-xs font-medium text-slate-700"
                    >
                      Zap. št.
                    </label>
                    <input
                      id="cc-order"
                      type="number"
                      min="1"
                      max="20"
                      value={formOrder}
                      onChange={(e) => setFormOrder(e.target.value)}
                      className="w-full px-2.5 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-4 space-y-1">
                    <label
                      htmlFor="cc-name"
                      className="block text-xs font-medium text-slate-700"
                    >
                      Ime in priimek
                    </label>
                    <input
                      id="cc-name"
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="npr. Ana Kovač"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label
                      htmlFor="cc-year"
                      className="block text-xs font-medium text-slate-700"
                    >
                      Letnica roj.
                    </label>
                    <input
                      id="cc-year"
                      type="number"
                      min="1930"
                      max="2008"
                      value={formBirthYear}
                      onChange={(e) => setFormBirthYear(e.target.value)}
                      placeholder="1980"
                      className="w-full px-2.5 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label
                      htmlFor="cc-res"
                      className="block text-xs font-medium text-slate-700"
                    >
                      Kraj / KS
                    </label>
                    <input
                      id="cc-res"
                      type="text"
                      value={formResidence}
                      onChange={(e) => setFormResidence(e.target.value)}
                      placeholder="Pragersko"
                      className="w-full px-2.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2 flex gap-2">
                    <button
                      type="submit"
                      className="w-full px-3 py-2 text-xs font-medium text-white bg-[#0F4C81] hover:bg-[#0c3d68] rounded-lg transition-colors cursor-pointer"
                    >
                      Dodaj
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <textarea
                    rows={5}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder={`Prilepite vrstice iz seznama OVK (vsak kandidat v svoji vrstici):\n1. Janez Novak (roj. 1978), Pragersko\n2. Marija Kovač, roj. 1984, Spodnja Polskava\n3. Marko Kralj 145`}
                    className="w-full p-3 text-xs sm:text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleImportPaste}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#0F4C81] hover:bg-[#0c3d68] rounded-lg transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Uvozi kandidate v izbrano listo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddPanel(false)}
                      className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Zapri
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Filter controls */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSelectedUnitId('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedUnitId === 'all'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Vse enote
                </button>
                {dataset.electoralUnits.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelectedUnitId(u.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedUnitId === u.id
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {u.number}. VE
                    {u.includesPragerskoGaj ? ' · Pragersko–Gaj' : ''}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setOnlyElected(false)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    !onlyElected
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Vsi kandidati ({computedCandidates.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOnlyElected(true)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    onlyElected
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Izvoljeni svetniki ({electedCount})
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor="list-filter-select"
                  className="text-xs font-medium text-slate-600"
                >
                  Lista:
                </label>
                <select
                  id="list-filter-select"
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                >
                  <option value="all">Vse kandidatne liste (9)</option>
                  {dataset.councilLists.map((l) => {
                    const count = computedCandidates.filter(
                      (c) => c.listId === l.id
                    ).length;
                    return (
                      <option key={l.id} value={l.id}>
                        {l.shortName} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="relative max-w-xs w-full">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Išči kandidata, kraj ali stranko..."
                  aria-label="Išči kandidata na listah za občinski svet"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                />
              </div>
            </div>
          </div>

          {viewMode === 'lists' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {dataset.councilLists
                .filter(
                  (list) => selectedListId === 'all' || list.id === selectedListId
                )
                .map((list, listIdx) => {
                  const listCands = filteredCandidates.filter(
                    (c) => c.listId === list.id
                  );

                  return (
                    <div
                      key={list.id}
                      className="border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4 bg-white"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-xs shrink-0"
                                style={{ backgroundColor: list.color }}
                                aria-hidden="true"
                              />
                              <h3 className="text-base font-bold text-slate-900 truncate">
                                {listIdx + 1}. {list.shortName}
                              </h3>
                            </div>
                            <p className="text-xs text-slate-500 truncate">
                              {list.fullName}
                            </p>
                          </div>
                          <span className="font-mono text-xs text-slate-500 tabular-nums shrink-0">
                            {listCands.length} kand.
                          </span>
                        </div>

                        <div className="space-y-3">
                          {dataset.electoralUnits
                            .filter(
                              (u) =>
                                selectedUnitId === 'all' || u.id === selectedUnitId
                            )
                            .map((unit) => {
                              const unitCands = listCands.filter(
                                (c) => c.unitId === unit.id
                              );
                              if (unitCands.length === 0 && selectedUnitId === 'all') {
                                return null;
                              }

                              return (
                                <div key={unit.id} className="space-y-1.5">
                                  <div className="flex items-baseline justify-between text-xs font-semibold text-slate-700">
                                    <span>
                                      {unit.number}. VE
                                      {unit.includesPragerskoGaj
                                        ? ' · Pragersko–Gaj'
                                        : ''}
                                    </span>
                                    <span className="font-mono text-[11px] text-slate-400">
                                      {unit.seats} sed.
                                    </span>
                                  </div>

                                  {unitCands.length > 0 ? (
                                    <ol className="space-y-1 text-xs">
                                      {unitCands.map((cand) => (
                                        <li
                                          key={cand.id}
                                          className={`flex items-baseline justify-between gap-2 py-0.5 ${
                                            cand.projectedElected
                                              ? 'text-emerald-800 font-semibold'
                                              : 'text-slate-700'
                                          }`}
                                        >
                                          <span className="truncate">
                                            <span className="font-mono text-slate-400 mr-1.5">
                                              {cand.ballotOrder}.
                                            </span>
                                            {cand.name}
                                            {cand.birthYear
                                              ? ` (${cand.birthYear})`
                                              : ''}
                                          </span>
                                          {cand.preferentialVotes !== null && (
                                            <span className="font-mono text-[11px] text-slate-500 tabular-nums shrink-0">
                                              {cand.preferentialVotes} gl.
                                            </span>
                                          )}
                                        </li>
                                      ))}
                                    </ol>
                                  ) : (
                                    <p className="text-xs text-slate-400">
                                      Seznam za to enoto še ni dopolnjen.
                                    </p>
                                  )}
                                </div>
                              );
                            })}

                          {listCands.length === 0 && (
                            <p className="text-xs text-slate-500 py-2">
                              Za izbrani filter še ni vpisanih kandidatov te liste.
                            </p>
                          )}
                        </div>
                      </div>

                      {mode === 'lv2026' && (
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 no-print">
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenAddForList(
                                list.id,
                                selectedUnitId === 'all' ? 've2' : selectedUnitId
                              )
                            }
                            className="text-xs font-medium text-[#0F4C81] hover:underline cursor-pointer"
                          >
                            + Dodaj ali prilepi kandidate
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedListId(list.id);
                              setViewMode('table');
                            }}
                            className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer"
                          >
                            Uredi glasove
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ) : (
            /* High-Density Candidates Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                  <th className="py-3 pr-2 whitespace-nowrap">Št.</th>
                  <th className="py-3 px-3">Kandidat / kandidatka</th>
                  <th className="py-3 px-3 whitespace-nowrap">Lista</th>
                  <th className="py-3 px-3 whitespace-nowrap">Enota</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">
                    Pref. glasovi
                  </th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">
                    Status
                  </th>
                  <th className="py-3 pl-2 text-right whitespace-nowrap no-print">
                    Uredi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredCandidates.map((cand) => (
                  <tr
                    key={cand.id}
                    className={`transition-colors ${
                      cand.projectedElected
                        ? 'bg-emerald-50/40 hover:bg-emerald-50/70'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-2.5 pr-2 font-mono text-xs text-slate-500 tabular-nums">
                      {cand.ballotOrder}.
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-900">
                        {cand.name}
                      </div>
                      {(cand.birthYear || cand.residence) && (
                        <div className="text-xs text-slate-500">
                          {cand.birthYear ? `roj. ${cand.birthYear}` : ''}
                          {cand.birthYear && cand.residence ? ' · ' : ''}
                          {cand.residence ?? ''}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-xs shrink-0"
                          style={{ backgroundColor: cand.listColor }}
                          aria-hidden="true"
                        />
                        <span className="text-xs font-medium text-slate-800">
                          {cand.listShortName}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-xs text-slate-600">
                      {cand.unitNumber}. VE
                      {cand.unitId === 've2' ? ' (Pragersko)' : ''}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        aria-label={`Preferenčni glasovi za ${cand.name}`}
                        value={cand.preferentialVotes ?? ''}
                        onChange={(e) =>
                          handlePrefVotesChange(cand.id, e.target.value)
                        }
                        placeholder="—"
                        className="w-20 px-2 py-1 text-right font-mono text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      {cand.projectedElected ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>
                            Izvoljen/a
                            {cand.electionBasis === 'preferencni'
                              ? ' (pref.)'
                              : cand.electionBasis === 'vrstni_red'
                                ? ' (vrstni red)'
                                : ''}
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">
                          Na listi
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pl-2 text-right whitespace-nowrap no-print">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleManualElected(cand.id)}
                          title="Ročno označi ali odznači izvoljenega svetnika"
                          className={`px-2 py-1 text-[11px] font-medium rounded-md border transition-colors cursor-pointer ${
                            cand.manualElected
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {cand.manualElected ? 'Označen' : 'Označi'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveCandidate(cand.id)}
                          aria-label={`Odstrani kandidata ${cand.name}`}
                          className="p-1 text-slate-400 hover:text-rose-700 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredCandidates.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-sm text-slate-500"
                    >
                      Za izbrano kombinacijo filtra trenutno ni vpisanih kandidatov. Uporabite gumb »Dodaj / uvozi kandidate« za vnos ali lepljenje seznama liste.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          )}
        </>
      )}
    </section>
  );
};
