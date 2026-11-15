import type {
  CouncilList,
  ElectionDataset,
  ElectoralUnit,
  KsCandidate,
  MayoralCandidate,
} from '../types/election';

export interface ComputedMayoralResult extends MayoralCandidate {
  pct: number | null;
  rank: number;
}

export interface ComputedMayoralOutcome {
  totalValidVotes: number;
  hasResults: boolean;
  winnerFirstRound: ComputedMayoralResult | null;
  runoffPair: [ComputedMayoralResult, ComputedMayoralResult] | null;
  candidates: ComputedMayoralResult[];
}

export interface ComputedListResult extends CouncilList {
  totalVotes: number;
  pct: number | null;
  seatsTotal: number;
  seatsByUnit: Record<string, number>;
  seatDeltaFrom2022: number;
}

export interface ComputedKsCandidate extends KsCandidate {
  pctOfBallots: number | null;
  rank: number;
  elected: boolean;
}

export function formatPct(val: number | null | undefined, digits = 2): string {
  if (val === null || val === undefined || Number.isNaN(val)) return '—';
  return `${val.toFixed(digits).replace('.', ',')} %`;
}

export function formatInt(val: number | null | undefined): string {
  if (val === null || val === undefined || Number.isNaN(val)) return '—';
  return val.toLocaleString('sl-SI');
}

export function computeMayoralResults(candidates: MayoralCandidate[]): ComputedMayoralOutcome {
  const hasResults = candidates.some((c) => typeof c.votes === 'number' && c.votes > 0);
  const totalValidVotes = candidates.reduce((acc, c) => acc + (c.votes ?? 0), 0);

  const sorted = [...candidates]
    .sort((a, b) => (b.votes ?? -1) - (a.votes ?? -1))
    .map((c, idx) => {
      const pct =
        c.knownPct2022 !== undefined
          ? c.knownPct2022
          : totalValidVotes > 0 && c.votes !== null
            ? (c.votes / totalValidVotes) * 100
            : null;
      return {
        ...c,
        pct,
        rank: idx + 1,
      };
    });

  let winnerFirstRound: ComputedMayoralResult | null = null;
  let runoffPair: [ComputedMayoralResult, ComputedMayoralResult] | null = null;

  if (hasResults && sorted.length > 0 && sorted[0].pct !== null) {
    if (sorted[0].pct > 50) {
      winnerFirstRound = sorted[0];
    } else if (sorted.length >= 2) {
      runoffPair = [sorted[0], sorted[1]];
    }
  }

  return {
    totalValidVotes,
    hasResults,
    winnerFirstRound,
    runoffPair,
    candidates: sorted,
  };
}

/**
 * D'Hondt allocation per electoral unit, matching Slovenian Local Elections Act (ZLV).
 */
export function allocateDHondtForUnit(
  lists: CouncilList[],
  unitId: string,
  seatsCount: number
): Record<string, number> {
  const allocation: Record<string, number> = {};
  for (const list of lists) allocation[list.id] = 0;

  const active = lists.filter((l) => (l.votesByUnit[unitId] ?? 0) > 0);
  if (active.length === 0 || seatsCount <= 0) return allocation;

  for (let seat = 0; seat < seatsCount; seat++) {
    let bestId: string | null = null;
    let bestQuotient = -1;

    for (const list of active) {
      const votes = list.votesByUnit[unitId] ?? 0;
      const quotient = votes / (allocation[list.id] + 1);
      if (quotient > bestQuotient) {
        bestQuotient = quotient;
        bestId = list.id;
      }
    }

    if (bestId) {
      allocation[bestId] += 1;
    }
  }

  return allocation;
}

