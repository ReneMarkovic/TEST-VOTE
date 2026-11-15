#!/usr/bin/env node
/**
 * Prenos in preverjanje uradnih podatkov DVK (volitve.dvk-rs.si/lv2026):
 * - #/udelezba (`data/data.json` + `data/obcine-press/obcina_slovenska_bistrica.json`)
 * - #/obcine/slovenska_bistrica/rezultati (`rez.rez_zup`, `rez.rez_svet`, `kand_rez`, `data/liste.json`)
 *
 * Uporablja se v GitHub Actions (ali ročno z `npm run sync:dvk`) in posodobi
 * datoteko public/lv2026-data.json, ki jo bere statična aplikacija na GitHub Pages.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_PATH = path.join(ROOT_DIR, 'public', 'lv2026-data.json');

const DVK_DATA_URL = 'https://volitve.dvk-rs.si/lv2026/data/data.json';
const DVK_SB_PRESS_URL =
  'https://volitve.dvk-rs.si/lv2026/data/obcine-press/obcina_slovenska_bistrica.json';
const DVK_LISTE_URL = 'https://volitve.dvk-rs.si/lv2026/data/liste.json';

const MUNICIPALITY_ST = 113;
const MUNICIPALITY_NAME = 'SLOVENSKA BISTRICA';

const MAYOR_TEMPLATES = [
  { id: 'zagar', name: 'dr. Ivan Žagar', matchers: ['žagar', 'zagar'] },
  { id: 'cvahte', name: 'dr. Peter Cvahte', matchers: ['cvahte'] },
  { id: 'gosnik', name: 'Edita Gošnik', matchers: ['gošnik', 'gosnik'] },
  { id: 'spaninger', name: 'Matej Španinger', matchers: ['španinger', 'spaninger'] },
];

// Vključuje tudi dejansko DVK tipkarsko napako "GIBANJE SVODODA" v obcine-press JSON-u
const COUNCIL_LIST_TEMPLATES = [
  { id: 'sls', matchers: ['slovenska ljudska stranka', 'sls'] },
  { id: 'sds', matchers: ['slovenska demokratska stranka', 'sds'] },
  { id: 'svoboda', matchers: ['gibanje svoboda', 'gibanje svododa', 'svoboda', 'svododa'] },
  { id: 'sd', matchers: ['socialni demokrati', 'sd'] },
  { id: 'nsi-fokus', matchers: ['nova slovenija', 'nsi', 'fokus'] },
  { id: 'sg', matchers: ['stranka generacij', 'sg'] },
  { id: 'demokrati', matchers: ['demokrati'] },
  { id: 'sns', matchers: ['slovenska nacionalna stranka', 'sns'] },
  { id: 'resnica', matchers: ['resni.ca', 'resnica'] },
];

function toPct(raw) {
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0) {
    return null;
  }
  const pct = raw <= 1 ? raw * 100 : raw;
  return Math.round(pct * 100) / 100;
}

function toInt(raw) {
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0) {
    return null;
  }
  return Math.round(raw);
}

function normalizeTimeLabel(rawTime) {
  if (typeof rawTime !== 'string') return null;
  const match = rawTime.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

function formatDvkDateTime(isoString) {
  if (typeof isoString !== 'string' || !isoString.trim()) return null;
  const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return isoString;
  const [, year, month, day, hour, minute] = match;
  return `${Number(day)}. ${Number(month)}. ${year} ob ${hour}:${minute}`;
}

function formatHourOnly(isoString) {
  if (typeof isoString !== 'string') return null;
  const match = isoString.match(/T(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : null;
}

function formatPctSl(pct) {
  if (typeof pct !== 'number' || !Number.isFinite(pct)) return '—';
  return `${pct.toFixed(2).replace('.', ',')} %`;
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'TEST-VOTE-DVK-Sync/1.0',
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} pri prenosu ${url}`);
  }
  return res.json();
}

async function readExistingOutput() {
  try {
    const raw = await fs.readFile(OUTPUT_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function resolveTurnoutEntry(sbUdel, siUdel, pressUdel, existingCp) {
  const sbPct = toPct(sbUdel?.prc ?? pressUdel?.prc);
  const siPct = toPct(siUdel?.prc);
  const voters = toInt(sbUdel?.gl ?? pressUdel?.glas);
  const eligible = toInt(sbUdel?.upr ?? pressUdel?.st_upr);
  const cert = toInt(sbUdel?.gl_pot);

  return {
    municipalityPct: sbPct ?? existingCp?.municipalityPct ?? null,
    pragerskoPct: existingCp?.pragerskoPct ?? null,
    sloveniaPct: siPct ?? existingCp?.sloveniaPct ?? null,
    municipalityVoters: voters ?? existingCp?.municipalityVoters ?? null,
    municipalityEligible: eligible ?? existingCp?.municipalityEligible ?? null,
    certificatesCount: cert ?? existingCp?.certificatesCount ?? null,
  };
}

function resolveCheckpointTarget(nastavitve) {
  const cas = normalizeTimeLabel(nastavitve?.cas_udelezba);
  if (cas === '11:00' || cas === '16:00' || cas === '19:00') {
    return cas;
  }
  const hourStr = formatHourOnly(nastavitve?.datum);
  if (hourStr) {
    const h = Number(hourStr.split(':')[0]);
    if (h <= 13) return '11:00';
    if (h <= 18) return '16:00';
    return '19:00';
  }
  return null;
}

function collectObjects(root, keys) {
  const items = [];
  if (!root) return items;
  if (Array.isArray(root)) {
    items.push(...root);
  } else if (typeof root === 'object') {
    for (const k of keys) {
      if (Array.isArray(root[k])) {
        items.push(...root[k]);
      }
    }
  }
  return items;
}

function extractMayoralCandidates(sb, press, hasResults) {
  if (!hasResults) {
    return MAYOR_TEMPLATES.map((t) => ({ id: t.id, name: t.name, votes: null }));
  }

  // Primarni vir z vsemi 4 kandidati je `press.rez.rez_zup`, dopolnilno pa `sb.kand_rez`
  const rawList = [
    ...collectObjects(press?.rez, ['rez_zup', 'kand', 'kandidati', 'zupan', 'zupani', 'rezultati']),
    ...collectObjects(sb?.kand_rez, ['rez_zup', 'kand', 'kandidati', 'zupan', 'zupani', 'rezultati']),
    ...collectObjects(sb?.rez, ['rez_zup', 'kand', 'kandidati', 'zupan', 'zupani']),
  ];

  return MAYOR_TEMPLATES.map((template) => {
    const matched = rawList.find((item) => {
      const label = String(
        item?.naz ?? item?.ime ?? item?.naziv ?? item?.kandidat ?? item?.priimek ?? ''
      ).toLowerCase();
      return template.matchers.some((m) => label.includes(m));
    });
    const votes = toInt(
      matched?.gl ?? matched?.glas ?? matched?.glasovi ?? matched?.st_gl
    );
    return {
      id: template.id,
      name: template.name,
      votes,
    };
  });
}

function matchListTemplateId(item, listeMap) {
  const dictEntry = item?.st ? listeMap.get(String(item.st)) : null;
  const label = [
    item?.naz,
    item?.naziv,
    item?.kratica,
    item?.knaz,
    dictEntry?.naz,
    dictEntry?.knaz,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  for (const template of COUNCIL_LIST_TEMPLATES) {
    if (template.matchers.some((m) => label.includes(m))) {
      return template.id;
    }
  }
  return null;
}

function extractCouncilLists(sb, press, listeMap, hasResults) {
  const emptyVotes = () => ({ ve1: null, ve2: null, ve3: null, ve4: null });
  if (!hasResults) {
    return COUNCIL_LIST_TEMPLATES.map((t) => ({
      id: t.id,
      votesByUnit: emptyVotes(),
      dvkTotalVotes: null,
      knownSeatsOverride: null,
    }));
  }

  // DVK obcine-press JSON vsebuje `rez.rez_svet` z zapisi { man, ve: 1..4, st, naz, gl, prc }
  const rawSvet = [
    ...collectObjects(press?.rez, ['rez_svet', 'liste', 'svet', 'obcinski_svet', 'stranke']),
    ...collectObjects(sb?.rez, ['rez_svet', 'liste', 'svet', 'obcinski_svet', 'stranke']),
  ];

  const byId = new Map();
  for (const t of COUNCIL_LIST_TEMPLATES) {
    byId.set(t.id, {
      id: t.id,
      votesByUnit: emptyVotes(),
      dvkTotalVotes: 0,
      hasAnyUnitVotes: false,
      dvkSeatsSum: 0,
      hasAnySeats: false,
    });
  }

  for (const item of rawSvet) {
    const id = matchListTemplateId(item, listeMap);
    if (!id) continue;
    const target = byId.get(id);
    if (!target) continue;

    const unitNum = Number(item?.ve);
    const votes = toInt(item?.gl ?? item?.glas ?? item?.glasovi);
    if (unitNum >= 1 && unitNum <= 4 && votes !== null) {
      target.votesByUnit[`ve${unitNum}`] = votes;
      target.dvkTotalVotes += votes;
      target.hasAnyUnitVotes = true;
    } else if (votes !== null && !target.hasAnyUnitVotes) {
      target.dvkTotalVotes += votes;
      target.hasAnyUnitVotes = true;
    }

    const man = toInt(item?.man ?? item?.mandati ?? item?.mand);
    if (man !== null && votes !== null && votes > 0) {
      target.dvkSeatsSum += man;
      target.hasAnySeats = true;
    }
  }

  return COUNCIL_LIST_TEMPLATES.map((t) => {
    const entry = byId.get(t.id);
    return {
      id: t.id,
      votesByUnit: entry.votesByUnit,
      dvkTotalVotes: entry.hasAnyUnitVotes ? entry.dvkTotalVotes : null,
      knownSeatsOverride: null,
    };
  });
}

function extractInvalidBallots(sb, press) {
  for (const src of [press?.rez, sb?.rez]) {
    if (src && typeof src === 'object' && !Array.isArray(src)) {
      const nev = toInt(src.nev ?? src.neveljavni ?? src.neveljavne);
      if (nev !== null) return nev;
    }
  }
  return null;
}

function extractCountedBallots(sb, press) {
  for (const src of [press?.rez, sb?.rez]) {
    if (src && typeof src === 'object' && !Array.isArray(src)) {
      const gl = toInt(src.gl ?? src.glas ?? src.glasovi);
      if (gl !== null) return gl;
    }
  }
  return 0;
}

async function main() {
  console.log(`Prenašam uradne podatke DVK z ${DVK_DATA_URL} ...`);
  const [dataJson, pressJson, listeJson, existing] = await Promise.all([
    fetchJson(DVK_DATA_URL),
    fetchJson(DVK_SB_PRESS_URL).catch((err) => {
      console.warn(`Opozorilo: press endpoint ni dosegljiv (${err.message}).`);
      return null;
    }),
    fetchJson(DVK_LISTE_URL).catch(() => []),
    readExistingOutput(),
  ]);

  const nastavitve = dataJson?.nastavitve;
  const slovenija = dataJson?.slovenija;
  const obcine = slovenija?.obcine;

  if (!nastavitve || !slovenija || !Array.isArray(obcine)) {
    throw new Error('Neveljavna struktura DVK data.json (manjka nastavitve ali slovenija.obcine).');
  }

  const sb = obcine.find(
    (o) =>
      o?.st === MUNICIPALITY_ST ||
      String(o?.naz ?? '').trim().toUpperCase() === MUNICIPALITY_NAME
  );

  if (!sb) {
    throw new Error('Občina Slovenska Bistrica (st: 113) ni najdena v DVK data.json.');
  }

  const listeMap = new Map(
    Array.isArray(listeJson)
      ? listeJson.map((entry) => [String(entry.st), entry])
      : []
  );

  const casUdelezba = resolveCheckpointTarget(nastavitve);
  const existingByTime = new Map(
    Array.isArray(existing?.turnout)
      ? existing.turnout.map((t) => [t.time, t])
      : []
  );

  const cp11SourceSb =
    sb.udel_11 ?? (casUdelezba === '11:00' ? sb.udel : null);
  const cp11SourceSi =
    slovenija.udel_11 ?? (casUdelezba === '11:00' ? slovenija.udel : null);

  const cp16SourceSb =
    sb.udel_16 ?? (casUdelezba === '16:00' ? sb.udel : null);
  const cp16SourceSi =
    slovenija.udel_16 ?? (casUdelezba === '16:00' ? slovenija.udel : null);
  const cp16SourcePress = casUdelezba === '16:00' ? pressJson?.udel : null;

  const cp19SourceSb =
    sb.udel_19 ?? (casUdelezba === '19:00' ? sb.udel : null);
  const cp19SourceSi =
    slovenija.udel_19 ?? (casUdelezba === '19:00' ? slovenija.udel : null);
  const cp19SourcePress = casUdelezba === '19:00' ? pressJson?.udel : null;

  const turnout = [
    {
      label: 'Udeležba ob 11:00',
      time: '11:00',
      ...resolveTurnoutEntry(
        cp11SourceSb,
        cp11SourceSi,
        casUdelezba === '11:00' ? pressJson?.udel : null,
        existingByTime.get('11:00')
      ),
    },
    {
      label: 'Udeležba ob 16:00',
      time: '16:00',
      ...resolveTurnoutEntry(
        cp16SourceSb,
        cp16SourceSi,
        cp16SourcePress,
        existingByTime.get('16:00')
      ),
    },
    {
      label: 'Končna udeležba ob 19:00',
      time: '19:00',
      ...resolveTurnoutEntry(
        cp19SourceSb,
        cp19SourceSi,
        cp19SourcePress,
        existingByTime.get('19:00')
      ),
    },
  ];

  const hasResultFlag = Boolean(nastavitve.has_rezultat);
  const hasActualResultData =
    sb.rez !== null || sb.kand_rez !== null || pressJson?.rez !== null;
  const hasResults = hasResultFlag && hasActualResultData;
  const isFinal = Boolean(nastavitve.is_final);

  const stage = !hasResults
    ? 'v_teku'
    : isFinal
      ? 'koncni'
      : 'delni';

  const latestTurnout =
    [...turnout].reverse().find((t) => t.municipalityPct !== null) ?? turnout[0];

  const dvkClock =
    formatHourOnly(nastavitve.datum ?? pressJson?.datum) ??
    formatHourOnly(nastavitve.timestamp);
  const dvkFormattedDate = formatDvkDateTime(
    nastavitve.datum ?? pressJson?.datum ?? nastavitve.timestamp
  );

  const dvkCountedPct =
    typeof sb.prestetih_glasov === 'number'
      ? toPct(sb.prestetih_glasov)
      : null;
  const dvkVotesCounted = extractCountedBallots(sb, pressJson);

  const lastUpdatedLabel = hasResults
    ? `${isFinal ? 'Končni' : 'Delni'} izidi DVK (${
        dvkCountedPct !== null ? `preštetih ${formatPctSl(dvkCountedPct)} · ` : ''
      }${dvkVotesCounted} glasov${dvkClock ? ` · osveženo ${dvkClock}` : ''})`
    : `Udeležba ob ${latestTurnout?.time ?? casUdelezba ?? '16:00'}: SB ${formatPctSl(
        latestTurnout?.municipalityPct
      )} · SI ${formatPctSl(latestTurnout?.sloveniaPct)}${
        dvkClock ? ` (osveženo DVK ${dvkClock})` : ''
      }`;

  const eligibleVotersMunicipality =
    toInt(sb.udel?.upr ?? pressJson?.udel?.st_upr) ??
    latestTurnout?.municipalityEligible ??
    existing?.eligibleVotersMunicipality ??
    20336;

  const mayoralCandidates = extractMayoralCandidates(sb, pressJson, hasResults);
  const councilLists = extractCouncilLists(sb, pressJson, listeMap, hasResults);
  const invalidBallotsMayor = extractInvalidBallots(sb, pressJson);

  const output = {
    year: 2026,
    dateLabel: '15. november 2026',
    stage,
    hasResults,
    casUdelezba: casUdelezba ?? null,
    dvkUpdatedAt: dvkFormattedDate ?? nastavitve.datum ?? null,
    dvkVotesCounted,
    dvkCountedPct,
    invalidBallotsMayor,
    lastUpdatedLabel,
    eligibleVotersMunicipality,
    turnout,
    mayoralCandidates,
    councilLists,
  };

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  console.log(
    `Uspešno posodobljeno public/lv2026-data.json | cas_udelezba=${output.casUdelezba} | SB=${latestTurnout?.municipalityPct}% (${latestTurnout?.municipalityVoters}/${latestTurnout?.municipalityEligible}) | SI=${latestTurnout?.sloveniaPct}% | has_rezultat=${output.hasResults} | counted=${dvkVotesCounted} (${dvkCountedPct}%)`
  );
}

main().catch((err) => {
  console.error('Napaka pri prenosu podatkov DVK:', err);
  process.exit(1);
});
