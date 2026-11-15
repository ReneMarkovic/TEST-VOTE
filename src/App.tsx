import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Header } from './components/Header';
import { TurnoutSection } from './components/TurnoutSection';
import { MayoralAndCouncilSection } from './components/MayoralAndCouncilSection';
import { CouncilCandidatesSection } from './components/CouncilCandidatesSection';
import { PragerskoGajSection } from './components/PragerskoGajSection';
import { SummarySection } from './components/SummarySection';
import { ImportModal, type ImportModalTab } from './components/ImportModal';
import {
  DVK_LV2026_URL,
  DVK_SB_REZULTATI_URL,
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
        const existingTurnout = Array.isArray(parsed.turnout) ? parsed.turnout : [];
        const mergedTurnout = INITIAL_LV2026_DATA.turnout.map((initCp, idx) => {
          const savedCp = existingTurnout[idx];
          if (!savedCp) return initCp;
          return {
            ...initCp,
            ...savedCp,
            municipalityPct:
              savedCp.municipalityPct === 11.6 && initCp.time === '11:00'
                ? initCp.municipalityPct
                : (savedCp.municipalityPct ?? initCp.municipalityPct),
            sloveniaPct: savedCp.sloveniaPct ?? initCp.sloveniaPct,
            municipalityVoters:
              savedCp.municipalityVoters ?? initCp.municipalityVoters,
            municipalityEligible:
              savedCp.municipalityEligible ?? initCp.municipalityEligible,
            certificatesCount:
              savedCp.certificatesCount ?? initCp.certificatesCount,
          };
        });
        return {
          ...INITIAL_LV2026_DATA,
          ...parsed,
          lastUpdatedLabel:
            parsed.stage === 'v_teku' || !parsed.stage
              ? INITIAL_LV2026_DATA.lastUpdatedLabel
              : (parsed.lastUpdatedLabel ?? INITIAL_LV2026_DATA.lastUpdatedLabel),
          eligibleVotersMunicipality:
            INITIAL_LV2026_DATA.eligibleVotersMunicipality ??
            parsed.eligibleVotersMunicipality ??
            null,
          turnout: mergedTurnout,
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lv2026Data));
    } catch {
      // Ignore storage errors
    }
  }, [lv2026Data]);

  const handleRefreshData = useCallback(async (options?: { silent?: boolean }) => {
    const silent = Boolean(options?.silent);
    if (!silent) {
      setIsRefreshing(true);
    }
    const nowTime = new Date().toLocaleTimeString('sl-SI', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    try {
      const feedUrl = `${import.meta.env.BASE_URL}lv2026-data.json?t=${Date.now()}`;
      const res = await fetch(feedUrl, { cache: 'no-store' });
      if (res.ok) {
        const remote = (await res.json()) as Partial<ElectionDataset>;
        setLv2026Data((prev) => {
          const mergedTurnout = prev.turnout.map((cp, idx) => {
            const rCp = remote.turnout?.[idx];
            if (!rCp) return cp;
            return {
              ...cp,
              municipalityPct: rCp.municipalityPct ?? cp.municipalityPct,
              pragerskoPct: rCp.pragerskoPct ?? cp.pragerskoPct,
              sloveniaPct: rCp.sloveniaPct ?? cp.sloveniaPct,
              municipalityVoters: rCp.municipalityVoters ?? cp.municipalityVoters,
              municipalityEligible:
                rCp.municipalityEligible ?? cp.municipalityEligible,
              certificatesCount:
                rCp.certificatesCount ?? cp.certificatesCount,
            };
          });
          const mergedMayor = prev.mayoralCandidates.map((mc) => {
            const rMc = remote.mayoralCandidates?.find((x) => x.id === mc.id);
            return rMc ? { ...mc, votes: rMc.votes ?? mc.votes } : mc;
          });
          const mergedCouncil = prev.councilLists.map((cl) => {
            const rCl = remote.councilLists?.find((x) => x.id === cl.id);
            if (!rCl) return cl;
            return {
              ...cl,
              votesByUnit: {
                ve1: rCl.votesByUnit?.ve1 ?? cl.votesByUnit.ve1,
                ve2: rCl.votesByUnit?.ve2 ?? cl.votesByUnit.ve2,
                ve3: rCl.votesByUnit?.ve3 ?? cl.votesByUnit.ve3,
                ve4: rCl.votesByUnit?.ve4 ?? cl.votesByUnit.ve4,
              },
              dvkTotalVotes: rCl.dvkTotalVotes ?? cl.dvkTotalVotes,
              knownSeatsOverride: rCl.knownSeatsOverride ?? cl.knownSeatsOverride,
            };
          });
          const mergedKs = prev.ksCandidates.map((kc) => {
            const rKc = remote.ksCandidates?.find((x) => x.id === kc.id);
            return rKc ? { ...kc, votes: rKc.votes ?? kc.votes } : kc;
          });
          return {
            ...prev,
            stage: remote.stage ?? prev.stage,
            hasResults:
              typeof remote.hasResults === 'boolean'
                ? remote.hasResults
                : prev.hasResults,
            casUdelezba: remote.casUdelezba ?? prev.casUdelezba,
            dvkUpdatedAt: remote.dvkUpdatedAt ?? prev.dvkUpdatedAt,
            dvkVotesCounted: remote.dvkVotesCounted ?? prev.dvkVotesCounted,
            invalidBallotsMayor:
              remote.invalidBallotsMayor ?? prev.invalidBallotsMayor,
            lastUpdatedLabel: remote.lastUpdatedLabel ?? prev.lastUpdatedLabel,
            eligibleVotersMunicipality:
              remote.eligibleVotersMunicipality ?? prev.eligibleVotersMunicipality,
            turnout: mergedTurnout,
            mayoralCandidates: mergedMayor,
            councilLists: mergedCouncil,
            ksCandidates: mergedKs,
          };
        });
        if (!silent) {
          const waitingResults =
            remote.hasResults === false || remote.stage === 'v_teku';
          const dvkMeta = remote.dvkUpdatedAt
            ? ` (vir DVK: ${remote.dvkUpdatedAt})`
            : '';
          setSyncNotice(
            waitingResults
              ? `Preverjeno ob ${nowTime}. Podatki iz lv2026-data.json so osveženi${dvkMeta}. Rezultati za župana in občinski svet še niso objavljeni (čakanje na rezultate). Ker DVK brskalnikom omejuje neposreden dostop s pravilom CORS, datoteko lv2026-data.json samodejno posodablja GitHub Actions.`
              : `Preverjeno ob ${nowTime}. Podatki iz lv2026-data.json so uspešno posodobljeni${dvkMeta}.`
          );
        }
      } else if (!silent) {
        setSyncNotice(
          `Preverjeno ob ${nowTime}: datoteka lv2026-data.json trenutno ni dosegljiva. Za takojšen vnos lahko uporabite »Vnos / Uvoz DVK«.`
        );
      }
    } catch {
      if (!silent) {
        setSyncNotice(
          `Preverjeno ob ${nowTime}: branje datoteke lv2026-data.json ni uspelo. Za takojšen vnos lahko uporabite »Vnos / Uvoz DVK«.`
        );
      }
    } finally {
      if (!silent) {
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void handleRefreshData({ silent: true });
  }, [handleRefreshData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = window.setInterval(() => {
      void handleRefreshData();
    }, 60000);
    return () => window.clearInterval(timer);
  }, [autoRefresh, handleRefreshData]);

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
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleRefreshData()}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#0F4C81] hover:bg-[#0c3d68] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  <span>{isRefreshing ? 'Posodabljanje...' : 'Posodobi podatke'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAutoRefresh((prev) => !prev)}
                  aria-pressed={autoRefresh}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    autoRefresh
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {autoRefresh ? 'Samodejno: vklopljeno (60 s)' : 'Samodejno (60 s)'}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <a
                  href={DVK_LV2026_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0F4C81] hover:underline"
                >
                  DVK udeležba
                </a>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <a
                  href={DVK_SB_REZULTATI_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0F4C81] hover:underline"
                >
                  DVK rezultati (Občina Slovenska Bistrica)
                </a>
              </div>
            </div>
          </div>

          {syncNotice && (
            <div className="px-4 py-3 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700 no-print">
              <span>{syncNotice}</span>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => openModal('paste')}
                  className="font-medium text-[#0F4C81] hover:underline whitespace-nowrap cursor-pointer"
                >
                  Prilepi iz DVK
                </button>
                <button
                  type="button"
                  onClick={() => setSyncNotice(null)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  Zapri
                </button>
              </div>
            </div>
          )}

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