export function computeCouncilResults(
  lists: CouncilList[],
  units: ElectoralUnit[]
): {
  lists: ComputedListResult[];
  totalVotes: number;
  totalSeatsAllocated: number;
  hasVoteData: boolean;
  unitTotals: Record<string, number>;
} {
  const unitTotals: Record<string, number> = {};
  for (const unit of units) {
    unitTotals[unit.id] = lists.reduce((sum, l) => sum + (l.votesByUnit[unit.id] ?? 0), 0);
  }

  const totalVotes = Object.values(unitTotals).reduce((a, b) => a + b, 0);
  const hasVoteData = totalVotes > 0;
  const hasKnownOverrides = lists.some((l) => typeof l.knownSeatsOverride === 'number');

  const unitAllocations: Record<string, Record<string, number>> = {};
  for (const unit of units) {
    unitAllocations[unit.id] = allocateDHondtForUnit(lists, unit.id, unit.seats);
  }

  const computed: ComputedListResult[] = lists.map((list) => {
    const listVotes = units.reduce((sum, u) => sum + (list.votesByUnit[u.id] ?? 0), 0);
    const seatsByUnit: Record<string, number> = {};
    let seatsTotal = 0;

    for (const unit of units) {
      const s = unitAllocations[unit.id][list.id] ?? 0;
      seatsByUnit[unit.id] = s;
      seatsTotal += s;
    }

    if (!hasVoteData && hasKnownOverrides && typeof list.knownSeatsOverride === 'number') {
      seatsTotal = list.knownSeatsOverride;
    }

    return {
      ...list,
      totalVotes: listVotes,
      pct: totalVotes > 0 ? (listVotes / totalVotes) * 100 : null,
      seatsTotal,
      seatsByUnit,
      seatDeltaFrom2022: seatsTotal - list.seats2022,
    };
  });

  computed.sort((a, b) => {
    if (b.seatsTotal !== a.seatsTotal) return b.seatsTotal - a.seatsTotal;
    if (b.totalVotes !== a.totalVotes) return b.totalVotes - a.totalVotes;
    return b.seats2022 - a.seats2022;
  });

  const totalSeatsAllocated = computed.reduce((s, l) => s + l.seatsTotal, 0);

  return {
    lists: computed,
    totalVotes,
    totalSeatsAllocated,
    hasVoteData,
    unitTotals,
  };
}

export function computeKsResults(
  candidates: KsCandidate[],
  seatsTotal: number
): {
  candidates: ComputedKsCandidate[];
  totalVotesCast: number;
  hasResults: boolean;
} {
  const hasResults = candidates.some((c) => typeof c.votes === 'number' && c.votes > 0);
  const totalVotesCast = candidates.reduce((acc, c) => acc + (c.votes ?? 0), 0);

  const sorted = [...candidates].sort((a, b) => {
    const va = a.votes ?? -1;
    const vb = b.votes ?? -1;
    if (vb !== va) return vb - va;
    return a.ballotNumber - b.ballotNumber;
  });

  const computed: ComputedKsCandidate[] = sorted.map((c, idx) => ({
    ...c,
    pctOfBallots: totalVotesCast > 0 && c.votes !== null ? (c.votes / totalVotesCast) * 100 : null,
    rank: idx + 1,
    elected: hasResults && idx < seatsTotal && (c.votes ?? 0) > 0,
  }));

  return {
    candidates: computed,
    totalVotesCast,
    hasResults,
  };
}

