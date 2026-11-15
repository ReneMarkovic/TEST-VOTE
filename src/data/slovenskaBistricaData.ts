import type { CouncilCandidate, ElectionDataset } from '../types/election';

export const DVK_LV2026_URL = 'https://volitve.dvk-rs.si/lv2026/#/udelezba';
export const OB_SLOVENSKA_BISTRICA_URL = 'https://www.slovenska-bistrica.si/';
export const OVK_LISTS_URL = 'https://www.slovenska-bistrica.si/objave/101?subcategory=16915';

export const INITIAL_COUNCIL_CANDIDATES_2026: CouncilCandidate[] = [
  // 1. volilna enota (8 sedežev) — SDS
  { id: 'cc-sds-ve1-1', listId: 'sds', unitId: 've1', ballotOrder: 1, name: 'Žarko Furman', birthYear: 1979, preferentialVotes: null },
  { id: 'cc-sds-ve1-2', listId: 'sds', unitId: 've1', ballotOrder: 2, name: 'mag. Karmen Furman', birthYear: 1980, preferentialVotes: null },
  { id: 'cc-sds-ve1-3', listId: 'sds', unitId: 've1', ballotOrder: 3, name: 'Jožef Jerovšek', birthYear: 1950, preferentialVotes: null },
  { id: 'cc-sds-ve1-4', listId: 'sds', unitId: 've1', ballotOrder: 4, name: 'mag. Iva Pučnik Ozimič', birthYear: 1959, preferentialVotes: null },
  { id: 'cc-sds-ve1-5', listId: 'sds', unitId: 've1', ballotOrder: 5, name: 'Rok Dolničar', birthYear: 1992, preferentialVotes: null },
  { id: 'cc-sds-ve1-6', listId: 'sds', unitId: 've1', ballotOrder: 6, name: 'Karin Ribič', birthYear: 2000, preferentialVotes: null },
  { id: 'cc-sds-ve1-7', listId: 'sds', unitId: 've1', ballotOrder: 7, name: 'Stanislava Korošec', birthYear: 1949, preferentialVotes: null },
  { id: 'cc-sds-ve1-8', listId: 'sds', unitId: 've1', ballotOrder: 8, name: 'Milan Ozimič', birthYear: 1957, preferentialVotes: null },

  // 1. volilna enota — SLS
  { id: 'cc-sls-ve1-1', listId: 'sls', unitId: 've1', ballotOrder: 1, name: 'Karl Kavkler', birthYear: 1973, preferentialVotes: null },
  { id: 'cc-sls-ve1-2', listId: 'sls', unitId: 've1', ballotOrder: 2, name: 'Mateja Topolič', birthYear: 1981, preferentialVotes: null },
  { id: 'cc-sls-ve1-3', listId: 'sls', unitId: 've1', ballotOrder: 3, name: 'Franc Podgrajšek', birthYear: 1961, preferentialVotes: null },
  { id: 'cc-sls-ve1-4', listId: 'sls', unitId: 've1', ballotOrder: 4, name: 'Nina Razboršek', birthYear: 1982, preferentialVotes: null },
  { id: 'cc-sls-ve1-5', listId: 'sls', unitId: 've1', ballotOrder: 5, name: 'Srečko Juhart', birthYear: 1957, preferentialVotes: null },
  { id: 'cc-sls-ve1-6', listId: 'sls', unitId: 've1', ballotOrder: 6, name: 'dr. Matjaž Šraml', preferentialVotes: null },
  { id: 'cc-sls-ve1-7', listId: 'sls', unitId: 've1', ballotOrder: 7, name: 'Maksim Ferme', preferentialVotes: null },
  { id: 'cc-sls-ve1-8', listId: 'sls', unitId: 've1', ballotOrder: 8, name: 'Nina Kačič', preferentialVotes: null },

  // 1. volilna enota — Gibanje Svoboda
  { id: 'cc-svoboda-ve1-1', listId: 'svoboda', unitId: 've1', ballotOrder: 1, name: 'Danijel Lenošek', preferentialVotes: null },
  { id: 'cc-svoboda-ve1-2', listId: 'svoboda', unitId: 've1', ballotOrder: 2, name: 'Stanislav Fermišek', preferentialVotes: null },
  { id: 'cc-svoboda-ve1-3', listId: 'svoboda', unitId: 've1', ballotOrder: 3, name: 'Tjaša Lerher', preferentialVotes: null },
  { id: 'cc-svoboda-ve1-4', listId: 'svoboda', unitId: 've1', ballotOrder: 4, name: 'Vera Lambert', preferentialVotes: null },
  { id: 'cc-svoboda-ve1-5', listId: 'svoboda', unitId: 've1', ballotOrder: 5, name: 'dr. Vito Martinčič', preferentialVotes: null },
  { id: 'cc-svoboda-ve1-6', listId: 'svoboda', unitId: 've1', ballotOrder: 6, name: 'Marjana Brezovšek', preferentialVotes: null },

  // 1. volilna enota — SD
  { id: 'cc-sd-ve1-1', listId: 'sd', unitId: 've1', ballotOrder: 1, name: 'Samo Šift', birthYear: 1988, residence: 'Leskovec', preferentialVotes: null },

  // 1. volilna enota — NSi + Fokus
  { id: 'cc-nsi-ve1-1', listId: 'nsi-fokus', unitId: 've1', ballotOrder: 1, name: 'Zoran Košič', birthYear: 1971, residence: 'Križni Vrh', preferentialVotes: null },
  { id: 'cc-nsi-ve1-2', listId: 'nsi-fokus', unitId: 've1', ballotOrder: 2, name: 'Brigita Žižek', residence: 'Stari Log', preferentialVotes: null },
  { id: 'cc-nsi-ve1-3', listId: 'nsi-fokus', unitId: 've1', ballotOrder: 3, name: 'Aleš Koren', residence: 'Leskovec', preferentialVotes: null },

  // 1. volilna enota — Stranka generacij (SG)
  { id: 'cc-sg-ve1-1', listId: 'sg', unitId: 've1', ballotOrder: 1, name: 'Bojan Fajs', preferentialVotes: null },
  { id: 'cc-sg-ve1-2', listId: 'sg', unitId: 've1', ballotOrder: 2, name: 'Jelka Jamnikar', preferentialVotes: null },
  { id: 'cc-sg-ve1-3', listId: 'sg', unitId: 've1', ballotOrder: 3, name: 'Jožef Majcen', preferentialVotes: null },
  { id: 'cc-sg-ve1-4', listId: 'sg', unitId: 've1', ballotOrder: 4, name: 'Štefanija Krhlanko', preferentialVotes: null },

  // 1. volilna enota — Demokrati
  { id: 'cc-demokrati-ve1-1', listId: 'demokrati', unitId: 've1', ballotOrder: 1, name: 'Jožef Sobočan', birthYear: 1959, residence: 'Vrhole pri Laporju', preferentialVotes: null },

  // 1. volilna enota — SNS
  { id: 'cc-sns-ve1-1', listId: 'sns', unitId: 've1', ballotOrder: 1, name: 'Tone Kušer', preferentialVotes: null },

  // 1. volilna enota — Resni.ca
  { id: 'cc-resnica-ve1-1', listId: 'resnica', unitId: 've1', ballotOrder: 1, name: 'Matevž Koren', birthYear: 2000, residence: 'Leskovec', preferentialVotes: null },

  // 2. volilna enota (9 sedežev, vključuje KS Pragersko–Gaj) — SLS
  { id: 'cc-sls-ve2-1', listId: 'sls', unitId: 've2', ballotOrder: 1, name: 'Blanka Remškar', birthYear: 1981, residence: 'Spodnja Polskava', preferentialVotes: null },
  { id: 'cc-sls-ve2-2', listId: 'sls', unitId: 've2', ballotOrder: 2, name: 'Rudi Kruh', birthYear: 1961, residence: 'Pragersko', preferentialVotes: null },
  { id: 'cc-sls-ve2-3', listId: 'sls', unitId: 've2', ballotOrder: 3, name: 'Danica Sagadin Leskovar', birthYear: 1958, residence: 'Devina', preferentialVotes: null },
  { id: 'cc-sls-ve2-4', listId: 'sls', unitId: 've2', ballotOrder: 4, name: 'David Prelog', birthYear: 1977, residence: 'Gabernik', preferentialVotes: null },
  { id: 'cc-sls-ve2-5', listId: 'sls', unitId: 've2', ballotOrder: 5, name: 'Marjana Sagadin', birthYear: 1985, residence: 'Kalše', preferentialVotes: null },
  { id: 'cc-sls-ve2-6', listId: 'sls', unitId: 've2', ballotOrder: 6, name: 'Marko Tarkuš', birthYear: 1978, residence: 'Devina', preferentialVotes: null },
  { id: 'cc-sls-ve2-7', listId: 'sls', unitId: 've2', ballotOrder: 7, name: 'Tanja Vintar', birthYear: 1971, residence: 'Pokoše', preferentialVotes: null },
  { id: 'cc-sls-ve2-8', listId: 'sls', unitId: 've2', ballotOrder: 8, name: 'Maksimiljan Prah', birthYear: 1960, residence: 'Pragersko', preferentialVotes: null },
  { id: 'cc-sls-ve2-9', listId: 'sls', unitId: 've2', ballotOrder: 9, name: 'Stanislava Rebernak', birthYear: 1957, residence: 'Kočno pri Polskavi', preferentialVotes: null },

  // 2. volilna enota — SD
  { id: 'cc-sd-ve2-1', listId: 'sd', unitId: 've2', ballotOrder: 1, name: 'Tin Kampl', birthYear: 1990, residence: 'Spodnja Polskava', preferentialVotes: null },
  { id: 'cc-sd-ve2-2', listId: 'sd', unitId: 've2', ballotOrder: 2, name: 'Tatjana Perc Nekrep', birthYear: 1965, preferentialVotes: null },
  { id: 'cc-sd-ve2-3', listId: 'sd', unitId: 've2', ballotOrder: 3, name: 'Boštjan Brbre', birthYear: 1982, preferentialVotes: null },

  // 2. volilna enota — NSi + Fokus
  { id: 'cc-nsi-ve2-1', listId: 'nsi-fokus', unitId: 've2', ballotOrder: 1, name: 'Lea Furlan', residence: 'Pragersko', preferentialVotes: null },
  { id: 'cc-nsi-ve2-2', listId: 'nsi-fokus', unitId: 've2', ballotOrder: 2, name: 'Breda Štern', preferentialVotes: null },

  // 2. volilna enota — Gibanje Svoboda
  { id: 'cc-svoboda-ve2-1', listId: 'svoboda', unitId: 've2', ballotOrder: 1, name: 'Vlasta Holl Lambert', residence: 'Leskovec / Pragersko', preferentialVotes: null },

  // 3. volilna enota (7 sedežev) — SDS
  { id: 'cc-sds-ve3-1', listId: 'sds', unitId: 've3', ballotOrder: 1, name: 'Borut Furman', birthYear: 1986, residence: 'Ošelj', preferentialVotes: null },
  { id: 'cc-sds-ve3-2', listId: 'sds', unitId: 've3', ballotOrder: 2, name: 'Iva Novak', birthYear: 1963, residence: 'Kovača vas', preferentialVotes: null },
  { id: 'cc-sds-ve3-3', listId: 'sds', unitId: 've3', ballotOrder: 3, name: 'Jožef Pečovnik', birthYear: 1957, residence: 'Šmartno na Pohorju', preferentialVotes: null },
  { id: 'cc-sds-ve3-4', listId: 'sds', unitId: 've3', ballotOrder: 4, name: 'Gaja Omerzi', birthYear: 1998, residence: 'Zgornja Bistrica', preferentialVotes: null },

  // 3. volilna enota — SD
  { id: 'cc-sd-ve3-1', listId: 'sd', unitId: 've3', ballotOrder: 1, name: 'Borut Kruder', preferentialVotes: null },
  { id: 'cc-sd-ve3-2', listId: 'sd', unitId: 've3', ballotOrder: 2, name: 'Metka Pristovnik', preferentialVotes: null },
  { id: 'cc-sd-ve3-3', listId: 'sd', unitId: 've3', ballotOrder: 3, name: 'Henrik Stegne', preferentialVotes: null },
  { id: 'cc-sd-ve3-4', listId: 'sd', unitId: 've3', ballotOrder: 4, name: 'Simona Godec', preferentialVotes: null },
  { id: 'cc-sd-ve3-5', listId: 'sd', unitId: 've3', ballotOrder: 5, name: 'Maša Holobar', preferentialVotes: null },

  // 3. volilna enota — NSi + Fokus
  { id: 'cc-nsi-ve3-1', listId: 'nsi-fokus', unitId: 've3', ballotOrder: 1, name: 'Andrej Slaček', preferentialVotes: null },
  { id: 'cc-nsi-ve3-2', listId: 'nsi-fokus', unitId: 've3', ballotOrder: 2, name: 'mag. Lea Ornik', preferentialVotes: null },
  { id: 'cc-nsi-ve3-3', listId: 'nsi-fokus', unitId: 've3', ballotOrder: 3, name: 'Iztok Vidmar', preferentialVotes: null },
  { id: 'cc-nsi-ve3-4', listId: 'nsi-fokus', unitId: 've3', ballotOrder: 4, name: 'Alenka Pušnik', preferentialVotes: null },

  // 3. volilna enota — Demokrati
  { id: 'cc-demokrati-ve3-1', listId: 'demokrati', unitId: 've3', ballotOrder: 1, name: 'Danijel Pogorevc', preferentialVotes: null },
  { id: 'cc-demokrati-ve3-2', listId: 'demokrati', unitId: 've3', ballotOrder: 2, name: 'Almira Pogorevc', preferentialVotes: null },

  // 4. volilna enota (7 sedežev) — SLS
  { id: 'cc-sls-ve4-1', listId: 'sls', unitId: 've4', ballotOrder: 1, name: 'Maksimiljan Tramšek', preferentialVotes: null },
  { id: 'cc-sls-ve4-2', listId: 'sls', unitId: 've4', ballotOrder: 2, name: 'Kristina Pregl', preferentialVotes: null },
  { id: 'cc-sls-ve4-3', listId: 'sls', unitId: 've4', ballotOrder: 3, name: 'Dušan Leskovar', preferentialVotes: null },
  { id: 'cc-sls-ve4-4', listId: 'sls', unitId: 've4', ballotOrder: 4, name: 'Staša Trajkovič', preferentialVotes: null },
  { id: 'cc-sls-ve4-5', listId: 'sls', unitId: 've4', ballotOrder: 5, name: 'Alojz Žvižaj', preferentialVotes: null },
  { id: 'cc-sls-ve4-6', listId: 'sls', unitId: 've4', ballotOrder: 6, name: 'Irena Vrbek', preferentialVotes: null },
  { id: 'cc-sls-ve4-7', listId: 'sls', unitId: 've4', ballotOrder: 7, name: 'Vlado Berdnik', preferentialVotes: null },

  // 4. volilna enota — SD
  { id: 'cc-sd-ve4-1', listId: 'sd', unitId: 've4', ballotOrder: 1, name: 'dr. Peter Cvahte', preferentialVotes: null },
  { id: 'cc-sd-ve4-2', listId: 'sd', unitId: 've4', ballotOrder: 2, name: 'Polona Kregar', preferentialVotes: null },
  { id: 'cc-sd-ve4-3', listId: 'sd', unitId: 've4', ballotOrder: 3, name: 'Ludvik Repolusk', preferentialVotes: null },
  { id: 'cc-sd-ve4-4', listId: 'sd', unitId: 've4', ballotOrder: 4, name: 'Lidija Ravš', preferentialVotes: null },
];

