import { useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { TurnoutSection } from './components/TurnoutSection';
import { MayoralAndCouncilSection } from './components/MayoralAndCouncilSection';
import { CouncilCandidatesSection } from './components/CouncilCandidatesSection';
import { PragerskoGajSection } from './components/PragerskoGajSection';
import { SummarySection } from './components/SummarySection';
import { ImportModal, type ImportModalTab } from './components/ImportModal';
import {
  DVK_LV2026_URL,
  HISTORICAL_LV2022_DATA,
  INITIAL_LV2026_DATA,
} from './data/slovenskaBistricaData';
import type { ElectionDataset, ElectionDatasetMode } from './types/election';
import {
  computeCouncilResults,
  computeKsResults,
  computeMayoralResults,
  formatPct,
} from './utils/electionCalculations';

const STORAGE_KEY = 'sb_pragersko_lv2026_v1';

export default function App() {
  const [mode, setMode] = useState<ElectionDatasetMode>('lv2026');
  const [lv2026Data, setLv2026Data] = useState<ElectionDataset>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<ElectionDataset>;
        const existingCandidates = Array.isArray(parsed.councilCandidates)
          ? parsed.councilCandidates
          : [];
        const existingIds = new Set(existingCandidates.map((c) => c.id));
        const missingInitial = INITIAL_LV2026_DATA.councilCandidates.filter(
          (c) => !existingIds.has(c.id)
        );
        return {
          ...INITIAL_LV2026_DATA,
          ...parsed,
          councilCandidates: [...existingCandidates, ...missingInitial],
        };
      }
    } catch {
      // Ignore storage errors
    }
    return INITIAL_LV2026_DATA;
  });

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importModalTab, setImportModalTab] = useState<ImportModalTab>('paste');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lv2026Data));
    } catch {
      // Ignore storage errors
    }
  }, [lv2026Data]);

  const activeDataset = mode === 'lv2026' ? lv2026Data : HISTORICAL_LV2022_DATA;

  const kpis = useMemo(() => {
    const latestTurnout =
      [...activeDataset.turnout]
        .reverse()
        .find((t) => t.municipalityPct !== null) ?? activeDataset.turnout[0];

    const mayor = computeMayoralResults(activeDataset.mayoralCandidates);
    const council = computeCouncilResults(
      activeDataset.councilLists,
      activeDataset.electoralUnits
    );
    const ks = computeKsResults(
      activeDataset.ksCandidates,
      activeDataset.ksSeatsTotal
    );

    const mayorLeadLabel = mayor.winnerFirstRound
      ? `${mayor.winnerFirstRound.name} (${formatPct(mayor.winnerFirstRound.pct)})`
      : mayor.runoffPair
        ? `${mayor.runoffPair[0].name} · ${mayor.runoffPair[1].name}`
        : `${mayor.candidates.length} potrjeni kandidati`;

    const mayorSubLabel = mayor.winnerFirstRound
      ? 'Izvoljen v 1. krogu'
      : mayor.runoffPair
        ? 'Uvrščena v 2. krog'
        : 'V čakanju na štetje po 19:00';

    const councilTop = council.lists[0];
    const councilValue =
      council.hasVoteData || activeDataset.year === 2022
        ? `${councilTop.shortName}: ${councilTop.seatsTotal} / 31`
        : '31 sedežev · 9 list';

    const ksElectedCount = ks.candidates.filter((c) => c.elected).length;
    const ksValue =
      mode === 'lv2022'
        ? '7 članov sveta KS'
        : ks.hasResults
          ? `${ksElectedCount} / 7 izvoljenih`
          : `${activeDataset.ksCandidates.length} potrjenih kandidatov`;

    return {
      turnoutValue: formatPct(latestTurnout?.municipalityPct),
      turnoutSub: `${latestTurnout?.label ?? 'Udeležba'} · Slovenija ${formatPct(
        latestTurnout?.sloveniaPct
      )}`,
      mayorValue: mayorLeadLabel,
      mayorSub: mayorSubLabel,
      councilValue,
      councilSub:
        council.hasVoteData || activeDataset.year === 2022
          ? 'Najmočnejša lista v občinskem svetu'
          : '4 volilne enote (156 kandidatov)',
      ksValue,
      ksSub: '2. volilna enota (9 občinskih sedežev)',
    };
  }, [activeDataset, mode]);

  const openModal = (tab: ImportModalTab) => {
    setImportModalTab(tab);
    setImportModalOpen(true);
  };

  const handleQuickAddKsCandidate = (name: string, proposer: string) => {
    setLv2026Data((prev) => ({
      ...prev,
      ksCandidates: [
        ...prev.ksCandidates,
        {
          id: `ks-custom-${Date.now()}`,
          ballotNumber: prev.ksCandidates.length + 1,
          name,
          residence: 'Pragersko',
          proposer,
          votes: null,
        },
      ],
    }));
  };

  const handleReset2026 = () => {
    setLv2026Data(INITIAL_LV2026_DATA);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header onOpenImport={() => openModal('paste')} />

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {/* Hero / Overview */}
        <section id="pregled" className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2.5 max-w-3xl">
              <p className="text-xs font-medium text-slate-500">
                Redne lokalne volitve · {activeDataset.dateLabel} ·{' '}
                {activeDataset.lastUpdatedLabel}
              </p>
              <h1
                className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight"
                style={{ textWrap: 'balance' }}
              >
                Izidi lokalnih volitev za Občino Slovenska Bistrica in KS Pragersko–Gaj
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Pregled volilne udeležbe po urah, županske tekme, razreza 31 mandatov občinskega sveta po volilnih enotah ter izidov za 7-članski Svet Krajevne skupnosti Pragersko–Gaj.
              </p>
            </div>

            {/* Interactive Mode Switcher */}
            <div className="flex flex-col sm:items-end gap-2 shrink-0 no-print">
              <div
                className="inline-flex items-center gap-1 p-1 bg-slate-200/75 rounded-lg"
                role="tablist"
                aria-label="Izbira volilnega leta"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'lv2026'}
                  onClick={() => setMode('lv2026')}
                  className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    mode === 'lv2026'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Lokalne volitve 2026
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'lv2022'}
                  onClick={() => setMode('lv2022')}
                  className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    mode === 'lv2022'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Referenca LV 2022
                </button>
              </div>
              <a
                href={DVK_LV2026_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#0F4C81] hover:underline"
              >
                Uradni portal DVK: volitve.dvk-rs.si/lv2026
              </a>
            </div>
          </div>

          {/* 4-column KPI strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5">
              <div className="text-xs font-medium text-slate-500">
                Volilna udeležba (Občina SB)
              </div>
              <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {kpis.turnoutValue}
              </div>
              <div className="text-xs text-slate-600">{kpis.turnoutSub}</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5">
              <div className="text-xs font-medium text-slate-500">
                Župan Občine Slovenska Bistrica
              </div>
              <div className="text-lg font-bold text-slate-900 truncate">
                {kpis.mayorValue}
              </div>
              <div className="text-xs text-slate-600">{kpis.mayorSub}</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5">
              <div className="text-xs font-medium text-slate-500">
                Občinski svet
              </div>
              <div className="font-mono text-xl font-bold text-slate-900 tabular-nums">
                {kpis.councilValue}
              </div>
              <div className="text-xs text-slate-600">{kpis.councilSub}</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5">
              <div className="text-xs font-medium text-slate-500">
                KS Pragersko – Gaj
              </div>
              <div className="font-mono text-xl font-bold text-slate-900 tabular-nums">
                {kpis.ksValue}
              </div>
              <div className="text-xs text-slate-600">{kpis.ksSub}</div>
            </div>
          </div>
        </section>

        <TurnoutSection
          dataset={activeDataset}
          mode={mode}
          onEditTurnout={() => openModal('turnout')}
        />

        <MayoralAndCouncilSection
          dataset={activeDataset}
          mode={mode}
          onEditResults={(tab) => openModal(tab)}
        />

        <CouncilCandidatesSection
          dataset={activeDataset}
          mode={mode}
          onUpdateCandidates={(updated) =>
            setLv2026Data((prev) => ({
              ...prev,
              councilCandidates: updated,
            }))
          }
        />

        <PragerskoGajSection
          dataset={activeDataset}
          mode={mode}
          onEditKs={() => openModal('ks')}
          onQuickAddCandidate={handleQuickAddKsCandidate}
        />

        <SummarySection dataset={activeDataset} />
      </main>

      <footer className="border-t border-slate-200 bg-white mt-8 no-print">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Pregled lokalnih volitev · Občina Slovenska Bistrica in KS Pragersko–Gaj
          </div>
          <div>
            Uradni vir podatkov: Državna volilna komisija (volitve.dvk-rs.si/lv2026) in OVK Slovenska Bistrica
          </div>
        </div>
      </footer>

      <ImportModal
        isOpen={importModalOpen}
        initialTab={importModalTab}
        dataset={lv2026Data}
        onClose={() => setImportModalOpen(false)}
        onSaveDataset={(updated) => {
          setLv2026Data(updated);
          setMode('lv2026');
        }}
        onReset2026={handleReset2026}
      />
    </div>
  );
}