function normalizeStr(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface ParsedImportResult {
  matchedMayorCount: number;
  matchedCouncilCount: number;
  matchedKsCount: number;
  matchedTurnoutCount: number;
  updatedDataset: ElectionDataset;
  notes: string[];
}

/**
 * Parses pasted JSON or raw Slovenian text copied from volitve.dvk-rs.si/lv2026 or OVK Slovenska Bistrica.
 */
export function parseDvkImportText(rawText: string, current: ElectionDataset): ParsedImportResult {
  const next: ElectionDataset = structuredClone(current);
  const notes: string[] = [];
  let matchedMayorCount = 0;
  let matchedCouncilCount = 0;
  let matchedKsCount = 0;
  let matchedTurnoutCount = 0;

  const trimmed = rawText.trim();
  if (!trimmed) {
    return {
      matchedMayorCount: 0,
      matchedCouncilCount: 0,
      matchedKsCount: 0,
      matchedTurnoutCount: 0,
      updatedDataset: next,
      notes: ['Vneseno besedilo je prazno.'],
    };
  }

  // Try structured JSON first if user copied DVK XHR payload or exported JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.mayoralCandidates)) {
        return {
          matchedMayorCount: parsed.mayoralCandidates.length,
          matchedCouncilCount: Array.isArray(parsed.councilLists) ? parsed.councilLists.length : 0,
          matchedKsCount: Array.isArray(parsed.ksCandidates) ? parsed.ksCandidates.length : 0,
          matchedTurnoutCount: Array.isArray(parsed.turnout) ? parsed.turnout.length : 0,
          updatedDataset: { ...next, ...parsed },
          notes: ['Uspešno uvožen celoten JSON paket volilnih podatkov.'],
        };
      }
    } catch {
      // Fall through to line-by-line Slovenian text parser
    }
  }

  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    const normLine = normalizeStr(line);

    // Match turnout percentages like "11:00 ... 11,60 %" or "16:00 ... 29,4 %"
    const pctMatch = line.match(/(\d{1,2}[.,]\d{1,2})\s*%/);
    if (pctMatch) {
      const val = parseFloat(pctMatch[1].replace(',', '.'));
      if (!Number.isNaN(val) && val <= 100) {
        if (normLine.includes('11 00') || normLine.includes('11 uri') || normLine.includes('11h')) {
          if (normLine.includes('pragersko')) {
            next.turnout[0].pragerskoPct = val;
          } else if (normLine.includes('slovenij')) {
            next.turnout[0].sloveniaPct = val;
          } else {
            next.turnout[0].municipalityPct = val;
          }
          matchedTurnoutCount++;
          continue;
        }
        if (normLine.includes('16 00') || normLine.includes('16 uri') || normLine.includes('16h')) {
          if (normLine.includes('pragersko')) {
            next.turnout[1].pragerskoPct = val;
          } else if (normLine.includes('slovenij')) {
            next.turnout[1].sloveniaPct = val;
          } else {
            next.turnout[1].municipalityPct = val;
          }
          matchedTurnoutCount++;
          continue;
        }
        if (normLine.includes('19 00') || normLine.includes('19 uri') || normLine.includes('koncn')) {
          if (normLine.includes('pragersko')) {
            next.turnout[2].pragerskoPct = val;
          } else if (normLine.includes('slovenij')) {
            next.turnout[2].sloveniaPct = val;
          } else {
            next.turnout[2].municipalityPct = val;
          }
          matchedTurnoutCount++;
          continue;
        }
      }
    }

    // Extract integer vote count (supports "1.234", "1 234", or "1234")
    const numMatches = [...line.matchAll(/\b(\d{1,3}(?:[.\s]\d{3})+|\d{1,6})\b/g)];
    const candidateNums = numMatches
      .map((m) => parseInt(m[1].replace(/[.\s]/g, ''), 10))
      .filter((n) => !Number.isNaN(n) && n >= 0 && n < 50000);

    // Avoid picking years like 1972 or 2026 if there's another vote count
    const voteNumber =
      candidateNums.length > 0
        ? candidateNums[candidateNums.length - 1]
        : null;

    if (voteNumber === null) continue;

    // Match Mayoral Candidates
    let matchedLine = false;
    for (const mc of next.mayoralCandidates) {
      const surname = normalizeStr(mc.name).split(' ').pop() ?? '';
      if (surname && normLine.includes(surname)) {
        mc.votes = voteNumber;
        matchedMayorCount++;
        matchedLine = true;
        break;
      }
    }
    if (matchedLine) continue;

    // Match KS Pragersko-Gaj Candidates
    for (const kc of next.ksCandidates) {
      const parts = normalizeStr(kc.name).split(' ');
      const surname = parts[parts.length - 1] ?? '';
      const first = parts[0] ?? '';
      if (surname && first && normLine.includes(surname) && normLine.includes(first)) {
        kc.votes = voteNumber;
        matchedKsCount++;
        matchedLine = true;
        break;
      }
    }
    if (matchedLine) continue;

    // Match Council Lists (check unit hint VE1..VE4 or default VE2 if unspecified)
    for (const cl of next.councilLists) {
      const shortNorm = normalizeStr(cl.shortName);
      const keywords = [shortNorm];
      if (cl.id === 'svoboda') keywords.push('svoboda');
      if (cl.id === 'nsi-fokus') keywords.push('nsi', 'fokus', 'nova slovenija');
      if (cl.id === 'sg') keywords.push('generacij');
      if (cl.id === 'resnica') keywords.push('resnica', 'resni ca');

      if (keywords.some((kw) => kw && normLine.includes(kw))) {
        let targetUnit = 've1';
        if (normLine.includes('ve 2') || normLine.includes('2 enota') || normLine.includes('pragersko')) {
          targetUnit = 've2';
        } else if (normLine.includes('ve 3') || normLine.includes('3 enota')) {
          targetUnit = 've3';
        } else if (normLine.includes('ve 4') || normLine.includes('4 enota')) {
          targetUnit = 've4';
        }
        cl.votesByUnit[targetUnit] = voteNumber;
        matchedCouncilCount++;
        matchedLine = true;
        break;
      }
    }
  }

  if (matchedMayorCount + matchedCouncilCount + matchedKsCount + matchedTurnoutCount > 0) {
    next.stage = matchedMayorCount > 0 || matchedCouncilCount > 0 || matchedKsCount > 0 ? 'delni' : next.stage;
    next.lastUpdatedLabel = `Posodobljeno iz uvoza (${new Date().toLocaleTimeString('sl-SI', {
      hour: '2-digit',
      minute: '2-digit',
    })})`;
    notes.push(
      `Prepoznani podatki: udeležba (${matchedTurnoutCount}), župan (${matchedMayorCount}), liste OS (${matchedCouncilCount}), KS Pragersko–Gaj (${matchedKsCount}).`
    );
  } else {
    notes.push(
      'Iz prilepljenega besedila ni bilo mogoče samodejno razbrati številk. Uporabite neposredni vnos v tabeli ali format "Priimek - število glasov".'
    );
  }

  return {
    matchedMayorCount,
    matchedCouncilCount,
    matchedKsCount,
    matchedTurnoutCount,
    updatedDataset: next,
    notes,
  };
}