export const INITIAL_LV2026_DATA: ElectionDataset = {
  year: 2026,
  dateLabel: '15. november 2026',
  stage: 'v_teku',
  lastUpdatedLabel: 'Uradna udeležba ob 11:00 · Glasovanje poteka (7:00–19:00)',
  sourceNote: 'Vir uradnih kandidatur in udeležbe: DVK (volitve.dvk-rs.si/lv2026) in OVK Občine Slovenska Bistrica',
  eligibleVotersMunicipality: null,
  eligibleVotersPragersko: null,
  invalidBallotsMayor: null,
  invalidBallotsCouncil: null,
  invalidBallotsKs: null,
  turnout: [
    {
      label: 'Udeležba ob 11:00',
      time: '11:00',
      municipalityPct: 11.6,
      pragerskoPct: null,
      sloveniaPct: 12.85,
    },
    {
      label: 'Udeležba ob 16:00',
      time: '16:00',
      municipalityPct: null,
      pragerskoPct: null,
      sloveniaPct: null,
    },
    {
      label: 'Končna udeležba ob 19:00',
      time: '19:00',
      municipalityPct: null,
      pragerskoPct: null,
      sloveniaPct: null,
    },
  ],
  mayoralCandidates: [
    {
      id: 'zagar',
      name: 'dr. Ivan Žagar',
      proposer: 'SLS, SDS, NSi, Fokus in Stranka generacij',
      color: '#15803D',
      votes: null,
      isIncumbent: true,
    },
    {
      id: 'cvahte',
      name: 'dr. Peter Cvahte',
      proposer: 'Socialni demokrati (SD), s podporo Levice',
      color: '#DC2626',
      votes: null,
    },
    {
      id: 'gosnik',
      name: 'Edita Gošnik',
      proposer: 'Neodvisna kandidatka s podporo Gibanja Svoboda',
      color: '#0284C7',
      votes: null,
    },
    {
      id: 'spaninger',
      name: 'Matej Španinger',
      proposer: 'Slovenska nacionalna stranka (SNS)',
      color: '#D97706',
      votes: null,
    },
  ],
  electoralUnits: [
    {
      id: 've1',
      number: 1,
      name: '1. volilna enota',
      seats: 8,
      communities: ['Leskovec – Stari Log', 'Črešnjevec', 'Laporje', 'Dr. Jagodič'],
    },
    {
      id: 've2',
      number: 2,
      name: '2. volilna enota',
      seats: 9,
      communities: ['Pragersko – Gaj', 'Spodnja Polskava', 'Zgornja Polskava', 'Alfonz Šarh'],
      includesPragerskoGaj: true,
    },
    {
      id: 've3',
      number: 3,
      name: '3. volilna enota',
      seats: 7,
      communities: ['Impol', 'Šmartno na Pohorju', 'Kebelj', 'Tinje'],
    },
    {
      id: 've4',
      number: 4,
      name: '4. volilna enota',
      seats: 7,
      communities: ['Pohorski odred', 'Zgornja Ložnica', 'Vrhole – Preloge'],
    },
  ],
  councilLists: [
    {
      id: 'sls',
      shortName: 'SLS',
      fullName: 'Slovenska ljudska stranka (SLS)',
      color: '#15803D',
      votesByUnit: { ve1: null, ve2: null, ve3: null, ve4: null },
      seats2022: 9,
    },
    {
      id: 'sds',
      shortName: 'SDS',
      fullName: 'Slovenska demokratska stranka (SDS)',
      color: '#CA8A04',
      votesByUnit: { ve1: null, ve2: null, ve3: null, ve4: null },
      seats2022: 7,
    },
    {
      id: 'svoboda',
      shortName: 'Gibanje Svoboda',
      fullName: 'Gibanje Svoboda',
      color: '#0284C7',
      votesByUnit: { ve1: null, ve2: null, ve3: null, ve4: null },
      seats2022: 7,
    },
    {
      id: 'sd',
      shortName: 'SD',
      fullName: 'Socialni demokrati (SD)',
      color: '#DC2626',
      votesByUnit: { ve1: null, ve2: null, ve3: null, ve4: null },
      seats2022: 4,
    },
    {
      id: 'nsi-fokus',
      shortName: 'NSi + Fokus',
      fullName: 'Nova Slovenija – krščanski demokrati in Fokus',
      color: '#0F4C81',
      votesByUnit: { ve1: null, ve2: null, ve3: null, ve4: null },
      seats2022: 3,
    },
    {
      id: 'sg',
      shortName: 'Stranka generacij',
      fullName: 'Stranka generacij (SG)',
      color: '#0D9488',
      votesByUnit: { ve1: null, ve2: null, ve3: null, ve4: null },
      seats2022: 1,
    },
    {
      id: 'demokrati',
      shortName: 'Demokrati',
      fullName: 'Demokrati',
      color: '#475569',
      votesByUnit: { ve1: null, ve2: null, ve3: null, ve4: null },
      seats2022: 0,
    },
    {
      id: 'sns',
      shortName: 'SNS',
      fullName: 'Slovenska nacionalna stranka (SNS)',
      color: '#D97706',
      votesByUnit: { ve1: null, ve2: null, ve3: null, ve4: null },
      seats2022: 0,
    },
    {
      id: 'resnica',
      shortName: 'Resni.ca',
      fullName: 'Državljansko gibanje Resni.ca',
      color: '#7C3AED',
      votesByUnit: { ve1: null, ve2: null, ve3: null, ve4: null },
      seats2022: 0,
    },
  ],
  councilCandidates: INITIAL_COUNCIL_CANDIDATES_2026,
  ksSeatsTotal: 7,
  ksPollingStation: {
    name: 'Društvo KKS Pragersko',
    address: 'Kolodvorska ulica 9 / Ulica Pohorskega bataljona 10, 2331 Pragersko',
    headquarters: 'Kolodvorska ulica 3, 2331 Pragersko',
    systemNote: 'Večinski volilni sistem — izvoljenih je 7 kandidatov z največjim številom glasov',
  },
  ksCandidates: [
    {
      id: 'ks-sres',
      ballotNumber: 1,
      name: 'Sonja Sreš',
      birthYear: 1972,
      residence: 'Pragersko',
      proposer: 'Milena Furek in skupina volivcev',
      votes: null,
    },
    {
      id: 'ks-sinkovec',
      ballotNumber: 2,
      name: 'Uroš Šinkovec',
      birthYear: 1977,
      residence: 'Pragersko',
      proposer: 'Milena Furek in skupina volivcev',
      votes: null,
    },
    {
      id: 'ks-kruh-r',
      ballotNumber: 3,
      name: 'Rudi Kruh',
      birthYear: 1961,
      residence: 'Pragersko',
      proposer: 'Milena Furek in skupina volivcev',
      votes: null,
    },
    {
      id: 'ks-trebovsek',
      ballotNumber: 4,
      name: 'Zlatko Trebovšek',
      birthYear: 1955,
      residence: 'Pragersko',
      proposer: 'Zlatko Trebovšek in skupina volivcev',
      votes: null,
    },
    {
      id: 'ks-crnoga',
      ballotNumber: 5,
      name: 'Romana Črnoga',
      residence: 'Pragersko',
      proposer: 'Skupina volivcev',
      votes: null,
    },
    {
      id: 'ks-pogorevc',
      ballotNumber: 6,
      name: 'Aleš Pogorevc',
      birthYear: 1977,
      residence: 'Pragersko',
      proposer: 'Mateja Godec in skupina volivcev',
      votes: null,
    },
    {
      id: 'ks-kruh-b',
      ballotNumber: 7,
      name: 'Branko Kruh',
      residence: 'Pragersko',
      proposer: 'Skupina volivcev',
      votes: null,
    },
  ],
};

