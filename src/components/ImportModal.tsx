import React, { useState } from 'react';
import { ExternalLink, RotateCcw, Upload, X } from 'lucide-react';
import type { ElectionDataset, ElectionStage } from '../types/election';
import { DVK_LV2026_URL } from '../data/slovenskaBistricaData';
import { parseDvkImportText } from '../utils/electionCalculations';

export type ImportModalTab = 'paste' | 'turnout' | 'mayor' | 'council' | 'ks';

interface ImportModalProps {
  isOpen: boolean;
  initialTab: ImportModalTab;
  dataset: ElectionDataset;
  onClose: () => void;
  onSaveDataset: (updated: ElectionDataset) => void;
  onReset2026: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  initialTab,
  dataset,
  onClose,
  onSaveDataset,
  onReset2026,
}) => {
  const [activeTab, setActiveTab] = useState<ImportModalTab>(initialTab);
  const [draft, setDraft] = useState<ElectionDataset>(() => structuredClone(dataset));
  const [pasteText, setPasteText] = useState('');
  const [parseNotes, setParseNotes] = useState<string[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      setDraft(structuredClone(dataset));
      setActiveTab(initialTab);
      setParseNotes([]);
    }
  }, [isOpen, initialTab, dataset]);

  if (!isOpen) return null;

  const parseNullableNumber = (val: string): number | null => {
    const cleaned = val.trim().replace(',', '.');
    if (cleaned === '') return null;
    const num = Number(cleaned);
    return Number.isFinite(num) && num >= 0 ? num : null;
  };

  const handleApplyPaste = () => {
    const result = parseDvkImportText(pasteText, draft);
    setDraft(result.updatedDataset);
    setParseNotes(result.notes);
  };

  const handleSave = () => {
    onSaveDataset({
      ...draft,
      lastUpdatedLabel:
        draft.stage === 'koncni'
          ? 'Uradni končni izidi LV 2026'
          : draft.stage === 'delni'
            ? `Delni izidi (posodobljeno ${new Date().toLocaleTimeString('sl-SI', {
                hour: '2-digit',
                minute: '2-digit',
              })})`
            : draft.lastUpdatedLabel,
    });
    onClose();
  };

  const tabs: { id: ImportModalTab; label: string }[] = [
    { id: 'paste', label: 'Prilepi iz DVK' },
    { id: 'turnout', label: 'Udeležba' },
    { id: 'mayor', label: 'Župan' },
    { id: 'council', label: 'Občinski svet' },
    { id: 'ks', label: 'KS Pragersko–Gaj' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-lg">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2
              id="import-modal-title"
              className="text-lg font-bold text-slate-900"
            >
              Vnos ali uvoz izidov DVK (LV 2026)
            </h2>
            <p className="text-xs text-slate-500">
              Vnesite uradne podatke s portala volitve.dvk-rs.si/lv2026 ali OVK Občine Slovenska Bistrica.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zapri okno"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="stage-select" className="text-xs text-slate-600">
              Status:
            </label>
            <select
              id="stage-select"
              value={draft.stage}
              onChange={(e) =>
                setDraft({ ...draft, stage: e.target.value as ElectionStage })
              }
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
            >
              <option value="v_teku">Volitve v teku</option>
              <option value="delni">Delni neuradni izidi</option>
              <option value="koncni">Uradni končni izidi</option>
            </select>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-lg text-xs text-slate-700 space-y-2">
                <p className="font-semibold text-slate-900">
                  Kako uvoziti podatke s portala DVK (volitve.dvk-rs.si/lv2026)
                </p>
                <p>
                  Državna volilna komisija spletno stran ščiti z zaščito Cloudflare, zato neposreden strežniški zajem ni dovoljen. Odprite uradno stran DVK, označite in kopirajte vrstice z rezultati ali udeležbo za Občino Slovenska Bistrica ter jih prilepite spodaj.
                </p>
                <a
                  href={DVK_LV2026_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-[#0F4C81] hover:underline"
                >
                  <span>Odpri volitve.dvk-rs.si/lv2026/#/udelezba</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="dvk-paste-textarea"
                  className="block text-xs font-medium text-slate-700"
                >
                  Prilepite besedilo ali JSON s portala DVK / OVK
                </label>
                <textarea
                  id="dvk-paste-textarea"
                  rows={7}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`Primer:\n11:00 Občina Slovenska Bistrica 11,60 %\n16:00 Občina Slovenska Bistrica 29,40 %\nIvan Žagar 5420\nPeter Cvahte 1680\nEdita Gošnik 1240\nMatej Španinger 410`}
                  className="w-full p-3 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleApplyPaste}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#0F4C81] hover:bg-[#0c3d68] rounded-lg transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Razčleni in prenesi v obrazec</span>
                </button>
              </div>

              {parseNotes.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-1">
                  {parseNotes.map((note, idx) => (
                    <p key={idx}>{note}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'turnout' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Vnesite odstotke volilne udeležbe (npr. 11,60 ali 42,80). Prazno polje pomeni, da podatek še ni objavljen.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                      <th className="py-2 pr-3">Časovni presek</th>
                      <th className="py-2 px-3">Občina Slovenska Bistrica (%)</th>
                      <th className="py-2 px-3">KS Pragersko–Gaj (%)</th>
                      <th className="py-2 pl-3">Slovenija (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {draft.turnout.map((t, idx) => (
                      <tr key={t.time}>
                        <td className="py-3 pr-3 font-medium text-slate-900">
                          {t.label}
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={t.municipalityPct ?? ''}
                            onChange={(e) => {
                              const next = [...draft.turnout];
                              next[idx] = {
                                ...next[idx],
                                municipalityPct: parseNullableNumber(e.target.value),
                              };
                              setDraft({ ...draft, turnout: next });
                            }}
                            className="w-28 px-2.5 py-1.5 font-mono text-sm border border-slate-300 rounded-lg"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={t.pragerskoPct ?? ''}
                            onChange={(e) => {
                              const next = [...draft.turnout];
                              next[idx] = {
                                ...next[idx],
                                pragerskoPct: parseNullableNumber(e.target.value),
                              };
                              setDraft({ ...draft, turnout: next });
                            }}
                            className="w-28 px-2.5 py-1.5 font-mono text-sm border border-slate-300 rounded-lg"
                          />
                        </td>
                        <td className="py-3 pl-3">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={t.sloveniaPct ?? ''}
                            onChange={(e) => {
                              const next = [...draft.turnout];
                              next[idx] = {
                                ...next[idx],
                                sloveniaPct: parseNullableNumber(e.target.value),
                              };
                              setDraft({ ...draft, turnout: next });
                            }}
                            className="w-28 px-2.5 py-1.5 font-mono text-sm border border-slate-300 rounded-lg"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'mayor' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Vnesite število prejetih glasov za kandidate za župana Občine Slovenska Bistrica. Deleži in drugi krog se izračunajo samodejno.
              </p>
              <div className="space-y-3">
                {draft.mayoralCandidates.map((c, idx) => (
                  <div
                    key={c.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-sm text-slate-900">
                        {c.name}
                      </div>
                      <div className="text-xs text-slate-500">{c.proposer}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label
                        htmlFor={`mayor-votes-${c.id}`}
                        className="text-xs text-slate-600"
                      >
                        Glasovi:
                      </label>
                      <input
                        id={`mayor-votes-${c.id}`}
                        type="number"
                        min="0"
                        step="1"
                        value={c.votes ?? ''}
                        onChange={(e) => {
                          const next = [...draft.mayoralCandidates];
                          next[idx] = {
                            ...next[idx],
                            votes: parseNullableNumber(e.target.value),
                          };
                          setDraft({
                            ...draft,
                            stage: draft.stage === 'v_teku' ? 'delni' : draft.stage,
                            mayoralCandidates: next,
                          });
                        }}
                        className="w-32 px-2.5 py-1.5 font-mono text-sm bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'council' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Vnesite glasove po posameznih volilnih enotah (VE 1–4). Mandati se samodejno razdelijo po D’Hondtovi metodi. 2. volilna enota vključuje KS Pragersko–Gaj.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                      <th className="py-2 pr-3">Lista</th>
                      <th className="py-2 px-2 text-right">1. VE (8)</th>
                      <th className="py-2 px-2 text-right text-[#0F4C81]">
                        2. VE Pragersko (9)
                      </th>
                      <th className="py-2 px-2 text-right">3. VE (7)</th>
                      <th className="py-2 pl-2 text-right">4. VE (7)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {draft.councilLists.map((list, idx) => (
                      <tr key={list.id}>
                        <td className="py-2.5 pr-3 font-medium text-slate-900">
                          {list.shortName}
                        </td>
                        {(['ve1', 've2', 've3', 've4'] as const).map((unitId) => (
                          <td key={unitId} className="py-2.5 px-2 text-right">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              aria-label={`${list.shortName} glasovi v ${unitId}`}
                              value={list.votesByUnit[unitId] ?? ''}
                              onChange={(e) => {
                                const next = [...draft.councilLists];
                                next[idx] = {
                                  ...next[idx],
                                  votesByUnit: {
                                    ...next[idx].votesByUnit,
                                    [unitId]: parseNullableNumber(e.target.value),
                                  },
                                };
                                setDraft({
                                  ...draft,
                                  stage:
                                    draft.stage === 'v_teku' ? 'delni' : draft.stage,
                                  councilLists: next,
                                });
                              }}
                              className="w-24 px-2 py-1 font-mono text-sm text-right bg-white border border-slate-300 rounded-md"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'ks' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Vnesite prejete glasove kandidatov za 7-članski Svet Krajevne skupnosti Pragersko – Gaj.
              </p>
              <div className="space-y-2.5">
                {draft.ksCandidates.map((c, idx) => (
                  <div
                    key={c.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-sm text-slate-900">
                        {c.ballotNumber}. {c.name}
                      </div>
                      <div className="text-xs text-slate-500">{c.proposer}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label
                        htmlFor={`ks-votes-${c.id}`}
                        className="text-xs text-slate-600"
                      >
                        Glasovi:
                      </label>
                      <input
                        id={`ks-votes-${c.id}`}
                        type="number"
                        min="0"
                        step="1"
                        value={c.votes ?? ''}
                        onChange={(e) => {
                          const next = [...draft.ksCandidates];
                          next[idx] = {
                            ...next[idx],
                            votes: parseNullableNumber(e.target.value),
                          };
                          setDraft({
                            ...draft,
                            stage: draft.stage === 'v_teku' ? 'delni' : draft.stage,
                            ksCandidates: next,
                          });
                        }}
                        className="w-28 px-2.5 py-1.5 font-mono text-sm bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onReset2026();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Ponastavi na izhodiščno stanje LV 2026</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
            >
              Prekliči
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-medium text-white bg-[#0F4C81] hover:bg-[#0c3d68] rounded-lg transition-colors cursor-pointer"
            >
              Shrani podatke
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