export function generateSummaryText(dataset: ElectionDataset): string {
  const mayor = computeMayoralResults(dataset.mayoralCandidates);
  const council = computeCouncilResults(dataset.councilLists, dataset.electoralUnits);
  const ks = computeKsResults(dataset.ksCandidates, dataset.ksSeatsTotal);

  const stageLabel =
    dataset.stage === 'koncni'
      ? 'URADNI KONČNI IZIDI'
      : dataset.stage === 'delni'
        ? 'DELNI NEURADNI IZIDI'
        : 'STANJE NA VOLILNI DAN (V TEKU)';

  const lines: string[] = [];
  lines.push(`POVZETEK LOKALNIH VOLITEV ${dataset.year} — OBČINA SLOVENSKA BISTRICA IN KS PRAGERSKO–GAJ`);
  lines.push(`Datum: ${dataset.dateLabel} · Status: ${stageLabel}`);
  lines.push('');

  lines.push('1. VOLILNA UDELEŽBA');
  for (const t of dataset.turnout) {
    lines.push(
      `- ${t.label}: Občina Slovenska Bistrica ${formatPct(t.municipalityPct)} | KS Pragersko–Gaj ${formatPct(t.pragerskoPct)} | Slovenija ${formatPct(t.sloveniaPct)}`
    );
  }
  lines.push('');

  lines.push('2. ŽUPAN OBČINE SLOVENSKA BISTRICA');
  if (mayor.hasResults) {
    if (mayor.winnerFirstRound) {
      lines.push(
        `V prvem krogu je zmagal/a ${mayor.winnerFirstRound.name} (${formatInt(mayor.winnerFirstRound.votes)} glasov oz. ${formatPct(mayor.winnerFirstRound.pct)}).`
      );
    } else if (mayor.runoffPair) {
      lines.push(
        `Noben kandidat ni presegel 50 %. V drugi krog sta se uvrstila ${mayor.runoffPair[0].name} (${formatPct(mayor.runoffPair[0].pct)}) in ${mayor.runoffPair[1].name} (${formatPct(mayor.runoffPair[1].pct)}).`
      );
    }
    for (const c of mayor.candidates) {
      lines.push(`- ${c.name} (${c.proposer}): ${formatInt(c.votes)} glasov (${formatPct(c.pct)})`);
    }
  } else {
    lines.push('Glasovi še niso vneseni. Potrjeni kandidati: ' + mayor.candidates.map((c) => c.name).join(', ') + '.');
  }
  lines.push('');

  lines.push('3. OBČINSKI SVET OBČINE SLOVENSKA BISTRICA (31 sedežev, 4 volilne enote)');
  if (council.hasVoteData || council.totalSeatsAllocated > 0) {
    for (const l of council.lists) {
      lines.push(
        `- ${l.shortName}: ${l.seatsTotal} mandatov${l.totalVotes > 0 ? ` (${formatInt(l.totalVotes)} glasov, ${formatPct(l.pct)})` : ''} · 2. VE (Pragersko–Gaj): ${l.seatsByUnit['ve2'] ?? 0} mandatov`
      );
    }
  } else {
    lines.push(
      `Vloženo je ${council.lists.length} kandidatnih list za 31 mandatov. KS Pragersko–Gaj spada v 2. volilno enoto (9 mandatov).`
    );
  }
  lines.push('');

  lines.push('4. SVET KRAJEVNE SKUPNOSTI PRAGERSKO – GAJ (7 sedežev, večinski sistem)');
  if (ks.hasResults) {
    const elected = ks.candidates.filter((c) => c.elected);
    lines.push(`Izvoljeni člani sveta KS Pragersko–Gaj (${elected.length}/${dataset.ksSeatsTotal}):`);
    for (const c of ks.candidates) {
      lines.push(
        `- #${c.rank} ${c.name}: ${formatInt(c.votes)} glasov${c.elected ? ' [IZVOLJEN/A]' : ''}`
      );
    }
  } else if (dataset.ksCandidates.length > 0) {
    lines.push(
      'Rezultati glasovanja za svet KS še niso objavljeni. Potrjeni kandidati: ' +
        dataset.ksCandidates.map((c) => `${c.ballotNumber}. ${c.name}`).join(', ') +
        '.'
    );
  } else {
    lines.push('Podatki za svet KS v tem naboru niso na voljo.');
  }

  lines.push('');
  lines.push(`Vir: ${dataset.sourceNote}`);
  return lines.join('\n');
}