export const HISTORICAL_LV2022_DATA: ElectionDataset = {
  year: 2022,
  dateLabel: '20. november 2022',
  stage: 'koncni',
  lastUpdatedLabel: 'Uradni končni izidi lokalnih volitev 2022',
  sourceNote: 'Zgodovinski referenčni podatki DVK / OVK Občine Slovenska Bistrica (LV 2022)',
  eligibleVotersMunicipality: 20808,
  eligibleVotersPragersko: null,
  invalidBallotsMayor: null,
  invalidBallotsCouncil: null,
  invalidBallotsKs: null,
  turnout: [
    {
      label: 'Končna udeležba ob 19:00',
      time: '19:00',
      municipalityPct: 42.8,
      pragerskoPct: null,
      sloveniaPct: 47.59,
    },
  ],
  mayoralCandidates: [
    {
      id: 'zagar-2022',
      name: 'dr. Ivan Žagar',
      proposer: 'SLS, SDS, NSi in DeSUS',
      color: '#15803D',
      votes: 6205,
      isIncumbent: true,
      knownPct2022: 69.68,
    },
    {
      id: 'ostali-2022',
      name: 'Ostali protikandidati (skupaj)',
      proposer: 'Zbirni seštevek preostalih veljavnih glasov LV 2022',
      color: '#64748B',
      votes: 2700,
      knownPct2022: 30.32,
    },
  ],
  electoralUnits: INITIAL_LV2026_DATA.electoralUnits,
  councilLists: [
    {
      id: 'sls-2022',
      shortName: 'SLS',
      fullName: 'Slovenska ljudska stranka (SLS)',
      color: '#15803D',
      votesByUnit: { ve1: null, ve2: null, ve3: null, ve4: null },
      seats2022: 9,
      knownSeatsOverride: 9,
    },
    {
      id: 'sds-2022',
      shortName: 'SDS',
      fullName: 'Slovenska demokratska stranka (SDS)',
      color: '#CA8A04',
      votesByUnit: { ve1: null, ve2: null, ve3: null, ve4: null },
      seats2022: 7,
      knownSeatsOverride: 7,
    },
    {
      id: 'svoboda-2022',
      shortName: 'Gibanje Svoboda',
      fullName: 'Gibanje Svoboda',
      color: '#0284C7',
      votesByUnit: { ve1: null, ve2: null, ve3: null, ve4: null },
      seats2022: 7,
      knownSeatsOverride: 7,
    },
    {
      id: 'sd-2022',
      shortName: 'SD',
      fullName: 'Socialni demokrati (SD)',
      color: '#DC2626',
      votesByUnit: { ve1: null, ve2: null, ve3: null, ve4: null },
      seats2022: 4,
      knownSeatsOverride: 4,
    },
    {
      id: 'nsi-2022',
      shortName: 'NSi',
      fullName: 'Nova Slovenija – krščanski demokrati (NSi)',
      color: '#0F4C81',
      votesByUnit: { ve1: null, ve2: null, ve3: null, ve4: null },
      seats2022: 3,
      knownSeatsOverride: 3,
    },
    {
      id: 'desus-2022',
      shortName: 'DeSUS',
      fullName: 'Demokratična stranka upokojencev Slovenije (DeSUS)',
      color: '#0D9488',
      votesByUnit: { ve1: null, ve2: null, ve3: null, ve4: null },
      seats2022: 1,
      knownSeatsOverride: 1,
    },
  ],
  councilCandidates: [],
  ksSeatsTotal: 7,
  ksPollingStation: INITIAL_LV2026_DATA.ksPollingStation,
  ksCandidates: [],
};
